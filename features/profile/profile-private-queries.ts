import 'server-only';

import { cookies } from 'next/headers';
import { classify, percentileFor } from '@/lib/archetypes';
import { buildStats, signalCommits, type Commit } from '@/lib/stats';
import type { ArchetypeId, ProfileSummary } from '@/types/cronotype';
import { getSignalCommitsFor, GitHubError } from './profile-queries';

// Private profile reads are intentionally isolated from the normal cached profile
// queries. GitHub OAuth Apps require the broad `repo` scope for private repo
// reads, so this flow uses the visitor's short-lived token once, makes read-only
// API requests, and stores only the derived result in a short-lived HTTP-only
// cookie. Do not add `use cache` here, and do not persist tokens or raw commits.

const API = 'https://api.github.com';
const UA = 'cronotype.dev';
const COOKIE_NAME = 'cronotype-private-result';
const MAX_AGE_SECONDS = 60 * 10;

type GitHubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type PrivateSearchCommitItem = {
  commit: {
    author?: { date?: string };
    committer?: { date?: string };
    message?: string;
  };
  parents?: unknown[];
  repository?: { full_name?: string };
};

export type PrivateCronotypeResult = {
  archetypeId: ArchetypeId;
  createdAt: string;
  percentile: number;
  profile: ProfileSummary;
  source: 'github-oauth';
  stats: ReturnType<typeof buildStats>;
  window: '90d';
};

export function privateOAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET);
}

export function privateOAuthAuthorizeUrl(origin: string, state: string): string {
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', process.env.GITHUB_OAUTH_CLIENT_ID ?? '');
  url.searchParams.set('redirect_uri', `${origin}/api/github/private/callback`);
  url.searchParams.set('scope', 'repo');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeCodeForToken(origin: string, code: string): Promise<string> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
      redirect_uri: `${origin}/api/github/private/callback`,
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': UA,
    },
    method: 'POST',
  });
  if (!res.ok) throw new Error(`GitHub OAuth failed (${res.status}).`);
  const json = (await res.json()) as GitHubTokenResponse;
  if (!json.access_token) {
    throw new Error(json.error_description ?? json.error ?? 'GitHub OAuth did not return an access token.');
  }
  return json.access_token;
}

export async function computePrivateCronotype(token: string): Promise<PrivateCronotypeResult> {
  const profile = await fetchViewerProfile(token);
  const today = new Date();
  const toISO = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
    .toISOString()
    .slice(0, 10);
  const fromISO = new Date(Date.parse(`${toISO}T00:00:00Z`) - 90 * 24 * 3600_000).toISOString().slice(0, 10);
  const [publicCommits, visibleCommits] = await Promise.all([
    getSignalCommitsFor(profile.login, '90d'),
    fetchPrivateCommits(token, profile.login, fromISO, toISO).then(signalCommits),
  ]);
  const stats = buildStats(dedupe([...publicCommits, ...visibleCommits]));
  const archetype = classify(stats);
  const percentile = percentileFor(archetype, stats);

  return {
    archetypeId: archetype.id,
    createdAt: new Date().toISOString(),
    percentile,
    profile,
    source: 'github-oauth',
    stats,
    window: '90d',
  };
}

export async function setPrivateResultCookie(result: PrivateCronotypeResult) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeResult(result), {
    httpOnly: true,
    maxAge: MAX_AGE_SECONDS,
    path: '/private',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function getPrivateResultCookie(): Promise<PrivateCronotypeResult | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;

  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as PrivateCronotypeResult;
  } catch {
    return null;
  }
}

async function fetchViewerProfile(token: string): Promise<ProfileSummary> {
  const res = await githubFetch(token, `${API}/user`);
  if (!res.ok) throw new Error(`Could not read GitHub profile (${res.status}).`);
  const user = await res.json();
  return {
    avatarUrl: user.avatar_url,
    bio: user.bio ?? null,
    createdAt: user.created_at,
    followers: user.followers ?? 0,
    login: user.login,
    name: user.name ?? null,
    publicRepos: user.public_repos ?? 0,
  };
}

async function fetchPrivateCommits(token: string, login: string, fromISO: string, toISO: string): Promise<Commit[]> {
  const commits: Commit[] = [];
  const q = `author:${login} author-date:${fromISO}..${toISO}`;

  for (let page = 1; page <= 5; page++) {
    const url = `${API}/search/commits?q=${encodeURIComponent(q)}&per_page=100&page=${page}&sort=author-date&order=desc`;
    const res = await githubFetch(token, url, { Accept: 'application/vnd.github.cloak-preview+json' });
    if (!res.ok) {
      if (page === 1 && res.status === 422) return [];
      break;
    }

    const json = (await res.json()) as { items?: PrivateSearchCommitItem[] };
    const items = json.items ?? [];
    for (const item of items) {
      const authoredAt = item.commit.author?.date ?? item.commit.committer?.date;
      if (!authoredAt) continue;
      commits.push({
        authoredAt,
        message: item.commit.message ?? '',
        parentCount: item.parents?.length ?? 1,
        repo: item.repository?.full_name ?? 'unknown',
        tzOffsetMinutes: parseTzOffsetMinutes(authoredAt),
      });
    }
    if (items.length < 100) break;
  }

  return dedupe(commits);
}

function githubFetch(token: string, url: string, extraHeaders: Record<string, string> = {}) {
  return fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': UA,
      'X-GitHub-Api-Version': '2022-11-28',
      ...extraHeaders,
    },
  }).then(res => {
    if (res.status === 401) throw new GitHubError('GitHub auth failed.', 401);
    if (res.status === 403 || res.status === 429) {
      const remaining = res.headers.get('x-ratelimit-remaining');
      const resetAt = res.headers.get('x-ratelimit-reset');
      if (remaining === '0') {
        const wait = resetAt ? Math.max(0, Number(resetAt) * 1000 - Date.now()) : 60_000;
        const mins = Math.ceil(wait / 60_000);
        throw new GitHubError(`GitHub rate limit hit. Resets in ~${mins} minute${mins === 1 ? '' : 's'}.`, 403);
      }
      throw new GitHubError('GitHub blocked the request (secondary rate limit). Try again in a minute.', 403);
    }
    return res;
  });
}

function encodeResult(result: PrivateCronotypeResult): string {
  return Buffer.from(JSON.stringify(result), 'utf8').toString('base64url');
}

function parseTzOffsetMinutes(iso: string): number | null {
  const m = iso.match(/([+-])(\d{2}):?(\d{2})$|Z$/);
  if (!m) return null;
  if (iso.endsWith('Z')) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

function dedupe(commits: Commit[]): Commit[] {
  const seen = new Set<string>();
  const out: Commit[] = [];
  for (const commit of commits) {
    const key = `${commit.authoredAt}|${commit.repo}|${commit.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(commit);
  }
  return out;
}

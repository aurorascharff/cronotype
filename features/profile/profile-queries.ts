import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { buildStats, type Commit } from '@/lib/stats';
import type { ProfileSummary, Window } from '@/types/cronotype';

const UA = 'cronotype.dev';
const API = 'https://api.github.com';

export class GitHubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function headers(extra: Record<string, string> = {}): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': UA,
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

async function gh(url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
  if (res.status === 401) throw new GitHubError('GitHub auth failed — check that GITHUB_TOKEN is valid', 401);
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
}

// ── Profile ────────────────────────────────────────────────────────────────

export async function getProfile(login: string): Promise<ProfileSummary> {
  'use cache';
  cacheTag(`profile-${login.toLowerCase()}`);
  cacheLife('hours');

  const res = await gh(`${API}/users/${encodeURIComponent(login)}`);
  if (res.status === 404) throw new GitHubError(`User @${login} not found on GitHub`, 404);
  if (!res.ok) throw new GitHubError(`GitHub error (${res.status})`, res.status);
  const j = await res.json();
  return {
    avatarUrl: j.avatar_url,
    bio: j.bio ?? null,
    createdAt: j.created_at,
    followers: j.followers ?? 0,
    login: j.login,
    name: j.name ?? null,
    publicRepos: j.public_repos ?? 0,
  };
}

// ── Search commits with real per-commit timezones ──────────────────────────

type SearchCommitItem = {
  commit: {
    author: { date: string };
    committer: { date: string };
  };
  repository: { full_name: string };
};

async function fetchCommitsInRange(login: string, fromISO: string, toISO: string, depth = 0): Promise<Commit[]> {
  const q = `author:${login} author-date:${fromISO}..${toISO}`;
  const commits: Commit[] = [];
  let truncated = false;

  for (let page = 1; page <= 10; page++) {
    const url = `${API}/search/commits?q=${encodeURIComponent(q)}&per_page=100&page=${page}&sort=author-date&order=desc`;
    const res = await gh(url, { headers: { Accept: 'application/vnd.github.cloak-preview+json' } });
    if (!res.ok) {
      if (page === 1 && res.status === 422) return [];
      break;
    }
    const j = (await res.json()) as { total_count: number; incomplete_results: boolean; items: SearchCommitItem[] };
    if (j.total_count > 1000 && depth < 3) truncated = true;
    for (const item of j.items ?? []) {
      const iso = item.commit.author?.date ?? item.commit.committer?.date;
      if (!iso) continue;
      const tz = parseTzOffsetMinutes(iso);
      commits.push({
        authoredAt: iso,
        repo: item.repository?.full_name ?? 'unknown',
        tzOffsetMinutes: tz,
      });
    }
    if (!j.items || j.items.length < 100) break;
  }

  if (truncated && depth < 3) {
    const from = new Date(fromISO).getTime();
    const to = new Date(toISO).getTime();
    const mid = new Date((from + to) / 2).toISOString().slice(0, 10);
    const [a, b] = await Promise.all([
      fetchCommitsInRange(login, fromISO, mid, depth + 1),
      fetchCommitsInRange(login, mid, toISO, depth + 1),
    ]);
    return dedupe([...a, ...b]);
  }

  return commits;
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
  for (const c of commits) {
    const k = `${c.authoredAt}|${c.repo}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

// ── 90-day "current" stats ────────────────────────────────────────────────

export async function getStatsFor(login: string, window: Window): Promise<ReturnType<typeof buildStats>> {
  'use cache';
  cacheTag(`stats-${login.toLowerCase()}-${window}`);
  cacheLife('hours');

  const days = window === '90d' ? 90 : window === '1y' ? 365 : 365 * 5;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 3600_000);
  const commits = await fetchCommitsInRange(
    login,
    from.toISOString().slice(0, 10),
    to.toISOString().slice(0, 10),
  );
  return buildStats(commits);
}

// ── Per-year stats for the evolution strip ────────────────────────────────

export async function getYearStats(login: string, year: number) {
  'use cache';
  cacheTag(`year-${login.toLowerCase()}-${year}`);
  const isCurrent = year === new Date().getUTCFullYear();
  cacheLife(isCurrent ? 'hours' : 'weeks');

  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const commits = await fetchCommitsInRange(login, from, to);
  return buildStats(commits);
}

export async function getEvolution(login: string) {
  'use cache';
  cacheTag(`evolution-${login.toLowerCase()}`);
  cacheLife('hours');

  const profile = await getProfile(login);
  const firstYear = new Date(profile.createdAt).getUTCFullYear();
  const thisYear = new Date().getUTCFullYear();

  const startYear = Math.max(firstYear, thisYear - 7);
  const years: number[] = [];
  for (let y = startYear; y <= thisYear; y++) years.push(y);

  // Sequence the year fetches. Search Commits is 30 req/min — parallel fan-out
  // trips the secondary rate limit. If a fetch fails, return what we have.
  const out: Array<{ year: number; stats: ReturnType<typeof buildStats> }> = [];
  for (const year of years) {
    try {
      const stats = await getYearStats(login, year);
      out.push({ stats, year });
    } catch (err) {
      if (err instanceof GitHubError && (err.status === 403 || err.status === 429)) break;
      throw err;
    }
  }
  return out;
}

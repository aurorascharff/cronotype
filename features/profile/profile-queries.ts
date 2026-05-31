import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { buildStats } from '@/lib/stats';
import type { Commit } from '@/lib/stats';
import type { ProfileSummary, Window } from '@/types/cronotype';

const UA = 'cronotype.dev (https://github.com/cronotype)';

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': UA,
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

export class GitHubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const getProfile = cache(async (login: string): Promise<ProfileSummary> => {
  'use cache';
  cacheTag(`profile-${login.toLowerCase()}`);
  cacheLife('hours');

  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
    headers: headers(),
  });
  if (res.status === 404) {
    throw new GitHubError(`User @${login} not found on GitHub`, 404);
  }
  if (!res.ok) {
    throw new GitHubError(`GitHub error (${res.status})`, res.status);
  }
  const j = await res.json();
  return {
    avatarUrl: j.avatar_url,
    bio: j.bio ?? null,
    followers: j.followers ?? 0,
    login: j.login,
    name: j.name ?? null,
    publicRepos: j.public_repos ?? 0,
  };
});

/**
 * Fetch recent push events for a user. GitHub returns up to 300 events across
 * the last 90 days. Each push event contains commits with their author info,
 * but the REST events feed does NOT include per-commit timezone. We fall back
 * to UTC. For the "show me my chart" use case this is the cheap-and-fast path.
 */
async function fetchPushEvents(login: string): Promise<Commit[]> {
  const commits: Commit[] = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}/events/public?per_page=100&page=${page}`, {
      headers: headers(),
    });
    if (!res.ok) {
      if (page === 1) throw new GitHubError(`GitHub events error (${res.status})`, res.status);
      break;
    }
    const events = (await res.json()) as Array<{
      type: string;
      created_at: string;
      repo: { name: string };
      payload: { commits?: Array<{ author?: { email?: string; name?: string } }> };
    }>;
    if (!Array.isArray(events) || events.length === 0) break;
    for (const e of events) {
      if (e.type !== 'PushEvent') continue;
      const repo = e.repo?.name ?? 'unknown';
      const n = e.payload?.commits?.length ?? 1;
      // The event's created_at is when the push happened in UTC. Without a
      // per-commit timezone, we treat it as UTC and let the user supply a
      // timezone override via ?tz=.
      for (let i = 0; i < n; i++) {
        commits.push({
          authoredAt: e.created_at,
          repo,
          tzOffsetMinutes: null,
        });
      }
    }
    if (events.length < 100) break;
  }
  return commits;
}

export const getCommits = cache(async (login: string, window: Window): Promise<Commit[]> => {
  'use cache';
  cacheTag(`commits-${login.toLowerCase()}-${window}`);
  cacheLife('hours');

  const all = await fetchPushEvents(login);
  if (window === '90d') return all;

  const now = Date.now();
  if (window === '1y') {
    const cutoff = now - 365 * 24 * 3600_000;
    return all.filter(c => new Date(c.authoredAt).getTime() >= cutoff);
  }
  return all;
});

export const getStatsFor = cache(async (login: string, window: Window, tzHours: number | null) => {
  'use cache';
  cacheTag(`stats-${login.toLowerCase()}-${window}-${tzHours ?? 'utc'}`);
  cacheLife('hours');

  const commits = await getCommits(login, window);
  const adjusted: Commit[] = tzHours == null
    ? commits
    : commits.map(c => ({ ...c, tzOffsetMinutes: tzHours * 60 }));
  return buildStats(adjusted);
});

import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { computeCronotype } from '@/features/profile/profile-service';
import { listReveals } from '@/lib/reveals';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
};

/**
 * Seed list - shown on a fresh deploy before anyone has been revealed, and as
 * filler when KV has fewer than `limit` reveals so the grid is never sparse.
 */
const FEATURED: string[] = [
  'torvalds',
  'gaearon',
  'rauchg',
  'sindresorhus',
  'tj',
  'kentcdodds',
  'wesbos',
  'addyosmani',
  'sebmarkbage',
  'acdlite',
  'leerob',
  'shuding',
  'sophiebits',
  'shadcn',
  'timneutkens',
  'tannerlinsley',
  'tkdodo',
  'cassidoo',
];

/**
 * Returns the ordered list of logins to show in the grid.
 *
 * Just the logins - not the data. Each card then fetches its own data via
 * `computeCronotype(login)`, which is cached per-login. That means navigating
 * away and back hits the per-login caches instead of re-fetching N users.
 */
export const getRecentLogins = cache(async (limit: number): Promise<string[]> => {
  return getRecentLoginsCached(limit);
});

async function getRecentLoginsCached(limit: number): Promise<string[]> {
  'use cache';
  cacheTag('leaderboard');
  cacheTag('reveals');
  cacheLife('minutes');

  // Read live reveals from KV; pad with FEATURED so the grid is never sparse.
  // listReveals returns [] when KV env vars aren't configured (local dev).
  const revealed = await listReveals(50);
  const seen = new Set<string>();
  const logins: string[] = [];
  for (const login of [...revealed, ...FEATURED]) {
    const lower = login.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    logins.push(lower);
    if (logins.length >= limit) break;
  }
  return logins;
}

/**
 * Per-card data fetch. Cached per-login via the tags on computeCronotype's
 * inner queries (`profile-{login}`, `stats-{login}-90d`).
 *
 * Returns null on failure so the card can render an empty state without
 * crashing the whole grid.
 */
export const getCardEntry = cache(async (login: string): Promise<LeaderboardEntry | null> => {
  try {
    const { profile, archetype, stats } = await computeCronotype(login, '90d');
    return { archetype, profile, stats };
  } catch {
    return null;
  }
});

import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { getProfile, getStatsFor } from '@/features/profile/profile-queries';
import { classify } from '@/lib/archetypes';
import { listReveals } from '@/lib/reveals';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
};

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

export const getRecentLogins = cache(async (limit: number): Promise<string[]> => {
  return getRecentLoginsCached(limit);
});

async function getRecentLoginsCached(limit: number): Promise<string[]> {
  'use cache';
  cacheTag('leaderboard');
  cacheTag('reveals');
  cacheLife('minutes');

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

/** Cheap GET /users/:login. Cached per-login for 60 days via `getProfile`. */
export const getCardProfile = cache(async (login: string): Promise<ProfileSummary | null> => {
  try {
    return await getProfile(login);
  } catch {
    return null;
  }
});

/**
 * Expensive Search Commits fetch. Throws on failure so the caller can wrap it
 * in an error boundary and offer a retry. Cached per-login for 60 days via
 * `getStatsFor` - once it succeeds it stays put.
 */
export const getCardClassification = cache(
  async (login: string): Promise<{ archetype: Archetype; stats: HourStats }> => {
    const stats = await getStatsFor(login, '90d');
    return { archetype: classify(stats), stats };
  },
);

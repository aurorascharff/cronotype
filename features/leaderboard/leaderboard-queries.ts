import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { computeCronotype } from '@/features/profile/profile-service';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
};

export const FEATURED: string[] = [
  'torvalds',
  'gaearon',
  'rauchg',
  'sindresorhus',
  'tj',
  'kentcdodds',
  'wesbos',
  'addyosmani',
  'getify',
  'bradtraversy',
  'jaredpalmer',
  'jhildenbiddle',
  'sebmarkbage',
  'acdlite',
  'leerob',
  'shuding',
  'sophiebits',
  'feross',
  'styfle',
  'timneutkens',
  'huozhi',
  'shadcn',
  'pcattori',
  'mjackson',
  'jacobmparis',
  'iamsahebgiri',
  'tannerlinsley',
  'tkdodo',
  'cassidoo',
  'sarah-edo',
];

export const getRecentClassified = cache(async (limit = 6): Promise<LeaderboardEntry[]> => {
  try {
    const all = await getFeaturedEntries();
    return all.slice(0, limit);
  } catch {
    return [];
  }
});

async function getFeaturedEntries(): Promise<LeaderboardEntry[]> {
  'use cache';
  cacheTag('leaderboard');
  cacheLife('hours');

  const entries: LeaderboardEntry[] = [];
  for (const login of FEATURED) {
    try {
      const { profile, archetype, stats } = await computeCronotype(login.toLowerCase(), '90d');
      entries.push({ archetype, profile, stats });
    } catch {
      // One user failing is fine; we skip them and keep going.
    }
  }

  // Don't cache an empty list — that means every featured user failed
  // (almost certainly rate-limited). Throwing prevents the empty result
  // from being pinned for cacheLife. The caller catches and renders empty.
  if (entries.length === 0) throw new Error('Leaderboard empty; not caching');

  return entries.sort((a, b) => b.profile.followers - a.profile.followers);
}

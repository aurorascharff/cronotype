import 'server-only';
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
  const entries: LeaderboardEntry[] = [];
  for (const login of FEATURED) {
    try {
      const { profile, archetype, stats } = await computeCronotype(login.toLowerCase(), '90d');
      entries.push({ archetype, profile, stats });
    } catch {
      // Skip rate-limited or failed users; their cached entries fill in on later requests.
    }
  }

  return entries.sort((a, b) => b.profile.followers - a.profile.followers).slice(0, limit);
});

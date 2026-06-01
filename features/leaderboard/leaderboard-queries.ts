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
  const entries = await Promise.all(
    FEATURED.map(async login => {
      try {
        const { profile, archetype, stats } = await computeCronotype(login.toLowerCase(), '90d');
        return { archetype, profile, stats } satisfies LeaderboardEntry;
      } catch {
        return null;
      }
    }),
  );

  return entries
    .filter((e): e is LeaderboardEntry => e !== null)
    .sort((a, b) => b.profile.followers - a.profile.followers)
    .slice(0, limit);
});

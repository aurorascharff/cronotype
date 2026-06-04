import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { computeCronotype, getProfile } from '@/features/profile/profile-queries';
import { FEATURED_HANDLES } from '@/features/leaderboard/data/featured-handles';
import type { Archetype, CronotypeResult, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
};

export async function getCardProfile(login: string): Promise<ProfileSummary | null> {
  try {
    return await getProfile(login);
  } catch {
    return null;
  }
}

export async function getCardCronotype(login: string): Promise<CronotypeResult | null> {
  try {
    return await computeCronotype(login, '90d');
  } catch {
    return null;
  }
}

export const getFeaturedHandlesByFollowers = cache(async (): Promise<string[]> => {
  'use cache: remote';
  cacheTag('featured-profiles');
  cacheLife('cronotype');

  const entries = await Promise.all(
    FEATURED_HANDLES.map(async (handle, index) => {
      const profile = await getCardProfile(handle);
      return {
        followers: profile?.followers ?? -1,
        handle,
        index,
      };
    }),
  );

  return entries
    .sort((a, b) => {
      if (b.followers !== a.followers) return b.followers - a.followers;
      return a.index - b.index;
    })
    .map(entry => entry.handle);
});

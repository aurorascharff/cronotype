import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { computeCronotype, getProfile } from '@/features/profile/profile-queries';
import { FEATURED_HANDLES } from '@/features/leaderboard/data/featured-handles';
import type { Archetype, ArchetypeId, CronotypeResult, HourStats, ProfileSummary } from '@/types/cronotype';

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

export const getFeaturedHandlesByType = cache(
  async ({ excludeHandle, typeId }: { excludeHandle: string; typeId: ArchetypeId }): Promise<string[]> => {
    'use cache: remote';
    cacheTag(`featured-type-${typeId}`);
    cacheLife('cronotype');

    const exclude = excludeHandle.toLowerCase();
    const handles = await getFeaturedHandlesByFollowers();
    const candidates = handles.filter(handle => handle.toLowerCase() !== exclude).slice(0, 48);
    const entries = await Promise.all(
      candidates.map(async handle => {
        const cronotype = await getCardCronotype(handle);
        return { cronotype, handle };
      }),
    );

    return entries
      .filter(({ cronotype }) => cronotype && cronotype.stats.total > 0 && cronotype.archetype.id === typeId)
      .map(({ handle }) => handle)
      .slice(0, 4);
  },
);

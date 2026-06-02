import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { FEATURED_HANDLES } from '@/features/leaderboard/data/featured-handles';
import { computeCronotype, getProfile } from '@/features/profile/profile-queries';
import { listFeaturedReveals } from '@/lib/reveals';
import type { Archetype, CronotypeResult, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
};

export async function getTopRevealedHandles(limit = 8): Promise<string[]> {
  'use cache: remote';
  cacheTag('leaderboard');
  cacheTag('reveals');
  cacheLife('cronotype');

  const revealed = await listFeaturedReveals(FEATURED_HANDLES.length);
  if (revealed.length === 0) return [];

  const profiles = await Promise.all(
    revealed.map(async (handle, index) => {
      try {
        return { handle, index, profile: await getProfile(handle) };
      } catch {
        return { handle, index, profile: null };
      }
    }),
  );
  profiles.sort((a, b) => {
    const followerDelta = (b.profile?.followers ?? -1) - (a.profile?.followers ?? -1);
    return followerDelta || a.index - b.index;
  });

  return profiles.slice(0, limit).map(p => p.handle);
}

export async function getCardProfile(login: string): Promise<ProfileSummary | null> {
  try {
    return await getProfile(login);
  } catch {
    return null;
  }
}

export async function getSuggestedProfiles(handles: string[]): Promise<Array<ProfileSummary | null>> {
  'use cache: remote';
  cacheTag('leaderboard');
  cacheTag('suggested-profiles');
  cacheLife('cronotype');

  return Promise.all(handles.map(handle => getCardProfile(handle)));
}

export async function getCardCronotype(login: string): Promise<CronotypeResult | null> {
  try {
    return await computeCronotype(login, '90d');
  } catch {
    return null;
  }
}

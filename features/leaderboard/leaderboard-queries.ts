import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { FEATURED_HANDLES } from '@/features/leaderboard/featured-handles';
import { getProfile, getStatsFor } from '@/features/profile/profile-queries';
import { classify } from '@/lib/archetypes';
import { listFeaturedReveals } from '@/lib/reveals';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

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

export async function getCardClassification(login: string): Promise<{ archetype: Archetype; stats: HourStats } | null> {
  try {
    const stats = await getStatsFor(login, '90d');
    return { archetype: classify(stats), stats };
  } catch {
    return null;
  }
}

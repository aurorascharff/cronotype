import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { FEATURED } from '@/features/leaderboard/featured';
import { getProfile, getStatsFor } from '@/features/profile/profile-queries';
import { classify } from '@/lib/archetypes';
import { listFeaturedReveals } from '@/lib/reveals';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
};

export async function getRecentHandles(): Promise<string[]> {
  'use cache: remote';
  cacheTag('leaderboard');
  cacheTag('reveals');
  cacheLife('minutes');

  const revealed = await listFeaturedReveals(FEATURED.length);
  if (revealed.length === 0) return [];

  const profiles = await Promise.all(
    revealed.map(async handle => {
      try {
        return { handle, profile: await getProfile(handle) };
      } catch {
        return { handle, profile: null };
      }
    }),
  );
  profiles.sort((a, b) => (b.profile?.followers ?? 0) - (a.profile?.followers ?? 0));

  return profiles.map(p => p.handle);
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

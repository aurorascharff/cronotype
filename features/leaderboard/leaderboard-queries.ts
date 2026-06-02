import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { FEATURED_HANDLES } from '@/features/leaderboard/data/featured-handles';
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
  const recent = revealed.slice(0, Math.min(4, limit));

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

  const handles: string[] = [];
  const seen = new Set<string>();
  for (const handle of recent) {
    const key = handle.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    handles.push(handle);
  }
  for (const p of profiles) {
    const key = p.handle.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    handles.push(p.handle);
    if (handles.length >= limit) break;
  }

  return handles;
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

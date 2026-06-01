import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { computeCronotype } from '@/features/profile/profile-service';
import { listReveals } from '@/lib/reveals';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
};

/**
 * Seed list - shown on a fresh deploy before anyone has been revealed, and as
 * filler when KV has fewer than `limit` reveals so the grid is never sparse.
 */
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

export const getRecentClassified = cache(async (limit = 6): Promise<LeaderboardEntry[]> => {
  try {
    const all = await getRevealedEntries();
    return all.slice(0, limit);
  } catch {
    return [];
  }
});

async function getRevealedEntries(): Promise<LeaderboardEntry[]> {
  'use cache';
  cacheTag('leaderboard');
  cacheTag('reveals');
  cacheLife('minutes');

  // Read live reveals from KV; pad with FEATURED so the grid is never sparse.
  // listReveals returns [] when KV env vars aren't configured (local dev).
  const revealed = await listReveals(50);
  const seen = new Set<string>();
  const logins: string[] = [];
  for (const login of [...revealed, ...FEATURED]) {
    const lower = login.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    logins.push(lower);
  }

  const entries: LeaderboardEntry[] = [];
  for (const login of logins) {
    try {
      const { profile, archetype, stats } = await computeCronotype(login, '90d');
      entries.push({ archetype, profile, stats });
    } catch {
      // One user failing is fine; we skip them and keep going.
    }
  }

  // Don't cache an empty list - that means every fetch failed (almost certainly
  // rate-limited). Throwing prevents the empty result from being pinned for
  // cacheLife. The caller catches and renders empty.
  if (entries.length === 0) throw new Error('Leaderboard empty; not caching');

  // Preserve recency order from KV; FEATURED fillers come after, sorted by
  // followers as a stable tiebreaker.
  const order = new Map(logins.map((l, i) => [l, i]));
  return entries.sort((a, b) => {
    const ai = order.get(a.profile.login.toLowerCase()) ?? Infinity;
    const bi = order.get(b.profile.login.toLowerCase()) ?? Infinity;
    if (ai !== bi) return ai - bi;
    return b.profile.followers - a.profile.followers;
  });
}

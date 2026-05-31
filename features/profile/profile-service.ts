import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { recordEntry } from '@/features/leaderboard/leaderboard-queries';
import { getProfile, getStatsFor } from '@/features/profile/profile-queries';
import { classify, percentileFor } from '@/lib/archetypes';
import type { CronotypeResult, Window } from '@/types/cronotype';

/**
 * The main "compute a cronotype" pipeline. Fetches profile + commits, classifies,
 * computes percentile, and records the entry for the leaderboard.
 */
export const computeCronotype = cache(async (
  login: string,
  window: Window = '90d',
  tzHours: number | null = null,
): Promise<CronotypeResult> => {
  'use cache';
  cacheTag(`cronotype-${login.toLowerCase()}-${window}-${tzHours ?? 'utc'}`);
  cacheLife('hours');

  const [profile, stats] = await Promise.all([
    getProfile(login),
    getStatsFor(login, window, tzHours),
  ]);

  const archetype = classify(stats);
  const percentile = percentileFor(archetype, stats);

  recordEntry({
    archetype,
    classifiedAt: new Date().toISOString(),
    profile,
    score: 0,
    stats,
  });

  return { archetype, percentile, profile, stats, window };
});

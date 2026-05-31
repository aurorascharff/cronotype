import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getProfile, getStatsFor } from '@/features/profile/profile-queries';
import { classify, percentileFor } from '@/lib/archetypes';
import type { CronotypeResult, Window } from '@/types/cronotype';

/**
 * Fetch profile + 90-day stats, classify, compute percentile. Pure — the
 * leaderboard recording happens outside this cached function (see
 * `recordCronotype` in the service).
 */
export async function computeCronotype(login: string, window: Window = '90d'): Promise<CronotypeResult> {
  'use cache';
  cacheTag(`cronotype-${login.toLowerCase()}-${window}`);
  cacheLife('hours');

  const [profile, stats] = await Promise.all([getProfile(login), getStatsFor(login, window)]);

  const archetype = classify(stats);
  const percentile = percentileFor(archetype, stats);

  return { archetype, percentile, profile, stats, window };
}

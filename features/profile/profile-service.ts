import 'server-only';
import { cache } from 'react';
import { getProfile, getStatsFor } from '@/features/profile/profile-queries';
import { classify, percentileFor } from '@/lib/archetypes';
import type { CronotypeResult, Window } from '@/types/cronotype';

export const computeCronotype = cache(async (login: string, window: Window = '90d'): Promise<CronotypeResult> => {
  const normalized = login.toLowerCase();
  const [profile, stats] = await Promise.all([getProfile(normalized), getStatsFor(normalized, window)]);

  if (!profile) throw new Error(`Profile unavailable for @${normalized}`);
  if (!stats) throw new Error(`Stats unavailable for @${normalized}`);

  const archetype = classify(stats);
  const percentile = percentileFor(archetype, stats);

  return { archetype, percentile, profile, stats, window };
});

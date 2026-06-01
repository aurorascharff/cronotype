import 'server-only';
import { cache } from 'react';
import { getProfile, getStatsFor } from '@/features/profile/profile-queries';
import { classify, percentileFor } from '@/lib/archetypes';
import type { CronotypeResult, Window } from '@/types/cronotype';

export const computeCronotype = cache(async (login: string, window: Window = '90d'): Promise<CronotypeResult> => {
  const normalized = login.toLowerCase();
  const [profile, stats] = await Promise.all([getProfile(normalized), getStatsFor(normalized, window)]);

  const archetype = classify(stats);
  const percentile = percentileFor(archetype, stats);

  return { archetype, percentile, profile, stats, window };
});

import 'server-only';
import { cache } from 'react';
import { getProfile, getStatsFor, GitHubError } from '@/features/profile/profile-queries';
import { classify, percentileFor } from '@/lib/archetypes';
import type { CronotypeResult, Window } from '@/types/cronotype';

export const computeCronotype = cache(async (login: string, window: Window = '90d'): Promise<CronotypeResult> => {
  const normalized = login.toLowerCase();
  const [profile, stats] = await Promise.all([getProfile(normalized), getStatsFor(normalized, window)]);

  if (!profile) throw new GitHubError('GitHub is being moody. Give it a minute and try again.', 403);
  if (!stats) throw new GitHubError('GitHub is being moody. Give it a minute and try again.', 403);

  const archetype = classify(stats);
  const percentile = percentileFor(archetype, stats);

  return { archetype, percentile, profile, stats, window };
});

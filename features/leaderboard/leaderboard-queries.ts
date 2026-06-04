import 'server-only';

import { computeCronotype, getProfile } from '@/features/profile/profile-queries';
import type { Archetype, CronotypeResult, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
};

export async function getCardProfile(login: string): Promise<ProfileSummary | null> {
  try {
    return await getProfile(login);
  } catch {
    return null;
  }
}

export async function getCardCronotype(login: string): Promise<CronotypeResult | null> {
  try {
    return await computeCronotype(login, '90d');
  } catch {
    return null;
  }
}

import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getProfile, getStatsFor } from '@/features/profile/profile-queries';
import { classify } from '@/lib/archetypes';
import { listReveals } from '@/lib/reveals';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
};

export const FEATURED: string[] = [
  'gaearon',
  'sebmarkbage',
  'acdlite',
  'sophiebits',
  'rickhanlonii',
  'rauchg',
  'leerob',
  'shuding',
  'timneutkens',
  'styfle',
  'sindresorhus',
  'tj',
  'addyosmani',
  'paulirish',
  'mjackson',
  'ryanflorence',
  'kentcdodds',
  'wesbos',
  'sdras',
  'tannerlinsley',
  'tkdodo',
  'cassidoo',
  'jaredpalmer',
  'mxstbr',
  'kettanaito',
  'evanw',
  'developit',
  'antfu',
  'yyx990803',
  'rich-harris',
  'torvalds',
  'mitchellh',
  'kelseyhightower',
  'shadcn',
  'pacocoursey',
  'steveruizok',
];

export async function getRecentLogins(limit: number): Promise<string[]> {
  'use cache';
  cacheTag('leaderboard');
  cacheTag('reveals');
  cacheLife('minutes');

  const revealed = await listReveals(limit);
  if (revealed.length === 0) return [];

  const profiles = await Promise.all(revealed.map(async login => ({ login, profile: await getProfile(login) })));
  profiles.sort((a, b) => (b.profile?.followers ?? 0) - (a.profile?.followers ?? 0));

  return profiles.map(p => p.login).slice(0, limit);
}

export async function getCardProfile(login: string): Promise<ProfileSummary | null> {
  try {
    return await getProfile(login);
  } catch {
    return null;
  }
}

export async function getCardClassification(login: string): Promise<{ archetype: Archetype; stats: HourStats } | null> {
  const stats = await getStatsFor(login, '90d');
  if (!stats) return null;
  return { archetype: classify(stats), stats };
}

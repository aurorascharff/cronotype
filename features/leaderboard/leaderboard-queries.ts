import 'server-only';
import { computeCronotype } from '@/features/profile/profile-service';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
  isFeatured: boolean;
};

type RecentRecord = { login: string };

type Store = {
  recent: Map<string, RecentRecord>;
};

declare global {
  var __cronotype_store: Store | undefined;
}

export const FEATURED: string[] = [
  'torvalds',
  'gaearon',
  'rauchg',
  'sindresorhus',
  'tj',
  'kentcdodds',
  'wesbos',
  'addyosmani',
  'getify',
  'bradtraversy',
  'jaredpalmer',
  'jhildenbiddle',
  'sebmarkbage',
  'acdlite',
  'leerob',
  'shuding',
  'sophiebits',
  'feross',
  'styfle',
  'timneutkens',
  'huozhi',
  'shadcn',
  'pcattori',
  'mjackson',
  'jacobmparis',
  'iamsahebgiri',
  'tannerlinsley',
  'tkdodo',
  'cassidoo',
  'sarah-edo',
];

function store(): Store {
  if (!globalThis.__cronotype_store || !(globalThis.__cronotype_store.recent instanceof Map)) {
    globalThis.__cronotype_store = { recent: new Map() };
  }
  return globalThis.__cronotype_store;
}

export function recordEntry(login: string) {
  const key = login.toLowerCase();
  if (FEATURED.some(f => f.toLowerCase() === key)) return;
  store().recent.set(key, { login: key });
}

export async function getRecentClassified(limit = 6): Promise<LeaderboardEntry[]> {
  const featuredSet = new Set(FEATURED.map(l => l.toLowerCase()));
  const recentLogins = Array.from(store().recent.values())
    .filter(r => !featuredSet.has(r.login))
    .map(r => r.login);

  const allLogins = [...featuredSet, ...recentLogins];

  const entries = await Promise.all(
    allLogins.map(async login => {
      try {
        const { profile, archetype, stats } = await computeCronotype(login, '90d');
        return {
          archetype,
          isFeatured: featuredSet.has(login),
          profile,
          stats,
        } satisfies LeaderboardEntry;
      } catch {
        return null;
      }
    }),
  );

  return entries
    .filter((e): e is LeaderboardEntry => e !== null)
    .sort((a, b) => b.profile.followers - a.profile.followers)
    .slice(0, limit);
}

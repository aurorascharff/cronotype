import 'server-only';
import { computeCronotype } from '@/features/profile/profile-service';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
  classifiedAt: string;
};

type RecentRecord = { login: string; classifiedAt: string };

type Store = {
  recent: Map<string, RecentRecord>;
};

declare global {
  // eslint-disable-next-line no-var
  var __cronotype_store: Store | undefined;
}

export const FEATURED: string[] = [
  'torvalds',
  'rauchg',
  'gaearon',
  'sebmarkbage',
  'acdlite',
  'leerob',
  'shuding',
  'sindresorhus',
  'tj',
  'kentcdodds',
  'wesbos',
  'sophiebits',
];

function store(): Store {
  if (!globalThis.__cronotype_store || !(globalThis.__cronotype_store.recent instanceof Map)) {
    globalThis.__cronotype_store = { recent: new Map() };
  }
  return globalThis.__cronotype_store;
}

export function recordEntry(login: string, classifiedAt: string) {
  const key = login.toLowerCase();
  if (FEATURED.some(f => f.toLowerCase() === key)) return;
  store().recent.set(key, { classifiedAt, login: key });
}

export async function getRecentClassified(limit = 6): Promise<LeaderboardEntry[]> {
  const featuredLogins = FEATURED.map(l => l.toLowerCase());
  const featuredSet = new Set(featuredLogins);
  const recent = Array.from(store().recent.values())
    .filter(r => !featuredSet.has(r.login))
    .sort((a, b) => +new Date(b.classifiedAt) - +new Date(a.classifiedAt))
    .map(r => r.login);

  const ordered = [...featuredLogins, ...recent].slice(0, limit);

  const entries = await Promise.all(
    ordered.map(async login => {
      try {
        const { profile, archetype, stats } = await computeCronotype(login, '90d');
        return {
          archetype,
          classifiedAt: store().recent.get(login)?.classifiedAt ?? new Date().toISOString(),
          profile,
          stats,
        } satisfies LeaderboardEntry;
      } catch {
        return null;
      }
    }),
  );

  return entries.filter((e): e is LeaderboardEntry => e !== null);
}

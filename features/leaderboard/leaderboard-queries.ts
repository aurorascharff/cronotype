import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
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

function store(): Store {
  if (!globalThis.__cronotype_store || !(globalThis.__cronotype_store.recent instanceof Map)) {
    globalThis.__cronotype_store = { recent: new Map() };
    seed(globalThis.__cronotype_store);
  }
  return globalThis.__cronotype_store;
}

function seed(s: Store) {
  const seeds = [
    'rauchg',
    'gaearon',
    'leerob',
    'shuding',
    'sebmarkbage',
    'acdlite',
    'sophiebits',
    'feross',
    'wesbos',
    'tj',
    'sindresorhus',
    'kentcdodds',
  ];

  for (const login of seeds) {
    s.recent.set(login.toLowerCase(), {
      classifiedAt: new Date(Date.now() - ((login.length * 3600_000) % (30 * 24 * 3600_000))).toISOString(),
      login: login.toLowerCase(),
    });
  }
}

export function recordEntry(login: string, classifiedAt: string) {
  store().recent.set(login.toLowerCase(), {
    classifiedAt,
    login: login.toLowerCase(),
  });
}

export async function getRecentClassified(limit = 6): Promise<LeaderboardEntry[]> {
  const records = await readRecentRegistry();

  const entries = await Promise.all(
    records.slice(0, limit).map(async record => {
      try {
        const { profile, archetype, stats } = await computeCronotype(record.login, '90d');
        return {
          archetype,
          classifiedAt: record.classifiedAt,
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

async function readRecentRegistry(): Promise<RecentRecord[]> {
  'use cache';
  cacheTag('leaderboard-recent');
  cacheLife('seconds');

  return Array.from(store().recent.values()).sort(
    (a, b) => +new Date(b.classifiedAt) - +new Date(a.classifiedAt),
  );
}

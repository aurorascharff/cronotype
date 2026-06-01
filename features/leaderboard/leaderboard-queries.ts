import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { ARCHETYPES } from '@/lib/archetypes';
import { syntheticStatsFor } from '@/lib/synthetic';
import type { Archetype, ArchetypeId, HourStats, ProfileSummary } from '@/types/cronotype';

export type LeaderboardEntry = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
  /** ISO timestamp this entry was last classified. */
  classifiedAt: string;
};

type Store = {
  entries: Map<string, LeaderboardEntry>;
};

declare global {
  // eslint-disable-next-line no-var
  var __cronotype_store: Store | undefined;
}

function store(): Store {
  if (!globalThis.__cronotype_store) {
    globalThis.__cronotype_store = { entries: new Map() };
    seed(globalThis.__cronotype_store);
  }
  return globalThis.__cronotype_store;
}

function seed(s: Store) {
  const seeds: Array<{ login: string; name: string; id: ArchetypeId }> = [
    { id: 'vampire', login: 'rauchg', name: 'Guillermo Rauch' },
    { id: 'vampire', login: 'gaearon', name: 'Dan Abramov' },
    { id: 'insomniac-maintainer', login: 'leerob', name: 'Lee Robinson' },
    { id: 'nine-to-fiver', login: 'shuding', name: 'Shu Ding' },
    { id: 'sunrise-sniper', login: 'sebmarkbage', name: 'Sebastian Markbåge' },
    { id: 'lunch-bandit', login: 'acdlite', name: 'Andrew Clark' },
    { id: 'weekend-warrior', login: 'sophiebits', name: 'Sophie Alpert' },
    { id: 'drifter', login: 'feross', name: 'Feross Aboukhadijeh' },
    { id: 'nine-to-fiver', login: 'wesbos', name: 'Wes Bos' },
    { id: 'vampire', login: 'tj', name: 'TJ Holowaychuk' },
    { id: 'insomniac-maintainer', login: 'sindresorhus', name: 'Sindre Sorhus' },
    { id: 'sunrise-sniper', login: 'kentcdodds', name: 'Kent C. Dodds' },
  ];

  for (const { login, name, id } of seeds) {
    s.entries.set(login.toLowerCase(), {
      archetype: ARCHETYPES[id],
      classifiedAt: new Date(Date.now() - ((login.length * 3600_000) % (30 * 24 * 3600_000))).toISOString(),
      profile: {
        avatarUrl: `https://avatars.githubusercontent.com/${login}`,
        bio: null,
        createdAt: '2014-01-01T00:00:00Z',
        followers: 1000 + login.length * 137,
        login,
        name,
        publicRepos: 30,
      },
      stats: syntheticStatsFor(id, 200 + (login.length % 7) * 30),
    });
  }
}

/** Mutates the module-scoped store. NEVER call this from inside a `'use cache'` function. */
export function recordEntry(entry: LeaderboardEntry) {
  store().entries.set(entry.profile.login.toLowerCase(), entry);
}

export async function getRecentClassified(limit = 6): Promise<LeaderboardEntry[]> {
  'use cache';
  cacheTag('leaderboard-recent');
  cacheLife('seconds');

  const all = Array.from(store().entries.values());
  all.sort((a, b) => +new Date(b.classifiedAt) - +new Date(a.classifiedAt));
  return all.slice(0, limit);
}

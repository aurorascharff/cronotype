import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { ARCHETYPES } from '@/lib/archetypes';
import { classify } from '@/lib/archetypes';
import { buildStats, type Commit } from '@/lib/stats';
import { syntheticStatsFor } from '@/lib/synthetic';
import type { ArchetypeId, ProfileSummary, Window } from '@/types/cronotype';

const UA = 'cronotype.dev';
const API = 'https://api.github.com';
const MOCK = process.env.MOCK_PROFILE === '1';

/**
 * Sentinel login used by `generateStaticParams` to opt the route into PPR
 * without hitting GitHub at build. All queries short-circuit to synthetic data
 * for this exact login so the shell prerender always succeeds.
 */
export const SHELL_LOGIN = '__shell__';
function isShell(login: string): boolean {
  return login.toLowerCase() === SHELL_LOGIN;
}

export class GitHubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function headers(extra: Record<string, string> = {}): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': UA,
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

const MAX_CONCURRENT = 4;
let inflight = 0;
const queue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (inflight < MAX_CONCURRENT) {
    inflight++;
    return Promise.resolve();
  }
  return new Promise(resolve => queue.push(resolve));
}

function releaseSlot() {
  const next = queue.shift();
  if (next) {
    next();
  } else {
    inflight--;
  }
}

async function gh(url: string, init: RequestInit = {}): Promise<Response> {
  await acquireSlot();
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
  } catch (err) {
    releaseSlot();
    throw err;
  }
  releaseSlot();
  if (res.status === 401) throw new GitHubError('GitHub auth failed - check that GITHUB_TOKEN is valid', 401);
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    const resetAt = res.headers.get('x-ratelimit-reset');
    if (remaining === '0') {
      const wait = resetAt ? Math.max(0, Number(resetAt) * 1000 - Date.now()) : 60_000;
      const mins = Math.ceil(wait / 60_000);
      throw new GitHubError(`GitHub rate limit hit. Resets in ~${mins} minute${mins === 1 ? '' : 's'}.`, 403);
    }
    throw new GitHubError('GitHub blocked the request (secondary rate limit). Try again in a minute.', 403);
  }
  return res;
}

type ContributionDay = { date: string; contributionCount: number };

async function fetchContributionCalendar(login: string, fromISO: string, toISO: string): Promise<ContributionDay[]> {
  if (!process.env.GITHUB_TOKEN) {
    throw new GitHubError('GraphQL contributions require GITHUB_TOKEN', 401);
  }
  const query = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
   user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
     contributionCalendar {
      weeks {
       contributionDays {
        date
        contributionCount
       }
      }
     }
    }
   }
  }
 `;
  const res = await fetch(`${API}/graphql`, {
    body: JSON.stringify({
      query,
      variables: { from: `${fromISO}T00:00:00Z`, login, to: `${toISO}T23:59:59Z` },
    }),
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': UA,
    },
    method: 'POST',
  });
  if (res.status === 401) throw new GitHubError('GitHub auth failed', 401);
  if (res.status === 403 || res.status === 429) {
    throw new GitHubError('GitHub rate limit hit.', 403);
  }
  if (!res.ok) throw new GitHubError(`GitHub GraphQL error (${res.status})`, res.status);
  const j = (await res.json()) as {
    data?: {
      user?: {
        contributionsCollection?: { contributionCalendar?: { weeks: Array<{ contributionDays: ContributionDay[] }> } };
      };
    };
    errors?: Array<{ message: string }>;
  };
  if (j.errors?.length) throw new GitHubError(j.errors[0].message, 400);
  const weeks = j.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
  return weeks.flatMap(w => w.contributionDays);
}

export const getProfile = cache(async (login: string): Promise<ProfileSummary> => {
  return getProfileCached(login.toLowerCase());
});

async function getProfileCached(login: string): Promise<ProfileSummary> {
  'use cache';
  cacheTag(`profile-${login.toLowerCase()}`);
  cacheLife('profile');

  if (MOCK || isShell(login)) return mockProfile(login);

  const res = await gh(`${API}/users/${encodeURIComponent(login)}`);
  if (res.status === 404) throw new GitHubError(`User @${login} not found on GitHub`, 404);
  if (!res.ok) throw new GitHubError(`GitHub error (${res.status})`, res.status);
  const j = await res.json();
  return {
    avatarUrl: j.avatar_url,
    bio: j.bio ?? null,
    createdAt: j.created_at,
    followers: j.followers ?? 0,
    login: j.login,
    name: j.name ?? null,
    publicRepos: j.public_repos ?? 0,
  };
}

type SearchCommitItem = {
  commit: {
    author: { date: string };
    committer: { date: string };
  };
  repository: { full_name: string };
};

async function fetchCommitsInRange(
  login: string,
  fromISO: string,
  toISO: string,
  depth = 0,
  maxPages = 10,
): Promise<Commit[]> {
  const q = `author:${login} author-date:${fromISO}..${toISO}`;
  const commits: Commit[] = [];
  let truncated = false;

  for (let page = 1; page <= maxPages; page++) {
    const url = `${API}/search/commits?q=${encodeURIComponent(q)}&per_page=100&page=${page}&sort=author-date&order=desc`;
    const res = await gh(url, { headers: { Accept: 'application/vnd.github.cloak-preview+json' } });
    if (!res.ok) {
      if (page === 1 && res.status === 422) return [];
      break;
    }
    const j = (await res.json()) as { total_count: number; incomplete_results: boolean; items: SearchCommitItem[] };
    if (j.total_count > 1000 && depth < 3 && maxPages > 1) truncated = true;
    for (const item of j.items ?? []) {
      const iso = item.commit.author?.date ?? item.commit.committer?.date;
      if (!iso) continue;
      const tz = parseTzOffsetMinutes(iso);
      commits.push({
        authoredAt: iso,
        repo: item.repository?.full_name ?? 'unknown',
        tzOffsetMinutes: tz,
      });
    }
    if (!j.items || j.items.length < 100) break;
  }

  if (truncated && depth < 3) {
    const from = new Date(fromISO).getTime();
    const to = new Date(toISO).getTime();
    const mid = new Date((from + to) / 2).toISOString().slice(0, 10);
    const [a, b] = await Promise.all([
      fetchCommitsInRange(login, fromISO, mid, depth + 1, maxPages),
      fetchCommitsInRange(login, mid, toISO, depth + 1, maxPages),
    ]);
    return dedupe([...a, ...b]);
  }

  return commits;
}

function parseTzOffsetMinutes(iso: string): number | null {
  const m = iso.match(/([+-])(\d{2}):?(\d{2})$|Z$/);
  if (!m) return null;
  if (iso.endsWith('Z')) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

function dedupe(commits: Commit[]): Commit[] {
  const seen = new Set<string>();
  const out: Commit[] = [];
  for (const c of commits) {
    const k = `${c.authoredAt}|${c.repo}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

export const getStatsFor = cache(async (login: string, window: Window): Promise<ReturnType<typeof buildStats>> => {
  return getStatsForCached(login.toLowerCase(), window);
});

async function getStatsForCached(login: string, window: Window): Promise<ReturnType<typeof buildStats>> {
  'use cache';
  cacheTag(`stats-${login.toLowerCase()}-${window}`);
  cacheLife('cronotype');

  if (MOCK || isShell(login)) return syntheticStatsFor(mockArchetypeFor(login), 220 + ((login.length * 17) % 180));

  const days = window === '90d' ? 90 : window === '1y' ? 365 : 365 * 5;
  const now = new Date();
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const from = new Date(to.getTime() - days * 24 * 3600_000);
  const commits = await fetchCommitsInRange(
    login,
    from.toISOString().slice(0, 10),
    to.toISOString().slice(0, 10),
    0,
    1,
  );
  return buildStats(commits);
}

export type MonthBucket = { month: string; count: number };
export type YearArchetypeBucket = { year: number; archetypeId: ArchetypeId; commits: number };
export type MonthlyHistory = {
  months: MonthBucket[];
  yearlyArchetypes: YearArchetypeBucket[];
  partial: boolean;
  /** Years whose monthly OR archetype fetch failed - the only ones worth re-fetching. */
  failedYears: number[];
};

type YearMonthly = {
  months: MonthBucket[];
  archetypeId: ArchetypeId | null;
  commits: number;
  year: number;
};

export const getYearMonthly = cache(async (login: string, year: number): Promise<YearMonthly> => {
  return getYearMonthlyCached(login.toLowerCase(), year);
});

async function getYearMonthlyCached(login: string, year: number): Promise<YearMonthly> {
  'use cache';
  cacheTag(`monthly-${login.toLowerCase()}-${year}`);
  cacheLife('cronotype');

  if (MOCK || isShell(login)) {
    const seed = login.length * 31 + year;
    const months: MonthBucket[] = [];
    for (let m = 0; m < 12; m++) {
      const x = Math.sin(seed * 7 + m * 13) * 9999;
      const wave = (Math.abs(x) % 1) * 0.7 + Math.sin(m / 2 + year) * 0.3 + 0.4;
      months.push({ count: Math.max(0, Math.round(wave * 60)), month: `${year}-${String(m + 1).padStart(2, '0')}` });
    }
    const commits = months.reduce((sum, m) => sum + m.count, 0);
    return {
      archetypeId: mockArchetypeFor(`${login}-${year}`),
      commits,
      months,
      year,
    };
  }

  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const days = await fetchContributionCalendar(login, from, to);

  const counts = new Map<string, number>();
  for (let m = 0; m < 12; m++) counts.set(`${year}-${String(m + 1).padStart(2, '0')}`, 0);
  for (const d of days) {
    const key = d.date.slice(0, 7);
    if (key.startsWith(String(year))) {
      counts.set(key, (counts.get(key) ?? 0) + d.contributionCount);
    }
  }
  const months = Array.from(counts.entries())
    .map(([month, count]) => ({ count, month }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const commitsCount = months.reduce((sum, m) => sum + m.count, 0);

  return {
    archetypeId: null,
    commits: commitsCount,
    months,
    year,
  };
}

async function getYearArchetype(login: string, year: number): Promise<ArchetypeId | null> {
  return getYearArchetypeCached(login.toLowerCase(), year);
}

async function getYearArchetypeCached(login: string, year: number): Promise<ArchetypeId | null> {
  'use cache';
  cacheTag(`year-archetype-${login.toLowerCase()}-${year}`);
  cacheLife('cronotype');

  if (MOCK || isShell(login)) return mockArchetypeFor(`${login}-${year}`);

  const sampleCommits = await fetchCommitsInRange(login, `${year}-01-01`, `${year}-12-31`, 0, 2);
  if (sampleCommits.length === 0) return null;
  return classify(buildStats(sampleCommits)).id;
}

export const getMonthlyHistory = cache(
  async (login: string): Promise<MonthlyHistory> => getMonthlyHistoryImpl(login.toLowerCase()),
);

async function getMonthlyHistoryImpl(login: string): Promise<MonthlyHistory> {
  const profile = await getProfile(login);
  const firstYear = new Date(profile.createdAt).getUTCFullYear();
  const thisYear = new Date().getUTCFullYear();

  const years: number[] = [];
  for (let year = thisYear; year >= firstYear; year--) years.push(year);

  const results = await Promise.allSettled(years.map(year => getYearMonthly(login, year)));

  const byYear: YearMonthly[] = [];
  const failedYearsSet = new Set<number>();
  let partial = false;
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      byYear.push(r.value);
    } else {
      partial = true;
      failedYearsSet.add(years[i]);
    }
  });

  if (byYear.length === 0) {
    return { failedYears: [...failedYearsSet], months: [], partial: true, yearlyArchetypes: [] };
  }

  const out = byYear.flatMap(y => y.months).sort((a, b) => a.month.localeCompare(b.month));

  let start = 0;
  while (start < out.length && out[start].count === 0) start++;
  let end = out.length;
  while (
    end > start &&
    out[end - 1].count === 0 &&
    out[end - 1].month > `${thisYear}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`
  ) {
    end--;
  }

  const months = out.slice(start, end);
  if (months.length === 0) {
    return { failedYears: [...failedYearsSet], months: [], partial, yearlyArchetypes: [] };
  }

  const startYear = Number(months[0].month.slice(0, 4));
  const endYear = Number(months[months.length - 1].month.slice(0, 4));

  const yearsWithCommits = byYear
    .filter(y => y.year >= startYear && y.year <= endYear && y.commits > 0)
    .map(y => y.year)
    .sort((a, b) => a - b);

  const archetypeResults: Array<PromiseSettledResult<ArchetypeId | null>> = [];
  for (const year of yearsWithCommits) {
    try {
      const value = await getYearArchetype(login, year);
      archetypeResults.push({ status: 'fulfilled', value });
    } catch (reason) {
      archetypeResults.push({ status: 'rejected', reason });
    }
  }

  const yearlyArchetypes: YearArchetypeBucket[] = [];
  let failed = 0;
  archetypeResults.forEach((r, i) => {
    const year = yearsWithCommits[i];
    const yearData = byYear.find(y => y.year === year);
    if (!yearData) return;
    if (r.status === 'fulfilled' && r.value) {
      yearlyArchetypes.push({ archetypeId: r.value, commits: yearData.commits, year });
    } else {
      failed++;
      failedYearsSet.add(year);
    }
  });

  if (yearsWithCommits.length > 0 && failed / yearsWithCommits.length > 0.5) {
    partial = true;
  }

  return { failedYears: [...failedYearsSet].sort((a, b) => b - a), months, partial, yearlyArchetypes };
}

function mockProfile(login: string): ProfileSummary {
  return {
    avatarUrl: `https://avatars.githubusercontent.com/${encodeURIComponent(login)}`,
    bio: null,
    createdAt: '2017-01-01T00:00:00Z',
    followers: 1200 + ((login.length * 137) % 8000),
    login,
    name: titleCase(login),
    publicRepos: 40,
  };
}

const ARCHETYPE_IDS = Object.keys(ARCHETYPES) as ArchetypeId[];

function mockArchetypeFor(login: string): ArchetypeId {
  let h = 0;
  for (const c of login.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ARCHETYPE_IDS[h % ARCHETYPE_IDS.length];
}

function titleCase(s: string) {
  return s.replace(/(^|[-_])(\w)/g, (_, sep, c) => (sep ? ' ' : '') + c.toUpperCase());
}

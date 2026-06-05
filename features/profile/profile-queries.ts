import 'server-only';

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { ARCHETYPES, classify, percentileFor } from '@/lib/archetypes';
import { buildStats, signalCommits, type Commit } from '@/lib/stats';
import { syntheticStatsFor } from '@/lib/synthetic';
import type { ArchetypeId, CronotypeResult, HourStats, ProfileSummary, Window } from '@/types/cronotype';

const UA = 'cronotype.dev';
const API = 'https://api.github.com';
const MOCK = process.env.MOCK_PROFILE === '1';
const HIGH_YEAR_COMMIT_THRESHOLD = 1000;
const VERY_HIGH_YEAR_COMMIT_THRESHOLD = 5000;
const YEAR_ARCHETYPE_SAMPLE_SIZE = 100;
const HIGH_YEAR_ARCHETYPE_SAMPLE_SIZE = 25;
const VERY_HIGH_YEAR_ARCHETYPE_SAMPLE_SIZE = 5;
export const DEFAULT_HISTORY_ARCHETYPE_PAGE = 0;
const FULL_HISTORY_ARCHETYPE_PAGE = -1;
const HISTORY_ARCHETYPE_PAGE_SIZE = 5;
const MAX_HISTORY_ARCHETYPE_WARM_YEARS = 5;
const GITHUB_RATE_LIMIT_MESSAGE = 'GitHub rate limit hit. Try again in a minute.';
// TODO(nextjs): remove once failed `use cache: remote` fills/revalidations no longer escape
// as unhandled rejections and terminate the Vercel function.
const SHORT_RATE_LIMIT_CACHE_LIFE = { expire: 10, revalidate: 0, stale: 0 };

type ProfileCacheResult =
  | { status: 'found'; profile: ProfileSummary }
  | { status: 'missing' }
  | { status: 'rate-limited' };

export type AgentCommitSample = { month: string; percent: number };
type YearArchetypeResult = {
  agentCommitMonths: AgentCommitSample[];
  agentCommitPercent: number;
  archetypeId: ArchetypeId | null;
};
type YearArchetypeCacheResult = ({ status: 'ok' } & YearArchetypeResult) | { status: 'rate-limited' };

export function yearArchetypeSampleSizeForCommitCount(commitCount: number) {
  if (commitCount > VERY_HIGH_YEAR_COMMIT_THRESHOLD) return VERY_HIGH_YEAR_ARCHETYPE_SAMPLE_SIZE;
  if (commitCount > HIGH_YEAR_COMMIT_THRESHOLD) return HIGH_YEAR_ARCHETYPE_SAMPLE_SIZE;
  return YEAR_ARCHETYPE_SAMPLE_SIZE;
}

export class GitHubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function gitHubErrorStatus(err: unknown): number | null {
  if (err instanceof GitHubError) return err.status;
  if (typeof err !== 'object' || err === null) return null;
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

export function isGitHubNotFoundError(err: unknown): boolean {
  return gitHubErrorStatus(err) === 404;
}

export function isGitHubRateLimitError(err: unknown): boolean {
  const status = gitHubErrorStatus(err);
  if (status === 403 || status === 429) return true;
  return err instanceof Error && /rate limit|secondary rate limit|blocked the request/i.test(err.message);
}

export function isGitHubHistoryUnavailableError(err: unknown): boolean {
  if (gitHubErrorStatus(err) !== 503) return false;
  return err instanceof Error && err.message.includes('GitHub could not load commit history');
}

function gitHubRateLimitError(): GitHubError {
  return new GitHubError(GITHUB_RATE_LIMIT_MESSAGE, 403);
}

function githubHistoryToken(): string | undefined {
  return process.env.GITHUB_HISTORY_TOKEN ?? process.env.GITHUB_TOKEN;
}

export async function ensureGitHubRateLimitHeadroom(minRemaining = 10) {
  const res = await gh(`${API}/rate_limit`);
  const remaining = Number(res.headers.get('x-ratelimit-remaining') ?? '0');
  if (Number.isFinite(remaining) && remaining < minRemaining) {
    throw gitHubRateLimitError();
  }
}

function headers(extra: Record<string, string> = {}, token = process.env.GITHUB_TOKEN): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': UA,
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

export const computeCronotype = cache(async (login: string, window: Window = '90d'): Promise<CronotypeResult> => {
  const normalized = login.toLowerCase();
  const result = await computeCronotypeCached(normalized, window);
  if (!result) throw gitHubRateLimitError();
  return result;
});

async function computeCronotypeCached(login: string, window: Window): Promise<CronotypeResult | null> {
  'use cache: remote';
  cacheTag(`cronotype-${login}-${window}`);
  cacheLife('cronotype');

  try {
    const profile = await getProfile(login);
    const today = profile.fetchedAtDate ?? (await getGitHubDateKey());
    const stats = await getStatsFor(login, window, today);

    const archetype = classify(stats);
    const percentile = percentileFor(archetype, stats);
    return { archetype, percentile, profile, stats, window };
  } catch (err) {
    if (isGitHubRateLimitError(err)) {
      // TODO(nextjs): short-cache the sentinel until cache revalidation errors stop escaping.
      cacheLife(SHORT_RATE_LIMIT_CACHE_LIFE);
      return null;
    }
    throw err;
  }
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

async function gh(url: string, init: RequestInit = {}, token = process.env.GITHUB_TOKEN): Promise<Response> {
  await acquireSlot();
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { ...headers({}, token), ...(init.headers ?? {}) } });
  } finally {
    releaseSlot();
  }
  if (res.status === 401) throw new GitHubError('GitHub auth failed - check that GITHUB_TOKEN is valid', 401);
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (remaining === '0') {
      throw gitHubRateLimitError();
    }
    throw new GitHubError('GitHub blocked the request (secondary rate limit). Try again in a minute.', 403);
  }
  return res;
}

type ContributionDay = { date: string; contributionCount: number };

async function fetchContributionCalendar(login: string, fromISO: string, toISO: string): Promise<ContributionDay[]> {
  const token = githubHistoryToken();
  if (!token) {
    throw new GitHubError('GraphQL contributions require GITHUB_TOKEN or GITHUB_HISTORY_TOKEN', 401);
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
  await acquireSlot();
  let res: Response;
  try {
    res = await fetch(`${API}/graphql`, {
      body: JSON.stringify({
        query,
        variables: { from: `${fromISO}T00:00:00Z`, login, to: `${toISO}T23:59:59Z` },
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': UA,
      },
      method: 'POST',
    });
  } catch (err) {
    throw err;
  } finally {
    releaseSlot();
  }
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

export async function getProfile(login: string): Promise<ProfileSummary> {
  const profile = await getProfileOrNull(login);
  if (profile) return profile;
  throw new GitHubError(`User @${login.toLowerCase()} not found on GitHub`, 404);
}

export async function getProfileOrNull(login: string): Promise<ProfileSummary | null> {
  const result = await getProfileCached(login.toLowerCase());
  if (result.status === 'rate-limited') throw gitHubRateLimitError();
  return result.status === 'found' ? result.profile : null;
}

async function getProfileCached(login: string): Promise<ProfileCacheResult> {
  'use cache: remote';
  cacheTag(`profile-${login}`);
  cacheLife('cronotype');

  if (MOCK) {
    return { profile: mockProfile(login), status: 'found' };
  }

  try {
    const res = await gh(`${API}/users/${encodeURIComponent(login)}`);
    if (res.status === 404) return { status: 'missing' };
    if (!res.ok) throw new GitHubError(`GitHub error (${res.status})`, res.status);
    const fetchedAtDate = dateHeaderToDayKey(res.headers.get('date'));
    const j = await res.json();
    return {
      profile: {
        avatarUrl: j.avatar_url,
        bio: j.bio ?? null,
        createdAt: j.created_at,
        fetchedAtDate,
        followers: j.followers ?? 0,
        login: j.login,
        name: j.name ?? null,
        publicRepos: j.public_repos ?? 0,
      },
      status: 'found',
    };
  } catch (err) {
    if (isGitHubRateLimitError(err)) {
      // TODO(nextjs): short-cache the sentinel until cache revalidation errors stop escaping.
      cacheLife(SHORT_RATE_LIMIT_CACHE_LIFE);
      return { status: 'rate-limited' };
    }
    throw err;
  }
}

type SearchCommitItem = {
  author?: { login?: string; type?: string } | null;
  commit: {
    author: { date: string };
    committer: { date: string };
    message?: string;
  };
  committer?: { login?: string; type?: string } | null;
  parents?: unknown[];
  repository: { full_name: string };
};

async function fetchCommitsInRange(
  login: string,
  fromISO: string,
  toISO: string,
  depth = 0,
  maxPages = 10,
  perPage = 100,
  token = process.env.GITHUB_TOKEN,
): Promise<Commit[]> {
  const q = `author:${login} author-date:${fromISO}..${toISO}`;
  const commits: Commit[] = [];
  let truncated = false;

  for (let page = 1; page <= maxPages; page++) {
    const url = `${API}/search/commits?q=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}&sort=author-date&order=desc`;
    const res = await gh(url, { headers: { Accept: 'application/vnd.github.cloak-preview+json' } }, token);
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
        authorLogin: item.author?.login ?? null,
        authorType: item.author?.type ?? null,
        committerLogin: item.committer?.login ?? null,
        committerType: item.committer?.type ?? null,
        message: item.commit.message ?? '',
        parentCount: item.parents?.length ?? 1,
        repo: item.repository?.full_name ?? 'unknown',
        tzOffsetMinutes: tz,
      });
    }
    if (!j.items || j.items.length < perPage) break;
  }

  if (truncated && depth < 3) {
    const from = dateKeyToDayNumber(fromISO);
    const to = dateKeyToDayNumber(toISO);
    const mid = dayNumberToDateKey(Math.floor((from + to) / 2));
    const [a, b] = await Promise.all([
      fetchCommitsInRange(login, fromISO, mid, depth + 1, maxPages, perPage, token),
      fetchCommitsInRange(login, mid, toISO, depth + 1, maxPages, perPage, token),
    ]);
    return dedupe([...a, ...b]);
  }

  return commits;
}

function parseTzOffsetMinutes(iso: string): number | null {
  const m = iso.match(/([+-])(\d{2}):?(\d{2})$|Z$/);
  if (!m) return null;
  if (iso.endsWith('Z')) return null;
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

function dateHeaderToDayKey(value: string | null): string {
  if (!value) throw new GitHubError('GitHub response did not include a date header.', 502);
  const match = value.match(/^[A-Za-z]{3},\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+/);
  const month = match ? monthIndex(match[2]) : 0;
  if (!match || month === 0) throw new GitHubError('GitHub response included an invalid date header.', 502);
  return `${match[3]}-${String(month).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`;
}

function monthIndex(name: string): number {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(name) + 1;
}

function dateKeyToDayNumber(value: string): number {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (![year, month, day].every(Number.isFinite)) throw new GitHubError('Invalid date key.', 502);
  return daysFromCivil(year, month, day);
}

function dayNumberToDateKey(dayNumber: number): string {
  const { day, month, year } = civilFromDays(dayNumber);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysFromCivil(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  m += m > 2 ? -3 : 9;
  const doy = Math.floor((153 * m + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function civilFromDays(dayNumber: number) {
  const z = dayNumber + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  let year = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp + (mp < 10 ? 3 : -9);
  year += month <= 2 ? 1 : 0;
  return { day, month, year };
}

async function getGitHubDateKey(): Promise<string> {
  const value = await getGitHubDateKeyCached();
  if (!value) throw gitHubRateLimitError();
  return value;
}

async function getGitHubDateKeyCached(): Promise<string | null> {
  'use cache: remote';
  cacheTag('github-date');
  cacheLife('hours');

  try {
    const res = await gh(`${API}/rate_limit`);
    return dateHeaderToDayKey(res.headers.get('date'));
  } catch (err) {
    if (isGitHubRateLimitError(err)) {
      // TODO(nextjs): short-cache the sentinel until cache revalidation errors stop escaping.
      cacheLife(SHORT_RATE_LIMIT_CACHE_LIFE);
      return null;
    }
    throw err;
  }
}

function rangeFromToday(toISO: string, window: Window): { fromISO: string; toISO: string } {
  const days = window === '90d' ? 90 : window === '1y' ? 365 : 365 * 5;
  return { fromISO: dayNumberToDateKey(dateKeyToDayNumber(toISO) - days), toISO };
}

export async function getStatsFor(login: string, window: Window, toDateKey?: string): Promise<HourStats> {
  const today = toDateKey ?? (await getProfile(login)).fetchedAtDate ?? (await getGitHubDateKey());
  const { fromISO, toISO } = rangeFromToday(today, window);
  const stats = await getStatsForCached(login.toLowerCase(), window, fromISO, toISO);
  if (!stats) throw gitHubRateLimitError();
  return stats;
}

export async function getSignalCommitsFor(login: string, window: Window, toDateKey?: string): Promise<Commit[]> {
  const today = toDateKey ?? (await getProfile(login)).fetchedAtDate ?? (await getGitHubDateKey());
  const { fromISO, toISO } = rangeFromToday(today, window);
  const commits = await getSignalCommitsForCached(login.toLowerCase(), window, fromISO, toISO);
  if (!commits) throw gitHubRateLimitError();
  return commits;
}

async function getStatsForCached(
  login: string,
  window: Window,
  fromISO: string,
  toISO: string,
): Promise<HourStats | null> {
  'use cache: remote';
  cacheTag(`stats-${login}-${window}`);
  cacheTag(`stats-${login}-${window}-${toISO}`);
  cacheLife('cronotype');

  if (MOCK) {
    return syntheticStatsFor(mockArchetypeFor(login), 220 + ((login.length * 17) % 180));
  }

  try {
    const commits = await getSignalCommitsForCached(login, window, fromISO, toISO);
    if (!commits) {
      // TODO(nextjs): short-cache the sentinel until cache revalidation errors stop escaping.
      cacheLife(SHORT_RATE_LIMIT_CACHE_LIFE);
      return null;
    }
    return buildStats(commits);
  } catch (err) {
    if (isGitHubRateLimitError(err)) {
      // TODO(nextjs): short-cache the sentinel until cache revalidation errors stop escaping.
      cacheLife(SHORT_RATE_LIMIT_CACHE_LIFE);
      return null;
    }
    throw err;
  }
}

async function getSignalCommitsForCached(
  login: string,
  window: Window,
  fromISO: string,
  toISO: string,
): Promise<Commit[] | null> {
  'use cache: remote';
  cacheTag(`commits-${login}-${window}`);
  cacheTag(`commits-${login}-${window}-${toISO}`);
  cacheLife('cronotype');

  if (MOCK) {
    return [];
  }

  try {
    const commits = await fetchCommitsInRange(login, fromISO, toISO, 0, 1);
    return signalCommits(commits);
  } catch (err) {
    if (isGitHubRateLimitError(err)) {
      // TODO(nextjs): short-cache the sentinel until cache revalidation errors stop escaping.
      cacheLife(SHORT_RATE_LIMIT_CACHE_LIFE);
      return null;
    }
    throw err;
  }
}

export type MonthBucket = { month: string; count: number };
export type YearArchetypeBucket = {
  agentCommitMonths: AgentCommitSample[];
  agentCommitPercent: number;
  archetypeId: ArchetypeId | null;
  commits: number;
  year: number;
};
export type MonthlyHistory = {
  months: MonthBucket[];
  yearlyArchetypes: YearArchetypeBucket[];
  partial: boolean;
  archetypeYearPage: number;
  archetypeYearRangeLabel: string | null;
  /** Years whose monthly fetch failed - only these get monthly tags invalidated on refresh. */
  failedMonthlyYears: number[];
  /** Years whose archetype fetch failed - only these get archetype tags invalidated on refresh. */
  failedArchetypeYears: number[];
  hasNewerArchetypeYears: boolean;
  hasOlderArchetypeYears: boolean;
  sampledArchetypeYears: number[];
  visibleTimelineYears: number[];
};

export type TimelineGeometry = {
  width: number;
  height: number;
  padTop: number;
  padBottom: number;
};

export type AgentCommitBar = {
  height: number;
  percent: number;
  period: string;
  width: number;
  x: number;
  y: number;
  year: number;
};

type TimelineChartOptions = {
  scope?: 'window' | 'full';
};

type TimelineMark = {
  archetypeId: ArchetypeId | null;
  color: string | null;
  commits: number;
  idx: number;
  label: string | null;
  missing: boolean;
  skipped: boolean;
  year: number;
};

type TimelineEra = {
  color: string;
  commits: number;
  label: string | null;
  yearLabel: string;
  startPct: number;
  endPct: number;
  unknown: boolean;
};

type YearMonthly = {
  months: MonthBucket[];
  archetypeId: ArchetypeId | null;
  commits: number;
  year: number;
};

async function getYearMonthly(login: string, year: number): Promise<YearMonthly> {
  const value = await getYearMonthlyCached(login.toLowerCase(), year);
  if (!value) throw gitHubRateLimitError();
  return value;
}

async function getYearMonthlyCached(login: string, year: number): Promise<YearMonthly | null> {
  'use cache: remote';
  cacheTag(`monthly-${login}-${year}`);
  cacheLife('cronotype');

  if (MOCK) {
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

  try {
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
  } catch (err) {
    if (isGitHubRateLimitError(err)) {
      // TODO(nextjs): short-cache the sentinel until cache revalidation errors stop escaping.
      cacheLife(SHORT_RATE_LIMIT_CACHE_LIFE);
      return null;
    }
    throw err;
  }
}

async function getYearArchetype(login: string, year: number, commitCount: number): Promise<YearArchetypeResult> {
  const result = await getYearArchetypeCached(login, year, commitCount);
  if (result.status === 'rate-limited') throw gitHubRateLimitError();
  return {
    agentCommitMonths: result.agentCommitMonths,
    agentCommitPercent: result.agentCommitPercent,
    archetypeId: result.archetypeId,
  };
}

async function getYearArchetypeCached(
  login: string,
  year: number,
  commitCount: number,
): Promise<YearArchetypeCacheResult> {
  'use cache: remote';
  cacheTag(`year-archetype-${login.toLowerCase()}-${year}`);
  cacheLife('cronotype');

  if (MOCK) {
    return {
      agentCommitMonths: [],
      agentCommitPercent: 0,
      archetypeId: mockArchetypeFor(`${login}-${year}`),
      status: 'ok',
    };
  }

  try {
    const perPage = yearArchetypeSampleSizeForCommitCount(commitCount);
    const sampleCommits = await fetchCommitsInRange(
      login,
      `${year}-01-01`,
      `${year}-12-31`,
      0,
      1,
      perPage,
      githubHistoryToken(),
    );
    const signal = signalCommits(sampleCommits);
    if (signal.length === 0) {
      return {
        agentCommitMonths: [],
        agentCommitPercent: 0,
        archetypeId: sampleCommits.length > 0 ? ARCHETYPES.drifter.id : null,
        status: 'ok',
      };
    }
    const stats = buildStats(signal);
    return {
      agentCommitMonths: agentCommitMonthsFromSample(signal),
      agentCommitPercent: stats.aiScore,
      archetypeId: classify({ ...stats, total: commitCount }).id,
      status: 'ok',
    };
  } catch (err) {
    if (isGitHubRateLimitError(err)) {
      // TODO(nextjs): short-cache the sentinel until cache revalidation errors stop escaping.
      cacheLife(SHORT_RATE_LIMIT_CACHE_LIFE);
      return { status: 'rate-limited' };
    }
    throw err;
  }
}

export type WarmedHistoryYears = {
  archetypeYears: number[];
  monthlyYears: number[];
};

export async function warmMissingHistoryYears(
  login: string,
  failedMonthlyYears: number[],
  failedArchetypeYears: number[],
): Promise<WarmedHistoryYears> {
  const lower = login.toLowerCase();
  const warmed: WarmedHistoryYears = { archetypeYears: [], monthlyYears: [] };
  const monthlyByYear = new Map<number, YearMonthly>();

  for (const year of [...new Set(failedMonthlyYears)]) {
    try {
      const value = await getYearMonthly(lower, year);
      monthlyByYear.set(year, value);
      warmed.monthlyYears.push(year);
    } catch (err) {
      if (isGitHubRateLimitError(err)) break;
      throw err;
    }
  }

  for (const year of [...new Set(failedArchetypeYears)].slice(0, MAX_HISTORY_ARCHETYPE_WARM_YEARS)) {
    try {
      const yearData = monthlyByYear.get(year) ?? (await getYearMonthly(lower, year));
      if (yearData.commits <= 0) continue;
      await getYearArchetype(lower, year, yearData.commits);
      warmed.archetypeYears.push(year);
    } catch (err) {
      if (isGitHubRateLimitError(err)) break;
      throw err;
    }
  }

  return warmed;
}

export async function getMonthlyHistory(
  login: string,
  archetypeYearPage = DEFAULT_HISTORY_ARCHETYPE_PAGE,
): Promise<MonthlyHistory> {
  const lower = login.toLowerCase();
  const profile = await getProfile(lower);
  const today = profile.fetchedAtDate ?? (await getGitHubDateKey());
  return getMonthlyHistoryCached(lower, today, profile.createdAt, archetypeYearPage);
}

export async function getTimelineChart(
  login: string,
  geometry: TimelineGeometry,
  archetypeYearPage = Number.NaN,
  options: TimelineChartOptions = {},
) {
  const lower = login.toLowerCase();

  const [
    {
      archetypeYearPage: resolvedArchetypeYearPage,
      archetypeYearRangeLabel,
      failedArchetypeYears,
      failedMonthlyYears,
      hasNewerArchetypeYears,
      hasOlderArchetypeYears,
      months,
      sampledArchetypeYears,
      visibleTimelineYears,
      yearlyArchetypes,
      partial,
    },
    { archetype, profile, stats },
  ] = await Promise.all([getMonthlyHistory(lower, archetypeYearPage), computeCronotype(lower, '90d')]);

  const fullScope = options.scope === 'full';
  const chartMonths = fullScope ? months : selectTimelineMonths(months, visibleTimelineYears);
  const totalCommits = months.reduce((sum, month) => sum + month.count, 0);
  const currentHistoryYear = Number(months[months.length - 1]?.month.slice(0, 4));

  if (chartMonths.length < 2) {
    return {
      archetype,
      archetypeYearPage: resolvedArchetypeYearPage,
      archetypeYearRangeLabel,
      eras: [],
      failedArchetypeYears,
      failedMonthlyYears,
      hasNewerArchetypeYears,
      hasOlderArchetypeYears,
      hasData: false,
      agentBars: [],
      months: chartMonths,
      partial,
      profile,
      totalCommits,
      yTicks: [],
      yearlyArchetypes,
      yearDividers: [],
      yearMarkers: [],
    };
  }

  const smoothed = smooth(
    chartMonths.map(m => m.count),
    2,
  );
  const max = Math.max(1, ...smoothed);
  const usableH = geometry.height - geometry.padTop - geometry.padBottom;

  const points = smoothed.map((v, i) => ({
    x: (i / (smoothed.length - 1)) * geometry.width,
    y: geometry.padTop + usableH - (v / max) * usableH,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L${geometry.width},${geometry.height - geometry.padBottom} L0,${geometry.height - geometry.padBottom} Z`;
  const yearMarkers = computeYearMarkers(chartMonths, geometry.width);
  const yearDividers = computeYearDividers(chartMonths, geometry.width);
  const marks = buildYearMarks(
    chartMonths,
    yearlyArchetypes,
    archetype.id,
    sampledArchetypeYears,
    fullScope || visibleTimelineYears.includes(currentHistoryYear),
    fullScope ? 'carry' : 'unknown',
  );
  const eras = buildEras(marks, smoothed.length, archetype.theme.accent);
  const agentBars = buildAgentCommitBars(
    chartMonths,
    yearlyArchetypes,
    currentHistoryYear,
    stats.aiScore,
    fullScope || visibleTimelineYears.includes(currentHistoryYear),
    geometry,
  );
  const yTicks = [max, max / 2].map(value => ({
    value: Math.round(value),
    y: geometry.padTop + usableH - (value / max) * usableH,
  }));

  return {
    archetype,
    archetypeYearPage: resolvedArchetypeYearPage,
    archetypeYearRangeLabel,
    areaPath,
    eras,
    failedArchetypeYears,
    failedMonthlyYears,
    hasData: true,
    hasNewerArchetypeYears,
    hasOlderArchetypeYears,
    agentBars,
    linePath,
    months: chartMonths,
    partial,
    profile,
    yTicks,
    totalCommits,
    yearDividers,
    yearMarkers,
    yearlyArchetypes,
  };
}

export async function getTimelineExportChart(login: string, geometry: TimelineGeometry) {
  return getTimelineChart(login, geometry, FULL_HISTORY_ARCHETYPE_PAGE, { scope: 'full' });
}

function smooth(values: number[], radius: number): number[] {
  if (radius <= 0) return values;
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(values.length - 1, i + radius); j++) {
      sum += values[j];
      n++;
    }
    out.push(sum / n);
  }
  return out;
}

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function computeYearMarkers(months: MonthBucket[], width: number): Array<{ label: string; x: number }> {
  const seen = new Map<number, number>();
  months.forEach((m, i) => {
    const y = Number(m.month.slice(0, 4));
    if (!seen.has(y)) seen.set(y, i);
  });

  const entries = Array.from(seen.entries());
  const step = Math.max(1, Math.ceil(entries.length / 6));
  const picked = entries.filter((_, i) => i % step === 0 || i === entries.length - 1);

  return picked.map(([year, idx]) => ({
    label: String(year),
    x: (idx / (months.length - 1)) * width,
  }));
}

function computeYearDividers(months: MonthBucket[], width: number): Array<{ year: number; x: number }> {
  const out: Array<{ year: number; x: number }> = [];
  let previousYear: number | null = null;
  months.forEach((month, index) => {
    const year = Number(month.month.slice(0, 4));
    if (previousYear !== null && year !== previousYear) {
      out.push({
        year,
        x: (index / (months.length - 1)) * width,
      });
    }
    previousYear = year;
  });
  return out;
}

function buildAgentCommitBars(
  months: MonthBucket[],
  yearly: YearArchetypeBucket[],
  currentYear: number,
  currentAgentCommitPercent: number,
  includeCurrentYear: boolean,
  geometry: TimelineGeometry,
): AgentCommitBar[] {
  if (months.length < 2) return [];

  const percentByMonth = new Map<string, number>();
  const percentByYear = new Map<number, number>();
  for (const bucket of yearly) {
    if (bucket.commits <= 0) continue;
    for (const sample of bucket.agentCommitMonths) {
      const percent = clampPercent(sample.percent);
      if (percent > 0) percentByMonth.set(sample.month, percent);
    }
    if (bucket.agentCommitMonths.length === 0) {
      percentByYear.set(bucket.year, clampPercent(bucket.agentCommitPercent));
    }
  }
  if (includeCurrentYear && Number.isFinite(currentYear)) {
    percentByYear.set(currentYear, clampPercent(currentAgentCommitPercent));
  }
  if (percentByMonth.size === 0 && percentByYear.size === 0) return [];

  const spans = new Map<number, { first: number; last: number }>();
  months.forEach((month, index) => {
    const year = Number(month.month.slice(0, 4));
    const existing = spans.get(year);
    if (existing) {
      existing.last = index;
    } else {
      spans.set(year, { first: index, last: index });
    }
  });

  const maxBarHeight = geometry.height - geometry.padTop - geometry.padBottom;
  const barWidth = 4;
  const baseline = geometry.height - geometry.padBottom;
  const bars: AgentCommitBar[] = [];

  if (percentByMonth.size > 0) {
    for (const [index, month] of months.entries()) {
      const percent = percentByMonth.get(month.month) ?? 0;
      const height = percent > 0 ? Math.max(3, (percent / 100) * maxBarHeight) : 3;
      const x = (index / (months.length - 1)) * geometry.width;
      bars.push({
        height,
        percent,
        period: month.month,
        width: barWidth,
        x: x - barWidth / 2,
        y: baseline - height,
        year: Number(month.month.slice(0, 4)),
      });
    }
  }

  for (const [year, span] of Array.from(spans.entries()).sort((a, b) => a[0] - b[0])) {
    const percent = percentByYear.get(year);
    if (percent == null || percent <= 0) continue;
    const midpoint = Math.round((span.first + span.last) / 2);
    const height = Math.max(3, (percent / 100) * maxBarHeight);
    const x = (midpoint / (months.length - 1)) * geometry.width;
    bars.push({
      height,
      percent,
      period: String(year),
      width: barWidth,
      x: x - barWidth / 2,
      y: baseline - height,
      year,
    });
  }

  return bars;
}

function agentCommitMonthsFromSample(commits: Commit[]): AgentCommitSample[] {
  const byMonth = new Map<string, Commit[]>();
  for (const commit of commits) {
    const month = commit.authoredAt.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    const existing = byMonth.get(month);
    if (existing) {
      existing.push(commit);
    } else {
      byMonth.set(month, [commit]);
    }
  }

  return Array.from(byMonth.entries())
    .map(([month, monthCommits]) => ({
      month,
      percent: buildStats(monthCommits).aiScore,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildYearMarks(
  months: MonthBucket[],
  yearly: YearArchetypeBucket[],
  currentId: ArchetypeId,
  sampledYears: number[],
  includeCurrentYear: boolean,
  skippedMode: 'unknown' | 'carry' = 'unknown',
): TimelineMark[] {
  const archetypeByYear = new Map<number, ArchetypeId | null>();
  for (const y of yearly) {
    if (y.commits > 0) archetypeByYear.set(y.year, y.archetypeId);
  }
  const sampledYearSet = new Set(sampledYears);

  if (includeCurrentYear) {
    const lastYear = months.length > 0 ? Number(months[months.length - 1].month.slice(0, 4)) : 2026;
    archetypeByYear.set(lastYear, currentId);
    sampledYearSet.add(lastYear);
  }

  const commitsByYear = new Map<number, number>();
  const firstIdxByYear = new Map<number, number>();
  months.forEach((m, i) => {
    const y = Number(m.month.slice(0, 4));
    commitsByYear.set(y, (commitsByYear.get(y) ?? 0) + m.count);
    if (!firstIdxByYear.has(y)) firstIdxByYear.set(y, i);
  });

  return Array.from(firstIdxByYear.entries())
    .filter(([year]) => (commitsByYear.get(year) ?? 0) > 0)
    .sort((a, b) => a[0] - b[0])
    .map(([year, idx]) => {
      const sampled = sampledYearSet.has(year);
      const hasClassification = sampled && archetypeByYear.has(year);
      const archetypeId = hasClassification ? (archetypeByYear.get(year) ?? null) : null;
      const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;
      const noSignal = hasClassification && !archetypeId;
      const skipped = !sampled;
      const missing = !hasClassification && (!skipped || skippedMode === 'unknown');
      return {
        archetypeId,
        color: noSignal ? '#9ca3af' : (archetype?.theme.accent ?? null),
        commits: commitsByYear.get(year) ?? 0,
        idx,
        label: skipped ? null : noSignal ? 'No signal' : (archetype?.name ?? null),
        missing,
        skipped,
        year,
      };
    });
}

function selectTimelineMonths(months: MonthBucket[], visibleYears: number[]) {
  if (months.length === 0) return months;
  if (visibleYears.length === 0) return months;
  const sorted = [...visibleYears].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  return months.filter(month => {
    const year = Number(month.month.slice(0, 4));
    return year >= first && year <= last;
  });
}

function buildEras(marks: TimelineMark[], pointCount: number, fallback: string): TimelineEra[] {
  if (marks.length === 0 || pointCount < 2) {
    return [{ color: fallback, commits: 0, endPct: 100, label: null, startPct: 0, unknown: true, yearLabel: '' }];
  }

  const pct = (idx: number) => (idx / (pointCount - 1)) * 100;

  const eras: TimelineEra[] = [];
  let lastColor = marks[0].color ?? fallback;

  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    const unknown = m.missing;
    const color = unknown ? '#94a3b8' : (m.color ?? lastColor);
    const startPct = i === 0 ? 0 : pct(m.idx);
    const endPct = i === marks.length - 1 ? 100 : pct(marks[i + 1].idx);
    if (!unknown) lastColor = color;

    const prev = eras[eras.length - 1];
    if (prev && prev.unknown === unknown && prev.color === color && prev.label === m.label) {
      prev.commits += m.commits;
      prev.endPct = endPct;
      prev.yearLabel = `${prev.yearLabel.split('-')[0]}-${m.year}`;
    } else {
      eras.push({
        color,
        commits: m.commits,
        endPct,
        label: m.label,
        startPct,
        unknown,
        yearLabel: String(m.year),
      });
    }
  }

  return eras;
}

async function getMonthlyHistoryCached(
  login: string,
  today: string,
  profileCreatedAt: string,
  archetypeYearPage: number,
): Promise<MonthlyHistory> {
  'use cache: remote';
  cacheTag(`history-${login}`);
  cacheTag(`history-${login}-${today}`);
  cacheLife('cronotype');

  if (MOCK) {
    const years = [2026, 2025, 2024, 2023, 2022];
    const rawResults = await Promise.all(years.map(y => getYearMonthly(login, y)));
    const results = rawResults.filter((r): r is YearMonthly => r !== null);
    const history = {
      archetypeYearPage,
      archetypeYearRangeLabel: null,
      failedArchetypeYears: [],
      failedMonthlyYears: [],
      hasNewerArchetypeYears: false,
      hasOlderArchetypeYears: false,
      months: results.flatMap(r => r.months).sort((a, b) => a.month.localeCompare(b.month)),
      partial: false,
      sampledArchetypeYears: results.map(r => r.year),
      visibleTimelineYears: results.map(r => r.year),
      yearlyArchetypes: results.map(r => ({
        agentCommitMonths: [],
        agentCommitPercent: 0,
        archetypeId: r.archetypeId ?? ('drifter' as ArchetypeId),
        commits: r.commits,
        year: r.year,
      })),
    };
    return history;
  }

  const firstYear = Number(profileCreatedAt.slice(0, 4));
  const thisYear = Number(today.slice(0, 4));
  const thisMonth = Number(today.slice(5, 7));

  const years: number[] = [];
  for (let year = thisYear; year >= firstYear; year--) years.push(year);

  const byYear: YearMonthly[] = [];
  const failedMonthlySet = new Set<number>();
  const failedArchetypeSet = new Set<number>();
  let partial = false;
  for (const year of years) {
    try {
      const value = await getYearMonthly(login, year);
      byYear.push(value);
      continue;
    } catch {
      partial = true;
      failedMonthlySet.add(year);
    }
  }

  if (byYear.length === 0) {
    return {
      failedArchetypeYears: [],
      failedMonthlyYears: [...failedMonthlySet].sort((a, b) => b - a),
      archetypeYearPage,
      archetypeYearRangeLabel: null,
      hasNewerArchetypeYears: false,
      hasOlderArchetypeYears: false,
      months: [],
      partial: true,
      sampledArchetypeYears: [],
      visibleTimelineYears: [],
      yearlyArchetypes: [],
    };
  }

  const out = byYear.flatMap(y => y.months).sort((a, b) => a.month.localeCompare(b.month));

  let start = 0;
  while (start < out.length && out[start].count === 0) start++;
  let end = out.length;
  while (
    end > start &&
    out[end - 1].count === 0 &&
    out[end - 1].month > `${thisYear}-${String(thisMonth).padStart(2, '0')}`
  ) {
    end--;
  }

  const months = out.slice(start, end);
  if (months.length === 0) {
    return {
      failedArchetypeYears: [],
      failedMonthlyYears: [...failedMonthlySet],
      archetypeYearPage,
      archetypeYearRangeLabel: null,
      hasNewerArchetypeYears: false,
      hasOlderArchetypeYears: false,
      months: [],
      partial,
      sampledArchetypeYears: [],
      visibleTimelineYears: [],
      yearlyArchetypes: [],
    };
  }

  const startYear = Number(months[0].month.slice(0, 4));
  const endYear = Number(months[months.length - 1].month.slice(0, 4));

  const yearsWithCommits = byYear
    .filter(y => y.year >= startYear && y.year <= endYear && y.commits > 0)
    .filter(y => y.year !== thisYear)
    .map(y => y.year)
    .sort((a, b) => b - a);
  const maxPage = Math.max(0, Math.ceil((endYear - startYear + 1) / HISTORY_ARCHETYPE_PAGE_SIZE) - 1);
  const fullHistory = archetypeYearPage === FULL_HISTORY_ARCHETYPE_PAGE;
  const resolvedPage = fullHistory
    ? FULL_HISTORY_ARCHETYPE_PAGE
    : Number.isFinite(archetypeYearPage)
      ? Math.max(0, Math.min(maxPage, Math.round(archetypeYearPage)))
      : DEFAULT_HISTORY_ARCHETYPE_PAGE;
  const visibleTimelineYears = fullHistory
    ? timelineYearWindow(startYear, endYear, FULL_HISTORY_ARCHETYPE_PAGE)
    : timelineYearWindow(startYear, endYear, resolvedPage);
  const visibleYearSet = new Set(visibleTimelineYears);
  const sampledYears = fullHistory ? yearsWithCommits : yearsWithCommits.filter(year => visibleYearSet.has(year));

  const archetypeResults: Array<PromiseSettledResult<YearArchetypeResult>> = [];
  for (const year of sampledYears) {
    try {
      const yearData = byYear.find(y => y.year === year);
      const value = await getYearArchetype(login, year, yearData?.commits ?? 0);
      archetypeResults.push({ status: 'fulfilled', value });
    } catch (reason) {
      archetypeResults.push({ status: 'rejected', reason });
      if (isGitHubRateLimitError(reason)) break;
    }
  }

  const yearlyArchetypes: YearArchetypeBucket[] = [];
  const attemptedYears = new Set<number>();
  archetypeResults.forEach((r, i) => {
    const year = sampledYears[i];
    const yearData = byYear.find(y => y.year === year);
    if (!yearData) return;
    attemptedYears.add(year);
    if (r.status === 'fulfilled') {
      yearlyArchetypes.push({
        agentCommitMonths: r.value.agentCommitMonths,
        agentCommitPercent: r.value.agentCommitPercent,
        archetypeId: r.value.archetypeId,
        commits: yearData.commits,
        year,
      });
    } else {
      failedArchetypeSet.add(year);
    }
  });

  if (archetypeResults.length < sampledYears.length) {
    partial = true;
  }

  for (const year of sampledYears) {
    if (!attemptedYears.has(year)) failedArchetypeSet.add(year);
  }

  if (failedArchetypeSet.size > 0) partial = true;

  return {
    archetypeYearPage: resolvedPage,
    archetypeYearRangeLabel: formatYearRange(visibleTimelineYears),
    failedArchetypeYears: [...failedArchetypeSet].sort((a, b) => b - a),
    failedMonthlyYears: [...failedMonthlySet].sort((a, b) => b - a),
    hasNewerArchetypeYears: fullHistory ? false : resolvedPage > 0,
    hasOlderArchetypeYears: fullHistory ? false : Math.min(...visibleTimelineYears) > startYear,
    months,
    partial,
    sampledArchetypeYears: sampledYears,
    visibleTimelineYears,
    yearlyArchetypes,
  };
}

function timelineYearWindow(startYear: number, endYear: number, page: number) {
  if (page === FULL_HISTORY_ARCHETYPE_PAGE) {
    const years: number[] = [];
    for (let year = endYear; year >= startYear; year--) years.push(year);
    return years;
  }

  const newestWindowEnd = endYear - page * HISTORY_ARCHETYPE_PAGE_SIZE;
  const windowStart = Math.max(startYear, newestWindowEnd - HISTORY_ARCHETYPE_PAGE_SIZE + 1);
  const windowEnd = Math.min(endYear, windowStart + HISTORY_ARCHETYPE_PAGE_SIZE - 1);
  const years: number[] = [];
  for (let year = windowEnd; year >= windowStart; year--) years.push(year);
  return years;
}

function formatYearRange(years: number[]) {
  if (years.length === 0) return null;
  const sorted = [...years].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return first === last ? String(first) : `${first}-${last}`;
}

function mockProfile(login: string): ProfileSummary {
  return {
    avatarUrl: `https://avatars.githubusercontent.com/${encodeURIComponent(login)}`,
    bio: null,
    createdAt: '2017-01-01T00:00:00Z',
    fetchedAtDate: '2026-06-03',
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

import 'server-only';

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { ARCHETYPES, classify, percentileFor } from '@/lib/archetypes';
import { buildStats, signalCommits, type Commit } from '@/lib/stats';
import { syntheticStatsFor } from '@/lib/synthetic';
import type { ArchetypeId, CronotypeResult, ProfileSummary, Window } from '@/types/cronotype';
import {
  readCronotypeSnapshot,
  readHistorySnapshot,
  writeCronotypeSnapshot,
  writeHistorySnapshot,
} from './profile-snapshots';

const UA = 'cronotype.dev';
const API = 'https://api.github.com';
const MOCK = process.env.MOCK_PROFILE === '1';
const HIGH_YEAR_COMMIT_THRESHOLD = 1000;
const VERY_HIGH_YEAR_COMMIT_THRESHOLD = 5000;
const YEAR_ARCHETYPE_SAMPLE_SIZE = 35;
const HIGH_YEAR_ARCHETYPE_SAMPLE_SIZE = 15;
const YEAR_ARCHETYPE_SAMPLE_PAGES = 3;

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

function isRateLimitError(err: unknown): boolean {
  const status = gitHubErrorStatus(err);
  return status === 403 || status === 429;
}

function githubHistoryToken(): string | undefined {
  return process.env.GITHUB_HISTORY_TOKEN ?? process.env.GITHUB_TOKEN;
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
  return computeCronotypeCached(normalized, window);
});

async function computeCronotypeCached(login: string, window: Window): Promise<CronotypeResult> {
  'use cache: remote';
  cacheTag(`cronotype-${login}-${window}`);
  cacheLife('cronotype');

  try {
    const profile = await getProfile(login);
    const today = profile.fetchedAtDate ?? (await getGitHubDateKey());
    const stats = await getStatsFor(login, window, today);

    const archetype = classify(stats);
    const percentile = percentileFor(archetype, stats);
    const result = { archetype, percentile, profile, stats, window };

    await writeCronotypeSnapshot(login, result);
    return result;
  } catch (err) {
    if (isRateLimitError(err)) {
      const snapshot = await readCronotypeSnapshot(login);
      if (snapshot) return snapshot;
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
  } catch (err) {
    releaseSlot();
    throw err;
  }
  releaseSlot();
  if (res.status === 401) throw new GitHubError('GitHub auth failed - check that GITHUB_TOKEN is valid', 401);
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (remaining === '0') {
      throw new GitHubError('GitHub rate limit hit. Try again in a minute.', 403);
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
  return getProfileCached(login.toLowerCase());
}

async function getProfileCached(login: string): Promise<ProfileSummary | null> {
  'use cache: remote';
  cacheTag(`profile-${login}`);
  cacheLife('cronotype');

  if (MOCK) {
    return mockProfile(login);
  }

  const res = await gh(`${API}/users/${encodeURIComponent(login)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubError(`GitHub error (${res.status})`, res.status);
  const fetchedAtDate = dateHeaderToDayKey(res.headers.get('date'));
  const j = await res.json();
  return {
    avatarUrl: j.avatar_url,
    bio: j.bio ?? null,
    createdAt: j.created_at,
    fetchedAtDate,
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
    message?: string;
  };
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
        message: item.commit.message ?? '',
        parentCount: item.parents?.length ?? 1,
        repo: item.repository?.full_name ?? 'unknown',
        tzOffsetMinutes: tz,
      });
    }
    if (!j.items || j.items.length < perPage) break;
  }

  if (truncated && depth < 3) {
    const from = new Date(fromISO).getTime();
    const to = new Date(toISO).getTime();
    const mid = new Date((from + to) / 2).toISOString().slice(0, 10);
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
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new GitHubError('GitHub response included an invalid date header.', 502);
  return new Date(time).toISOString().slice(0, 10);
}

async function getGitHubDateKey(): Promise<string> {
  'use cache: remote';
  cacheTag('github-date');
  cacheLife('hours');

  const res = await gh(`${API}/rate_limit`);
  return dateHeaderToDayKey(res.headers.get('date'));
}

function rangeFromToday(toISO: string, window: Window): { fromISO: string; toISO: string } {
  const days = window === '90d' ? 90 : window === '1y' ? 365 : 365 * 5;
  const toDate = new Date(`${toISO}T00:00:00Z`);
  const fromDate = new Date(toDate.getTime() - days * 24 * 3600_000);
  return { fromISO: fromDate.toISOString().slice(0, 10), toISO };
}

export async function getStatsFor(
  login: string,
  window: Window,
  toDateKey?: string,
): Promise<ReturnType<typeof buildStats>> {
  const today = toDateKey ?? (await getProfile(login)).fetchedAtDate ?? (await getGitHubDateKey());
  const { fromISO, toISO } = rangeFromToday(today, window);
  return getStatsForCached(login.toLowerCase(), window, fromISO, toISO);
}

export async function getSignalCommitsFor(login: string, window: Window, toDateKey?: string): Promise<Commit[]> {
  const today = toDateKey ?? (await getProfile(login)).fetchedAtDate ?? (await getGitHubDateKey());
  const { fromISO, toISO } = rangeFromToday(today, window);
  return getSignalCommitsForCached(login.toLowerCase(), window, fromISO, toISO);
}

async function getStatsForCached(
  login: string,
  window: Window,
  fromISO: string,
  toISO: string,
): Promise<ReturnType<typeof buildStats>> {
  'use cache: remote';
  cacheTag(`stats-${login}-${window}`);
  cacheTag(`stats-${login}-${window}-${toISO}`);
  cacheLife('cronotype');

  if (MOCK) {
    return syntheticStatsFor(mockArchetypeFor(login), 220 + ((login.length * 17) % 180));
  }

  const commits = await getSignalCommitsForCached(login, window, fromISO, toISO);
  return buildStats(commits);
}

async function getSignalCommitsForCached(
  login: string,
  window: Window,
  fromISO: string,
  toISO: string,
): Promise<Commit[]> {
  'use cache: remote';
  cacheTag(`commits-${login}-${window}`);
  cacheTag(`commits-${login}-${window}-${toISO}`);
  cacheLife('cronotype');

  if (MOCK) {
    return [];
  }

  const commits = await fetchCommitsInRange(login, fromISO, toISO, 0, 1);
  return signalCommits(commits);
}

export type MonthBucket = { month: string; count: number };
export type YearArchetypeBucket = { year: number; archetypeId: ArchetypeId | null; commits: number };
export type MonthlyHistory = {
  months: MonthBucket[];
  yearlyArchetypes: YearArchetypeBucket[];
  partial: boolean;
  /** Years whose monthly fetch failed - only these get monthly tags invalidated on refresh. */
  failedMonthlyYears: number[];
  /** Years whose archetype fetch failed - only these get archetype tags invalidated on refresh. */
  failedArchetypeYears: number[];
};

export type TimelineGeometry = {
  width: number;
  height: number;
  padTop: number;
  padBottom: number;
};

type TimelineMark = {
  archetypeId: ArchetypeId | null;
  color: string | null;
  commits: number;
  idx: number;
  label: string | null;
  missing: boolean;
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

async function getYearMonthly(login: string, year: number): Promise<YearMonthly | null> {
  return getYearMonthlyCached(login.toLowerCase(), year);
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

async function getYearArchetype(login: string, year: number, commitCount: number): Promise<ArchetypeId | null> {
  'use cache: remote';
  cacheTag(`year-archetype-${login.toLowerCase()}-${year}`);
  cacheLife('cronotype');

  if (MOCK) return mockArchetypeFor(`${login}-${year}`);

  const perPage =
    commitCount > VERY_HIGH_YEAR_COMMIT_THRESHOLD
      ? HIGH_YEAR_ARCHETYPE_SAMPLE_SIZE
      : commitCount > HIGH_YEAR_COMMIT_THRESHOLD
        ? YEAR_ARCHETYPE_SAMPLE_SIZE
        : 100;
  const maxPages = commitCount > HIGH_YEAR_COMMIT_THRESHOLD ? YEAR_ARCHETYPE_SAMPLE_PAGES : 1;
  const sampleCommits = await fetchCommitsInRange(
    login,
    `${year}-01-01`,
    `${year}-12-31`,
    0,
    maxPages,
    perPage,
    githubHistoryToken(),
  );
  const signal = signalCommits(sampleCommits);
  if (signal.length === 0) return sampleCommits.length > 0 ? ARCHETYPES.drifter.id : null;
  return classify({ ...buildStats(signal), total: commitCount }).id;
}

export async function getMonthlyHistory(login: string): Promise<MonthlyHistory> {
  const lower = login.toLowerCase();
  try {
    const profile = await getProfile(lower);
    const today = profile.fetchedAtDate ?? (await getGitHubDateKey());
    return getMonthlyHistoryCached(lower, today, profile.createdAt);
  } catch (err) {
    if (isRateLimitError(err)) {
      const snapshot = await readHistorySnapshot(lower);
      if (snapshot) return snapshot;
    }
    throw err;
  }
}

export async function getTimelineChart(login: string, geometry: TimelineGeometry) {
  const lower = login.toLowerCase();

  const [{ failedArchetypeYears, failedMonthlyYears, months, yearlyArchetypes, partial }, { archetype, profile }] =
    await Promise.all([getMonthlyHistory(lower), computeCronotype(lower, '90d')]);

  if (months.length < 2) {
    return {
      archetype,
      eras: [],
      failedArchetypeYears,
      failedMonthlyYears,
      hasData: false,
      months,
      partial,
      profile,
      totalCommits: 0,
      yTicks: [],
      yearlyArchetypes,
      yearMarkers: [],
    };
  }

  const smoothed = smooth(
    months.map(m => m.count),
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
  const yearMarkers = computeYearMarkers(months, geometry.width);
  const marks = buildYearMarks(months, yearlyArchetypes, archetype.id);
  const eras = buildEras(marks, smoothed.length, archetype.theme.accent);
  const totalCommits = months.reduce((sum, month) => sum + month.count, 0);
  const yTicks = [max, max / 2].map(value => ({
    value: Math.round(value),
    y: geometry.padTop + usableH - (value / max) * usableH,
  }));

  return {
    archetype,
    areaPath,
    eras,
    failedArchetypeYears,
    failedMonthlyYears,
    hasData: true,
    linePath,
    months,
    partial,
    profile,
    yTicks,
    totalCommits,
    yearMarkers,
    yearlyArchetypes,
  };
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

function buildYearMarks(months: MonthBucket[], yearly: YearArchetypeBucket[], currentId: ArchetypeId): TimelineMark[] {
  const archetypeByYear = new Map<number, ArchetypeId | null>();
  for (const y of yearly) {
    if (y.commits > 0) archetypeByYear.set(y.year, y.archetypeId);
  }

  const lastYear = months.length > 0 ? Number(months[months.length - 1].month.slice(0, 4)) : 2026;
  archetypeByYear.set(lastYear, currentId);

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
      const hasClassification = archetypeByYear.has(year);
      const archetypeId = hasClassification ? (archetypeByYear.get(year) ?? null) : null;
      const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;
      const noSignal = hasClassification && !archetypeId;
      return {
        archetypeId,
        color: noSignal ? '#9ca3af' : (archetype?.theme.accent ?? null),
        commits: commitsByYear.get(year) ?? 0,
        idx,
        label: noSignal ? 'No signal' : (archetype?.name ?? null),
        missing: !hasClassification,
        year,
      };
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
      failedArchetypeYears: [],
      failedMonthlyYears: [],
      months: results.flatMap(r => r.months).sort((a, b) => a.month.localeCompare(b.month)),
      partial: false,
      yearlyArchetypes: results.map(r => ({
        archetypeId: r.archetypeId ?? ('drifter' as ArchetypeId),
        commits: r.commits,
        year: r.year,
      })),
    };
    await writeHistorySnapshot(login, history);
    return history;
  }

  try {
    const firstYear = new Date(profileCreatedAt).getUTCFullYear();
    const todayDate = new Date(`${today}T00:00:00Z`);
    const thisYear = todayDate.getUTCFullYear();
    const thisMonth = todayDate.getUTCMonth() + 1;

    const years: number[] = [];
    for (let year = thisYear; year >= firstYear; year--) years.push(year);

    const byYear: YearMonthly[] = [];
    const failedMonthlySet = new Set<number>();
    const failedArchetypeSet = new Set<number>();
    let partial = false;
    for (const year of years) {
      try {
        const value = await getYearMonthly(login, year);
        if (value !== null) {
          byYear.push(value);
          continue;
        }
        partial = true;
        failedMonthlySet.add(year);
      } catch {
        partial = true;
        failedMonthlySet.add(year);
      }
    }

    if (byYear.length === 0) {
      const snapshot = await readHistorySnapshot(login);
      if (snapshot) return snapshot;
      return {
        failedArchetypeYears: [],
        failedMonthlyYears: [...failedMonthlySet],
        months: [],
        partial: true,
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
      const history = {
        failedArchetypeYears: [],
        failedMonthlyYears: [...failedMonthlySet],
        months: [],
        partial,
        yearlyArchetypes: [],
      };
      await writeHistorySnapshot(login, history);
      return history;
    }

    const startYear = Number(months[0].month.slice(0, 4));
    const endYear = Number(months[months.length - 1].month.slice(0, 4));

    const yearsWithCommits = byYear
      .filter(y => y.year >= startYear && y.year <= endYear && y.commits > 0)
      .filter(y => y.year !== thisYear)
      .map(y => y.year)
      .sort((a, b) => b - a);

    const archetypeResults: Array<PromiseSettledResult<ArchetypeId | null>> = [];
    for (const year of yearsWithCommits) {
      try {
        const yearData = byYear.find(y => y.year === year);
        const value = await getYearArchetype(login, year, yearData?.commits ?? 0);
        archetypeResults.push({ status: 'fulfilled', value });
      } catch (reason) {
        archetypeResults.push({ status: 'rejected', reason });
        if (isRateLimitError(reason)) break;
      }
    }

    const yearlyArchetypes: YearArchetypeBucket[] = [];
    const attemptedYears = new Set<number>();
    archetypeResults.forEach((r, i) => {
      const year = yearsWithCommits[i];
      const yearData = byYear.find(y => y.year === year);
      if (!yearData) return;
      attemptedYears.add(year);
      if (r.status === 'fulfilled') {
        yearlyArchetypes.push({ archetypeId: r.value, commits: yearData.commits, year });
      } else {
        failedArchetypeSet.add(year);
      }
    });

    if (archetypeResults.length < yearsWithCommits.length) {
      partial = true;
    }

    for (const year of yearsWithCommits) {
      if (!attemptedYears.has(year)) failedArchetypeSet.add(year);
    }

    if (failedArchetypeSet.size > 0) partial = true;

    const history = {
      failedArchetypeYears: [...failedArchetypeSet].sort((a, b) => b - a),
      failedMonthlyYears: [...failedMonthlySet].sort((a, b) => b - a),
      months,
      partial,
      yearlyArchetypes,
    };
    await writeHistorySnapshot(login, history);
    return history;
  } catch (err) {
    if (isRateLimitError(err)) {
      const snapshot = await readHistorySnapshot(login);
      if (snapshot) return snapshot;
    }
    throw err;
  }
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

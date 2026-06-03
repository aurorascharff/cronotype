'use server';

import { refresh, revalidateTag, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { isFeaturedHandle } from '@/features/leaderboard/data/featured-handles';
import {
  computeCronotype,
  ensureGitHubRateLimitHeadroom,
  getMonthlyHistory,
  isGitHubHistoryUnavailableError,
  isGitHubRateLimitError,
  warmMissingHistoryYears,
} from '@/features/profile/profile-queries';
import { isValidGitHubHandle, normalizeHandle } from '@/lib/github-handle';
import { hasBeenRevealedFresh, recordFeaturedReveal, recordReveal, recordTimelineLoaded } from '@/lib/reveals';

export type RevealFormState = {
  error: string | null;
  errorId: number;
};

const FIRST_HISTORY_YEAR = 2008;
const LAST_HISTORY_YEAR_WITHOUT_TIME_ACCESS = 2035;

const CACHE_LIFE = 'cronotype';

function invalidateProfileForHandle(handle: string) {
  updateTag(`profile-page-${handle}`);
  updateTag(`profile-${handle}`);
  updateTag(`cronotype-${handle}-90d`);
  updateTag(`stats-${handle}-90d`);
  updateTag(`commits-${handle}-90d`);
}

function revalidateHistoryForHandle(handle: string, years?: number[], includeAggregate = true) {
  if (includeAggregate) revalidateTag(`history-${handle}`, CACHE_LIFE);
  const yearsToRefresh = years?.length
    ? [...new Set(years)]
    : Array.from(
        { length: LAST_HISTORY_YEAR_WITHOUT_TIME_ACCESS - FIRST_HISTORY_YEAR + 1 },
        (_, i) => FIRST_HISTORY_YEAR + i,
      );
  for (const year of yearsToRefresh) {
    if (year < FIRST_HISTORY_YEAR || year > LAST_HISTORY_YEAR_WITHOUT_TIME_ACCESS) continue;
    revalidateTag(`monthly-${handle}-${year}`, CACHE_LIFE);
    revalidateTag(`year-archetype-${handle}-${year}`, CACHE_LIFE);
  }
}

function invalidateMissingHistoryForHandle(handle: string, years: number[]) {
  for (const year of [...new Set(years)]) {
    if (year < FIRST_HISTORY_YEAR || year > LAST_HISTORY_YEAR_WITHOUT_TIME_ACCESS) continue;
    updateTag(`monthly-${handle}-${year}`);
    updateTag(`year-archetype-${handle}-${year}`);
  }
}

async function recordFeaturedRevealIfNeeded(handle: string) {
  if (!isFeaturedHandle(handle)) return;
  try {
    await recordFeaturedReveal(handle);
    updateTag('reveals');
  } catch {
    // The per-user reveal is the critical write. The homepage list can catch up later.
  }
}

export async function revealUser(handle: string) {
  const lower = handle.toLowerCase();
  if (!isValidGitHubHandle(lower)) throw new Error('Invalid GitHub handle');
  await recordReveal(lower);
  updateTag(`reveal-${lower}`);
  await recordFeaturedRevealIfNeeded(lower);
}

export async function revealUserFromForm(state: RevealFormState, formData: FormData): Promise<RevealFormState> {
  const handle = normalizeHandle(String(formData.get('handle') ?? ''));
  if (!handle) return { error: 'Type a GitHub username.', errorId: state.errorId + 1 };
  if (!isValidGitHubHandle(handle)) {
    return { error: "That doesn't look like a GitHub username.", errorId: state.errorId + 1 };
  }

  try {
    await revealUser(handle);
  } catch {
    return { error: "Couldn't start the reveal. Try again in a moment.", errorId: state.errorId + 1 };
  }

  redirect(`/${handle}`);
}

export async function regenerateUser(handle: string): Promise<boolean> {
  const lower = handle.toLowerCase();
  if (!isValidGitHubHandle(lower)) throw new Error('Invalid GitHub handle');
  if (!(await hasBeenRevealedFresh(lower))) return false;
  await ensureGitHubRateLimitHeadroom();
  invalidateProfileForHandle(lower);
  await computeCronotype(lower, '90d');
  await recordReveal(lower);
  updateTag(`reveal-${lower}`);
  await recordFeaturedRevealIfNeeded(lower);
  refresh();
  return true;
}

export async function regenerateUserAndRedirect(handle: string, showTimeline: boolean) {
  const lower = handle.toLowerCase();
  const regenerated = await regenerateUser(lower);
  if (!regenerated) redirect(`/${lower}`);
  if (showTimeline) {
    revalidateTag(`history-${lower}`, CACHE_LIFE);
  }
  redirect(`/${lower}${showTimeline ? '?history=1' : ''}`);
}

export type RegenerateHistoryResult = {
  status: 'refreshed' | 'rate-limited' | 'skipped' | 'unchanged';
};

function hasHistoryRetryProgress(
  requestedMonthlyYears: number[],
  requestedArchetypeYears: number[],
  result: Awaited<ReturnType<typeof getMonthlyHistory>>,
) {
  const failedMonthly = new Set(result.failedMonthlyYears);
  const failedArchetypes = new Set(result.failedArchetypeYears);
  return (
    requestedMonthlyYears.some(year => !failedMonthly.has(year)) ||
    requestedArchetypeYears.some(year => !failedArchetypes.has(year))
  );
}

export async function regenerateHistory(
  handle: string,
  failedMonthlyYears: number[],
  failedArchetypeYears: number[],
): Promise<RegenerateHistoryResult> {
  const lower = handle.toLowerCase();
  if (!isValidGitHubHandle(lower)) throw new Error('Invalid GitHub handle');
  if (!(await hasBeenRevealedFresh(lower))) return { status: 'skipped' };
  invalidateMissingHistoryForHandle(lower, [...failedMonthlyYears, ...failedArchetypeYears]);
  try {
    const warmed = await warmMissingHistoryYears(lower, failedMonthlyYears, failedArchetypeYears);
    if (!warmed) return { status: 'unchanged' };
    revalidateTag(`history-${lower}`, CACHE_LIFE);
    const history = await getMonthlyHistory(lower);
    if (!hasHistoryRetryProgress(failedMonthlyYears, failedArchetypeYears, history)) return { status: 'unchanged' };
  } catch (err) {
    if (isGitHubRateLimitError(err) || isGitHubHistoryUnavailableError(err)) return { status: 'rate-limited' };
    throw err;
  }
  return { status: 'refreshed' };
}

export async function showHistory(handle: string) {
  const lower = handle.toLowerCase();
  if (!isValidGitHubHandle(lower)) throw new Error('Invalid GitHub handle');
  await recordTimelineLoaded(lower);
  updateTag(`timeline-loaded-${lower}`);
}

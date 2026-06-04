'use server';

import { refresh, revalidateTag, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { isFeaturedHandle } from '@/features/leaderboard/data/featured-handles';
import {
  computeCronotype,
  ensureGitHubRateLimitHeadroom,
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

function invalidateProfileForHandle(handle: string) {
  updateTag(`profile-page-${handle}`);
  updateTag(`profile-${handle}`);
  updateTag(`cronotype-${handle}-90d`);
  updateTag(`stats-${handle}-90d`);
  updateTag(`commits-${handle}-90d`);
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
  if (await hasBeenRevealedFresh(lower)) return;
  await computeCronotype(lower, '90d');
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
  redirect(`/${lower}${showTimeline ? '?history=1' : ''}`);
}

export type RegenerateHistoryResult = {
  status: 'refreshed' | 'rate-limited' | 'skipped' | 'unchanged';
};

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
    if (warmed.monthlyYears.length === 0 && warmed.archetypeYears.length === 0) return { status: 'unchanged' };
    updateTag(`history-${lower}`);
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

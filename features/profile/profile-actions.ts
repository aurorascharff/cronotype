'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { isFeaturedHandle } from '@/features/leaderboard/data/featured-handles';
import { computeCronotype, getMonthlyHistory } from '@/features/profile/profile-queries';
import { isValidGitHubHandle, normalizeHandle } from '@/lib/github-handle';
import { hasBeenRevealed, recordFeaturedReveal, recordReveal, recordTimelineLoaded } from '@/lib/reveals';

export type RevealFormState = {
  error: string | null;
  errorId: number;
};

const FIRST_HISTORY_YEAR = 2008;
const LAST_HISTORY_YEAR_WITHOUT_TIME_ACCESS = 2035;

function invalidateAllForHandle(handle: string) {
  updateTag(`profile-page-${handle}`);
  updateTag(`profile-${handle}`);
  updateTag(`cronotype-${handle}-90d`);
  updateTag(`stats-${handle}-90d`);
  invalidateHistoryForHandle(handle);
}

function invalidateHistoryForHandle(handle: string, years?: number[]) {
  updateTag(`history-${handle}`);
  const yearsToRefresh = years?.length
    ? [...new Set(years)]
    : Array.from(
        { length: LAST_HISTORY_YEAR_WITHOUT_TIME_ACCESS - FIRST_HISTORY_YEAR + 1 },
        (_, i) => FIRST_HISTORY_YEAR + i,
      );
  for (const year of yearsToRefresh) {
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
  if (!(await hasBeenRevealed(lower))) return false;
  invalidateAllForHandle(lower);
  await computeCronotype(lower, '90d');
  await recordReveal(lower);
  updateTag(`reveal-${lower}`);
  await recordFeaturedRevealIfNeeded(lower);
  return true;
}

export async function regenerateUserAndRedirect(handle: string, showTimeline: boolean) {
  const lower = handle.toLowerCase();
  const regenerated = await regenerateUser(lower);
  if (!regenerated) redirect(`/${lower}`);
  if (showTimeline) {
    await getMonthlyHistory(lower);
  }
  redirect(`/${lower}${showTimeline ? '?history=1' : ''}`);
}

export async function regenerateHistory(handle: string, failedMonthlyYears: number[], failedArchetypeYears: number[]) {
  const lower = handle.toLowerCase();
  if (!isValidGitHubHandle(lower)) throw new Error('Invalid GitHub handle');
  if (!(await hasBeenRevealed(lower))) return;
  invalidateHistoryForHandle(lower, [...failedMonthlyYears, ...failedArchetypeYears]);
  await getMonthlyHistory(lower);
}

export async function showHistory(handle: string) {
  const lower = handle.toLowerCase();
  if (!isValidGitHubHandle(lower)) throw new Error('Invalid GitHub handle');
  await recordTimelineLoaded(lower);
  updateTag(`timeline-loaded-${lower}`);
}

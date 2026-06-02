'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { isFeaturedHandle } from '@/features/leaderboard/data/featured-handles';
import { isValidGitHubHandle, normalizeHandle } from '@/lib/github-handle';
import { recordFeaturedReveal, recordReveal } from '@/lib/reveals';

export type RevealFormState = {
  error: string | null;
  errorId: number;
};

function invalidateAllForHandle(handle: string) {
  updateTag(`profile-page-${handle}`);
  updateTag(`profile-${handle}`);
  updateTag(`cronotype-${handle}-90d`);
  updateTag(`stats-${handle}-90d`);
  invalidateHistoryForHandle(handle);
}

function invalidateHistoryForHandle(handle: string, years?: number[]) {
  updateTag(`history-${handle}`);
  const thisYear = new Date().getUTCFullYear();
  const yearsToRefresh = years?.length
    ? [...new Set(years)]
    : Array.from({ length: thisYear - 2008 + 1 }, (_, i) => 2008 + i);
  for (const year of yearsToRefresh) {
    if (year < 2008 || year > thisYear) continue;
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

export async function regenerateUser(handle: string) {
  const lower = handle.toLowerCase();
  if (!isValidGitHubHandle(lower)) throw new Error('Invalid GitHub handle');
  invalidateAllForHandle(lower);
  await recordReveal(lower);
  updateTag(`reveal-${lower}`);
  await recordFeaturedRevealIfNeeded(lower);
}

export async function regenerateUserAndRedirect(handle: string, showTimeline: boolean) {
  const lower = handle.toLowerCase();
  await regenerateUser(lower);
  redirect(`/${lower}${showTimeline ? '?history=1' : ''}`);
}

export async function regenerateHistoryAndRedirect(
  handle: string,
  failedMonthlyYears: number[],
  failedArchetypeYears: number[],
) {
  const lower = handle.toLowerCase();
  if (!isValidGitHubHandle(lower)) throw new Error('Invalid GitHub handle');
  invalidateHistoryForHandle(lower, [...failedMonthlyYears, ...failedArchetypeYears]);
  redirect(`/${lower}?history=1`);
}

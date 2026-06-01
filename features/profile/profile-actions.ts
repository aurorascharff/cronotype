'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { isFeaturedHandle } from '@/features/leaderboard/featured';
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
  updateTag(`history-${handle}`);
  const thisYear = new Date().getUTCFullYear();
  for (let year = 2008; year <= thisYear; year++) {
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

export async function revealUserFromForm(
  state: RevealFormState,
  formData: FormData,
): Promise<RevealFormState> {
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

export async function refreshPartialTimeline(
  handle: string,
  failedMonthlyYears: number[] = [],
  failedArchetypeYears: number[] = [],
) {
  const lower = handle.toLowerCase();
  if (!isValidGitHubHandle(lower)) throw new Error('Invalid GitHub handle');
  updateTag(`history-${lower}`);
  for (const year of failedMonthlyYears) {
    updateTag(`monthly-${lower}-${year}`);
  }
  for (const year of failedArchetypeYears) {
    updateTag(`year-archetype-${lower}-${year}`);
  }
}

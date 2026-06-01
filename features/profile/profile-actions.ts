'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { isFeaturedLogin } from '@/features/leaderboard/featured';
import { recordFeaturedReveal, recordReveal } from '@/lib/reveals';

function invalidateAllForLogin(login: string) {
  updateTag(`profile-page-${login}`);
  updateTag(`profile-${login}`);
  updateTag(`cronotype-${login}-90d`);
  updateTag(`stats-${login}-90d`);
  updateTag(`history-${login}`);
  const thisYear = new Date().getUTCFullYear();
  for (let year = 2008; year <= thisYear; year++) {
    updateTag(`monthly-${login}-${year}`);
    updateTag(`year-archetype-${login}-${year}`);
  }
}

export async function revealUser(login: string) {
  const lower = login.toLowerCase();
  await recordReveal(lower);
  updateTag(`reveal-${lower}`);
  if (isFeaturedLogin(lower)) {
    await recordFeaturedReveal(lower);
    updateTag('reveals');
  }
}

export async function revealUserAndRedirect(login: string) {
  const lower = login.toLowerCase();
  await revealUser(lower);
  redirect(`/u/${lower}`);
}

export async function regenerateUser(login: string) {
  const lower = login.toLowerCase();
  invalidateAllForLogin(lower);
  await recordReveal(lower);
  updateTag(`reveal-${lower}`);
  if (isFeaturedLogin(lower)) {
    await recordFeaturedReveal(lower);
    updateTag('reveals');
  }
}

export async function refreshPartialTimeline(
  login: string,
  failedMonthlyYears: number[] = [],
  failedArchetypeYears: number[] = [],
) {
  const lower = login.toLowerCase();
  updateTag(`history-${lower}`);
  for (const year of failedMonthlyYears) {
    updateTag(`monthly-${lower}-${year}`);
  }
  for (const year of failedArchetypeYears) {
    updateTag(`year-archetype-${lower}-${year}`);
  }
}

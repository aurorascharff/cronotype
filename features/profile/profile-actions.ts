'use server';

import { updateTag } from 'next/cache';
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

async function recordFeaturedRevealIfNeeded(login: string) {
  if (!isFeaturedLogin(login)) return;
  try {
    await recordFeaturedReveal(login);
    updateTag('reveals');
  } catch {
    // The per-user reveal is the critical write. The homepage list can catch up later.
  }
}

export async function revealUser(login: string) {
  const lower = login.toLowerCase();
  await recordReveal(lower);
  updateTag(`reveal-${lower}`);
  await recordFeaturedRevealIfNeeded(lower);
}

export async function regenerateUser(login: string) {
  const lower = login.toLowerCase();
  invalidateAllForLogin(lower);
  await recordReveal(lower);
  updateTag(`reveal-${lower}`);
  await recordFeaturedRevealIfNeeded(lower);
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

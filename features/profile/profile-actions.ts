'use server';

import { updateTag } from 'next/cache';
import { recordReveal } from '@/lib/reveals';

function invalidateAllForLogin(login: string) {
  updateTag(`profile-${login}`);
  updateTag(`stats-${login}-90d`);
  const thisYear = new Date().getUTCFullYear();
  for (let year = 2008; year <= thisYear; year++) {
    updateTag(`monthly-${login}-${year}`);
    updateTag(`year-archetype-${login}-${year}`);
  }
}

export async function revealUser(login: string) {
  const lower = login.toLowerCase();
  await recordReveal(lower);
  updateTag('reveals');
  invalidateAllForLogin(lower);
}

export async function regenerateUser(login: string) {
  const lower = login.toLowerCase();
  invalidateAllForLogin(lower);
}

export async function refreshPartialYears(login: string, monthlyYears: number[], archetypeYears: number[]) {
  const lower = login.toLowerCase();
  for (const year of monthlyYears) {
    updateTag(`monthly-${lower}-${year}`);
  }
  for (const year of archetypeYears) {
    updateTag(`year-archetype-${lower}-${year}`);
  }
}

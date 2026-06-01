'use server';

import { updateTag } from 'next/cache';
import { recordReveal } from '@/lib/reveals';

export async function revealUser(login: string) {
  const lower = login.toLowerCase();
  await recordReveal(lower);
  updateTag('reveals');
  updateTag(`profile-${lower}`);
  updateTag(`stats-${lower}-90d`);
}

export async function refreshPartialYears(login: string, years: number[]) {
  const lower = login.toLowerCase();
  for (const year of years) {
    updateTag(`monthly-${lower}-${year}`);
    updateTag(`year-archetype-${lower}-${year}`);
  }
}

'use server';

import { updateTag } from 'next/cache';
import { recordReveal } from '@/lib/reveals';

export async function revealUser(login: string) {
  await recordReveal(login);
  updateTag('reveals');
}

export async function refreshPartialYears(login: string, years: number[]) {
  const lower = login.toLowerCase();
  for (const year of years) {
    updateTag(`monthly-${lower}-${year}`);
    updateTag(`year-archetype-${lower}-${year}`);
  }
}

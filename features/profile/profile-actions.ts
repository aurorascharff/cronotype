'use server';

import { updateTag } from 'next/cache';

export async function refreshPartialYears(login: string, years: number[]) {
  const lower = login.toLowerCase();
  for (const year of years) {
    updateTag(`monthly-${lower}-${year}`);
    updateTag(`year-archetype-${lower}-${year}`);
  }
}

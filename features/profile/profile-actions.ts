'use server';

import { updateTag } from 'next/cache';

/**
 * Refresh only the cache entries we don't have yet.
 *
 * `updateTag` opts the current navigation out of the cache for the given tags
 * so the user sees the refilled chart in one click (vs `revalidateTag` which
 * only invalidates for *future* requests). By passing in just the failed years
 * we avoid re-fetching the years that already succeeded — every other year's
 * `'use cache'` entry continues serving from cache and stays untouched.
 */
export async function refreshPartialYears(login: string, years: number[]) {
  const lower = login.toLowerCase();
  for (const year of years) {
    updateTag(`monthly-${lower}-${year}`);
    updateTag(`year-archetype-${lower}-${year}`);
  }
}

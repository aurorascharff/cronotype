import { NextResponse } from 'next/server';
import { FEATURED } from '@/features/leaderboard/leaderboard-queries';
import { recordReveal } from '@/lib/reveals';

export async function POST() {
  for (const login of FEATURED) {
    await recordReveal(login);
  }
  return NextResponse.json({ ok: true, seeded: FEATURED.length });
}

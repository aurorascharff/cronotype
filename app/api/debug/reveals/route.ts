import { NextResponse } from 'next/server';
import { listReveals } from '@/lib/reveals';

export async function GET() {
  const reveals = await listReveals(50);
  return NextResponse.json({
    count: reveals.length,
    hasEnv: Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
    reveals,
  });
}

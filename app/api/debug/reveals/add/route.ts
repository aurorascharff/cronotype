import { NextResponse } from 'next/server';
import { recordReveal } from '@/lib/reveals';

export async function POST(req: Request) {
  const { login } = (await req.json()) as { login: string };
  if (!login) return NextResponse.json({ error: 'login required' }, { status: 400 });
  await recordReveal(login);
  return NextResponse.json({ ok: true, login: login.toLowerCase() });
}

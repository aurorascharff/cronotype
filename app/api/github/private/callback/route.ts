import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  computePrivateCronotype,
  exchangeCodeForToken,
  privateOAuthConfigured,
  setPrivateResultCookie,
} from '@/features/profile/profile-private-queries';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!privateOAuthConfigured()) {
    return NextResponse.redirect(new URL('/private?error=oauth-env', url.origin));
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get('cronotype-private-oauth-state')?.value;
  cookieStore.delete('cronotype-private-oauth-state');

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(new URL('/private?error=oauth-state', url.origin));
  }

  try {
    const token = await exchangeCodeForToken(url.origin, code);
    const result = await computePrivateCronotype(token);
    await setPrivateResultCookie(result);
    return NextResponse.redirect(new URL('/private/result', url.origin));
  } catch {
    return NextResponse.redirect(new URL('/private?error=github', url.origin));
  }
}

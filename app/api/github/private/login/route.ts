import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { privateOAuthAuthorizeUrl, privateOAuthConfigured } from '@/features/profile/profile-private-queries';

export async function GET(request: Request) {
  if (!privateOAuthConfigured()) {
    return NextResponse.redirect(new URL('/private?error=oauth-env', request.url));
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set('cronotype-private-oauth-state', state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return NextResponse.redirect(privateOAuthAuthorizeUrl(new URL(request.url).origin, state));
}

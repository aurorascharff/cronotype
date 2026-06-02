import 'server-only';
import { cookies } from 'next/headers';
import type { PrivateCronotypeResult } from '@/features/private/private-github';

const COOKIE_NAME = 'cronotype-private-result';
const MAX_AGE_SECONDS = 60 * 10;

export async function setPrivateResultCookie(result: PrivateCronotypeResult) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeResult(result), {
    httpOnly: true,
    maxAge: MAX_AGE_SECONDS,
    path: '/private',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function getPrivateResultCookie(): Promise<PrivateCronotypeResult | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;

  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as PrivateCronotypeResult;
  } catch {
    return null;
  }
}

function encodeResult(result: PrivateCronotypeResult): string {
  return Buffer.from(JSON.stringify(result), 'utf8').toString('base64url');
}

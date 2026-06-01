import { Suspense } from 'react';
import { connection } from 'next/server';
import { ProfileCardSkeleton, ProfileCardSlot } from '@/features/leaderboard/components/profile-card-grid';
import { getRecentLogins } from '@/features/leaderboard/leaderboard-queries';

type Props = {
  excludeLogin?: string;
  limit?: number;
};

export async function RecentRevealed({ excludeLogin, limit = 16 }: Props) {
  // Defer the login-list lookup to runtime. The list itself is cached for
  // minutes (`cacheTag('leaderboard')`); per-card data is cached separately
  // for hours via `cacheTag('profile-{login}')`. That means navigating away
  // and back fans out to the per-login caches instead of re-fetching the grid.
  await connection();

  // Fetch a few extras so we can drop the excluded login without going short.
  const all = await getRecentLogins(limit + (excludeLogin ? 1 : 0));
  const logins = excludeLogin
    ? all.filter(l => l.toLowerCase() !== excludeLogin.toLowerCase()).slice(0, limit)
    : all.slice(0, limit);

  if (logins.length === 0) {
    return (
      <p className="text-muted dark:text-muted-dark rounded-xl border border-dashed border-black/10 p-8 text-center text-sm dark:border-white/10">
        Couldn&apos;t reach GitHub just now. Refresh in a minute.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {logins.map(login => (
        <li key={login}>
          <Suspense fallback={<ProfileCardSkeleton />}>
            <ProfileCardSlot login={login} />
          </Suspense>
        </li>
      ))}
    </ul>
  );
}

export function RecentRevealedSkeleton({ limit = 8 }: { limit?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: limit }).map((_, i) => (
        <li key={i}>
          <ProfileCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

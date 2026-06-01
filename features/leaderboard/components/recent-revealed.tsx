import { ProfileCardSkeleton, ProfileCardSlot } from '@/features/leaderboard/components/profile-card-grid';
import { FEATURED } from '@/features/leaderboard/featured';
import { getRecentLogins } from '@/features/leaderboard/leaderboard-queries';
import { connection } from 'next/server';

type Props = {
  excludeLogin?: string;
};

export async function RecentRevealed({ excludeLogin }: Props) {
  await connection();

  const all = await getRecentLogins();
  const logins = excludeLogin ? all.filter(l => l.toLowerCase() !== excludeLogin.toLowerCase()) : all;

  if (logins.length === 0) {
    return (
      <p className="text-muted dark:text-muted-dark rounded-xl border border-dashed border-black/10 p-8 text-center text-sm dark:border-white/10">
        Couldn&apos;t reach GitHub just now. Refresh in a minute.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {logins.map(login => (
        <li key={login}>
          <ProfileCardSlot login={login} />
        </li>
      ))}
    </ul>
  );
}

export function RecentRevealedSkeleton() {
  const count = Math.ceil(FEATURED.length / 2);

  return (
    <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <ProfileCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

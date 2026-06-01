import { ProfileCardSkeleton, ProfileCardSlot } from '@/features/leaderboard/components/profile-card-grid';
import { FEATURED } from '@/features/leaderboard/featured';
import { getRecentHandles } from '@/features/leaderboard/leaderboard-queries';
import { connection } from 'next/server';

export async function RecentRevealed() {
  await connection();

  const handles = await getRecentHandles();

  if (handles.length === 0) {
    return (
      <p className="text-muted dark:text-muted-dark rounded-xl border border-dashed border-black/10 p-8 text-center text-sm dark:border-white/10">
        Couldn&apos;t reach GitHub just now. Refresh in a minute.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {handles.map(handle => (
        <li key={handle}>
          <ProfileCardSlot handle={handle} />
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

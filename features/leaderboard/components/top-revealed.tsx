import { LoadMore } from '@/components/ui/load-more';
import { ProfileCardSkeleton, ProfileCardSlot } from '@/features/leaderboard/components/profile-card-grid';
import { FEATURED_HANDLES } from '@/features/leaderboard/data/featured-handles';
import { getTopRevealedHandles } from '@/features/leaderboard/leaderboard-queries';
import type { Route } from 'next';

const TOP_REVEALED_PAGE_SIZE = 12;

export async function TopRevealed({ page = 1 }: { page?: number }) {
  const limit = page * TOP_REVEALED_PAGE_SIZE;
  const handles = await getTopRevealedHandles(limit + 1);
  const visible = handles.slice(0, limit);
  const hasMore = visible.length < handles.length;

  if (handles.length === 0) {
    return (
      <p className="text-muted dark:text-muted-dark rounded-xl border border-dashed border-black/10 p-8 text-center text-sm dark:border-white/10">
        Couldn&apos;t reach GitHub just now. Refresh in a minute.
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map(handle => (
          <li key={handle}>
            <ProfileCardSlot handle={handle} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="flex justify-center pt-2">
          <LoadMore href={`/?revealed=${page + 1}` as Route} />
        </div>
      )}
    </>
  );
}

export function TopRevealedSkeleton() {
  const count = Math.min(TOP_REVEALED_PAGE_SIZE, FEATURED_HANDLES.length);

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i}>
            <ProfileCardSkeleton />
          </li>
        ))}
      </ul>
      <div className="flex justify-center pt-2">
        <div className="skeleton h-8 w-28 rounded-md" />
      </div>
    </>
  );
}

import { LoadMore } from '@/components/ui/load-more';
import { ProfileCardSkeleton, ProfileCardSlot } from '@/features/leaderboard/components/profile-card-grid';
import { FEATURED_HANDLES } from '@/features/leaderboard/data/featured-handles';
import { getFeaturedHandlesByFollowers } from '@/features/leaderboard/leaderboard-queries';
import type { Route } from 'next';

const FEATURED_PAGE_SIZE = 12;

export async function FeaturedProfiles({ page = 1 }: { page?: number }) {
  const limit = page * FEATURED_PAGE_SIZE;
  const handles = await getFeaturedHandlesByFollowers();
  const visible = handles.slice(0, limit);
  const hasMore = visible.length < handles.length;

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
          <LoadMore href={`/?featured=${page + 1}` as Route} />
        </div>
      )}
    </>
  );
}

export function FeaturedProfilesSkeleton() {
  const count = Math.min(FEATURED_PAGE_SIZE, FEATURED_HANDLES.length);

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

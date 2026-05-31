import { Suspense } from 'react';
import Link from 'next/link';
import { ProfileCardGrid, ProfileCardGridSkeleton } from '@/features/leaderboard/components/profile-card-grid';
import { getLeaderboard } from '@/features/leaderboard/leaderboard-queries';

/** Public entry — owns its own Suspense and skeleton. */
export function PopularLeaderboard() {
  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Most diagnosed</h2>
        <Link
          href="/leaderboard"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper text-sm transition-colors"
        >
          All boards →
        </Link>
      </header>
      <Suspense fallback={<ProfileCardGridSkeleton count={12} />}>
        <PopularLeaderboardBody />
      </Suspense>
    </section>
  );
}

async function PopularLeaderboardBody() {
  const entries = await getLeaderboard('popular', 12);
  return <ProfileCardGrid entries={entries} />;
}

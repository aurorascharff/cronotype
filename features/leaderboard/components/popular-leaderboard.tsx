import { Suspense } from 'react';
import { ProfileCardGrid, ProfileCardGridSkeleton } from '@/features/leaderboard/components/profile-card-grid';
import { getLeaderboard } from '@/features/leaderboard/leaderboard-queries';

/** Public entry — owns its own Suspense and skeleton. */
export function PopularLeaderboard() {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Most diagnosed</h2>
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

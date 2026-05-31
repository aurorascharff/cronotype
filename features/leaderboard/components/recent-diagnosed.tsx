import { Suspense } from 'react';
import { ProfileCardGrid, ProfileCardGridSkeleton } from '@/features/leaderboard/components/profile-card-grid';
import { getRecentClassified } from '@/features/leaderboard/leaderboard-queries';

type Props = {
  /** Login to exclude from the rail (typically the profile being viewed). */
  excludeLogin?: string;
  limit?: number;
};

/** Public entry — owns its own Suspense and skeleton. */
export function RecentDiagnosed({ excludeLogin, limit = 8 }: Props) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Recently diagnosed</h2>
      </header>
      <Suspense fallback={<ProfileCardGridSkeleton count={limit} />}>
        <RecentDiagnosedBody excludeLogin={excludeLogin} limit={limit} />
      </Suspense>
    </section>
  );
}

async function RecentDiagnosedBody({ excludeLogin, limit }: Props) {
  const all = await getRecentClassified((limit ?? 8) + 1);
  const entries = excludeLogin
    ? all.filter(e => e.profile.login.toLowerCase() !== excludeLogin.toLowerCase()).slice(0, limit)
    : all.slice(0, limit);
  return <ProfileCardGrid entries={entries} />;
}

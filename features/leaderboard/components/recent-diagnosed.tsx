import { connection } from 'next/server';
import { ProfileCardGrid, ProfileCardGridSkeleton } from '@/features/leaderboard/components/profile-card-grid';
import { getRecentClassified } from '@/features/leaderboard/leaderboard-queries';

type Props = {
  excludeLogin?: string;
  limit?: number;
};

export async function RecentDiagnosed({ excludeLogin, limit = 16 }: Props) {
  await connection();
  const all = await getRecentClassified(limit + 1);
  const entries = excludeLogin
    ? all.filter(e => e.profile.login.toLowerCase() !== excludeLogin.toLowerCase()).slice(0, limit)
    : all.slice(0, limit);
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Recently diagnosed</h2>
      </header>
      <ProfileCardGrid entries={entries} />
    </section>
  );
}

export function RecentDiagnosedSkeleton({ limit = 8 }: { limit?: number }) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Recently diagnosed</h2>
      </header>
      <ProfileCardGridSkeleton count={limit} />
    </section>
  );
}

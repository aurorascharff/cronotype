import { connection } from 'next/server';
import { ProfileCardGrid, ProfileCardGridSkeleton } from '@/features/leaderboard/components/profile-card-grid';
import { getRecentClassified } from '@/features/leaderboard/leaderboard-queries';

type Props = {
  excludeLogin?: string;
  limit?: number;
};

export async function RecentRevealed({ excludeLogin, limit = 16 }: Props) {
  // Defer to runtime so a build-time rate limit doesn't fail the prerender.
  // Inner getFeaturedEntries() is still 'use cache' so requests share results.
  await connection();

  const all = await getRecentClassified(limit + 1);
  const entries = excludeLogin
    ? all.filter(e => e.profile.login.toLowerCase() !== excludeLogin.toLowerCase()).slice(0, limit)
    : all.slice(0, limit);
  return <ProfileCardGrid entries={entries} />;
}

export function RecentRevealedSkeleton({ limit = 8 }: { limit?: number }) {
  return <ProfileCardGridSkeleton count={limit} />;
}

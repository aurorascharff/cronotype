import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { HeroCard } from '@/components/hero-card';
import { ShareBlock } from '@/components/share-block';
import { recordEntry } from '@/features/leaderboard/leaderboard-queries';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError } from '@/features/profile/profile-queries';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

type Props = {
  login: string;
};

export async function CronotypeProfile({ login }: Props) {
  let result;
  try {
    result = await computeCronotype(login, '90d');
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) notFound();
    throw err;
  }

  const { profile, archetype, stats, percentile } = result;

  if (stats.total === 0) {
    return <EmptyProfile login={login} />;
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://cronotype.vercel.app';
  const shareUrl = `${base.replace(/\/$/, '')}/u/${profile.login}`;

  return (
    <div className="space-y-3">
      <HeroCard profile={profile} archetype={archetype} stats={stats} percentile={percentile} />
      <ShareBlock shareUrl={shareUrl} />
      <Suspense fallback={null}>
        <RecordLeaderboardEntry profile={profile} archetype={archetype} stats={stats} />
      </Suspense>
    </div>
  );
}

async function RecordLeaderboardEntry({
  profile,
  archetype,
  stats,
}: {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
}) {
  await connection();
  recordEntry({
    archetype,
    classifiedAt: new Date().toISOString(),
    profile,
    stats,
  });
  return null;
}

function EmptyProfile({ login }: { login: string }) {
  return (
    <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-10 text-center dark:border-white/10">
      <h2 className="text-2xl font-semibold tracking-tight">@{login} hasn&apos;t pushed in the last 90 days.</h2>
      <Link
        href="/"
        className="bg-ink text-paper dark:bg-paper dark:text-ink mt-6 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85"
      >
        Try another handle
      </Link>
    </div>
  );
}

export function CronotypeProfileSkeleton() {
  return (
    <div className="space-y-3">
      <div
        className="dark:bg-ink-2 relative overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 [aspect-ratio:auto] sm:[aspect-ratio:1200/630]"
      >
        <div className="grid h-full grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10">
          <div className="flex items-center justify-center">
            <div className="skeleton h-[120px] w-[120px] rounded-full sm:h-[190px] sm:w-[190px]" />
          </div>

          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="skeleton h-8 w-2/3 sm:h-10" />
            <div className="skeleton h-3.5 w-3/4 sm:w-2/3" />
          </div>
        </div>
      </div>

      <div className="skeleton h-9 w-full rounded-md" />
    </div>
  );
}

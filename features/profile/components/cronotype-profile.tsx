import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { HeroCard } from '@/components/hero-card';
import { ShareButton, ShareUrl } from '@/components/share-block';
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
    <div className="space-y-2">
      <div className="relative">
        <HeroCard profile={profile} archetype={archetype} stats={stats} percentile={percentile} />
        <ShareButton
          shareUrl={shareUrl}
          accent={archetype.theme.accent}
          className="absolute bottom-4 right-4 z-20 sm:bottom-6 sm:right-6"
        />
      </div>
      <ShareUrl shareUrl={shareUrl} />
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
    <div className="space-y-2">
      <div className="dark:bg-ink-2 relative overflow-hidden rounded-xl border border-black/10 bg-white [aspect-ratio:auto] dark:border-white/10 sm:[aspect-ratio:1200/630]">
        <div className="skeleton absolute top-4 right-4 h-5 w-22 rounded-md sm:top-6 sm:right-6" />

        <div className="grid h-full grid-cols-1 items-center gap-6 p-5 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10">
          <div className="flex items-center justify-center sm:justify-start">
            <HaloSkeleton />
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-10 w-2/3 rounded sm:h-14" />
            <div className="skeleton h-3.5 w-3/4 rounded sm:w-2/3" />

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:mt-4 sm:flex sm:flex-wrap sm:items-end sm:gap-x-8">
              {[24, 28, 24, 20].map((w, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="skeleton h-2.5 rounded" style={{ width: 44 }} />
                  <div className="skeleton h-6 rounded sm:h-7" style={{ width: w + 24 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="skeleton h-2.5 w-52 rounded" />
    </div>
  );
}

function HaloSkeleton() {
  return (
    <div className="relative">
      <div className="skeleton h-[140px] w-[140px] rounded-full sm:h-[220px] sm:w-[220px]" />
      <div className="absolute inset-0 m-auto h-[64px] w-[64px] rounded-full border border-black/10 bg-paper dark:border-white/10 dark:bg-ink-2 sm:h-[100px] sm:w-[100px]" />
    </div>
  );
}

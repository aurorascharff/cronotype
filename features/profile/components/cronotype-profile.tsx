import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { HeroCard } from '@/components/hero-card';
import { ShareActions, ShareUrl } from '@/components/share-block';
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
        <div className="pointer-events-none absolute inset-x-4 bottom-3 z-20 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:inset-x-6 sm:bottom-5">
          <div className="pointer-events-auto">
            <ShareUrl shareUrl={shareUrl} />
          </div>
          <div className="pointer-events-auto">
            <ShareActions
              shareUrl={shareUrl}
              archetypeName={archetype.name}
              accent={archetype.theme.accent}
            />
          </div>
        </div>
      </div>
      <Suspense fallback={null}>
        <RecordLeaderboardEntry login={profile.login} />
      </Suspense>
    </div>
  );
}

async function RecordLeaderboardEntry({ login }: { login: string }) {
  await connection();
  recordEntry(login, new Date().toISOString());
  return null;
}

function EmptyProfile({ login }: { login: string }) {
  return (
    <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-10 text-center dark:border-white/10">
      <h2 className="text-2xl font-semibold tracking-tight">@{login} hasn&apos;t pushed in the last 90 days.</h2>
      <Link
        href="/"
        className="bg-brand text-on-brand mt-6 inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-[filter,opacity] hover:brightness-105"
      >
        Try another handle
      </Link>
    </div>
  );
}

export function CronotypeProfileSkeleton() {
  return (
    <div
      className="dark:bg-ink-2 w-full overflow-hidden rounded-xl border border-black/10 bg-white [aspect-ratio:auto] dark:border-white/10 sm:[aspect-ratio:1200/630]"
      aria-hidden
    >
      <div className="grid h-full grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10">
        <div className="flex items-center justify-center sm:justify-start sm:pl-3">
          <div className="h-[140px] w-[140px] rounded-full border border-black/10 dark:border-white/10 sm:h-[220px] sm:w-[220px]" />
        </div>
        <div className="h-[140px] sm:h-[220px]" />
      </div>
    </div>
  );
}

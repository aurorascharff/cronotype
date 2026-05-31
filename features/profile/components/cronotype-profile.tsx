import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { EvolutionStrip } from '@/features/profile/components/evolution-strip';
import { HeroCard } from '@/components/hero-card';
import { ShareBlock } from '@/components/share-block';
import { recordEntry } from '@/features/leaderboard/leaderboard-queries';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError } from '@/features/profile/profile-queries';

type Props = {
  login: string;
};

/** Public entry — owns its own Suspense boundary and skeleton. */
export function CronotypeProfile({ login }: Props) {
  return (
    <Suspense fallback={<CronotypeProfileSkeleton />}>
      <CronotypeProfileBody login={login} />
    </Suspense>
  );
}

async function CronotypeProfileBody({ login }: Props) {
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

  // Record in the leaderboard. Done here (outside the cached compute) because
  // module-scoped state mutations are not allowed inside `'use cache'`.
  recordEntry({
    archetype,
    classifiedAt: new Date().toISOString(),
    profile,
    score: 0,
    stats,
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://cronotype.dev';
  const shareUrl = `${base.replace(/\/$/, '')}/u/${profile.login}`;

  return (
    <div className="space-y-4">
      <HeroCard profile={profile} archetype={archetype} stats={stats} percentile={percentile} />
      <ShareBlock shareUrl={shareUrl} />
      <EvolutionStrip login={profile.login} />
    </div>
  );
}

function EmptyProfile({ login }: { login: string }) {
  return (
    <div className="border-border dark:border-border-dark dark:bg-ink-2/40 rounded-2xl border bg-white/60 p-12 text-center backdrop-blur-sm">
      <h2 className="text-2xl font-semibold tracking-tight">
        @{login} hasn&apos;t pushed in the last 90 days.
      </h2>
      <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md">
        Either this account is private, brand-new, or practicing remarkable restraint.
      </p>
      <Link
        href="/"
        className="bg-ink text-paper dark:bg-paper dark:text-ink mt-6 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85"
      >
        Try another handle
      </Link>
    </div>
  );
}

function CronotypeProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border-border dark:border-border-dark dark:bg-ink-2/40 flex flex-col items-center rounded-3xl border bg-white/60 p-8 backdrop-blur-sm sm:p-12">
        <div className="skeleton h-80 w-80 rounded-full opacity-50" />
        <div className="skeleton mt-8 h-3 w-24 opacity-60" />
        <div className="skeleton mt-2 h-12 w-64 sm:h-16" />
        <div className="skeleton mt-3 h-4 w-3/4 max-w-sm" />
        <div className="mt-8 grid w-full max-w-md grid-cols-4 gap-2 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
        <div className="skeleton mt-6 h-8 w-32" />
      </div>
      <div className="skeleton h-12 rounded-xl" />
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeroCard } from '@/components/hero-card';
import { ShareBlock } from '@/components/share-block';
import { recordEntry } from '@/features/leaderboard/leaderboard-queries';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError } from '@/features/profile/profile-queries';

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

  // Module-state mutation must happen outside `'use cache'`.
  recordEntry({
    archetype,
    classifiedAt: new Date().toISOString(),
    profile,
    stats,
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://cronotype.dev';
  const shareUrl = `${base.replace(/\/$/, '')}/u/${profile.login}`;

  return (
    <div className="space-y-3">
      <HeroCard profile={profile} archetype={archetype} stats={stats} percentile={percentile} />
      <ShareBlock shareUrl={shareUrl} />
    </div>
  );
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
        className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white dark:border-white/10"
        style={{ aspectRatio: '1200 / 630' }}
      />
      <div className="skeleton h-9 rounded-md" />
    </div>
  );
}

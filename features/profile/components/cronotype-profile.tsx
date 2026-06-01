import Link from 'next/link';
import { updateTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { after, connection } from 'next/server';
import { ClassifyingRing } from '@/components/classifying-ring';
import { HeroCard } from '@/components/hero-card';
import { ShareActions, ShareUrl } from '@/components/share-block';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError } from '@/features/profile/profile-queries';
import { recordReveal } from '@/lib/reveals';

type Props = {
  login: string;
};

export async function CronotypeProfile({ login }: Props) {
  await connection();
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

  after(async () => {
    await recordReveal(profile.login);
    updateTag('reveals');
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://cronotype.vercel.app';
  const shareUrl = `${base.replace(/\/$/, '')}/u/${profile.login}`;

  return (
    <div className="relative">
      <HeroCard profile={profile} archetype={archetype} stats={stats} percentile={percentile} />
      <div className="pointer-events-none absolute inset-x-4 bottom-3 z-20 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:inset-x-6 sm:bottom-5">
        <div className="pointer-events-auto">
          <ShareUrl shareUrl={shareUrl} />
        </div>
        <div className="pointer-events-auto">
          <ShareActions shareUrl={shareUrl} archetypeName={archetype.name} accent={archetype.theme.accent} />
        </div>
      </div>
    </div>
  );
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

/**
 * Skeleton mirrors the resolved HeroCard exactly:
 * - Same outer aspect ratio (1200/630 on desktop, fluid on mobile)
 * - Same chip area: 220px halo container with the avatar disk overlaid
 * - Same right column: handle row, archetype headline, meaning paragraph, stats
 *
 * Uses ClassifyingRing instead of a flat skeleton circle so the loading state
 * reads as "working" not "blank".
 */
export function CronotypeProfileSkeleton() {
  return (
    <div
      className="dark:bg-ink-2 relative [aspect-ratio:auto] w-full overflow-hidden rounded-xl border border-black/10 bg-white sm:[aspect-ratio:1200/630] dark:border-white/10"
      aria-hidden
    >
      <div className="absolute top-4 right-4 z-10 rounded-lg border border-black/10 bg-white/80 px-2 py-1 font-mono text-[10px] tracking-wider text-transparent uppercase backdrop-blur-sm sm:top-6 sm:right-6 dark:border-white/10 dark:bg-white/[0.04]">
        Last 90 days
      </div>

      <div className="grid h-full grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10">
        <div className="relative flex items-center justify-center sm:justify-start sm:pl-3">
          <div className="relative flex h-[140px] w-[140px] items-center justify-center sm:h-[220px] sm:w-[220px]">
            <ClassifyingRing variant="inset" />
            <div className="skeleton h-[44%] w-[44%] rounded-full" />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-12 w-3/5 rounded sm:h-14" />
          <div className="skeleton h-4 w-4/5 max-w-md rounded" />
          <div className="skeleton h-3 w-32 rounded" />
          <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 sm:mt-2 sm:flex sm:flex-wrap sm:items-end sm:gap-x-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="skeleton h-2.5 w-12 rounded" />
                <div className="skeleton h-6 w-14 rounded sm:h-7" />
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

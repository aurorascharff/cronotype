import Link from 'next/link';
import { Suspense } from 'react';
import { RadialChip } from '@/components/radial-chip';
import {
  PopularLeaderboard,
} from '@/features/leaderboard/components/popular-leaderboard';
import { getLeaderboard, type Bucket } from '@/features/leaderboard/leaderboard-queries';

const BUCKETS: Array<{ id: Bucket; title: string; subtitle: string }> = [
  { id: 'nocturnal', subtitle: 'Highest % of commits between midnight–4am', title: 'Most nocturnal' },
  { id: 'sunrise', subtitle: 'Earliest risers, between 5–8am', title: 'Dawn patrol' },
  { id: 'disciplined', subtitle: 'Tight 9–6 distribution, lowest variance', title: 'Most 9-to-5' },
  { id: 'weekend', subtitle: 'Worst weekend offenders', title: 'No off-days' },
];

async function BucketColumn({ bucket }: { bucket: { id: Bucket; title: string; subtitle: string } }) {
  const entries = await getLeaderboard(bucket.id, 8);
  return (
    <section className="border-border dark:border-border-dark dark:bg-ink-2/40 flex flex-col gap-3 rounded-xl border bg-white/60 p-5 backdrop-blur-sm">
      <header>
        <h2 className="text-base font-semibold tracking-tight">{bucket.title}</h2>
        <p className="text-muted dark:text-muted-dark mt-0.5 text-xs">{bucket.subtitle}</p>
      </header>
      <ol className="flex flex-col gap-1">
        {entries.map((e, i) => (
          <li key={e.profile.login}>
            <Link
              href={{ pathname: `/u/${e.profile.login}` }}
              className="hover:bg-paper-2/80 dark:hover:bg-ink-3/60 flex items-center gap-3 rounded-lg p-2 transition-colors"
            >
              <span className="text-muted dark:text-muted-dark w-5 text-right text-xs tabular-nums">
                {i + 1}
              </span>
              <RadialChip stats={e.stats} colorClass={e.archetype.colorVar} size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{e.profile.name ?? e.profile.login}</div>
                <div className="text-muted dark:text-muted-dark truncate text-xs">
                  @{e.profile.login} · <span className={e.archetype.colorVar}>{e.archetype.name}</span>
                </div>
              </div>
              <span className="text-muted dark:text-muted-dark text-xs tabular-nums">
                {formatScore(bucket.id, e.score)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function BucketColumnSkeleton() {
  return (
    <section className="border-border dark:border-border-dark dark:bg-ink-2/40 flex flex-col gap-3 rounded-xl border bg-white/60 p-5 backdrop-blur-sm">
      <div className="space-y-1.5">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-3 w-48 opacity-60" />
      </div>
      <ol className="mt-2 flex flex-col gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-lg p-2">
            <span className="skeleton h-3 w-4" />
            <span className="skeleton h-8 w-8 rounded-full" />
            <span className="flex-1 space-y-1.5">
              <span className="skeleton block h-3 w-24" />
              <span className="skeleton block h-3 w-32 opacity-60" />
            </span>
            <span className="skeleton h-3 w-8" />
          </li>
        ))}
      </ol>
    </section>
  );
}

function formatScore(bucket: Bucket, score: number) {
  if (bucket === 'recent') return `${Math.round(score)}`;
  if (bucket === 'disciplined') return score.toFixed(1);
  return `${Math.round(score)}%`;
}

export default function LeaderboardPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Leaderboards</h1>
        <p className="text-muted dark:text-muted-dark max-w-prose">
          Anyone who&apos;s been diagnosed shows up here.
        </p>
      </header>

      <PopularLeaderboard />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">By archetype</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {BUCKETS.map(bucket => (
            <Suspense key={bucket.id} fallback={<BucketColumnSkeleton />}>
              <BucketColumn bucket={bucket} />
            </Suspense>
          ))}
        </div>
      </section>
    </div>
  );
}

export const unstable_prefetch = 'force-runtime';

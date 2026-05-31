import Link from 'next/link';
import { Suspense } from 'react';
import { RadialChip } from '@/components/radial-chip';
import { getLeaderboard } from '@/features/leaderboard/leaderboard-queries';

export function PopularLeaderboardShell({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <header className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Most diagnosed</h2>
        <Link
          href="/leaderboard"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper text-sm transition-colors"
        >
          All boards →
        </Link>
      </header>
      {children}
    </section>
  );
}

export async function PopularLeaderboardList() {
  const entries = await getLeaderboard('popular', 12);

  if (entries.length === 0) {
    return (
      <p className="text-muted dark:text-muted-dark border-border dark:border-border-dark rounded-xl border border-dashed p-8 text-center font-mono text-xs tracking-wide uppercase">
        No one diagnosed yet. Be the first.
      </p>
    );
  }

  return (
    <ol className="border-border dark:border-border-dark dark:bg-ink-2/40 divide-border dark:divide-border-dark/60 flex flex-col divide-y overflow-hidden rounded-xl border bg-white/60 backdrop-blur-sm">
      {entries.map((e, i) => (
        <li key={e.profile.login}>
          <Link
            href={{ pathname: `/u/${e.profile.login}` }}
            className="hover:bg-paper-2/80 dark:hover:bg-ink-3/60 group flex items-center gap-3 p-3 transition-colors sm:gap-4 sm:p-4"
          >
            <span className="text-muted dark:text-muted-dark w-6 text-right font-mono text-xs tabular-nums sm:text-sm">
              {i + 1}
            </span>
            <div className="border-border dark:border-border-dark bg-paper/40 dark:bg-ink-3/60 rounded-lg border p-1">
              <RadialChip stats={e.stats} colorClass={e.archetype.colorVar} size={40} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={e.profile.avatarUrl}
              alt=""
              width={32}
              height={32}
              className="border-border dark:border-border-dark hidden h-8 w-8 rounded-full border sm:block"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-sm font-semibold">{e.profile.name ?? e.profile.login}</span>
                <span className="text-muted dark:text-muted-dark truncate font-mono text-xs">@{e.profile.login}</span>
              </div>
              <div className={`mt-0.5 truncate text-xs font-semibold ${e.archetype.colorVar}`}>
                {e.archetype.name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold tabular-nums">{formatFollowers(e.profile.followers)}</div>
              <div className="text-muted dark:text-muted-dark text-xs">followers</div>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function PopularLeaderboardListSkeleton() {
  return (
    <ol className="border-border dark:border-border-dark dark:bg-ink-2/40 divide-border dark:divide-border-dark/60 flex flex-col divide-y overflow-hidden rounded-xl border bg-white/60 backdrop-blur-sm">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
          <span className="skeleton h-3 w-4" />
          <span className="skeleton h-10 w-10 rounded-lg" />
          <span className="skeleton hidden h-8 w-8 rounded-full sm:block" />
          <span className="flex-1 space-y-1.5">
            <span className="skeleton block h-3 w-32" />
            <span className="skeleton block h-3 w-20 opacity-60" />
          </span>
          <span className="space-y-1.5 text-right">
            <span className="skeleton ml-auto block h-3 w-10" />
            <span className="skeleton ml-auto block h-2 w-12 opacity-60" />
          </span>
        </li>
      ))}
    </ol>
  );
}

export function PopularLeaderboard() {
  return (
    <PopularLeaderboardShell>
      <Suspense fallback={<PopularLeaderboardListSkeleton />}>
        <PopularLeaderboardList />
      </Suspense>
    </PopularLeaderboardShell>
  );
}

function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

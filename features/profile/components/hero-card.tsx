import Link from 'next/link';
import { ViewTransition } from 'react';
import { HaloChart } from '@/features/profile/components/halo-chart';
import { cn } from '@/lib/cn';
import { formatCount, formatDateKey, formatFollowers, formatHour } from '@/lib/format';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

type Props = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
  percentile: number;
};

export function HeroCard({ profile, archetype, stats, percentile }: Props) {
  const { theme } = archetype;
  const signalSize = stats.total >= 100 ? '100+' : formatCount(stats.total);
  const generatedAt = formatDateKey(profile.fetchedAtDate);

  return (
    <article className="dark:bg-ink-2 relative min-h-[600px] w-full overflow-hidden rounded-xl border border-black/10 bg-white sm:[aspect-ratio:1200/630] sm:min-h-0 dark:border-white/10">
      <div className="absolute top-3 left-3 z-10 sm:top-6 sm:left-6">
        <AgentCommitsBadge percent={stats.aiScore} />
      </div>

      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5 sm:top-6 sm:right-6">
        <span className="text-ink/70 dark:text-paper/80 rounded-lg border border-black/15 bg-white/95 px-2 py-1 font-mono text-[10px] tracking-wider uppercase backdrop-blur-sm dark:border-white/20 dark:bg-white/[0.10]">
          Last 90 days
        </span>
        {generatedAt ? (
          <span className="text-muted dark:text-muted-dark font-mono text-[9px] tracking-wider uppercase">
            Generated {generatedAt}
          </span>
        ) : null}
      </div>

      <div className="grid h-full min-h-[600px] grid-cols-1 items-center gap-4 p-5 pt-12 sm:min-h-0 sm:grid-cols-[auto_1fr] sm:gap-14 sm:p-8 lg:gap-16">
        <div className="mx-auto flex h-48 w-48 items-center justify-center min-[420px]:h-56 min-[420px]:w-56 sm:mx-0 sm:h-[240px] sm:w-[240px] sm:justify-start sm:pl-3">
          <HaloChart stats={stats} theme={theme} avatarUrl={profile.avatarUrl} size={240} />
        </div>

        <ViewTransition enter="auto" default="none">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="text-muted dark:text-muted-dark flex flex-wrap items-baseline gap-x-2 text-xs sm:text-sm">
              <a
                href={`https://github.com/${profile.login}`}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-ink dark:hover:text-paper transition-colors"
              >
                @{profile.login}
              </a>
              <span aria-hidden className="text-muted/40 dark:text-muted-dark/40">
                ·
              </span>
              <span className="tabular-nums">{formatFollowers(profile.followers)}</span>
            </div>
            <h1
              className="tracking-tightest text-4xl leading-[0.98] font-semibold break-words min-[420px]:text-5xl sm:text-6xl"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.accent2}, ${theme.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {archetype.name}
            </h1>
            <p className="text-muted dark:text-muted-dark max-w-md text-sm sm:text-base">{archetype.meaning}</p>

            <Link
              href={`/types#${archetype.id}`}
              className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper w-fit text-xs underline-offset-2 transition-colors hover:underline"
              style={{ color: theme.accent }}
            >
              What&apos;s a {archetype.name}? →
            </Link>

            <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:mt-2 sm:flex sm:flex-wrap sm:items-end sm:gap-x-6">
              <Stat label="Peak" value={formatHour(stats.peakHour)} />
              <Stat label="Nocturnal" value={`${Math.round(stats.pctNocturnal)}%`} />
              <Stat label="Signal" value={signalSize} />
              <Stat label="Percentile" value={`${percentile}`} accent={theme.accent} />
            </dl>
          </div>
        </ViewTransition>
      </div>
    </article>
  );
}

function AgentCommitsBadge({ className, percent }: { className?: string; percent: number }) {
  const active = percent > 0;

  return (
    <div
      className={cn(
        'border-muted/25 dark:border-muted-dark/25 text-ink dark:text-paper flex w-fit max-w-full items-center gap-2 rounded-lg border bg-white/95 px-2.5 py-1 font-mono text-[10px] tracking-wide uppercase backdrop-blur-sm dark:bg-white/[0.10]',
        className,
      )}
      style={active ? { borderColor: '#a3e63566' } : undefined}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
        style={active ? { color: '#a3e635' } : undefined}
        aria-hidden
      />
      <span className="whitespace-nowrap sm:hidden">Agent</span>
      <span className="hidden whitespace-nowrap sm:inline">Agent-attributed</span>
      <span className="tabular-nums">{percent}%</span>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted dark:text-muted-dark text-[10px] tracking-wider uppercase sm:text-xs">{label}</dt>
      <dd
        className="text-ink dark:text-paper mt-0.5 text-lg font-semibold tabular-nums sm:text-2xl"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

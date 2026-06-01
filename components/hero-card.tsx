import Link from 'next/link';
import { HaloChart } from '@/components/halo-chart';
import { formatCount, formatFollowers, formatHour } from '@/lib/format';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

type Props = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
  percentile: number;
};

export function HeroCard({ profile, archetype, stats, percentile }: Props) {
  const { theme } = archetype;

  return (
    <article
      className="dark:bg-ink-2 relative [aspect-ratio:auto] w-full overflow-hidden rounded-xl border border-black/10 bg-white sm:[aspect-ratio:1200/630] dark:border-white/10"
      style={{
        viewTransitionName: 'hero-card',
      }}
    >
      <div className="text-muted dark:text-muted-dark absolute top-4 right-4 z-10 rounded-lg border border-black/10 bg-white/80 px-2 py-1 font-mono text-[10px] tracking-wider uppercase backdrop-blur-sm sm:top-6 sm:right-6 dark:border-white/10 dark:bg-white/[0.04]">
        Last 90 days
      </div>

      <div className="grid h-full grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10">
        <div className="flex items-center justify-center sm:justify-start sm:pl-3">
          <HaloChart stats={stats} theme={theme} avatarUrl={profile.avatarUrl} size={220} />
        </div>

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
            <span className="text-muted/70 dark:text-muted-dark/70 text-[10.5px] tabular-nums sm:text-[11px]">
              {formatFollowers(profile.followers)}
            </span>
          </div>
          <h1
            className="tracking-tightest text-5xl leading-[0.95] font-semibold sm:text-6xl"
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
            <Stat label="Commits" value={formatCount(stats.total)} />
            <Stat label="Percentile" value={`${percentile}`} accent={theme.accent} />
          </dl>
        </div>
      </div>
    </article>
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

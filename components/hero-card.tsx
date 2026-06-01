import { HaloChart } from '@/components/halo-chart';
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
      className="dark:bg-ink-2 relative w-full overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 [aspect-ratio:auto] sm:[aspect-ratio:1200/630]"
      style={{
        viewTransitionName: 'hero-card',
      }}
    >
      <div className="text-muted dark:text-muted-dark absolute top-4 right-4 z-10 rounded-lg border border-black/10 bg-white/80 px-2 py-1 font-mono text-[10px] tracking-wider uppercase backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04] sm:top-6 sm:right-6">
        Last 90 days
      </div>

      <div className="grid h-full grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10">
        <div className="flex items-center justify-center sm:justify-start">
          <HaloChart stats={stats} theme={theme} avatarUrl={profile.avatarUrl} size={220} />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="text-muted dark:text-muted-dark text-xs sm:text-sm">@{profile.login}</div>
          <h1
            className="text-5xl leading-[0.95] font-semibold tracking-tightest sm:text-6xl"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.accent2}, ${theme.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {archetype.name}
          </h1>
          <p className="text-muted dark:text-muted-dark max-w-md text-sm sm:text-base">{archetype.meaning}</p>

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
      <dt className="text-muted dark:text-muted-dark text-[10px] uppercase tracking-wider sm:text-xs">{label}</dt>
      <dd className="text-ink dark:text-paper mt-0.5 text-lg font-semibold tabular-nums sm:text-2xl" style={accent ? { color: accent } : undefined}>
        {value}
      </dd>
    </div>
  );
}

function formatHour(h: number) {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

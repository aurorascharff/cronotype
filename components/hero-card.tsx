import { HaloChart } from '@/components/halo-chart';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

type Props = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
  percentile: number;
};

/**
 * The HeroCard — also the OG share preview. Sized at a 1200x630 aspect ratio
 * (the OG image standard) so what you see here is exactly what gets shared.
 * The same component will eventually render in `app/u/[login]/opengraph-image.tsx`.
 */
export function HeroCard({ profile, archetype, stats, percentile }: Props) {
  const { theme } = archetype;

  return (
    <article
      className="dark:bg-ink-2 relative w-full overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10"
      style={{
        aspectRatio: '1200 / 630',
        viewTransitionName: 'hero-card',
      }}
    >
      <div className="grid h-full grid-cols-[auto_1fr] items-center gap-6 p-6 sm:gap-10 sm:p-10">
        {/* Halo */}
        <div className="flex items-center justify-center">
          <HaloChart stats={stats} theme={theme} avatarUrl={profile.avatarUrl} size={260} />
        </div>

        {/* Verdict + minimal stats */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="text-muted dark:text-muted-dark text-xs sm:text-sm">@{profile.login}</div>
          <h1
            className="text-4xl leading-[0.95] font-semibold tracking-tightest sm:text-6xl"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.accent2}, ${theme.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {archetype.name}
          </h1>

          <dl className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2 text-sm">
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
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

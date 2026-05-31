import { HaloChart } from '@/components/halo-chart';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

type Props = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
  percentile: number;
};

/** The HeroCard — avatar inside a halo of hour-spokes, themed by archetype. */
export function HeroCard({ profile, archetype, stats, percentile }: Props) {
  const { theme } = archetype;

  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 p-8 backdrop-blur-sm dark:border-white/10 dark:bg-ink-2/80 sm:p-12"
      style={{
        backgroundImage: `radial-gradient(circle at 30% 0%, ${hexAlpha(theme.accent, 0.18)}, transparent 60%), radial-gradient(circle at 100% 100%, ${hexAlpha(theme.accent2, 0.14)}, transparent 50%)`,
        boxShadow: `0 1px 0 rgba(255,255,255,0.5) inset, 0 40px 80px -40px ${hexAlpha(theme.accent, 0.4)}`,
        viewTransitionName: 'hero-card',
      }}
    >
      <div className="relative flex flex-col items-center text-center">
        <HaloChart stats={stats} theme={theme} avatarUrl={profile.avatarUrl} size={320} animate />

        <div className="mt-8 space-y-2">
          <div className="text-sm font-medium" style={{ color: theme.accent }}>
            @{profile.login}
          </div>
          <h1
            className="text-5xl leading-[0.95] font-semibold tracking-tightest sm:text-7xl"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.accent2}, ${theme.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {archetype.name}
          </h1>
          <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md text-base sm:text-lg">
            {archetype.tagline}
          </p>
        </div>

        <dl className="mt-8 grid w-full max-w-md grid-cols-4 gap-2 sm:gap-4">
          <Stat label="Peak" value={formatHour(stats.peakHour)} accent={theme.accent} />
          <Stat label="Nocturnal" value={`${Math.round(stats.pctNocturnal)}%`} accent={theme.accent} />
          <Stat label="Weekend" value={`${Math.round(stats.pctWeekend)}%`} accent={theme.accent} />
          <Stat label="Commits" value={formatCount(stats.total)} accent={theme.accent} />
        </dl>

        <div className="mt-6">
          <div className="text-3xl font-semibold tabular-nums" style={{ color: theme.accent }}>
            {percentile}
            <span className="text-muted dark:text-muted-dark text-base font-normal">th percentile</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-xl border border-white/40 bg-white/40 p-2.5 backdrop-blur-sm dark:border-white/5 dark:bg-white/5"
      style={{ boxShadow: `0 1px 0 ${hexAlpha(accent, 0.2)} inset` }}
    >
      <dt className="text-muted dark:text-muted-dark text-[10px] sm:text-xs">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold tabular-nums sm:text-lg" style={{ color: accent }}>
        {value}
      </dd>
    </div>
  );
}

function hexAlpha(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
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

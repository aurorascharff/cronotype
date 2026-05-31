import clsx from 'clsx';
import { Waveform } from '@/components/waveform';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

type Props = {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
  percentile: number;
};

/** The HeroCard is the share artifact. Archetype is the headline. Waveform is the proof. */
export function HeroCard({ profile, archetype, stats, percentile }: Props) {
  return (
    <article
      className={clsx(
        'border-border dark:border-border-dark dark:bg-ink-2/60 relative overflow-hidden rounded-2xl border bg-white/70 p-8 backdrop-blur-sm sm:p-12',
        'shadow-[0_30px_60px_-30px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]',
      )}
      style={{ viewTransitionName: 'hero-card' }}
    >
      <div
        className={clsx(
          'pointer-events-none absolute -top-40 -left-40 h-80 w-80 rounded-full opacity-30 blur-3xl',
          archetype.colorVar,
        )}
        style={{ backgroundColor: 'currentColor' }}
        aria-hidden
      />

      <header className="relative flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt=""
          width={36}
          height={36}
          className="border-border dark:border-border-dark h-9 w-9 rounded-full border"
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{profile.name ?? profile.login}</div>
          <div className="text-muted dark:text-muted-dark truncate text-xs">@{profile.login}</div>
        </div>
      </header>

      <h1
        className={clsx(
          'verdict-text relative mt-8 bg-gradient-to-r text-5xl leading-[0.95] font-semibold tracking-tightest sm:text-7xl',
          archetype.glowVar,
        )}
      >
        {archetype.name}
      </h1>
      <p className="text-muted dark:text-muted-dark relative mt-3 max-w-prose text-base sm:text-lg">
        {archetype.tagline}
      </p>

      <div className="relative mt-10">
        <Waveform stats={stats} colorClass={archetype.colorVar} animate />
      </div>

      <footer className="relative mt-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <Stat label="Peak" value={formatHour(stats.peakHour)} />
          <Stat label="Nocturnal" value={`${Math.round(stats.pctNocturnal)}%`} />
          <Stat label="Weekend" value={`${Math.round(stats.pctWeekend)}%`} />
          <Stat label="Commits" value={stats.total.toLocaleString()} />
        </dl>
        <div className="text-right">
          <div className={clsx('text-3xl font-semibold tracking-tight tabular-nums', archetype.colorVar)}>
            {percentile}
            <span className="text-muted dark:text-muted-dark text-base font-normal">th</span>
          </div>
          <div className="text-muted dark:text-muted-dark text-xs">percentile</div>
        </div>
      </footer>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted dark:text-muted-dark text-xs">{label}</dt>
      <dd className="text-base font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function formatHour(h: number) {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

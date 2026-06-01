import Link from 'next/link';
import { RadialChip } from '@/components/radial-chip';
import { ARCHETYPES } from '@/lib/archetypes';
import { syntheticStatsFor } from '@/lib/synthetic';
import type { ArchetypeId } from '@/types/cronotype';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'The eight commit-time archetypes Cronotype can diagnose, and what each one means.',
  title: 'The archetypes',
};

type Detail = {
  meaning: string;
  signal: string;
  percentile: string;
};

const DETAILS: Record<ArchetypeId, Detail> = {
  drifter: {
    meaning: 'You code in stolen moments and still somehow keep shipping.',
    percentile: 'Flat: drifters get a fixed midpoint score (no single metric to rank by).',
    signal: 'The fallback. Nothing else triggers: no nocturnal cluster, no business-hours block, no weekend tilt.',
  },
  'insomniac-maintainer': {
    meaning: 'A day job, plus a side project (or an on-call rotation) at night.',
    percentile: 'Higher with more nocturnal commits added to a base of 50%.',
    signal: 'isBimodal: a daytime peak and a second peak after midnight, both well above the average hour.',
  },
  'lunch-bandit': {
    meaning: 'Your sharpest commits happen in that one sacred quiet hour.',
    percentile: 'Higher the more dominant the midday hour is.',
    signal: 'The noon hour is > 8% of all commits AND > 1.6× the average of the surrounding 11am and 1pm hours.',
  },
  'nine-to-fiver': {
    meaning: 'You ship clean during work hours and leave work at work.',
    percentile: 'Higher with a larger pctBusiness share.',
    signal: '> 70% of commits land 9am to 7pm AND hour-to-hour variance is under 5 (a flat business-hours block).',
  },
  'sunrise-sniper': {
    meaning: 'You do your best work in the quiet before the world wakes up.',
    percentile: 'Higher with more pre-9am commits.',
    signal: '> 25% of commits land between 5am and 9am.',
  },
  'touch-grass': {
    meaning: 'Either your life is balanced, or your best work is happening off-stage.',
    percentile: 'Inverse: lower total commits → higher percentile.',
    signal: 'Fewer than 25 public commits in the last 90 days.',
  },
  vampire: {
    meaning: 'You come alive when notifications sleep.',
    percentile: 'Higher with more nocturnal share.',
    signal: '> 30% of commits land between midnight and 5am.',
  },
  'weekend-warrior': {
    meaning: 'Your real momentum starts when the week is officially over.',
    percentile: 'Higher with more Sat/Sun share.',
    signal: '> 40% of commits land on Saturday or Sunday.',
  },
};

const ORDER: ArchetypeId[] = [
  'touch-grass',
  'vampire',
  'sunrise-sniper',
  'lunch-bandit',
  'weekend-warrior',
  'insomniac-maintainer',
  'nine-to-fiver',
  'drifter',
];

export default function TypesPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="tracking-tightest text-2xl font-semibold sm:text-3xl">The archetypes</h1>
        <p className="text-muted dark:text-muted-dark max-w-2xl text-sm sm:text-base">
          Cronotype reads the last 90 days of public commits and sorts you into one of eight rhythms. Each card shows
          what the type means, the exact signal that triggers it, and what drives your percentile.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ORDER.map(id => {
          const a = ARCHETYPES[id];
          const d = DETAILS[id];
          const stats = syntheticStatsFor(id, 220);
          return (
            <li
              key={id}
              id={id}
              className="dark:bg-ink-2 flex scroll-mt-24 gap-4 rounded-xl border border-black/10 bg-white p-4 sm:p-5 dark:border-white/10"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center">
                <RadialChip stats={stats} color={a.theme.accent} size={64} />
              </div>
              <div className="min-w-0 space-y-2.5">
                <h2 className="text-base font-semibold tracking-tight" style={{ color: a.theme.accent }}>
                  {a.name}
                </h2>
                <p className="text-ink dark:text-paper text-sm">{d.meaning}</p>
                <div className="space-y-1.5 pt-1 text-xs">
                  <p className="text-muted dark:text-muted-dark">
                    <span className="text-ink/80 dark:text-paper/80 font-medium">How it&apos;s spotted</span>
                    <br />
                    {d.signal}
                  </p>
                  <p className="text-muted dark:text-muted-dark">
                    <span className="text-ink/80 dark:text-paper/80 font-medium">Percentile</span>
                    <br />
                    {d.percentile}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="dark:bg-ink-2 space-y-3 rounded-xl border border-black/10 bg-white p-5 sm:p-6 dark:border-white/10">
        <h2 className="text-muted dark:text-muted-dark text-[11px] font-medium tracking-[0.14em] uppercase">
          How the diagnosis works
        </h2>
        <ul className="text-ink dark:text-paper space-y-2 text-sm">
          <li>
            <strong className="font-semibold">Data source.</strong>{' '}
            <span className="text-muted dark:text-muted-dark">
              GitHub&apos;s Search Commits API for the last 90 days of public commits authored by the handle, keeping
              each commit&apos;s author timestamp <em>with its original timezone offset</em> so 2am in Tokyo isn&apos;t
              mistaken for 2am in San Francisco.
            </span>
          </li>
          <li>
            <strong className="font-semibold">Bucketing.</strong>{' '}
            <span className="text-muted dark:text-muted-dark">
              Each commit is binned by hour (24 buckets) and weekday (7 buckets) in its local timezone. From those we
              derive shares: <code className="font-mono text-[11px]">pctNocturnal</code> (midnight to 5am),{' '}
              <code className="font-mono text-[11px]">pctSunrise</code> (5am to 9am),{' '}
              <code className="font-mono text-[11px]">pctBusiness</code> (9am to 7pm),{' '}
              <code className="font-mono text-[11px]">pctWeekend</code>, plus an{' '}
              <code className="font-mono text-[11px]">isBimodal</code> flag for two-peak distributions.
            </span>
          </li>
          <li>
            <strong className="font-semibold">Classifier.</strong>{' '}
            <span className="text-muted dark:text-muted-dark">
              A short cascade of rules in priority order. The first rule that matches wins. If nothing matches,
              you&apos;re a Drifter.
            </span>
          </li>
          <li>
            <strong className="font-semibold">Year history.</strong>{' '}
            <span className="text-muted dark:text-muted-dark">
              The colored evolution chart uses GitHub&apos;s GraphQL contributions calendar (one call per year) plus a
              small sample of commits per year to classify the rhythm of each year.
            </span>
          </li>
        </ul>
      </section>

      <div className="text-muted dark:text-muted-dark text-sm">
        <Link
          href="/"
          className="hover:text-ink dark:hover:text-paper underline-offset-2 transition-colors hover:underline"
        >
          ← Diagnose a handle
        </Link>
      </div>
    </div>
  );
}

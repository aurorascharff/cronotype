import Link from 'next/link';
import { RadialChip } from '@/components/radial-chip';
import { ARCHETYPES } from '@/lib/archetypes';
import { syntheticStatsFor } from '@/lib/synthetic';
import type { ArchetypeId } from '@/types/cronotype';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'The eight commit-time archetypes Cronotype can reveal, and what each one means.',
  title: 'The archetypes',
};

type Detail = {
  meaning: string;
  signal: string;
  percentile: string;
};

const DETAILS: Record<ArchetypeId, Detail> = {
  drifter: {
    meaning: 'You move through odd windows, bursts, and gaps, yet the work keeps appearing.',
    percentile: 'Fixed midpoint. Drifters are the beautiful chaos bucket, so there is no single metric to rank.',
    signal: 'The fallback when no stronger rhythm wins: no night cluster, no sunrise lean, no lunch spike, no weekend tilt.',
  },
  'insomniac-maintainer': {
    meaning: 'You split your output between the official day and the second shift after everyone logs off.',
    percentile: 'Starts at 50 and climbs with nocturnal share. The stronger the second shift, the higher it lands.',
    signal: 'A bimodal shape: one daytime peak and one after-midnight peak, both clearly above the average hour.',
  },
  'lunch-bandit': {
    meaning: 'You turn the quiet middle of the day into a tiny shipping heist.',
    percentile: 'Higher when noon dominates the rest of the workday. A sharper spike means a better score.',
    signal: 'Noon is more than 8% of all commits and more than 1.6x the average of 11am and 1pm.',
  },
  'nine-to-fiver': {
    meaning: 'You keep a steady workday pulse and still make it look clean.',
    percentile: 'Higher with a larger business-hours share. The more daytime your rhythm is, the stronger the type.',
    signal: 'More than 70% of commits land from 9am to 7pm, without a strong night or weekend signature.',
  },
  'sunrise-sniper': {
    meaning: 'You find leverage in the early quiet and leave fresh commits for everyone else to wake up to.',
    percentile: 'Higher with more pre-9am commits. The more morning-weighted the graph is, the sharper the shot.',
    signal: 'More than 25% of commits land between 5am and 9am.',
  },
  'touch-grass': {
    meaning: 'You are either touching grass, building somewhere private, or letting the graph wonder where you went.',
    percentile: 'Inverse: fewer recent public commits means a higher percentile. The quietest graphs score highest.',
    signal: 'Fewer than 25 public commits in the last 90 days.',
  },
  vampire: {
    meaning: 'You do your sharpest work when notifications are asleep and the world stops asking questions.',
    percentile: 'Higher with more nocturnal share. The deeper the night shift, the stronger the bite.',
    signal: 'More than 30% of commits land between midnight and 5am.',
  },
  'weekend-warrior': {
    meaning: 'You turn Saturday and Sunday into the part of the week where momentum finally gets room.',
    percentile: 'Higher with more Saturday and Sunday share. Weekend-heavy graphs rise fast.',
    signal: 'More than 40% of commits land on Saturday or Sunday.',
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
              className="dark:bg-ink-2 flex scroll-mt-24 flex-col gap-4 rounded-xl border border-black/10 bg-white p-4 min-[420px]:flex-row sm:p-5 dark:border-white/10"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center">
                <RadialChip stats={stats} color={a.theme.accent} size={64} />
              </div>
              <div className="min-w-0 space-y-2.5 break-words">
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
          How the reveal works
        </h2>
        <ul className="text-ink dark:text-paper space-y-2 text-sm break-words">
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
          ← Reveal a handle
        </Link>
      </div>
    </div>
  );
}

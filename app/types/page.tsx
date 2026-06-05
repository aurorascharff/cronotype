import Link from 'next/link';
import { RadialChip } from '@/components/ui/radial-chip';
import { ARCHETYPES } from '@/lib/archetypes';
import { syntheticStatsFor } from '@/lib/synthetic';
import type { ArchetypeId } from '@/types/cronotype';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'The commit-time archetypes Cronotype can reveal, how they are scored, and what Quiet lately means.',
  title: 'The types',
};

type Detail = {
  meaning: string;
  signal: string;
  percentile: string;
};

const DETAILS: Record<ArchetypeId, Detail> = {
  'last-call-shipper': {
    meaning:
      'You come alive as the respectable workday is packing up, which is either elite focus or procrastination with excellent branding.',
    percentile: 'Higher with a larger late-day share. Strong afternoon or evening peaks score highest.',
    signal: 'A clear late-day lean with very little early-day signal.',
  },
  drifter: {
    meaning: 'You move through odd windows, bursts, and gaps, yet the work keeps appearing.',
    percentile: 'Fixed midpoint. Drifters are the beautiful chaos bucket, so there is no single signal to score.',
    signal:
      'The fallback when no stronger rhythm wins by enough: no clear night cluster, sunrise lean, lunch spike, or weekend tilt.',
  },
  'insomniac-maintainer': {
    meaning: 'You split your output between the official day and the second shift after everyone logs off.',
    percentile: 'Starts at 50 and climbs with nocturnal share. The stronger the second shift, the higher it lands.',
    signal:
      'A two-shift shape: more than 25% during the day, more than 20% late at night, with a quieter evening valley.',
  },
  'lunch-bandit': {
    meaning: 'You turn the quiet middle of the day into a tiny shipping heist.',
    percentile: 'Higher when noon dominates the rest of the workday. A sharper spike means a better score.',
    signal: 'Noon clearly beats the surrounding hours. Small samples need a little extra separation before this wins.',
  },
  'nine-to-fiver': {
    meaning: 'You keep a steady workday pulse and still make it look clean.',
    percentile: 'Higher with a larger business-hours share. The more daytime your rhythm is, the stronger the type.',
    signal:
      'Most signal commits land from 9am to 7pm, with a real workday-start signal and no strong afternoon-only, night, or weekend signature.',
  },
  'sunrise-sniper': {
    meaning: 'You find leverage in the early quiet and leave fresh commits for everyone else to wake up to.',
    percentile: 'Higher with more pre-9am commits. The more morning-weighted the graph is, the sharper the shot.',
    signal:
      'A clear share of signal commits lands between 5am and 9am, with an early peak or a very strong morning lean.',
  },
  'touch-grass': {
    meaning: 'You are either touching grass, building somewhere private, or letting the graph wonder where you went.',
    percentile: 'Inverse: fewer signal commits means a higher score. The quietest matching graphs score highest.',
    signal:
      'Sparse public signal with no clear time-of-day shape. Low commit count alone is not enough for this to win.',
  },
  vampire: {
    meaning: 'You do your sharpest work when notifications are asleep and the world stops asking questions.',
    percentile: 'Higher with more nocturnal share. The deeper the night shift, the stronger the bite.',
    signal:
      'A clear share of signal commits lands between midnight and 5am, with a night peak or a very strong night lean.',
  },
  'weekend-warrior': {
    meaning: 'You turn Saturday and Sunday into the part of the week where momentum finally gets room.',
    percentile: 'Higher with more Saturday and Sunday share. Weekend-heavy graphs rise fast.',
    signal: 'A clear weekend tilt. Small samples need to land beyond the edge before this beats Drifter.',
  },
};

const ORDER: ArchetypeId[] = [
  'touch-grass',
  'vampire',
  'last-call-shipper',
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
        <h1 className="tracking-tightest text-2xl font-semibold sm:text-3xl">The types</h1>
        <p className="text-muted dark:text-muted-dark max-w-2xl text-sm sm:text-base">
          Cronotype samples recent authored commits, filters out obvious merge and dependency noise, and sorts active
          profiles into one of nine rhythms. Empty signal samples become Quiet lately instead: still a profile, just not
          enough recent public signal for a current type.
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
                    <span className="text-ink/80 dark:text-paper/80 font-medium">Score</span>
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
          AI stamp
        </h2>
        <p className="text-muted dark:text-muted-dark text-sm">
          The AI stamp is separate from your cronotype. It counts signal commits that carry visible AI attribution, such
          as agent accounts or commit trailers mentioning Copilot, Claude, Codex, Cursor, Devin, or similar tools. It is
          a public attribution signal, not proof that every changed line was written by AI.
        </p>
      </section>

      <section className="dark:bg-ink-2 space-y-3 rounded-xl border border-black/10 bg-white p-5 sm:p-6 dark:border-white/10">
        <h2 className="text-muted dark:text-muted-dark text-[11px] font-medium tracking-[0.14em] uppercase">
          How the reveal works
        </h2>
        <ul className="text-ink dark:text-paper space-y-2 text-sm break-words">
          <li>
            <strong className="font-semibold">Data source.</strong>{' '}
            <span className="text-muted dark:text-muted-dark">
              GitHub&apos;s Search Commits API for a recent 90-day sample of public commits authored by the handle. The
              current card filters out merge commits and obvious dependency automation, then uses up to 100 signal
              commits. A displayed signal of <code className="font-mono text-[11px]">100+</code> means the filtered
              sample hit GitHub&apos;s page cap.
            </span>
          </li>
          <li>
            <strong className="font-semibold">Bucketing.</strong>{' '}
            <span className="text-muted dark:text-muted-dark">
              Each signal commit is binned by hour (24 buckets) and weekday (7 buckets) using an explicit timestamp
              offset when GitHub exposes one, falling back to UTC bucketing when it does not. From those we derive
              shares: <code className="font-mono text-[11px]">pctNocturnal</code> (midnight to 5am),{' '}
              <code className="font-mono text-[11px]">pctSunrise</code> (5am to 9am),{' '}
              <code className="font-mono text-[11px]">pctBusiness</code> (9am to 7pm),{' '}
              <code className="font-mono text-[11px]">pctWeekend</code>, plus an{' '}
              <code className="font-mono text-[11px]">isBimodal</code> flag for two-shift distributions.
            </span>
          </li>
          <li>
            <strong className="font-semibold">Classifier.</strong>{' '}
            <span className="text-muted dark:text-muted-dark">
              A short cascade of rules in priority order. Empty signal samples become Quiet lately. Otherwise the first
              matching rhythm wins: Insomniac Maintainer, Vampire, Sunrise Sniper, Lunch Bandit, Weekend Warrior, Last
              Call Shipper, Nine-to-Fiver, Grass Toucher, then Drifter.
            </span>
          </li>
          <li>
            <strong className="font-semibold">Year history.</strong>{' '}
            <span className="text-muted dark:text-muted-dark">
              The evolution chart totals come from GitHub&apos;s GraphQL contributions calendar. Its colors use a small
              signal sample for each finished year, and the current year inherits the current 90-day type.
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

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

const HOW_WE_KNOW: Record<ArchetypeId, string> = {
  drifter: 'No single window dominates. Commits scatter across the clock.',
  'insomniac-maintainer': 'Two peaks: a daytime shift and a second wind well after midnight.',
  'lunch-bandit': 'A sharp midday spike that towers over the hours on either side.',
  'nine-to-fiver': 'Most commits land between 9am and 7pm with low hour-to-hour variance.',
  'sunrise-sniper': 'A heavy share of commits before 9am.',
  'touch-grass': 'Very few public commits in the recent window.',
  vampire: 'A heavy share of commits between midnight and 4am.',
  'weekend-warrior': 'Saturday and Sunday carry an outsized share of the week.',
};

// Stable display order, brightest/most-distinct types first.
const ORDER: ArchetypeId[] = [
  'vampire',
  'sunrise-sniper',
  'nine-to-fiver',
  'lunch-bandit',
  'weekend-warrior',
  'insomniac-maintainer',
  'drifter',
  'touch-grass',
];

export default function TypesPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tightest sm:text-3xl">The archetypes</h1>
        <p className="text-muted dark:text-muted-dark max-w-2xl text-sm sm:text-base">
          Cronotype reads the last 90 days of public commit timestamps and sorts you into one of eight
          rhythms. Here&apos;s every type and how the classifier spots it.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ORDER.map(id => {
          const a = ARCHETYPES[id];
          const stats = syntheticStatsFor(id, 220);
          return (
            <li
              key={id}
              id={id}
              className="dark:bg-ink-2 flex scroll-mt-24 gap-4 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 sm:p-5"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center">
                <RadialChip stats={stats} color={a.theme.accent} size={64} />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="text-base font-semibold tracking-tight" style={{ color: a.theme.accent }}>
                  {a.name}
                </h2>
                <p className="text-ink dark:text-paper text-sm">{a.meaning}</p>
                <p className="text-muted dark:text-muted-dark text-xs">{HOW_WE_KNOW[id]}</p>
              </div>
            </li>
          );
        })}
      </ul>

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

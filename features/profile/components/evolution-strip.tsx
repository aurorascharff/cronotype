import { Suspense } from 'react';
import { RadialChip } from '@/components/radial-chip';
import { ARCHETYPES, classify } from '@/lib/archetypes';
import { getEvolution } from '@/features/profile/profile-queries';

type Props = {
  login: string;
};

/** Public entry — owns its own Suspense and skeleton. */
export function EvolutionStrip({ login }: Props) {
  return (
    <Suspense fallback={<EvolutionStripSkeleton />}>
      <EvolutionStripBody login={login} />
    </Suspense>
  );
}

async function EvolutionStripBody({ login }: Props) {
  const years = await getEvolution(login);
  const meaningful = years.filter(y => y.stats.total > 0);
  if (meaningful.length < 2) return null;

  return (
    <section className="border-border dark:border-border-dark dark:bg-ink-2/40 rounded-2xl border bg-white/60 p-6 backdrop-blur-sm sm:p-8">
      <header className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
        <span className="text-muted dark:text-muted-dark text-xs">
          {meaningful[0].year}–{meaningful[meaningful.length - 1].year}
        </span>
      </header>

      <ol
        className={
          meaningful.length <= 4
            ? 'grid grid-cols-2 gap-3 sm:grid-cols-4'
            : meaningful.length <= 6
              ? 'grid grid-cols-3 gap-3 sm:grid-cols-6'
              : 'grid grid-cols-4 gap-3 sm:grid-cols-8'
        }
      >
        {meaningful.map(({ year, stats }) => {
          const archetype = classify(stats);
          const def = ARCHETYPES[archetype.id];
          return (
            <li key={year} className="flex flex-col items-center gap-2 text-center">
              <div
                className="rounded-2xl border border-white/40 p-3 dark:border-white/5"
                style={{ background: `radial-gradient(circle, ${hexAlpha(def.theme.accent, 0.1)}, transparent)` }}
              >
                <RadialChip stats={stats} color={def.theme.accent} size={56} />
              </div>
              <div className="text-muted dark:text-muted-dark text-xs tabular-nums">{year}</div>
              <div className="w-full truncate text-xs font-semibold" style={{ color: def.theme.accent }}>
                {def.name}
              </div>
              <div className="text-muted dark:text-muted-dark text-[10px] tabular-nums">
                {formatCount(stats.total)}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function EvolutionStripSkeleton() {
  return (
    <section className="border-border dark:border-border-dark dark:bg-ink-2/40 rounded-2xl border bg-white/60 p-6 backdrop-blur-sm sm:p-8">
      <div className="mb-5 flex items-baseline justify-between">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-3 w-20" />
      </div>
      <ol className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex flex-col items-center gap-2">
            <div className="skeleton h-[88px] w-[88px] rounded-2xl" />
            <div className="skeleton h-3 w-8" />
            <div className="skeleton h-3 w-12 opacity-60" />
          </li>
        ))}
      </ol>
    </section>
  );
}

function hexAlpha(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function formatCount(n: number) {
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

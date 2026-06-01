import { RadialChip } from '@/components/radial-chip';
import { ARCHETYPES, classify } from '@/lib/archetypes';
import { getEvolution } from '@/features/profile/profile-queries';

type Props = {
  login: string;
};

export async function EvolutionStrip({ login }: Props) {
  const years = await getEvolution(login);
  const meaningful = years.filter(y => y.stats.total > 0);
  if (meaningful.length < 2) return null;

  return (
    <section className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 sm:p-6">
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold tracking-tight">How you got here</h2>
        <span className="text-muted dark:text-muted-dark text-xs tabular-nums">
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
              <RadialChip stats={stats} color={def.theme.accent} size={56} />
              <div className="text-muted dark:text-muted-dark text-xs tabular-nums">{year}</div>
              <div className="text-ink dark:text-paper w-full truncate text-xs font-medium">{def.name}</div>
              <div className="text-muted dark:text-muted-dark text-[10px] tabular-nums">{formatCount(stats.total)}</div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function EvolutionStripSkeleton() {
  return (
    <section className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-3 w-20" />
      </div>
      <ol className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex flex-col items-center gap-2">
            <div className="skeleton h-14 w-14 rounded-full" />
            <div className="skeleton h-3 w-8" />
            <div className="skeleton h-3 w-12 opacity-60" />
          </li>
        ))}
      </ol>
    </section>
  );
}

function formatCount(n: number) {
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

import { connection } from 'next/server';
import { computeCronotype } from '@/features/profile/profile-service';
import { getMonthlyHistory, type MonthBucket } from '@/features/profile/profile-queries';
import { ARCHETYPES } from '@/lib/archetypes';
import type { ArchetypeId } from '@/types/cronotype';

type Props = {
  login: string;
};

const W = 1000;
const H = 200;
const PAD_TOP = 12;
const PAD_BOT = 4;

export async function EvolutionStrip({ login }: Props) {
  await connection();
  const [{ months, yearlyArchetypes, partial }, { archetype }] = await Promise.all([
    getMonthlyHistory(login),
    computeCronotype(login, '90d'),
  ]);
  if (months.length < 6) return null;

  const smoothed = smooth(months.map(m => m.count), 2);
  const max = Math.max(1, ...smoothed);
  const usableH = H - PAD_TOP - PAD_BOT;

  const points = smoothed.map((v, i) => ({
    x: (i / (smoothed.length - 1)) * W,
    y: PAD_TOP + usableH - (v / max) * usableH,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L${W},${H - PAD_BOT} L0,${H - PAD_BOT} Z`;

  const yearMarkers = computeYearMarkers(months);
  const transitions = buildArchetypeTransitions(months, yearlyArchetypes, archetype.id);

  return (
    <section className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 sm:p-6">
      <h2 className="text-muted dark:text-muted-dark mb-4 text-[11px] font-medium tracking-[0.14em] uppercase">
        How you got here{partial ? ' · partial' : ''}
      </h2>

      <div className="relative">
        <div className="relative mb-1 h-5">
          {transitions.map((t, i) => {
            const leftPct = (t.idx / (smoothed.length - 1)) * 100;
            const align = leftPct < 12 ? 'left' : leftPct > 88 ? 'right' : 'center';
            const accent2 = ARCHETYPES[t.archetypeId].theme.accent2;
            return (
              <div
                key={`transition-label-${i}`}
                className="pointer-events-none absolute top-0 flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  left: `${leftPct}%`,
                  transform: align === 'center' ? 'translateX(-50%)' : align === 'right' ? 'translateX(-100%)' : 'none',
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: t.color }}
                />
                <span
                  className="text-[11px] font-semibold tracking-tight"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${accent2}, ${t.color})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-32 w-full sm:h-40"
          role="img"
          aria-label={`Archetype evolution from ${months[0].month.slice(0, 4)} to ${months[months.length - 1].month.slice(0, 4)}`}
        >
          <defs>
            <linearGradient id={`evolution-fill-${archetype.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={archetype.theme.accent} stopOpacity="0.4" />
              <stop offset="100%" stopColor={archetype.theme.accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {yearMarkers.map(yr => (
            <line
              key={yr.x}
              x1={yr.x}
              y1={PAD_TOP}
              x2={yr.x}
              y2={H - PAD_BOT}
              stroke="currentColor"
              className="text-muted/15 dark:text-muted-dark/15"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={areaPath} fill={`url(#evolution-fill-${archetype.id})`} />

          <path
            d={linePath}
            fill="none"
            stroke={archetype.theme.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {transitions.map((t, i) => {
            const x = (t.idx / (smoothed.length - 1)) * W;
            const y = PAD_TOP + usableH - (smoothed[t.idx] / max) * usableH;
            return (
              <g key={`transition-${i}`}>
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={PAD_TOP + 18}
                  stroke={t.color}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.45"
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={x} cy={y} r="4.5" fill={t.color} stroke="currentColor" className="text-white dark:text-[#0a0b0d]" strokeWidth="1.5" />
              </g>
            );
          })}
        </svg>

        <div className="text-muted dark:text-muted-dark relative mt-2 h-4 text-[10px] tabular-nums">
          {yearMarkers.map(yr => (
            <span
              key={yr.label}
              className="absolute -translate-x-1/2"
              style={{ left: `${(yr.x / W) * 100}%` }}
            >
              {yr.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EvolutionStripSkeleton() {
  return (
    <section className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 sm:p-6">
      <div className="skeleton mb-4 h-2.5 w-32 rounded" />

      <div className="relative mb-1 flex h-5 items-center gap-6">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton ml-auto h-3 w-24 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>

      <div className="skeleton h-32 w-full rounded-md sm:h-40" />

      <div className="relative mt-2 flex h-4 justify-between">
        <div className="skeleton h-2.5 w-8 rounded" />
        <div className="skeleton h-2.5 w-8 rounded" />
        <div className="skeleton h-2.5 w-8 rounded" />
      </div>
    </section>
  );
}

function smooth(values: number[], radius: number): number[] {
  if (radius <= 0) return values;
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(values.length - 1, i + radius); j++) {
      sum += values[j];
      n++;
    }
    out.push(sum / n);
  }
  return out;
}

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function computeYearMarkers(months: MonthBucket[]): Array<{ label: string; x: number }> {
  const seen = new Map<number, number>();
  months.forEach((m, i) => {
    const y = Number(m.month.slice(0, 4));
    if (!seen.has(y)) seen.set(y, i);
  });

  const entries = Array.from(seen.entries());
  const step = Math.max(1, Math.ceil(entries.length / 6));
  const picked = entries.filter((_, i) => i % step === 0 || i === entries.length - 1);

  return picked.map(([year, idx]) => ({
    label: String(year),
    x: (idx / (months.length - 1)) * W,
  }));
}

function buildArchetypeTransitions(
  months: MonthBucket[],
  yearly: Array<{ year: number; archetypeId: ArchetypeId; commits: number }>,
  currentId: ArchetypeId,
) {
  const dense = yearly
    .filter(y => y.commits > 0)
    .sort((a, b) => a.year - b.year)
    .map(y => ({ archetypeId: y.archetypeId, year: y.year }));

  const collapsed: Array<{ startYear: number; endYear: number; archetypeId: ArchetypeId }> = [];
  for (const step of dense) {
    const prev = collapsed[collapsed.length - 1];
    if (!prev || prev.archetypeId !== step.archetypeId) {
      collapsed.push({ archetypeId: step.archetypeId, endYear: step.year, startYear: step.year });
    } else {
      prev.endYear = step.year;
    }
  }

  const thisYear = new Date().getUTCFullYear();
  const last = collapsed[collapsed.length - 1];
  if (!last || last.archetypeId !== currentId) {
    collapsed.push({ archetypeId: currentId, endYear: thisYear, startYear: thisYear });
  } else {
    last.endYear = Math.max(last.endYear, thisYear);
  }

  const firstIdxByYear = new Map<number, number>();
  months.forEach((m, i) => {
    const y = Number(m.month.slice(0, 4));
    if (!firstIdxByYear.has(y)) firstIdxByYear.set(y, i);
  });

  const transitions = collapsed
    .map(run => {
      const idx = firstIdxByYear.get(run.startYear);
      if (idx == null) return null;
      const archetype = ARCHETYPES[run.archetypeId];
      return {
        archetypeId: run.archetypeId,
        color: archetype.theme.accent,
        idx,
        label: archetype.name,
        year: run.startYear,
      };
    })
    .filter(Boolean) as Array<{ archetypeId: ArchetypeId; color: string; idx: number; label: string; year: number }>;

  return transitions;
}

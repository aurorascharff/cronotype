import { connection } from 'next/server';
import { RefreshPartial } from '@/components/refresh-partial';
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
  const [{ months, yearlyArchetypes, partial, failedYears }, { archetype }] = await Promise.all([
    getMonthlyHistory(login),
    computeCronotype(login, '90d'),
  ]);
  if (months.length < 6) return null;

  const smoothed = smooth(
    months.map(m => m.count),
    2,
  );
  const max = Math.max(1, ...smoothed);
  const usableH = H - PAD_TOP - PAD_BOT;

  const points = smoothed.map((v, i) => ({
    x: (i / (smoothed.length - 1)) * W,
    y: PAD_TOP + usableH - (v / max) * usableH,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L${W},${H - PAD_BOT} L0,${H - PAD_BOT} Z`;

  const yearMarkers = computeYearMarkers(months);
  const marks = buildYearMarks(months, yearlyArchetypes, archetype.id);
  const eras = buildEras(marks, smoothed.length, archetype.theme.accent);
  const hasUnknown = eras.some(e => e.unknown);
  const fillId = `evolution-fill-${archetype.id}`;

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
        {partial && (
          <div className="flex items-center gap-2">
            <span className="text-muted/70 dark:text-muted-dark/70 text-[10.5px] tracking-wide uppercase">
              Partial · GitHub rate limit
            </span>
            <RefreshPartial login={login} years={failedYears} />
          </div>
        )}
      </header>
      <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-6 sm:p-8 dark:border-white/10">
        <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
          {eras
            .filter(e => e.label)
            .map((e, i) => (
              <li key={`legend-${i}`} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                <span className="text-[11px] font-semibold tracking-tight" style={{ color: e.color }}>
                  {e.label}
                </span>
                <span className="text-muted dark:text-muted-dark text-[10.5px] tabular-nums">{e.yearLabel}</span>
              </li>
            ))}
          {hasUnknown && (
            <li className="text-muted dark:text-muted-dark flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="inline-block h-px w-4 align-middle"
                style={{
                  backgroundImage: 'repeating-linear-gradient(to right, currentColor 0 4px, transparent 4px 8px)',
                }}
              />
              <span className="text-[11px] font-semibold tracking-tight">Missing data</span>
            </li>
          )}
        </ul>

        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-32 w-full sm:h-40"
            role="img"
            aria-label={`Archetype evolution from ${months[0].month.slice(0, 4)} to ${months[months.length - 1].month.slice(0, 4)}`}
          >
            <defs>
              {eras.map((e, i) => (
                <linearGradient key={`${fillId}-${i}`} id={`${fillId}-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={e.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={e.color} stopOpacity="0" />
                </linearGradient>
              ))}
              {eras.map((e, i) => {
                const x1 = (e.startPct / 100) * W;
                const x2 = (e.endPct / 100) * W;
                return (
                  <clipPath key={`${fillId}-clip-${i}`} id={`${fillId}-clip-${i}`}>
                    <rect x={x1} y={0} width={Math.max(0.5, x2 - x1)} height={H} />
                  </clipPath>
                );
              })}
            </defs>

            {eras.map((e, i) =>
              e.unknown ? null : (
                <path
                  key={`era-fill-${i}`}
                  d={areaPath}
                  fill={`url(#${fillId}-${i})`}
                  clipPath={`url(#${fillId}-clip-${i})`}
                />
              ),
            )}

            {eras.map((e, i) => {
              if (i === 0) return null;
              const x = (e.startPct / 100) * W;
              return (
                <line
                  key={`era-divider-${i}`}
                  x1={x}
                  y1={PAD_TOP}
                  x2={x}
                  y2={H - PAD_BOT}
                  stroke={e.color}
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity="0.35"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {eras.map((e, i) => (
              <path
                key={`era-line-${i}`}
                d={linePath}
                fill="none"
                stroke={e.color}
                strokeWidth="2.5"
                strokeDasharray={e.unknown ? '4 4' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={e.unknown ? 0.55 : 1}
                clipPath={`url(#${fillId}-clip-${i})`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>

        <div className="text-muted dark:text-muted-dark relative mt-2 h-4 text-[10px] tabular-nums">
          {yearMarkers.map(yr => (
            <span key={yr.label} className="absolute -translate-x-1/2" style={{ left: `${(yr.x / W) * 100}%` }}>
              {yr.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EvolutionStripSkeleton() {
  // Render a structural placeholder, not an accurate one. Year labels are
  // omitted in the skeleton because computing them needs `new Date()` which
  // would force this fallback off the static shell during prerender.
  const years = 12;

  return (
    <section className="space-y-4" aria-hidden>
      <header>
        <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
      </header>
      <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-6 sm:p-8 dark:border-white/10">
        <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
          <li className="flex items-center gap-1.5">
            <span className="bg-muted/30 dark:bg-muted-dark/30 h-2 w-2 rounded-full" />
            <span className="skeleton h-3 w-20" />
          </li>
          <li className="flex items-center gap-1.5">
            <span className="bg-muted/30 dark:bg-muted-dark/30 h-2 w-2 rounded-full" />
            <span className="skeleton h-3 w-16" />
          </li>
          <li className="flex items-center gap-1.5">
            <span className="bg-muted/30 dark:bg-muted-dark/30 h-2 w-2 rounded-full" />
            <span className="skeleton h-3 w-24" />
          </li>
        </ul>

        <div
          role="status"
          aria-label="Loading timeline"
          className="border-muted/15 dark:border-muted-dark/15 relative h-32 overflow-hidden rounded-md border sm:h-40"
        >
          {/* Dotted year dividers — same density and treatment as the resolved chart. */}
          {Array.from({ length: years - 1 }).map((_, i) => (
            <div
              key={i}
              className="border-muted/20 dark:border-muted-dark/20 absolute inset-y-2 border-l border-dashed"
              style={{ left: `${((i + 1) / years) * 100}%` }}
            />
          ))}

          {/* Subtle inline loading pulse — keeps the silhouette empty since we
              don't yet know the line shape, but gestures at activity. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </div>
        </div>

        <div className="text-muted/60 dark:text-muted-dark/60 mt-2 flex justify-between text-[10px] tabular-nums">
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
        </div>
      </div>
    </section>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="text-muted/40 dark:text-muted-dark/40 h-5 w-5 animate-spin"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
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

function buildYearMarks(
  months: MonthBucket[],
  yearly: Array<{ year: number; archetypeId: ArchetypeId; commits: number }>,
  currentId: ArchetypeId,
) {
  const archetypeByYear = new Map<number, ArchetypeId>();
  for (const y of yearly) {
    if (y.commits > 0) archetypeByYear.set(y.year, y.archetypeId);
  }

  const thisYear = new Date().getUTCFullYear();
  archetypeByYear.set(thisYear, currentId);

  const commitsByYear = new Map<number, number>();
  const firstIdxByYear = new Map<number, number>();
  months.forEach((m, i) => {
    const y = Number(m.month.slice(0, 4));
    commitsByYear.set(y, (commitsByYear.get(y) ?? 0) + m.count);
    if (!firstIdxByYear.has(y)) firstIdxByYear.set(y, i);
  });

  const marks = Array.from(firstIdxByYear.entries())
    .filter(([year]) => (commitsByYear.get(year) ?? 0) > 0)
    .sort((a, b) => a[0] - b[0])
    .map(([year, idx]) => {
      const archetypeId = archetypeByYear.get(year) ?? null;
      const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;
      return {
        archetypeId,
        color: archetype?.theme.accent ?? null,
        idx,
        label: archetype?.name ?? null,
        year,
      };
    });

  return marks;
}

type Mark = {
  archetypeId: ArchetypeId | null;
  color: string | null;
  idx: number;
  label: string | null;
  year: number;
};

type Era = {
  color: string;
  label: string | null;
  yearLabel: string;
  startPct: number;
  endPct: number;
  unknown: boolean;
};

function buildEras(marks: Mark[], pointCount: number, fallback: string): Era[] {
  if (marks.length === 0 || pointCount < 2) {
    return [{ color: fallback, endPct: 100, label: null, startPct: 0, unknown: true, yearLabel: '' }];
  }

  const pct = (idx: number) => (idx / (pointCount - 1)) * 100;

  const eras: Era[] = [];
  let lastColor = marks[0].color ?? fallback;

  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    const unknown = !m.archetypeId;
    const color = unknown ? '#94a3b8' : (m.color ?? lastColor);
    const startPct = i === 0 ? 0 : pct(m.idx);
    const endPct = i === marks.length - 1 ? 100 : pct(marks[i + 1].idx);
    if (!unknown) lastColor = color;

    const prev = eras[eras.length - 1];
    if (prev && prev.unknown === unknown && prev.color === color && prev.label === m.label) {
      prev.endPct = endPct;
      prev.yearLabel = `${prev.yearLabel.split('-')[0]}-${m.year}`;
    } else {
      eras.push({
        color,
        endPct,
        label: m.label,
        startPct,
        unknown,
        yearLabel: String(m.year),
      });
    }
  }

  return eras;
}

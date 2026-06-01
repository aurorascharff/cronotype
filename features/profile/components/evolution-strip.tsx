import { Fragment } from 'react';
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
  const [{ months, yearlyArchetypes, partial }, { archetype }] = await Promise.all([
    getMonthlyHistory(login),
    computeCronotype(login, '90d'),
  ]);
  if (months.length < 6) return null;

  // Smooth a tiny bit so the line doesn't jitter on noisy months.
  const smoothed = smooth(months.map(m => m.count), 2);
  const max = Math.max(1, ...smoothed);
  const usableH = H - PAD_TOP - PAD_BOT;

  const points = smoothed.map((v, i) => ({
    x: (i / (smoothed.length - 1)) * W,
    y: PAD_TOP + usableH - (v / max) * usableH,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L${W},${H - PAD_BOT} L0,${H - PAD_BOT} Z`;

  const peak = findPeak(months);
  const total = months.reduce((a, b) => a + b.count, 0);
  const yearMarkers = computeYearMarkers(months);
  const journey = buildArchetypeJourney(yearlyArchetypes, archetype.id);

  return (
    <section className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 sm:p-6">
      <header className="mb-5 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">How you got here</h2>
          <p className="text-muted dark:text-muted-dark mt-0.5 text-xs">
            {total.toLocaleString()} commits since {months[0].month.slice(0, 4)} ·{' '}
            <span style={{ color: archetype.theme.accent }}>{archetype.name}</span> today
            {partial ? ' · recent-only snapshot' : ''}
          </p>
        </div>
        <span className="text-muted dark:text-muted-dark text-xs tabular-nums">
          {months[0].month.slice(0, 4)}–{months[months.length - 1].month.slice(0, 4)}
        </span>
      </header>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-32 w-full sm:h-40"
          role="img"
          aria-label={`Commit history: ${total.toLocaleString()} commits over ${months.length} months`}
        >
          <defs>
            <linearGradient id={`evolution-fill-${archetype.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={archetype.theme.accent} stopOpacity="0.4" />
              <stop offset="100%" stopColor={archetype.theme.accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Year divider hairlines */}
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

          {/* Gradient fill */}
          <path d={areaPath} fill={`url(#evolution-fill-${archetype.id})`} />

          {/* Top line */}
          <path
            d={linePath}
            fill="none"
            stroke={archetype.theme.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Peak marker — a single accent dot at the user's busiest month. */}
          {peak && (
            <circle
              cx={(peak.index / (smoothed.length - 1)) * W}
              cy={PAD_TOP + usableH - (smoothed[peak.index] / max) * usableH}
              r="3.5"
              fill={archetype.theme.accent}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Peak callout */}
        {peak && (
          <div
            className="text-muted dark:text-muted-dark pointer-events-none absolute -translate-x-1/2 text-[10px] tabular-nums"
            style={{
              left: `${(peak.index / (smoothed.length - 1)) * 100}%`,
              top: '-2px',
            }}
          >
            <span style={{ color: archetype.theme.accent }}>peak</span> {peak.label} · {peak.count}
          </div>
        )}

        {/* Year labels along the bottom */}
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

        {journey.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
            {journey.map((step, i) => {
              const a = ARCHETYPES[step.archetypeId];
              const label = step.current ? 'now' : String(step.year);
              return (
                <Fragment key={`${step.archetypeId}-${step.year}-${i}`}>
                  {i > 0 && <span className="text-muted dark:text-muted-dark">→</span>}
                  <span
                    className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10"
                    style={{ color: a.theme.accent }}
                  >
                    {a.name} <span className="text-muted dark:text-muted-dark">{label}</span>
                  </span>
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function EvolutionStripSkeleton() {
  return (
    <section className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 sm:p-6">
      <div className="mb-4 space-y-1.5">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-3 w-52 opacity-60" />
      </div>
      <div className="skeleton h-32 rounded-md sm:h-40" />
    </section>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Tiny moving-average smoothing so the line reads as a trend, not jitter. */
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

/**
 * Build a smooth cubic-bezier SVG path through the points. Uses a Catmull-Rom-
 * to-Bezier conversion so the curve passes through each data point exactly.
 */
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

function findPeak(months: MonthBucket[]): { index: number; label: string; count: number } | null {
  let best = -1;
  let bestIdx = -1;
  months.forEach((m, i) => {
    if (m.count > best) {
      best = m.count;
      bestIdx = i;
    }
  });
  if (bestIdx < 0 || best === 0) return null;
  return { count: best, index: bestIdx, label: formatMonth(months[bestIdx].month) };
}

function formatMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString('en', { month: 'short', year: 'numeric' });
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

function buildArchetypeJourney(
  yearly: Array<{ year: number; archetypeId: ArchetypeId; commits: number }>,
  currentId: ArchetypeId,
) {
  const dense = yearly
    .filter(y => y.commits > 0)
    .map(y => ({ archetypeId: y.archetypeId, current: false, year: y.year }));

  const collapsed: Array<{ year: number; archetypeId: ArchetypeId; current: boolean }> = [];
  for (const step of dense) {
    const prev = collapsed[collapsed.length - 1];
    if (!prev || prev.archetypeId !== step.archetypeId) collapsed.push(step);
  }

  const last = collapsed[collapsed.length - 1];
  if (!last || last.archetypeId !== currentId) {
    collapsed.push({ archetypeId: currentId, current: true, year: new Date().getUTCFullYear() });
  } else {
    last.current = true;
  }

  return collapsed.slice(Math.max(0, collapsed.length - 6));
}

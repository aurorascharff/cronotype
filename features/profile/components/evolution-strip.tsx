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
  const aura = buildArchetypeAuras(months, yearlyArchetypes, archetype.id);
  const orbiters = buildOrbiters();

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
            <filter id={`aura-blur-${archetype.id}`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            {aura.bands.map((b, i) => (
              <linearGradient key={`aura-grad-${i}`} id={`aura-grad-${archetype.id}-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={b.color} stopOpacity="0" />
                <stop offset="50%" stopColor={b.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={b.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Archetype aura bands so the chart itself carries the evolution story. */}
          {aura.bands.map((b, i) => (
            <rect
              key={`aura-band-${i}`}
              x={b.x}
              y={PAD_TOP}
              width={b.width}
              height={usableH}
              fill={`url(#aura-grad-${archetype.id}-${i})`}
              filter={`url(#aura-blur-${archetype.id})`}
            />
          ))}

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

          {/* Orbiting markers that visibly move along the curve. */}
          {orbiters.map((o, i) => (
            <g key={`floater-${i}`}>
              <circle
                r={o.r}
                fill={archetype.theme.accent2}
                opacity={o.opacity}
                vectorEffect="non-scaling-stroke"
              >
                <animate
                  attributeName="opacity"
                  values={`${o.opacity};${Math.min(0.85, o.opacity + 0.22)};${o.opacity}`}
                  dur={`${Math.max(3.2, o.duration - 1)}s`}
                  begin={`${o.delay / 2}s`}
                  repeatCount="indefinite"
                />
                <animateMotion
                  path={linePath}
                  dur={`${o.duration}s`}
                  begin={`${o.delay}s`}
                  keyPoints={`${o.start};${o.end};${o.start}`}
                  keyTimes="0;0.5;1"
                  calcMode="linear"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}

          {/* Archetype transition markers along the curve. */}
          {aura.transitions.map((t, i) => {
            const y = PAD_TOP + usableH - (smoothed[t.idx] / max) * usableH;
            const x = (t.idx / (smoothed.length - 1)) * W;
            return (
              <g key={`transition-${i}`}>
                <circle cx={x} cy={y} r="8" fill={t.color} opacity="0.16" filter={`url(#aura-blur-${archetype.id})`} />
                <circle cx={x} cy={y} r="3.6" fill={t.color} opacity="0.95" />
              </g>
            );
          })}

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

function buildArchetypeAuras(
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
  const lastIdxByYear = new Map<number, number>();
  months.forEach((m, i) => {
    const y = Number(m.month.slice(0, 4));
    if (!firstIdxByYear.has(y)) firstIdxByYear.set(y, i);
    lastIdxByYear.set(y, i);
  });

  const bands = collapsed
    .map(run => {
      const startIdx = firstIdxByYear.get(run.startYear);
      const endIdx = lastIdxByYear.get(run.endYear);
      if (startIdx == null || endIdx == null) return null;

      const x1 = (startIdx / (months.length - 1)) * W;
      const x2 = (endIdx / (months.length - 1)) * W;
      return {
        color: ARCHETYPES[run.archetypeId].theme.accent,
        width: Math.max(24, x2 - x1 + 22),
        x: Math.max(0, x1 - 11),
      };
    })
    .filter(Boolean) as Array<{ color: string; x: number; width: number }>;

  const transitions = collapsed
    .slice(1)
    .map(run => {
      const idx = firstIdxByYear.get(run.startYear);
      if (idx == null) return null;
      return {
        color: ARCHETYPES[run.archetypeId].theme.accent,
        idx,
      };
    })
    .filter(Boolean) as Array<{ color: string; idx: number }>;

  return {
    bands,
    transitions,
  };
}

function buildOrbiters() {
  const starts = [0.06, 0.2, 0.34, 0.5, 0.66, 0.82];
  return starts.map((start, i) => {
    const span = 0.12 + (i % 3) * 0.03;
    return {
      delay: i * 0.35,
      duration: 5.5 + (i % 4) * 1.2,
      end: Math.min(0.98, start + span),
      opacity: 0.34 + (i % 3) * 0.1,
      r: i % 3 === 0 ? 5.2 : i % 2 === 0 ? 4.4 : 3.8,
      start,
    };
  });
}

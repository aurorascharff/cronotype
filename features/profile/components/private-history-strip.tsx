import { ARCHETYPES, QUIET_THEME } from '@/lib/archetypes';
import { formatCount } from '@/lib/format';
import type { PrivateHistoryResult } from '@/features/profile/profile-private-queries';
import type { ArchetypeId } from '@/types/cronotype';

type Props = {
  history: PrivateHistoryResult | null;
};

type MonthBucket = { count: number; month: string };
type Era = {
  color: string;
  endPct: number;
  label: string | null;
  startPct: number;
  unknown: boolean;
  yearLabel: string;
};

const W = 1000;
const H = 200;
const PAD_TOP = 12;
const PAD_BOT = 4;

export function PrivateHistoryStrip({ history }: Props) {
  if (!history) return null;

  const months = expandPrivateMonths(history);
  if (months.length < 2) return null;

  const smoothed = smooth(
    months.map(month => month.count),
    2,
  );
  const max = Math.max(1, ...smoothed);
  const usableH = H - PAD_TOP - PAD_BOT;
  const points = smoothed.map((value, index) => ({
    x: (index / (smoothed.length - 1)) * W,
    y: PAD_TOP + usableH - (value / max) * usableH,
  }));
  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L${W},${H - PAD_BOT} L0,${H - PAD_BOT} Z`;
  const eras = buildPrivateEras(months, history, smoothed.length);
  const yearMarkers = computeYearMarkers(months);
  const mobileYearMarkers =
    yearMarkers.length > 1 ? [yearMarkers[0], yearMarkers[yearMarkers.length - 1]] : yearMarkers;
  const totalCommits = months.reduce((sum, month) => sum + month.count, 0);
  const fillId = `private-evolution-fill-${history.generatedAt.replace(/\W/g, '')}`;
  const hasUnknown = eras.some(era => era.unknown);
  const agentBars = buildPrivateAgentCommitBars(months, history, points);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
        {history.partial ? (
          <span className="text-muted/70 dark:text-muted-dark/70 text-[10.5px] tracking-wide uppercase">
            Partial · GitHub rate limit
          </span>
        ) : null}
      </header>
      <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-4 sm:p-8 dark:border-white/10">
        <ul className="mb-4 flex flex-wrap gap-x-3 gap-y-1.5 sm:gap-x-4">
          {eras
            .filter(era => era.label)
            .map((era, index) => (
              <li key={`private-legend-${index}`} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="h-2 w-2 rounded-full" style={{ background: era.color }} />
                <span className="text-[11px] font-semibold tracking-tight" style={{ color: era.color }}>
                  {era.label}
                </span>
                <span className="text-muted dark:text-muted-dark text-[10.5px] tabular-nums">{era.yearLabel}</span>
              </li>
            ))}
          {hasUnknown ? (
            <li className="text-muted dark:text-muted-dark flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="inline-block h-px w-4 align-middle"
                style={{
                  backgroundImage: 'repeating-linear-gradient(to right, currentColor 0 4px, transparent 4px 8px)',
                }}
              />
              <span className="text-[11px] font-semibold tracking-tight">Missing data</span>
            </li>
          ) : null}
        </ul>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-32 w-full sm:h-40"
          role="img"
          aria-label={`Private archetype history from ${months[0].month.slice(0, 4)} to ${months[months.length - 1].month.slice(0, 4)}`}
        >
          <defs>
            {eras.map((era, index) => (
              <linearGradient key={`${fillId}-${index}`} id={`${fillId}-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={era.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={era.color} stopOpacity="0" />
              </linearGradient>
            ))}
            {eras.map((era, index) => {
              const x1 = (era.startPct / 100) * W;
              const x2 = (era.endPct / 100) * W;
              return (
                <clipPath key={`${fillId}-clip-${index}`} id={`${fillId}-clip-${index}`}>
                  <rect x={x1} y={0} width={Math.max(0.5, x2 - x1)} height={H} />
                </clipPath>
              );
            })}
          </defs>
          {[max, max / 2].map(value => {
            const y = PAD_TOP + usableH - (value / max) * usableH;
            return (
              <g key={value}>
                <line
                  x1={0}
                  y1={y}
                  x2={W}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.06"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={W - 2}
                  y={y - 4}
                  fill="currentColor"
                  textAnchor="end"
                  className="text-muted dark:text-muted-dark"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  opacity="0.62"
                >
                  {formatCount(Math.round(value))}
                </text>
              </g>
            );
          })}

          {eras.map((era, index) =>
            era.unknown ? null : (
              <path
                key={`private-era-fill-${index}`}
                d={areaPath}
                fill={`url(#${fillId}-${index})`}
                clipPath={`url(#${fillId}-clip-${index})`}
              />
            ),
          )}
          {eras.map((era, index) => {
            if (index === 0) return null;
            const x = (era.startPct / 100) * W;
            return (
              <line
                key={`private-era-divider-${index}`}
                x1={x}
                y1={PAD_TOP}
                x2={x}
                y2={H - PAD_BOT}
                stroke={era.color}
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.35"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {eras.map((era, index) => (
            <path
              key={`private-era-line-${index}`}
              d={linePath}
              fill="none"
              stroke={era.color}
              strokeWidth="2.5"
              strokeDasharray={era.unknown ? '4 4' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={era.unknown ? 0.55 : 1}
              clipPath={`url(#${fillId}-clip-${index})`}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div className="text-muted dark:text-muted-dark mt-2 flex justify-between text-[10px] tabular-nums sm:hidden">
          {mobileYearMarkers.map(marker => (
            <span key={marker.label}>{marker.label}</span>
          ))}
        </div>
        <div className="text-muted dark:text-muted-dark relative mt-2 hidden h-4 text-[10px] tabular-nums sm:block">
          {yearMarkers.map(marker => (
            <span key={marker.label} className="absolute -translate-x-1/2" style={{ left: `${marker.x}%` }}>
              {marker.label}
            </span>
          ))}
        </div>
        {agentBars.length > 0 ? (
          <div
            className="text-muted/65 dark:text-muted-dark/65 relative mt-0.5 hidden h-4 font-mono text-[9px] tabular-nums sm:block"
            aria-label="Agent-attributed percent by sampled year"
          >
            {agentBars.map(bar => (
              <span
                key={`private-agent-year-${bar.year}`}
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${((bar.x + bar.width / 2) / W) * 100}%` }}
              >
                {bar.percent}%
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
          <p className="text-muted dark:text-muted-dark text-[10px] font-medium tracking-wide uppercase">
            Public + private-visible contributions
          </p>
          <p className="text-ink dark:text-paper mt-1 text-2xl leading-none font-semibold tracking-tight tabular-nums">
            {formatCount(totalCommits)}
          </p>
        </div>
      </div>
    </section>
  );
}

function expandPrivateMonths(history: PrivateHistoryResult): MonthBucket[] {
  const [startYear, startMonth] = history.startMonth.split('-').map(Number);
  return history.monthlyCounts.map((count, index) => {
    const zeroBased = startMonth - 1 + index;
    const year = startYear + Math.floor(zeroBased / 12);
    const month = (zeroBased % 12) + 1;
    return { count, month: `${year}-${String(month).padStart(2, '0')}` };
  });
}

function buildPrivateEras(months: MonthBucket[], history: PrivateHistoryResult, pointCount: number): Era[] {
  const firstIdxByYear = new Map<number, number>();
  const commitsByYear = new Map<number, number>();
  months.forEach((month, index) => {
    const year = Number(month.month.slice(0, 4));
    if (!firstIdxByYear.has(year)) firstIdxByYear.set(year, index);
    commitsByYear.set(year, (commitsByYear.get(year) ?? 0) + month.count);
  });
  const archetypeByYear = new Map(history.archetypes.map(([year, archetypeId]) => [year, archetypeId]));
  const failedYearSet = new Set(history.failedYears);
  const pct = (idx: number) => (idx / Math.max(1, pointCount - 1)) * 100;

  const eras: Era[] = [];
  let lastColor = QUIET_THEME.accent;
  for (const [year, idx] of Array.from(firstIdxByYear.entries()).sort((a, b) => a[0] - b[0])) {
    if ((commitsByYear.get(year) ?? 0) <= 0) continue;
    const archetypeId = archetypeByYear.get(year);
    const unknown = failedYearSet.has(year) || !archetypeByYear.has(year);
    const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;
    const color = unknown ? '#94a3b8' : (archetype?.theme.accent ?? QUIET_THEME.accent);
    const label = unknown ? null : (archetype?.name ?? 'No signal');
    if (!unknown) lastColor = color;
    const startPct = eras.length === 0 ? 0 : pct(idx);
    const endPct = 100;
    const prev = eras[eras.length - 1];
    if (prev && prev.unknown === unknown && prev.color === (unknown ? '#94a3b8' : color) && prev.label === label) {
      prev.endPct = endPct;
      prev.yearLabel = `${prev.yearLabel.split('-')[0]}-${year}`;
      continue;
    }
    eras.push({
      color: unknown ? '#94a3b8' : lastColor,
      endPct,
      label,
      startPct,
      unknown,
      yearLabel: String(year),
    });
  }

  for (let i = 0; i < eras.length - 1; i++) {
    eras[i].endPct = eras[i + 1].startPct;
  }

  return eras.length > 0
    ? eras
    : [{ color: QUIET_THEME.accent, endPct: 100, label: null, startPct: 0, unknown: true, yearLabel: '' }];
}

function buildPrivateAgentCommitBars(
  months: MonthBucket[],
  history: PrivateHistoryResult,
  points: Array<{ x: number; y: number }>,
): Array<{ height: number; percent: number; width: number; x: number; y: number; year: number }> {
  if (months.length < 2) return [];

  const percentByYear = new Map(
    history.archetypes.map(([year, , commits, percent]) => [year, commits > 0 ? clampPercent(percent) : 0]),
  );
  if (percentByYear.size === 0) return [];

  const spans = new Map<number, { first: number; last: number }>();
  months.forEach((month, index) => {
    const year = Number(month.month.slice(0, 4));
    const existing = spans.get(year);
    if (existing) {
      existing.last = index;
    } else {
      spans.set(year, { first: index, last: index });
    }
  });

  const maxBarHeight = 28;
  const barWidth = 2.5;
  const bars: Array<{ height: number; percent: number; width: number; x: number; y: number; year: number }> = [];

  for (const [year, span] of Array.from(spans.entries()).sort((a, b) => a[0] - b[0])) {
    const percent = percentByYear.get(year);
    if (percent == null || percent <= 0) continue;
    const midpoint = Math.round((span.first + span.last) / 2);
    const baseline = points[midpoint]?.y ?? PAD_TOP;
    const requestedHeight = Math.max(2, (percent / 100) * maxBarHeight);
    const y = Math.max(PAD_TOP, baseline - requestedHeight);
    const x = (midpoint / (months.length - 1)) * W;
    bars.push({
      height: baseline - y,
      percent,
      width: barWidth,
      x: x - barWidth / 2,
      y,
      year,
    });
  }

  return bars;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeYearMarkers(months: MonthBucket[]) {
  const seen = new Map<number, number>();
  months.forEach((month, index) => {
    const year = Number(month.month.slice(0, 4));
    if (!seen.has(year)) seen.set(year, index);
  });
  const entries = Array.from(seen.entries());
  const step = Math.max(1, Math.ceil(entries.length / 6));
  return entries
    .filter((_, index) => index % step === 0 || index === entries.length - 1)
    .map(([year, index]) => ({
      label: String(year),
      x: (index / Math.max(1, months.length - 1)) * 100,
    }));
}

function smooth(values: number[], radius: number): number[] {
  return values.map((_, index) => {
    let sum = 0;
    let n = 0;
    for (let i = Math.max(0, index - radius); i <= Math.min(values.length - 1, index + radius); i++) {
      sum += values[i];
      n++;
    }
    return sum / n;
  });
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
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

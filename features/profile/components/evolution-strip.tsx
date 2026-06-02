import { notFound } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { DownloadTimeline } from '@/features/profile/components/download-timeline';
import { RegenerateHistoryButton } from '@/features/profile/components/regenerate-history-button';
import { getTimelineChart, isGitHubNotFoundError } from '@/features/profile/profile-queries';
import { formatCount } from '@/lib/format';
import { cacheLife, cacheTag } from 'next/cache';

type Props = {
  handle: string;
};

const W = 1000;
const H = 200;
const PAD_TOP = 12;
const PAD_BOT = 4;

export async function EvolutionStrip({ handle }: Props) {
  return CachedEvolutionStrip({ handle });
}

async function CachedEvolutionStrip({ handle }: Props) {
  'use cache: remote';
  cacheTag(`history-${handle}`);
  cacheTag(`cronotype-${handle}-90d`);
  cacheLife('cronotype');

  let chart;
  try {
    chart = await getTimelineChart(handle, {
      height: H,
      padBottom: PAD_BOT,
      padTop: PAD_TOP,
      width: W,
    });
  } catch (err) {
    if (isGitHubNotFoundError(err)) notFound();
    throw err;
  }

  const {
    archetype,
    areaPath,
    eras,
    failedArchetypeYears,
    failedMonthlyYears,
    hasData,
    linePath,
    months,
    partial,
    totalCommits,
    yTicks,
    yearMarkers,
  } = chart;

  if (!hasData) {
    return (
      <>
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
          {partial && (
            <span className="text-muted/70 dark:text-muted-dark/70 text-[10.5px] tracking-wide uppercase">
              Partial · GitHub rate limit
            </span>
          )}
        </header>
        <div className="text-muted dark:text-muted-dark dark:bg-ink-2 flex h-40 items-center justify-center rounded-xl border border-black/10 bg-white text-center text-sm dark:border-white/10">
          {partial ? 'Couldn\u2019t load the timeline right now.' : 'Not enough commit history yet.'}
        </div>
      </>
    );
  }

  const hasUnknown = eras.some(e => e.unknown);
  const fillId = `evolution-fill-${archetype.id}`;
  const mobileYearMarkers =
    yearMarkers.length > 1 ? [yearMarkers[0], yearMarkers[yearMarkers.length - 1]] : yearMarkers;

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
        <div className="flex items-center gap-2">
          {partial && (
            <span className="text-muted/70 dark:text-muted-dark/70 text-[10.5px] tracking-wide uppercase">
              Partial · GitHub rate limit
            </span>
          )}
          <RegenerateHistoryButton
            failedArchetypeYears={failedArchetypeYears}
            failedMonthlyYears={failedMonthlyYears}
            handle={handle}
            partial={partial}
          />
          <DownloadTimeline handle={handle} />
        </div>
      </header>
      <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-4 sm:p-8 dark:border-white/10">
        <ul className="mb-4 flex flex-wrap gap-x-3 gap-y-1.5 sm:gap-x-4">
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
          {hasUnknown &&
            eras
              .filter(e => e.unknown)
              .map((e, i) => (
                <li
                  key={`legend-missing-${i}`}
                  className="text-muted dark:text-muted-dark flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span
                    className="inline-block h-px w-4 align-middle"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(to right, currentColor 0 4px, transparent 4px 8px)',
                    }}
                  />
                  <span className="text-[11px] font-semibold tracking-tight">Missing data</span>
                  <span className="text-[10.5px] tabular-nums">{e.yearLabel}</span>
                </li>
              ))}
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

            {yTicks.map(tick => (
              <g key={tick.value}>
                <line
                  x1={0}
                  y1={tick.y}
                  x2={W}
                  y2={tick.y}
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.06"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={W - 2}
                  y={tick.y - 4}
                  fill="currentColor"
                  textAnchor="end"
                  className="text-muted dark:text-muted-dark"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  opacity="0.62"
                >
                  {formatCount(tick.value)}
                </text>
              </g>
            ))}

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

        <div className="text-muted dark:text-muted-dark mt-2 flex justify-between text-[10px] tabular-nums sm:hidden">
          {mobileYearMarkers.map(yr => (
            <span key={yr.label}>{yr.label}</span>
          ))}
        </div>
        <div className="text-muted dark:text-muted-dark relative mt-2 hidden h-4 text-[10px] tabular-nums sm:block">
          {yearMarkers.map(yr => (
            <span key={yr.label} className="absolute -translate-x-1/2" style={{ left: `${(yr.x / W) * 100}%` }}>
              {yr.label}
            </span>
          ))}
        </div>

        <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
          <p className="text-muted dark:text-muted-dark text-[10px] font-medium tracking-wide uppercase">
            Total contributions
          </p>
          <p className="text-ink dark:text-paper mt-1 text-2xl leading-none font-semibold tracking-tight tabular-nums">
            {formatCount(totalCommits)}
          </p>
        </div>
      </div>
    </>
  );
}

export function EvolutionStripSkeleton() {
  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
        <div className="flex items-center gap-2">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-5 w-24 rounded-md" />
        </div>
      </header>
      <div
        className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-4 sm:p-8 dark:border-white/10"
        aria-hidden
      >
        <ul className="mb-4 flex flex-wrap gap-x-3 gap-y-1.5 sm:gap-x-4">
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

        <div className="relative h-32 sm:h-40">
          <div className="text-muted/60 dark:text-muted-dark/60 absolute inset-0 flex flex-col items-center justify-center gap-2">
            <LoaderCircle className="text-muted/40 dark:text-muted-dark/40 h-5 w-5 animate-spin" aria-hidden />
            <span className="text-[11px] font-medium tracking-wide uppercase">Loading, crunching your history</span>
          </div>
        </div>

        <div className="text-muted/60 dark:text-muted-dark/60 mt-2 flex justify-between text-[10px] tabular-nums">
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
        </div>
      </div>
    </>
  );
}

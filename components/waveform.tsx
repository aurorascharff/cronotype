import clsx from 'clsx';
import type { HourStats } from '@/types/cronotype';

type Props = {
  stats: HourStats;
  /** Tailwind text-color class for the bars and their glow. */
  colorClass?: string;
  /** Whether to render the hour labels underneath. */
  showLabels?: boolean;
  /** Optional rise animation on mount. */
  animate?: boolean;
  /** Whether to subtly tint the night bars darker. */
  shaded?: boolean;
};

/**
 * The Cronotype waveform — a 24-bar linear chart, one bar per hour of the
 * local day, with a midnight/noon tick rail underneath. This is the chart
 * that gets screenshotted.
 */
export function Waveform({
  stats,
  colorClass = 'text-vampire',
  showLabels = true,
  animate = false,
  shaded = true,
}: Props) {
  const max = Math.max(1, ...stats.hourly);

  return (
    <div className={clsx('relative w-full', colorClass)}>
      <div className="flex h-32 items-end gap-[3px] sm:h-40">
        {stats.hourly.map((count, h) => {
          const heightPct = (count / max) * 100;
          const isNight = shaded && (h < 5 || h >= 22);
          return (
            <div
              key={h}
              className={clsx(
                'group relative flex-1',
                animate && 'bar-rise',
              )}
              style={animate ? { animationDelay: `${h * 18}ms` } : undefined}
            >
              {/* shadow ghost behind bar for depth */}
              <div
                className="absolute right-0 bottom-0 left-0 rounded-t-sm bg-current opacity-10"
                style={{ height: `${Math.max(2, heightPct)}%` }}
                aria-hidden
              />
              {/* the bar */}
              <div
                className={clsx(
                  'absolute right-0 bottom-0 left-0 rounded-t-sm bg-current',
                  isNight ? 'opacity-90' : 'opacity-70',
                )}
                style={{ height: `${Math.max(2, heightPct)}%` }}
                aria-label={`${count} commits at ${formatHour(h)}`}
              />
              {/* hover glow */}
              <div
                className="pointer-events-none absolute right-0 bottom-0 left-0 rounded-t-sm bg-current opacity-0 blur-md transition-opacity group-hover:opacity-50"
                style={{ height: `${Math.max(2, heightPct)}%` }}
                aria-hidden
              />
              {/* tooltip-ish count above */}
              <div className="text-muted dark:text-muted-dark pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                {count} · {formatHour(h)}
              </div>
            </div>
          );
        })}
      </div>

      {showLabels && (
        <div className="text-muted dark:text-muted-dark tick-fade relative mt-2 grid grid-cols-4 text-xs tabular-nums">
          <span className="text-left">12a</span>
          <span className="text-center">6a</span>
          <span className="text-center">12p</span>
          <span className="text-right">6p</span>
        </div>
      )}
    </div>
  );
}

export function WaveformSkeleton() {
  return (
    <div className="w-full">
      <div className="flex h-32 items-end gap-[3px] sm:h-40">
        {Array.from({ length: 24 }).map((_, i) => {
          const h = 18 + ((i * 11) % 60);
          return <div key={i} className="skeleton flex-1 rounded-t-sm text-current" style={{ height: `${h}%` }} />;
        })}
      </div>
      <div className="mt-2 h-3" />
    </div>
  );
}

function formatHour(h: number) {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

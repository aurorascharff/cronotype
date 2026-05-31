import clsx from 'clsx';
import type { HourStats } from '@/types/cronotype';

type Props = {
  stats: HourStats;
  colorClass?: string;
  size?: number;
};

/**
 * A tiny radial (polar) version of the waveform. Used as a chip in the
 * history strip and leaderboards. The 12 o'clock position is midnight.
 */
export function RadialChip({ stats, colorClass = 'text-vampire', size = 64 }: Props) {
  const max = Math.max(1, ...stats.hourly);
  const cx = size / 2;
  const cy = size / 2;
  const inner = size * 0.22;
  const outer = size * 0.48;

  const spokes = stats.hourly.map((count, h) => {
    const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
    const len = inner + ((count / max) * (outer - inner));
    return {
      h,
      x1: cx + Math.cos(angle) * inner,
      x2: cx + Math.cos(angle) * len,
      y1: cy + Math.sin(angle) * inner,
      y2: cy + Math.sin(angle) * len,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={clsx('overflow-visible', colorClass)}
      role="img"
      aria-label={`Cronotype chart, peak at ${stats.peakHour}:00, ${stats.total} commits`}
    >
      {/* inner ring guide */}
      <circle cx={cx} cy={cy} r={inner} className="fill-none stroke-current opacity-15" strokeWidth={1} />
      {spokes.map(s => (
        <line
          key={s.h}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={Math.max(1.4, size * 0.024)}
          opacity={0.85}
        />
      ))}
    </svg>
  );
}

import type { HourStats } from '@/types/cronotype';

type Props = {
  stats: HourStats;
  /** Hex color for the spokes. */
  color: string;
  size?: number;
};

/** A tiny polar version of the halo chart. Used in lists and evolution strips. */
export function RadialChip({ stats, color, size = 64 }: Props) {
  const max = Math.max(1, ...stats.hourly);
  const cx = size / 2;
  const cy = size / 2;
  const inner = size * 0.22;
  const outer = size * 0.48;

  const spokes = stats.hourly.map((count, h) => {
    const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
    const len = inner + (count / max) * (outer - inner);
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
      className="overflow-visible"
      role="img"
      aria-label={`${stats.total} commits, peak at hour ${stats.peakHour}`}
    >
      <circle cx={cx} cy={cy} r={inner - 1} fill={color} opacity={0.1} />
      {spokes.map(s => (
        <line
          key={s.h}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={color}
          strokeLinecap="round"
          strokeWidth={Math.max(1.4, size * 0.028)}
          opacity={0.85}
        />
      ))}
    </svg>
  );
}

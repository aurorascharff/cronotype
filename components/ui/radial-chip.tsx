import type { HourStats } from '@/types/cronotype';

type Props = {
  stats: HourStats;
  color: string;
  size?: number;
};

export function RadialChip({ stats, color, size = 64 }: Props) {
  const max = Math.max(1, ...stats.hourly);
  const cx = size / 2;
  const cy = size / 2;
  const inner = size * 0.22;
  const outer = size * 0.48;
  const barWidth = Math.max(1.2, size * 0.032);

  const bars = stats.hourly.map((count, h) => ({
    angle: (h / 24) * 360,
    h,
    len: Math.max(1.5, (count / max) * (outer - inner)),
  }));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
      role="img"
      aria-label={`${stats.total} signal commits, peak at hour ${stats.peakHour}`}
    >
      <circle cx={cx} cy={cy} r={inner - 0.5} fill="none" stroke={color} opacity={0.18} strokeWidth={1} />
      {bars.map(b => (
        <rect
          key={b.h}
          x={cx - barWidth / 2}
          y={cy - inner - b.len}
          width={barWidth}
          height={b.len}
          fill={color}
          opacity={0.9}
          transform={`rotate(${b.angle}, ${cx}, ${cy})`}
        />
      ))}
    </svg>
  );
}

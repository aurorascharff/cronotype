import { useId } from 'react';
import type { ArchetypeTheme, HourStats } from '@/types/cronotype';

type Props = {
  stats: HourStats;
  theme: ArchetypeTheme;
  avatarUrl: string;
  size?: number;
};

export function HaloChart({ stats, theme, avatarUrl, size = 320 }: Props) {
  const clipId = `halo-clip-${useId().replaceAll(':', '')}`;
  const max = Math.max(1, ...stats.hourly);
  const cx = size / 2;
  const cy = size / 2;

  const avatarR = size * 0.23;
  const gap = size * 0.04;
  const inner = avatarR + gap;
  const outer = size * 0.45;
  const barWidth = Math.max(3, size * 0.018);

  const bars = stats.hourly.map((count, h) => {
    const len = (count / max) * (outer - inner);
    return {
      angle: (h / 24) * 360,
      h,
      len: Math.max(2, len),
    };
  });

  const ticks = [
    { anchor: 'middle' as const, label: '12am', x: cx, y: cy - outer - 16 },
    { anchor: 'start' as const, label: '6am', x: cx + outer + 14, y: cy + 5 },
    { anchor: 'middle' as const, label: '12pm', x: cx, y: cy + outer + 22 },
    { anchor: 'end' as const, label: '6pm', x: cx - outer - 14, y: cy + 5 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="h-full w-full overflow-visible"
      role="img"
      aria-label={`Halo chart, ${stats.total} signal commits, peak at hour ${stats.peakHour}`}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={avatarR} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={inner - 1} fill="none" stroke={theme.accent} opacity={0.24} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={outer + 1} fill="none" stroke={theme.accent} opacity={0.14} strokeWidth={1} />

      {[0, 6, 12, 18].map(q => {
        const a = (q / 24) * 360;
        return (
          <line
            key={`q-${q}`}
            x1={cx}
            y1={cy - outer - 6}
            x2={cx}
            y2={cy - outer + 2}
            stroke={theme.accent}
            opacity={0.5}
            strokeWidth={1}
            transform={`rotate(${a}, ${cx}, ${cy})`}
          />
        );
      })}

      {bars.map(b => (
        <rect
          key={b.h}
          x={cx - barWidth / 2}
          y={cy - inner - b.len}
          width={barWidth}
          height={b.len}
          fill={theme.accent}
          opacity={0.95}
          transform={`rotate(${b.angle}, ${cx}, ${cy})`}
        />
      ))}

      <g>
        <circle cx={cx} cy={cy} r={avatarR + 2} fill={theme.accent} opacity={0.15} />
        <image
          href={avatarUrl}
          x={cx - avatarR}
          y={cy - avatarR}
          width={avatarR * 2}
          height={avatarR * 2}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
        <circle cx={cx} cy={cy} r={avatarR} fill="none" stroke={theme.accent} strokeWidth={1.5} opacity={0.5} />
      </g>

      {ticks.map(t => (
        <text
          key={t.label}
          x={t.x}
          y={t.y}
          textAnchor={t.anchor}
          style={{
            fill: theme.accent,
            fontFamily: 'var(--font-mono)',
            fontSize: size * 0.05,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {t.label}
        </text>
      ))}
    </svg>
  );
}

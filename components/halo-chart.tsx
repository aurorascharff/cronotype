import type { ArchetypeTheme, HourStats } from '@/types/cronotype';

type Props = {
  stats: HourStats;
  theme: ArchetypeTheme;
  avatarUrl: string;
  size?: number;
};

/**
 * The HaloChart — avatar in the middle, 24 square-capped bars ringing it like
 * an Apple Watch activity ring. Midnight is at 12 o'clock. Reads as data, not
 * decoration.
 *
 * Each hour bar is a rectangle drawn upright at the top, then rotated around
 * the center by (h / 24) * 360° using SVG's `transform="rotate(angle, cx, cy)"`
 * attribute. CSS `transform-origin` must NOT be set on these — it conflicts
 * with the attribute-based rotation and scatters the bars.
 */
export function HaloChart({ stats, theme, avatarUrl, size = 320 }: Props) {
  const max = Math.max(1, ...stats.hourly);
  const cx = size / 2;
  const cy = size / 2;

  const avatarR = size * 0.22;
  const gap = size * 0.04;
  const inner = avatarR + gap;
  const outer = size * 0.46;
  const barWidth = Math.max(3, size * 0.018);

  // Draw bars from `inner` outward, rotated around the center.
  const bars = stats.hourly.map((count, h) => {
    const len = (count / max) * (outer - inner);
    const isNight = h < 5 || h >= 22;
    return {
      angle: (h / 24) * 360,
      h,
      isNight,
      len: Math.max(2, len),
    };
  });

  const ticks = [
    { anchor: 'middle' as const, label: '12am', x: cx, y: cy - outer - 16 },
    { anchor: 'start' as const, label: '6am', x: cx + outer + 14, y: cy + 5 },
    { anchor: 'middle' as const, label: '12pm', x: cx, y: cy + outer + 22 },
    { anchor: 'end' as const, label: '6pm', x: cx - outer - 14, y: cy + 5 },
  ];

  const gradId = `halo-grad-${theme.accent.replace('#', '')}`;
  const clipId = `halo-clip-${theme.accent.replace('#', '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
      role="img"
      aria-label={`Halo chart, ${stats.total} commits, peak at hour ${stats.peakHour}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.accent2} />
          <stop offset="100%" stopColor={theme.accent} />
        </linearGradient>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={avatarR} />
        </clipPath>
      </defs>

      {/* Inner + outer guide rings — drawn as hairlines to anchor the bars. */}
      <circle cx={cx} cy={cy} r={inner - 1} fill="none" stroke={theme.accent} opacity={0.15} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={outer + 1} fill="none" stroke={theme.accent} opacity={0.08} strokeWidth={1} />

      {/* Quarter-hour cardinal marks: a longer hairline at 00, 06, 12, 18. */}
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
            opacity={0.35}
            strokeWidth={1}
            transform={`rotate(${a}, ${cx}, ${cy})`}
          />
        );
      })}

      {/* The 24 data bars. */}
      {bars.map(b => (
        <rect
          key={b.h}
          x={cx - barWidth / 2}
          y={cy - inner - b.len}
          width={barWidth}
          height={b.len}
          fill={`url(#${gradId})`}
          opacity={b.isNight ? 1 : 0.7}
          transform={`rotate(${b.angle}, ${cx}, ${cy})`}
        />
      ))}

      {/* Avatar — circle frame, then the image clipped to a circle. */}
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

      {/* 24-hour cardinal labels. */}
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

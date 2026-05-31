import type { ArchetypeTheme, HourStats } from '@/types/cronotype';

type Props = {
  stats: HourStats;
  theme: ArchetypeTheme;
  avatarUrl: string;
  size?: number;
  animate?: boolean;
};

/**
 * The HaloChart — avatar in the middle, 24 hour-spokes ringing it like a
 * clock face. Midnight at 12 o'clock. The avatar is sized so spokes form a
 * clear ring around it, with a visible gap between the avatar edge and the
 * spoke start.
 */
export function HaloChart({ stats, theme, avatarUrl, size = 320, animate = true }: Props) {
  const max = Math.max(1, ...stats.hourly);
  const cx = size / 2;
  const cy = size / 2;

  // Geometry:
  //  - avatarR: the avatar's radius
  //  - gap: visible space between the avatar edge and the spoke origin
  //  - inner / outer: spoke start/end radii
  const avatarR = size * 0.22;
  const gap = size * 0.04;
  const inner = avatarR + gap;
  const outer = size * 0.46;

  const spokes = stats.hourly.map((count, h) => {
    const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
    const len = inner + (count / max) * (outer - inner);
    const isNight = h < 5 || h >= 22;
    return {
      h,
      isNight,
      x1: cx + Math.cos(angle) * inner,
      x2: cx + Math.cos(angle) * len,
      y1: cy + Math.sin(angle) * inner,
      y2: cy + Math.sin(angle) * len,
    };
  });

  const ticks = [
    { anchor: 'middle' as const, label: '12a', x: cx, y: cy - outer - 14 },
    { anchor: 'start' as const, label: '6a', x: cx + outer + 12, y: cy + 4 },
    { anchor: 'middle' as const, label: '12p', x: cx, y: cy + outer + 20 },
    { anchor: 'end' as const, label: '6p', x: cx - outer - 12, y: cy + 4 },
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
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.accent2} />
          <stop offset="100%" stopColor={theme.accent} />
        </linearGradient>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={avatarR} />
        </clipPath>
      </defs>

      {/* outer glow */}
      <circle cx={cx} cy={cy} r={outer + 6} fill={theme.accent} opacity={0.08} />

      {/* faint guide ring just outside the avatar */}
      <circle cx={cx} cy={cy} r={inner - 1} fill="none" stroke={theme.accent} opacity={0.2} strokeWidth={1} />

      {/* spokes */}
      {spokes.map(s => (
        <line
          key={s.h}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={`url(#${gradId})`}
          strokeLinecap="round"
          strokeWidth={Math.max(3, size * 0.014)}
          opacity={s.isNight ? 0.95 : 0.75}
          className={animate ? 'spoke' : undefined}
          style={animate ? { animationDelay: `${s.h * 26}ms` } : undefined}
        />
      ))}

      {/* avatar */}
      <g>
        <circle cx={cx} cy={cy} r={avatarR + 2} fill={theme.accent} opacity={0.2} />
        <image
          href={avatarUrl}
          x={cx - avatarR}
          y={cy - avatarR}
          width={avatarR * 2}
          height={avatarR * 2}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
        <circle cx={cx} cy={cy} r={avatarR} fill="none" stroke={theme.accent} strokeWidth={1.5} opacity={0.6} />
      </g>

      {/* cardinal labels */}
      {ticks.map(t => (
        <text
          key={t.label}
          x={t.x}
          y={t.y}
          textAnchor={t.anchor}
          style={{ fill: theme.accent, fontSize: size * 0.038, fontWeight: 600, letterSpacing: '0.05em' }}
        >
          {t.label}
        </text>
      ))}
    </svg>
  );
}

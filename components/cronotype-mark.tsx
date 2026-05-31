type Props = {
  size?: number;
  /** Hex color override; defaults to the brand cyan. */
  color?: string;
};

/**
 * The Cronotype mark. A 24-tick ring with a few longer bars at the typical
 * commit hours. Mirrors the halo chart in miniature so the brand and the
 * data viz are the same shape.
 */
export function CronotypeMark({ size = 20, color = '#06b6d4' }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const inner = size * 0.28;
  const outer = size * 0.46;
  const barWidth = Math.max(1, size * 0.07);

  // Hand-tuned hour heights for a "real-looking" silhouette in the logo —
  // a peaked weekday distribution so the mark itself reads as a chart.
  const heights = [
    0.15, 0.1, 0.08, 0.06, 0.05, 0.1, 0.25, 0.45, 0.7, 0.9, 1, 0.95, 0.7, 0.85, 0.95, 0.9, 0.75, 0.55, 0.35, 0.25,
    0.2, 0.18, 0.16, 0.15,
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden role="img">
      <circle cx={cx} cy={cy} r={inner - 0.5} fill="none" stroke={color} opacity={0.3} strokeWidth={0.5} />
      {heights.map((p, h) => {
        const len = Math.max(0.8, p * (outer - inner));
        const angle = (h / 24) * 360;
        return (
          <rect
            key={h}
            x={cx - barWidth / 2}
            y={cy - inner - len}
            width={barWidth}
            height={len}
            fill={color}
            transform={`rotate(${angle}, ${cx}, ${cy})`}
          />
        );
      })}
    </svg>
  );
}

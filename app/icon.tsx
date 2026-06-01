import { ImageResponse } from 'next/og';

export const size = { height: 32, width: 32 };
export const contentType = 'image/png';

const CYAN = '#06b6d4';
const HEIGHTS = [
  0.15, 0.1, 0.08, 0.06, 0.05, 0.1, 0.25, 0.45, 0.7, 0.9, 1, 0.95, 0.7, 0.85, 0.95, 0.9, 0.75, 0.55, 0.35, 0.25,
  0.2, 0.18, 0.16, 0.15,
];

export default function Icon() {
  const cx = size.width / 2;
  const cy = size.height / 2;
  const inner = size.width * 0.28;
  const outer = size.width * 0.46;
  const barWidth = Math.max(1, size.width * 0.07);

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'transparent',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          position: 'relative',
          width: '100%',
        }}
      >
        {HEIGHTS.map((p, h) => {
          const len = Math.max(0.8, p * (outer - inner));
          const angle = (h / 24) * 360;
          return (
            <div
              key={h}
              style={{
                background: CYAN,
                height: len,
                left: cx - barWidth / 2,
                position: 'absolute',
                top: cy - inner - len,
                transform: `rotate(${angle}deg)`,
                transformOrigin: `${barWidth / 2}px ${inner + len}px`,
                width: barWidth,
              }}
            />
          );
        })}
      </div>
    ),
    { ...size },
  );
}

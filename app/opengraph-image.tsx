import { ImageResponse } from 'next/og';

export const alt = 'Cronotype';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

const COLORS = {
  cyan: '#06b6d4',
  ink2: '#111216',
  muted: '#8b8d96',
  mutedDivider: 'rgba(139, 141, 150, 0.25)',
  paper: '#fafafa',
  paper80: 'rgba(250, 250, 250, 0.8)',
  white20: 'rgba(255, 255, 255, 0.2)',
};

const AURA = [
  0.14, 0.18, 0.24, 0.3, 0.4, 0.54, 0.68, 0.58, 0.44, 0.34, 0.24, 0.18, 0.2, 0.28, 0.48, 0.72, 0.9, 1, 0.78, 0.56, 0.4,
  0.28, 0.2, 0.16,
];

const CLOCK_LABELS = [
  { label: '12am', x: 190, y: 0, width: 120 },
  { label: '6am', x: 356, y: 176, width: 120 },
  { label: '12pm', x: 190, y: 348, width: 120 },
  { label: '6pm', x: 4, y: 176, width: 120 },
];

async function loadGeist() {
  try {
    const [sansRegular, sansSemibold, monoRegular, monoSemibold] = await Promise.all([
      loadFont('Geist-Regular.ttf'),
      loadFont('Geist-SemiBold.ttf'),
      loadFont('GeistMono-Regular.ttf'),
      loadFont('GeistMono-SemiBold.ttf'),
    ]);
    return [
      { data: sansRegular, name: 'GeistSans', style: 'normal' as const, weight: 400 as const },
      { data: sansSemibold, name: 'GeistSans', style: 'normal' as const, weight: 600 as const },
      { data: monoRegular, name: 'GeistMono', style: 'normal' as const, weight: 400 as const },
      { data: monoSemibold, name: 'GeistMono', style: 'normal' as const, weight: 600 as const },
    ];
  } catch {
    return undefined;
  }
}

async function loadFont(name: string) {
  const res = await fetch(new URL(`../public/fonts/${name}`, import.meta.url));
  if (!res.ok) throw new Error(`Failed to load ${name}`);
  return res.arrayBuffer();
}

function AuraRings() {
  const size = 380;
  const cx = size / 2;
  const inner = 78;
  const outer = 174;
  const barWidth = 7;

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        height: size,
        justifyContent: 'center',
        position: 'relative',
        width: size,
      }}
    >
      {[outer + 1, inner - 1].map((radius, index) => (
        <div
          key={radius}
          style={{
            border: `1px solid ${COLORS.cyan}`,
            borderRadius: '50%',
            display: 'flex',
            height: radius * 2,
            left: cx - radius,
            opacity: index === 0 ? 0.12 : 0.2,
            position: 'absolute',
            top: cx - radius,
            width: radius * 2,
          }}
        />
      ))}

      {AURA.map((height, hour) => {
        const len = 4 + height * (outer - inner);
        const angle = (hour / AURA.length) * 360;
        return (
          <div
            key={hour}
            style={{
              background: height > 0.46 ? COLORS.cyan : COLORS.muted,
              borderRadius: 1,
              display: 'flex',
              height: len,
              left: cx - barWidth / 2,
              opacity: height > 0.46 ? 0.9 : 0.42,
              position: 'absolute',
              top: cx - inner - len,
              transform: `rotate(${angle}deg)`,
              transformOrigin: `${barWidth / 2}px ${inner + len}px`,
              width: barWidth,
            }}
          />
        );
      })}

      {CLOCK_LABELS.map(item => (
        <div
          key={item.label}
          style={{
            color: COLORS.cyan,
            display: 'flex',
            fontFamily: 'GeistMono, monospace',
            fontSize: 21,
            fontWeight: 600,
            left: item.x,
            letterSpacing: '0.02em',
            opacity: 0.9,
            position: 'absolute',
            top: item.y,
            width: item.width,
          }}
        >
          {item.label}
        </div>
      ))}

      {[0, 6, 12, 18].map(hour => {
        const angle = (hour / 24) * 360;
        return (
          <div
            key={hour}
            style={{
              background: COLORS.paper,
              display: 'flex',
              height: 14,
              left: cx - 1,
              opacity: 0.28,
              position: 'absolute',
              top: cx - outer - 26,
              transform: `rotate(${angle}deg)`,
              transformOrigin: `1px ${outer + 26}px`,
              width: 2,
            }}
          />
        );
      })}

      <div
        style={{
          alignItems: 'center',
          border: `1px solid ${COLORS.cyan}`,
          borderRadius: '50%',
          display: 'flex',
          height: 116,
          justifyContent: 'center',
          opacity: 0.2,
          position: 'absolute',
          width: 116,
        }}
      />
      <div
        style={{
          border: `2px dashed ${COLORS.muted}`,
          borderRadius: '50%',
          display: 'flex',
          height: 94,
          opacity: 0.6,
          position: 'absolute',
          width: 94,
        }}
      />
      <div
        style={{
          alignItems: 'center',
          color: COLORS.muted,
          display: 'flex',
          fontFamily: 'GeistMono, monospace',
          fontSize: 42,
          fontWeight: 600,
          height: 82,
          justifyContent: 'center',
          opacity: 0.75,
          position: 'absolute',
          width: 82,
        }}
      >
        ?
      </div>
    </div>
  );
}

export default async function OpenGraphImage() {
  const fonts = await loadGeist();

  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: COLORS.ink2,
        color: COLORS.paper,
        display: 'flex',
        fontFamily: 'GeistSans, sans-serif',
        gap: 56,
        height: '100%',
        overflow: 'hidden',
        padding: 64,
        position: 'relative',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', flexShrink: 0 }}>
        <AuraRings />
      </div>

      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div style={{ alignItems: 'baseline', color: COLORS.muted, display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 24 }}>@github-handle</span>
          <span style={{ color: COLORS.mutedDivider, fontSize: 28 }}>·</span>
          <span style={{ fontSize: 20 }}>?</span>
        </div>
        <h1
          style={{
            color: COLORS.paper,
            display: 'flex',
            fontSize: 72,
            fontWeight: 600,
            letterSpacing: 0,
            lineHeight: 1,
            maxWidth: 600,
          }}
        >
          What type of developer are you?
        </h1>
        <p
          style={{
            color: COLORS.muted,
            display: 'flex',
            fontSize: 29,
            lineHeight: 1.34,
            marginTop: 6,
            maxWidth: 590,
          }}
        >
          Type a GitHub handle and reveal a commit-time archetype, shareable card, and history chart.
        </p>
        <div style={{ display: 'flex', gap: 40, marginTop: 24 }}>
          <Stat label="PEAK" value="-" />
          <Stat label="NOCTURNAL" value="-" />
          <Stat label="SIGNAL" value="-" />
          <Stat label="TYPE" value="?" accent={COLORS.cyan} />
        </div>
      </div>

      <div
        style={{
          color: COLORS.muted,
          display: 'flex',
          fontSize: 24,
          fontWeight: 600,
          left: 64,
          letterSpacing: '-0.01em',
          position: 'absolute',
          top: 40,
        }}
      >
        cronotype
      </div>

      <div
        style={{
          color: COLORS.muted,
          display: 'flex',
          fontFamily: 'GeistMono, monospace',
          fontSize: 22,
          left: 64,
          letterSpacing: 0,
          position: 'absolute',
          bottom: 36,
        }}
      >
        cronotype.vercel.app
      </div>
    </div>,
    { ...size, fonts },
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ color: COLORS.muted, display: 'flex', fontSize: 18, letterSpacing: '0.08em' }}>{label}</div>
      <div
        style={{
          color: accent ?? COLORS.paper80,
          display: 'flex',
          fontSize: 36,
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}

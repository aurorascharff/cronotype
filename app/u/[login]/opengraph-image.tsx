import { ImageResponse } from 'next/og';
import { ARCHETYPES, classify, percentileFor } from '@/lib/archetypes';
import { getProfile, getStatsFor } from '@/features/profile/profile-queries';

export const alt = 'Cronotype profile';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

type Params = { login: string };

async function loadGeist() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');
  const base = baseUrl.replace(/\/$/, '');
  try {
    const [regular, semibold] = await Promise.all([
      fetch(`${base}/fonts/Geist-Regular.ttf`).then(r => r.arrayBuffer()),
      fetch(`${base}/fonts/Geist-SemiBold.ttf`).then(r => r.arrayBuffer()),
    ]);
    return [
      { data: regular, name: 'Geist', style: 'normal' as const, weight: 400 as const },
      { data: semibold, name: 'Geist', style: 'normal' as const, weight: 600 as const },
    ];
  } catch {
    return undefined;
  }
}

export default async function OpenGraphImage({ params }: { params: Promise<Params> }) {
  const { login } = await params;

  let profile;
  let stats;
  try {
    [profile, stats] = await Promise.all([getProfile(login), getStatsFor(login, '90d')]);
  } catch {
    return fallback(await loadGeist());
  }

  if (stats.total === 0) return fallback(await loadGeist());

  const fonts = await loadGeist();

  const archetype = classify(stats);
  const { theme } = archetype;
  const percentile = percentileFor(archetype, stats);
  const max = Math.max(1, ...stats.hourly);

  const haloSize = 380;
  const cx = haloSize / 2;
  const avatarR = haloSize * 0.22;
  const gap = haloSize * 0.04;
  const inner = avatarR + gap;
  const outer = haloSize * 0.46;
  const barWidth = Math.max(4, haloSize * 0.018);

  const tickLabel = (text: string, dx: number, dy: number, anchor: 'left' | 'center' | 'right') => (
    <div
      key={text}
      style={{
        color: theme.accent,
        display: 'flex',
        fontFamily: 'monospace',
        fontSize: 22,
        fontWeight: 600,
        justifyContent: anchor === 'center' ? 'center' : anchor === 'right' ? 'flex-end' : 'flex-start',
        left: cx + dx - 60,
        letterSpacing: '0.04em',
        position: 'absolute',
        top: cx + dy - 14,
        width: 120,
      }}
    >
      {text}
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#08090b',
          color: 'white',
          display: 'flex',
          fontFamily: 'Geist, sans-serif',
          gap: 56,
          height: '100%',
          padding: 64,
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            height: haloSize,
            justifyContent: 'center',
            position: 'relative',
            width: haloSize,
          }}
        >
          <div
            style={{
              border: `1px solid ${theme.accent}`,
              borderRadius: '50%',
              display: 'flex',
              height: (outer + 1) * 2,
              left: cx - (outer + 1),
              opacity: 0.1,
              position: 'absolute',
              top: cx - (outer + 1),
              width: (outer + 1) * 2,
            }}
          />
          <div
            style={{
              border: `1px solid ${theme.accent}`,
              borderRadius: '50%',
              display: 'flex',
              height: (inner - 1) * 2,
              left: cx - (inner - 1),
              opacity: 0.18,
              position: 'absolute',
              top: cx - (inner - 1),
              width: (inner - 1) * 2,
            }}
          />

          {[0, 6, 12, 18].map(q => {
            const angle = (q / 24) * 360;
            return (
              <div
                key={`q-${q}`}
                style={{
                  background: theme.accent,
                  display: 'flex',
                  height: 10,
                  left: cx - 0.75,
                  opacity: 0.4,
                  position: 'absolute',
                  top: cx - outer - 8,
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: `0.75px ${outer + 8}px`,
                  width: 1.5,
                }}
              />
            );
          })}

          {stats.hourly.map((count, h) => {
            const len = Math.max(2, (count / max) * (outer - inner));
            const angle = (h / 24) * 360;
            const isNight = h < 5 || h >= 22;
            return (
              <div
                key={h}
                style={{
                  background: theme.accent,
                  borderRadius: 1,
                  display: 'flex',
                  height: len,
                  left: cx - barWidth / 2,
                  opacity: isNight ? 1 : 0.7,
                  position: 'absolute',
                  top: cx - inner - len,
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: `${barWidth / 2}px ${inner + len}px`,
                  width: barWidth,
                }}
              />
            );
          })}

          <div
            style={{
              alignItems: 'center',
              background: theme.accent,
              borderRadius: '50%',
              display: 'flex',
              height: avatarR * 2 + 4,
              justifyContent: 'center',
              left: cx - avatarR - 2,
              opacity: 0.15,
              position: 'absolute',
              top: cx - avatarR - 2,
              width: avatarR * 2 + 4,
            }}
          />
          <div
            style={{
              alignItems: 'center',
              border: `1.5px solid ${theme.accent}`,
              borderRadius: '50%',
              display: 'flex',
              height: avatarR * 2,
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'absolute',
              width: avatarR * 2,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatarUrl}
              alt=""
              width={avatarR * 2}
              height={avatarR * 2}
              style={{ display: 'block', objectFit: 'cover' }}
            />
          </div>

          {tickLabel('12am', 0, -outer - 30, 'center')}
          {tickLabel('6am', outer + 18, 0, 'left')}
          {tickLabel('12pm', 0, outer + 18, 'center')}
          {tickLabel('6pm', -outer - 18, 0, 'right')}
        </div>

        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#8b8d96', display: 'flex', fontSize: 28 }}>@{profile.login}</div>
          <div
            style={{
              backgroundClip: 'text',
              backgroundImage: `linear-gradient(135deg, ${theme.accent2}, ${theme.accent})`,
              color: 'transparent',
              display: 'flex',
              fontSize: 108,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 0.95,
            }}
          >
            {archetype.name}
          </div>
          <div style={{ color: '#c8cad4', display: 'flex', fontSize: 32, marginTop: 8, maxWidth: 620 }}>
            {archetype.meaning}
          </div>
          <div style={{ display: 'flex', gap: 44, marginTop: 28 }}>
            <Stat label="PEAK" value={formatHour(stats.peakHour)} />
            <Stat label="NOCTURNAL" value={`${Math.round(stats.pctNocturnal)}%`} />
            <Stat label="COMMITS" value={formatCount(stats.total)} />
            <Stat label="PERCENTILE" value={String(percentile)} accent={theme.accent} />
          </div>
        </div>

        <div
          style={{
            color: '#8b8d96',
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
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 6,
            color: '#8b8d96',
            display: 'flex',
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: '0.08em',
            padding: '8px 14px',
            position: 'absolute',
            right: 64,
            textTransform: 'uppercase',
            top: 40,
          }}
        >
          Last 90 days
        </div>

        <div
          style={{
            color: '#6b7280',
            display: 'flex',
            fontSize: 18,
            left: 64,
            letterSpacing: '0.01em',
            position: 'absolute',
            bottom: 36,
          }}
        >
          Find your developer type
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ color: '#8b8d96', display: 'flex', fontSize: 18, letterSpacing: '0.08em' }}>{label}</div>
      <div
        style={{
          color: accent ?? 'white',
          display: 'flex',
          fontSize: 40,
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function fallback(fonts?: Awaited<ReturnType<typeof loadGeist>>) {
  const fallbackArchetype = ARCHETYPES.drifter;
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#08090b',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Geist, sans-serif',
          gap: 16,
          height: '100%',
          justifyContent: 'center',
          padding: 64,
          width: '100%',
        }}
      >
        <div style={{ color: '#8b8d96', display: 'flex', fontSize: 30 }}>cronotype</div>
        <div
          style={{
            color: fallbackArchetype.theme.accent,
            display: 'flex',
            fontSize: 102,
            fontWeight: 600,
            letterSpacing: '-0.04em',
          }}
        >
          What type of developer are you?
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

function formatHour(h: number) {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

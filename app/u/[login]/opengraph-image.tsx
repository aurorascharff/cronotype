import { ImageResponse } from 'next/og';
import { ARCHETYPES, classify } from '@/lib/archetypes';
import { getProfile, getStatsFor } from '@/features/profile/profile-queries';

export const alt = 'Cronotype profile';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

type Params = { login: string };

export default async function OpenGraphImage({ params }: { params: Promise<Params> }) {
  const { login } = await params;

  let profile;
  let stats;
  try {
    [profile, stats] = await Promise.all([getProfile(login), getStatsFor(login, '90d')]);
  } catch {
    return fallback();
  }

  if (stats.total === 0) return fallback();

  const archetype = classify(stats);
  const { theme } = archetype;
  const max = Math.max(1, ...stats.hourly);

  // Halo geometry — same proportions as <HaloChart size={320}> but scaled for OG.
  const haloSize = 360;
  const cx = haloSize / 2;
  const avatarR = haloSize * 0.22;
  const gap = haloSize * 0.04;
  const inner = avatarR + gap;
  const outer = haloSize * 0.46;
  const barWidth = haloSize * 0.018;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#08090b',
          color: 'white',
          display: 'flex',
          fontFamily: 'sans-serif',
          gap: 56,
          height: '100%',
          padding: 64,
          width: '100%',
        }}
      >
        {/* Halo */}
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
          {/* Hour bars, rotated radially. */}
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
          {/* Avatar circle */}
          <div
            style={{
              alignItems: 'center',
              border: `2px solid ${theme.accent}`,
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
        </div>

        {/* Verdict + stats */}
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#8b8d96', display: 'flex', fontSize: 22 }}>@{profile.login}</div>
          <div
            style={{
              color: theme.accent,
              display: 'flex',
              fontSize: 92,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {archetype.name}
          </div>
          <div style={{ color: '#c8cad4', display: 'flex', fontSize: 26, marginTop: 8, maxWidth: 540 }}>
            {archetype.meaning}
          </div>
          <div style={{ display: 'flex', gap: 40, marginTop: 28 }}>
            <Stat label="PEAK" value={formatHour(stats.peakHour)} />
            <Stat label="NOCTURNAL" value={`${Math.round(stats.pctNocturnal)}%`} />
            <Stat label="WEEKEND" value={`${Math.round(stats.pctWeekend)}%`} />
            <Stat label="COMMITS" value={formatCount(stats.total)} />
          </div>
        </div>

        {/* Wordmark */}
        <div
          style={{
            color: '#8b8d96',
            display: 'flex',
            fontSize: 18,
            fontWeight: 600,
            left: 64,
            letterSpacing: '-0.01em',
            position: 'absolute',
            top: 40,
          }}
        >
          cronotype
        </div>

        {/* Window badge */}
        <div
          style={{
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 6,
            color: '#8b8d96',
            display: 'flex',
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '0.08em',
            padding: '6px 12px',
            position: 'absolute',
            right: 64,
            textTransform: 'uppercase',
            top: 40,
          }}
        >
          Last 90 days
        </div>
      </div>
    ),
    size,
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ color: '#8b8d96', display: 'flex', fontSize: 14, letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ color: 'white', display: 'flex', fontSize: 32, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function fallback() {
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
          fontFamily: 'sans-serif',
          gap: 16,
          height: '100%',
          justifyContent: 'center',
          padding: 64,
          width: '100%',
        }}
      >
        <div style={{ color: '#8b8d96', display: 'flex', fontSize: 22 }}>cronotype</div>
        <div
          style={{
            color: fallbackArchetype.theme.accent,
            display: 'flex',
            fontSize: 92,
            fontWeight: 600,
            letterSpacing: '-0.04em',
          }}
        >
          What type of developer are you?
        </div>
      </div>
    ),
    size,
  );
}

function formatHour(h: number) {
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

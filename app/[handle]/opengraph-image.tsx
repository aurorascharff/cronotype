import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { computeCronotype, isGitHubNotFoundError, isGitHubRateLimitError } from '@/features/profile/profile-queries';
import { ARCHETYPES } from '@/lib/archetypes';
import { formatCount, formatFollowers, formatHour } from '@/lib/format';
import type { ProfileSummary } from '@/types/cronotype';

export const alt = 'Cronotype profile';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

type Params = { handle: string };

const COLORS = {
  ink2: '#0f1013',
  mutedDark: '#8b8d96',
  mutedDivider: 'rgba(139, 141, 150, 0.25)',
  paper: '#fafafa',
  paper80: 'rgba(250, 250, 250, 0.8)',
  white10: 'rgba(255, 255, 255, 0.1)',
  white20: 'rgba(255, 255, 255, 0.2)',
};

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
  const res = await fetch(new URL(`../../public/fonts/${name}`, import.meta.url));
  if (!res.ok) throw new Error(`Failed to load ${name}`);
  const data = await res.arrayBuffer();
  const signature = String.fromCharCode(...new Uint8Array(data.slice(0, 4)));
  if (signature.startsWith('<')) throw new Error(`Invalid font response for ${name}`);
  return data;
}

function titleSizeFor(name: string) {
  if (name.length >= 20) return 58;
  if (name.length >= 16) return 64;
  return 76;
}

function meaningSizeFor(text: string) {
  if (text.length >= 92) return 25;
  if (text.length >= 72) return 27;
  return 30;
}

export default async function OpenGraphImage({ params }: { params: Promise<Params> }) {
  const { handle } = await params;

  let result;
  try {
    result = await computeCronotype(handle, '90d');
  } catch (err) {
    if (isGitHubNotFoundError(err)) notFound();
    if (isGitHubRateLimitError(err)) return defaultImage();
    throw err;
  }
  const { profile, stats, archetype } = result;

  const fonts = await loadGeist();

  if (stats.total === 0) return quietImage(profile, fonts);

  const { theme } = archetype;
  const max = Math.max(1, ...stats.hourly);

  const haloSize = 380;
  const cx = haloSize / 2;
  const avatarR = haloSize * 0.22;
  const gap = haloSize * 0.04;
  const inner = avatarR + gap;
  const outer = haloSize * 0.46;
  const barWidth = Math.max(4, haloSize * 0.018);
  const titleFontSize = titleSizeFor(archetype.name);
  const meaningFontSize = meaningSizeFor(archetype.meaning);
  const signalSize = stats.total >= 100 ? '100+' : formatCount(stats.total);
  const aiScore = `${stats.aiScore}%`;

  const tickLabel = (text: string, dx: number, dy: number, anchor: 'left' | 'center' | 'right') => (
    <div
      key={text}
      style={{
        color: theme.accent,
        display: 'flex',
        fontFamily: 'GeistMono, monospace',
        fontSize: 22,
        fontWeight: 600,
        justifyContent: anchor === 'center' ? 'center' : anchor === 'right' ? 'flex-end' : 'flex-start',
        left: cx + dx - 60,
        letterSpacing: '0.02em',
        position: 'absolute',
        top: cx + dy - 14,
        width: 120,
      }}
    >
      {text}
    </div>
  );

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
          return (
            <div
              key={h}
              style={{
                background: theme.accent,
                borderRadius: 1,
                display: 'flex',
                height: len,
                left: cx - barWidth / 2,
                opacity: 0.9,
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
            left: cx - avatarR,
            overflow: 'hidden',
            position: 'absolute',
            top: cx - avatarR,
            width: avatarR * 2,
          }}
        >
          <img
            src={profile.avatarUrl}
            alt=""
            width={avatarR * 2}
            height={avatarR * 2}
            style={{
              borderRadius: '50%',
              display: 'block',
              height: avatarR * 2,
              objectFit: 'cover',
              width: avatarR * 2,
            }}
          />
        </div>

        {tickLabel('12am', 0, -outer - 30, 'center')}
        {tickLabel('6am', outer + 18, 0, 'left')}
        {tickLabel('12pm', 0, outer + 18, 'center')}
        {tickLabel('6pm', -outer - 18, 0, 'right')}
      </div>

      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div style={{ alignItems: 'baseline', color: COLORS.mutedDark, display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 24 }}>@{profile.login}</span>
          <span style={{ color: COLORS.mutedDivider, fontSize: 28 }}>·</span>
          <span style={{ fontSize: 20 }}>{formatFollowers(profile.followers)}</span>
        </div>
        <div
          style={{
            backgroundClip: 'text',
            backgroundImage: `linear-gradient(135deg, ${theme.accent2}, ${theme.accent})`,
            color: 'transparent',
            display: 'flex',
            fontSize: titleFontSize,
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            maxWidth: 680,
          }}
        >
          {archetype.name}
        </div>
        <div
          style={{
            color: COLORS.mutedDark,
            display: 'flex',
            fontSize: meaningFontSize,
            lineHeight: 1.35,
            marginTop: 6,
            maxWidth: 600,
          }}
        >
          {archetype.meaning}
        </div>
        <div style={{ display: 'flex', gap: 40, marginTop: 24 }}>
          <Stat label="PEAK" value={formatHour(stats.peakHour)} />
          <Stat label="NOCTURNAL" value={`${Math.round(stats.pctNocturnal)}%`} />
          <Stat label="SIGNAL" value={signalSize} />
          <Stat label="PERCENTILE" value={String(result.percentile)} accent={theme.accent} />
        </div>
        <div
          style={{
            alignItems: 'center',
            border: `1px solid ${stats.aiScore > 0 ? theme.accent : COLORS.white20}`,
            borderRadius: 8,
            color: stats.aiScore > 0 ? theme.accent : COLORS.mutedDark,
            display: 'flex',
            fontFamily: 'GeistMono, monospace',
            fontSize: 16,
            gap: 10,
            letterSpacing: '0.08em',
            marginTop: 14,
            padding: '7px 12px',
            textTransform: 'uppercase',
            width: 'fit-content',
          }}
        >
          <span
            style={{
              background: 'currentColor',
              borderRadius: '50%',
              display: 'flex',
              height: 8,
              opacity: 0.75,
              width: 8,
            }}
          />
          <span>Agent commits</span>
          <span style={{ color: COLORS.paper }}>{aiScore}</span>
        </div>
      </div>

      <div
        style={{
          color: COLORS.mutedDark,
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
          border: `1px solid ${COLORS.white20}`,
          borderRadius: 6,
          background: COLORS.white10,
          color: COLORS.paper80,
          display: 'flex',
          fontFamily: 'GeistMono, monospace',
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
          color: COLORS.mutedDark,
          display: 'flex',
          fontFamily: 'GeistMono, monospace',
          fontSize: 22,
          left: 64,
          letterSpacing: '-0.01em',
          position: 'absolute',
          bottom: 36,
        }}
      >
        cronotype.vercel.app/{profile.login}
      </div>
    </div>,
    { ...size, fonts },
  );
}

async function defaultImage() {
  const { default: image } = await import('../opengraph-image');
  return image();
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ color: COLORS.mutedDark, display: 'flex', fontSize: 18, letterSpacing: '0.08em' }}>{label}</div>
      <div
        style={{
          color: accent ?? COLORS.paper,
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

function quietImage(profile: ProfileSummary, fonts?: Awaited<ReturnType<typeof loadGeist>>) {
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
        padding: 64,
        width: '100%',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          border: `1.5px solid ${COLORS.mutedDark}`,
          borderRadius: '50%',
          display: 'flex',
          height: 176,
          justifyContent: 'center',
          overflow: 'hidden',
          width: 176,
        }}
      >
        <img
          src={profile.avatarUrl}
          alt=""
          width={176}
          height={176}
          style={{
            borderRadius: '50%',
            display: 'block',
            height: 176,
            objectFit: 'cover',
            width: 176,
          }}
        />
      </div>

      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div style={{ alignItems: 'baseline', color: COLORS.mutedDark, display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 24 }}>@{profile.login}</span>
          <span style={{ color: COLORS.mutedDivider, fontSize: 28 }}>·</span>
          <span style={{ fontSize: 20 }}>{formatFollowers(profile.followers)}</span>
        </div>
        <div
          style={{
            color: COLORS.paper80,
            display: 'flex',
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          Quiet lately
        </div>
        <div
          style={{
            color: COLORS.mutedDark,
            display: 'flex',
            fontSize: 30,
            lineHeight: 1.35,
            maxWidth: 620,
          }}
        >
          This profile is here. There just are not recent authored signal commits to classify a current rhythm.
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${COLORS.white20}`,
          borderRadius: 6,
          background: COLORS.white10,
          color: COLORS.paper80,
          display: 'flex',
          fontFamily: 'GeistMono, monospace',
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: '0.08em',
          padding: '10px 14px',
          position: 'absolute',
          right: 64,
          textTransform: 'uppercase',
          top: 40,
        }}
      >
        No 90d signal
      </div>

      <div
        style={{
          color: COLORS.mutedDark,
          display: 'flex',
          fontFamily: 'GeistMono, monospace',
          fontSize: 22,
          left: 64,
          letterSpacing: '-0.01em',
          position: 'absolute',
          bottom: 36,
        }}
      >
        cronotype.vercel.app/{profile.login}
      </div>
    </div>,
    { ...size, fonts },
  );
}

function fallback(fonts?: Awaited<ReturnType<typeof loadGeist>>) {
  const fallbackArchetype = ARCHETYPES.drifter;
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: COLORS.ink2,
        color: COLORS.paper,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'GeistSans, sans-serif',
        gap: 16,
        height: '100%',
        justifyContent: 'center',
        padding: 64,
        width: '100%',
      }}
    >
      <div style={{ color: COLORS.mutedDark, display: 'flex', fontSize: 30 }}>cronotype</div>
      <div
        style={{
          color: fallbackArchetype.theme.accent,
          display: 'flex',
          fontSize: 86,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        What type of developer are you?
      </div>
    </div>,
    { ...size, fonts },
  );
}

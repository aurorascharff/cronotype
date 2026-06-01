import { ImageResponse } from 'next/og';
import { getMonthlyHistory } from '@/features/profile/profile-queries';
import { computeCronotype } from '@/features/profile/profile-service';
import { buildEras, buildSmoothPath, buildYearMarks, computeYearMarkers, smooth } from '@/lib/timeline';

const size = { width: 1200, height: 630 };

type RouteContext = { params: Promise<{ login: string }> };

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

const W = 1080;
const H = 360;
const PAD_TOP = 24;
const PAD_BOT = 8;

export async function GET(_req: Request, { params }: RouteContext) {
  const { login } = await params;

  const [{ months, yearlyArchetypes }, { profile, archetype }] = await Promise.all([
    getMonthlyHistory(login),
    computeCronotype(login, '90d'),
  ]);

  const fonts = await loadGeist();

  if (months.length < 2) {
    return new ImageResponse(
      <div
        style={{
          alignItems: 'center',
          background: '#08090b',
          color: '#8b8d96',
          display: 'flex',
          fontFamily: 'Geist, sans-serif',
          fontSize: 36,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        Not enough commit history yet.
      </div>,
      { ...size, fonts },
    );
  }

  const smoothed = smooth(
    months.map(m => m.count),
    2,
  );
  const max = Math.max(1, ...smoothed);
  const usableH = H - PAD_TOP - PAD_BOT;

  const points = smoothed.map((v, i) => ({
    x: (i / (smoothed.length - 1)) * W,
    y: PAD_TOP + usableH - (v / max) * usableH,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L${W},${H - PAD_BOT} L0,${H - PAD_BOT} Z`;

  const yearMarkers = computeYearMarkers(months, W);
  const marks = buildYearMarks(months, yearlyArchetypes, archetype.id);
  const eras = buildEras(marks, smoothed.length, archetype.theme.accent);

  const fillId = `evolution-fill-${archetype.id}`;

  return new ImageResponse(
    <div
      style={{
        background: '#08090b',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Geist, sans-serif',
        height: '100%',
        padding: 64,
        position: 'relative',
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'baseline', color: '#8b8d96', display: 'flex', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>@{profile.login}</span>
        <span style={{ color: '#8b8d9640', fontSize: 24 }}>·</span>
        <span style={{ fontSize: 22 }}>How they got here</span>
      </div>

      <div style={{ alignItems: 'baseline', color: 'white', display: 'flex', gap: 16, marginBottom: 24 }}>
        <span style={{ fontSize: 56, fontWeight: 600, letterSpacing: '-0.04em' }}>{archetype.name}</span>
        <span style={{ color: '#8b8d96', fontSize: 22 }}>today</span>
      </div>

      <div style={{ color: '#8b8d96', display: 'flex', flexWrap: 'wrap', fontSize: 18, gap: 18, marginBottom: 18 }}>
        {eras
          .filter(e => e.label)
          .slice(0, 6)
          .map((e, i) => (
            <div key={i} style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
              <span style={{ background: e.color, borderRadius: 999, display: 'flex', height: 10, width: 10 }} />
              <span style={{ color: e.color, fontWeight: 600 }}>{e.label}</span>
              <span style={{ color: '#8b8d96', fontSize: 16 }}>{e.yearLabel}</span>
            </div>
          ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ height: '100%', width: '100%' }} preserveAspectRatio="none">
          <defs>
            {eras.map((e, i) => (
              <linearGradient key={`${fillId}-${i}`} id={`${fillId}-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={e.color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={e.color} stopOpacity="0" />
              </linearGradient>
            ))}
            {eras.map((e, i) => {
              const x1 = (e.startPct / 100) * W;
              const x2 = (e.endPct / 100) * W;
              return (
                <clipPath key={`${fillId}-clip-${i}`} id={`${fillId}-clip-${i}`}>
                  <rect x={x1} y={0} width={Math.max(0.5, x2 - x1)} height={H} />
                </clipPath>
              );
            })}
          </defs>

          {eras.map((e, i) =>
            e.unknown ? null : (
              <path
                key={`era-fill-${i}`}
                d={areaPath}
                fill={`url(#${fillId}-${i})`}
                clipPath={`url(#${fillId}-clip-${i})`}
              />
            ),
          )}

          {eras.map((e, i) => (
            <path
              key={`era-line-${i}`}
              d={linePath}
              fill="none"
              stroke={e.color}
              strokeWidth="3"
              strokeDasharray={e.unknown ? '6 6' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={e.unknown ? 0.55 : 1}
              clipPath={`url(#${fillId}-clip-${i})`}
            />
          ))}
        </svg>
      </div>

      <div style={{ color: '#8b8d96', display: 'flex', fontSize: 18, justifyContent: 'space-between', marginTop: 12 }}>
        {yearMarkers.map(yr => (
          <span key={yr.label}>{yr.label}</span>
        ))}
      </div>

      <div
        style={{
          bottom: 36,
          color: '#8b8d96',
          display: 'flex',
          fontFamily: 'Geist, monospace',
          fontSize: 22,
          left: 64,
          letterSpacing: '-0.01em',
          position: 'absolute',
        }}
      >
        cronotype.vercel.app/u/{profile.login}
      </div>
    </div>,
    { ...size, fonts },
  );
}

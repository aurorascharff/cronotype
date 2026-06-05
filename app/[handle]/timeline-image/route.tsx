import { ImageResponse } from 'next/og';
import { getTimelineExportChart, isGitHubNotFoundError } from '@/features/profile/profile-queries';

const size = { width: 1200, height: 630 };

type RouteContext = { params: Promise<{ handle: string }> };

async function loadGeist() {
  try {
    const [sans, mono] = await Promise.all([loadFont('Geist-Variable.ttf'), loadFont('GeistMono-Regular.ttf')]);
    return [
      { data: sans, name: 'GeistSans', style: 'normal' as const, weight: 400 as const },
      { data: sans, name: 'GeistSans', style: 'normal' as const, weight: 600 as const },
      { data: mono, name: 'GeistMono', style: 'normal' as const, weight: 400 as const },
    ];
  } catch {
    return undefined;
  }
}

async function loadFont(name: string) {
  const res = await fetch(new URL(`../../../public/fonts/${name}`, import.meta.url));
  if (!res.ok) throw new Error(`Failed to load ${name}`);
  const data = await res.arrayBuffer();
  const signature = String.fromCharCode(...new Uint8Array(data.slice(0, 4)));
  if (signature.startsWith('<')) throw new Error(`Invalid font response for ${name}`);
  return data;
}

const W = 1080;
const H = 360;
const PAD_TOP = 24;
const PAD_BOT = 8;
const AGENT_LINE_COLOR = '#a3e635';

export async function GET(_req: Request, { params }: RouteContext) {
  const { handle } = await params;

  try {
    const chart = await getTimelineExportChart(handle, {
      height: H,
      padBottom: PAD_BOT,
      padTop: PAD_TOP,
      width: W,
    });

    const {
      agentBars,
      archetype,
      areaPath,
      eras,
      hasData,
      linePath,
      profile,
      totalCommits,
      yearDividers,
      yearMarkers,
    } = chart;

    const fonts = await loadGeist();

    if (!hasData) {
      return new ImageResponse(
        <div
          style={{
            alignItems: 'center',
            background: '#08090b',
            color: '#8b8d96',
            display: 'flex',
            fontFamily: 'GeistSans, sans-serif',
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

    const fillId = `evolution-fill-${archetype.id}`;

    return new ImageResponse(
      <div
        style={{
          background: '#08090b',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'GeistSans, sans-serif',
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
          <span style={{ color: '#8b8d96', fontSize: 22 }}>{totalCommits.toLocaleString('en')} contributions</span>
        </div>

        <div style={{ color: '#8b8d96', display: 'flex', flexWrap: 'wrap', fontSize: 16, gap: 12, marginBottom: 14 }}>
          {eras
            .filter(e => e.label || e.unknown)
            .map((e, i) => (
              <div key={i} style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
                {e.unknown ? (
                  <span
                    style={{
                      background: 'linear-gradient(90deg, currentColor 0 45%, transparent 45% 70%, currentColor 70%)',
                      color: '#94a3b8',
                      display: 'flex',
                      height: 2,
                      width: 16,
                    }}
                  />
                ) : (
                  <span style={{ background: e.color, borderRadius: 999, display: 'flex', height: 9, width: 9 }} />
                )}
                <span style={{ color: e.color, fontWeight: 600 }}>{e.label ?? 'Missing data'}</span>
                <span style={{ color: '#8b8d96', fontSize: 14 }}>{e.yearLabel}</span>
              </div>
            ))}
          {agentBars.length > 0 ? (
            <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
              <span
                style={{
                  background: AGENT_LINE_COLOR,
                  borderRadius: 999,
                  display: 'flex',
                  height: 18,
                  width: 4,
                }}
              />
              <span style={{ color: AGENT_LINE_COLOR, fontWeight: 600 }}>Agent-attributed %</span>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
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

            {yearDividers.map(divider => (
              <line
                key={`year-divider-${divider.year}`}
                x1={divider.x}
                y1={PAD_TOP}
                x2={divider.x}
                y2={H - PAD_BOT}
                stroke="#8b8d96"
                strokeWidth="1"
                strokeDasharray="4 8"
                opacity="0.22"
              />
            ))}

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

            {agentBars.length > 0 ? (
              <g opacity="0.86">
                {agentBars.map(bar => (
                  <g key={`agent-bar-${bar.period}`}>
                    <rect
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      rx={bar.width / 2}
                      fill={AGENT_LINE_COLOR}
                    />
                  </g>
                ))}
              </g>
            ) : null}
          </svg>
          {agentBars.length > 0
            ? agentBars.map(bar => (
                <div
                  key={`agent-label-${bar.period}`}
                  style={{
                    color: AGENT_LINE_COLOR,
                    display: 'flex',
                    fontFamily: 'GeistMono, monospace',
                    fontSize: 13,
                    left: `${((bar.x + bar.width / 2) / W) * 100}%`,
                    opacity: 0.95,
                    position: 'absolute',
                    top: `${(Math.max(PAD_TOP + 16, bar.y - 8) / H) * 100}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {bar.percent}%
                </div>
              ))
            : null}
        </div>

        <div
          style={{ color: '#8b8d96', display: 'flex', fontSize: 18, justifyContent: 'space-between', marginTop: 12 }}
        >
          {yearMarkers.map(yr => (
            <span key={yr.label}>{yr.label}</span>
          ))}
        </div>

        <div
          style={{
            bottom: 36,
            color: '#8b8d96',
            display: 'flex',
            fontFamily: 'GeistMono, monospace',
            fontSize: 22,
            left: 64,
            letterSpacing: '-0.01em',
            position: 'absolute',
          }}
        >
          cronotype.vercel.app/{profile.login}
        </div>
      </div>,
      { ...size, fonts },
    );
  } catch (err) {
    if (isGitHubNotFoundError(err)) return new Response(null, { status: 404 });
    return timelineUnavailableImage();
  }
}

function timelineUnavailableImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#08090b',
        color: '#8b8d96',
        display: 'flex',
        fontFamily: 'GeistSans, sans-serif',
        fontSize: 34,
        height: '100%',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      GitHub is rate limiting the timeline. Try again in a moment.
    </div>,
    size,
  );
}

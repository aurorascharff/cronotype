/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { getCardCronotype, getCardProfile } from '@/features/leaderboard/leaderboard-queries';
import { parseTeamHandles } from '@/features/team/team-handles';
import { QUIET_THEME } from '@/lib/archetypes';
import { formatFollowers } from '@/lib/format';

const COLORS = {
  ink: '#0a0a0a',
  ink2: '#0f1013',
  mutedDark: '#8b8d96',
  paper: '#fafafa',
  white10: 'rgba(255, 255, 255, 0.1)',
  white18: 'rgba(255, 255, 255, 0.18)',
};

type Entry = {
  archetype: string | null;
  avatarUrl: string | null;
  color: string;
  followers: number | null;
  handle: string;
  name: string;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { handles } = parseTeamHandles(url.searchParams.get('handles') ?? '');
    const entries = await Promise.all(handles.map(handle => getEntry(handle)));
    const fonts = await loadGeist();

    const columns = Math.min(4, Math.max(1, entries.length));
    const rows = Math.max(1, Math.ceil(entries.length / columns));
    const width = 1200;
    const height = Math.max(630, 178 + rows * 230);
    const cardWidth = Math.floor((width - 108 - (columns - 1) * 18) / columns);

    return new ImageResponse(
      <div
        style={{
          background: COLORS.ink,
          color: COLORS.paper,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'GeistSans, sans-serif',
          gap: 28,
          minHeight: '100%',
          padding: 54,
          width: '100%',
        }}
      >
        <div style={{ alignItems: 'flex-end', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ color: COLORS.mutedDark, fontSize: 26 }}>cronotype</div>
            <div style={{ fontSize: 58, fontWeight: 600 }}>Team gallery</div>
          </div>
          <div
            style={{
              border: `1px solid ${COLORS.white18}`,
              borderRadius: 18,
              color: COLORS.mutedDark,
              display: 'flex',
              fontFamily: 'GeistMono, monospace',
              fontSize: 18,
              letterSpacing: '0.08em',
              padding: '10px 14px',
              textTransform: 'uppercase',
            }}
          >
            {entries.length} handles
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 18,
            width: '100%',
          }}
        >
          {entries.length > 0 ? (
            entries.map(entry => <TeamImageCard key={entry.handle} entry={entry} width={cardWidth} />)
          ) : (
            <div
              style={{
                border: `1px dashed ${COLORS.white18}`,
                borderRadius: 20,
                color: COLORS.mutedDark,
                display: 'flex',
                fontSize: 28,
                padding: 40,
              }}
            >
              Add handles to build a gallery.
            </div>
          )}
        </div>
      </div>,
      {
        fonts,
        height,
        width,
      },
    );
  } catch {
    return new Response('Could not render the team image.', { status: 500 });
  }
}

async function getEntry(handle: string): Promise<Entry> {
  const cronotype = await getCardCronotype(handle);
  const profile = cronotype?.profile ?? (await getCardProfile(handle));
  const color = cronotype
    ? cronotype.stats.total === 0
      ? QUIET_THEME.accent
      : cronotype.archetype.theme.accent
    : COLORS.mutedDark;

  return {
    archetype: cronotype ? (cronotype.stats.total === 0 ? 'Quiet lately' : cronotype.archetype.name) : null,
    avatarUrl: profile?.avatarUrl ?? null,
    color,
    followers: profile?.followers ?? null,
    handle,
    name: profile?.name ?? profile?.login ?? `@${handle}`,
  };
}

function TeamImageCard({ entry, width }: { entry: Entry; width: number }) {
  return (
    <div
      style={{
        background: COLORS.ink2,
        border: `1px solid ${COLORS.white10}`,
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        minHeight: 210,
        padding: 22,
        width,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 16 }}>
        <div
          style={{
            alignItems: 'center',
            border: `1px solid ${entry.color}`,
            borderRadius: '50%',
            display: 'flex',
            height: 78,
            justifyContent: 'center',
            opacity: entry.avatarUrl ? 1 : 0.72,
            width: 78,
          }}
        >
          {entry.avatarUrl ? (
            <img
              src={entry.avatarUrl}
              alt=""
              width={66}
              height={66}
              style={{ borderRadius: '50%', height: 66, objectFit: 'cover', width: 66 }}
            />
          ) : (
            <div style={{ color: COLORS.mutedDark, display: 'flex', fontSize: 18, fontWeight: 600 }}>
              {entry.handle.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <div style={{ color: COLORS.paper, fontSize: 26, fontWeight: 600, lineHeight: 1.05 }}>{entry.name}</div>
          <div style={{ color: COLORS.mutedDark, fontSize: 18 }}>
            @{entry.handle}
            {entry.followers === null ? '' : ` · ${formatFollowers(entry.followers)}`}
          </div>
        </div>
      </div>
      <div style={{ color: entry.color, display: 'flex', fontSize: 24, fontWeight: 600, marginTop: 'auto' }}>
        {entry.archetype ?? 'Not revealed yet'}
      </div>
    </div>
  );
}

async function loadGeist() {
  try {
    const [sansRegular, sansSemibold, monoRegular] = await Promise.all([
      loadFont('Geist-Regular.ttf'),
      loadFont('Geist-SemiBold.ttf'),
      loadFont('GeistMono-Regular.ttf'),
    ]);
    return [
      { data: sansRegular, name: 'GeistSans', style: 'normal' as const, weight: 400 as const },
      { data: sansSemibold, name: 'GeistSans', style: 'normal' as const, weight: 600 as const },
      { data: monoRegular, name: 'GeistMono', style: 'normal' as const, weight: 400 as const },
    ];
  } catch {
    return undefined;
  }
}

async function loadFont(name: string) {
  const res = await fetch(new URL('../../../public/fonts/' + name, import.meta.url));
  if (!res.ok) throw new Error(`Failed to load ${name}`);
  return res.arrayBuffer();
}

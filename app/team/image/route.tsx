/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { getCardCronotype, getCardProfile } from '@/features/leaderboard/leaderboard-queries';
import { parseTeamHandles, parseTeamName } from '@/features/team/team-handles';
import { QUIET_THEME } from '@/lib/archetypes';
import { formatFollowers } from '@/lib/format';
import type { HourStats } from '@/types/cronotype';

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_REPRESENTATIVES = 10;

const COLORS = {
  ink: '#0a0a0a',
  ink2: '#111217',
  line: 'rgba(255, 255, 255, 0.14)',
  muted: '#9ca3af',
  paper: '#fafafa',
  red: '#fb7185',
  white: '#ffffff',
  white08: 'rgba(255, 255, 255, 0.08)',
  white12: 'rgba(255, 255, 255, 0.12)',
};

type Entry = {
  archetype: string | null;
  avatarUrl: string | null;
  color: string;
  followers: number;
  handle: string;
  name: string;
  stats: HourStats | null;
  status: 'ok' | 'pending';
};

type ArchetypeCount = {
  color: string;
  count: number;
  name: string;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { handles } = parseTeamHandles(url.searchParams.get('handles') ?? '');
    const name = parseTeamName(url.searchParams.get('name') ?? '') || 'Team gallery';
    const entries = await Promise.all(handles.map(handle => getEntry(handle)));
    return renderTeamImage({ entries, name });
  } catch (err) {
    return renderFallbackImage(err);
  }
}

async function getEntry(handle: string): Promise<Entry> {
  try {
    const cronotype = await getCardCronotype(handle);
    const profile = cronotype?.profile ?? (await getCardProfile(handle));
    const color = cronotype
      ? cronotype.stats.total === 0
        ? QUIET_THEME.accent
        : cronotype.archetype.theme.accent
      : COLORS.muted;

    return {
      archetype: cronotype ? (cronotype.stats.total === 0 ? 'Quiet lately' : cronotype.archetype.name) : null,
      avatarUrl: profile?.avatarUrl ?? null,
      color,
      followers: profile?.followers ?? 0,
      handle,
      name: profile?.name ?? profile?.login ?? `@${handle}`,
      stats: cronotype?.stats ?? null,
      status: cronotype ? 'ok' : 'pending',
    };
  } catch {
    return {
      archetype: null,
      avatarUrl: null,
      color: COLORS.muted,
      followers: 0,
      handle,
      name: `@${handle}`,
      stats: null,
      status: 'pending',
    };
  }
}

async function renderTeamImage({ entries, name }: { entries: Entry[]; name: string }) {
  const fonts = await loadGeist();
  const counts = typeCounts(entries);
  const selected = selectRepresentatives(entries);
  const columns = selected.length <= 4 ? Math.max(1, selected.length) : selected.length <= 8 ? 4 : 5;
  const cardWidth = Math.floor((WIDTH - 104 - (columns - 1) * 16) / columns);
  const cardHeight = columns === 5 ? 150 : 164;

  return new ImageResponse(
    <div
      style={{
        background: COLORS.ink,
        color: COLORS.paper,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'GeistSans, sans-serif',
        height: '100%',
        padding: 44,
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 760 }}>
          <div style={{ color: COLORS.muted, display: 'flex', fontSize: 24 }}>cronotype team</div>
          <div style={{ color: COLORS.paper, display: 'flex', fontSize: 56, fontWeight: 600, lineHeight: 1 }}>
            {name}
          </div>
        </div>
        <div
          style={{
            alignItems: 'baseline',
            color: COLORS.muted,
            display: 'flex',
            fontFamily: 'GeistMono, monospace',
            gap: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: COLORS.paper, fontFamily: 'GeistSans, sans-serif', fontSize: 34, fontWeight: 600 }}>
            {entries.length}
          </span>
          <span style={{ fontSize: 17 }}>{entries.length === 1 ? 'profile' : 'profiles'}</span>
        </div>
      </div>

      {counts.length > 0 ? (
        <div style={{ display: 'flex', gap: 12, marginTop: 22, width: '100%' }}>
          {counts.slice(0, 5).map(count => (
            <TypePill key={count.name} count={count} />
          ))}
        </div>
      ) : null}

      <div
        style={{
          alignContent: 'flex-start',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          marginTop: counts.length > 0 ? 22 : 30,
          width: '100%',
        }}
      >
        {selected.length > 0 ? (
          selected.map(entry => (
            <TeamImageCard
              key={entry.handle}
              cardHeight={cardHeight}
              entry={entry}
              width={cardWidth}
              compact={columns === 5}
            />
          ))
        ) : (
          <div
            style={{
              alignItems: 'center',
              border: `1px dashed ${COLORS.line}`,
              borderRadius: 18,
              color: COLORS.muted,
              display: 'flex',
              fontSize: 28,
              height: 220,
              justifyContent: 'center',
              width: '100%',
            }}
          >
            Add handles to build a gallery.
          </div>
        )}
      </div>
    </div>,
    { fonts, height: HEIGHT, width: WIDTH },
  );
}

function TypePill({ count }: { count: ArchetypeCount }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: COLORS.white08,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 999,
        display: 'flex',
        gap: 9,
        padding: '7px 11px',
      }}
    >
      <div style={{ background: count.color, borderRadius: 999, display: 'flex', height: 10, width: 10 }} />
      <div style={{ color: COLORS.paper, display: 'flex', fontSize: 18, fontWeight: 600 }}>{count.count}</div>
      <div style={{ color: COLORS.muted, display: 'flex', fontSize: 16 }}>{count.name}</div>
    </div>
  );
}

function TeamImageCard({
  cardHeight,
  compact,
  entry,
  width,
}: {
  cardHeight: number;
  compact: boolean;
  entry: Entry;
  width: number;
}) {
  const clockSize = compact ? 76 : 86;

  return (
    <div
      style={{
        background: COLORS.ink2,
        border: `1px solid ${entry.status === 'ok' ? COLORS.white12 : COLORS.line}`,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: cardHeight,
        justifyContent: 'space-between',
        padding: compact ? 12 : 14,
        width,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flex: 1, gap: compact ? 10 : 12, minWidth: 0 }}>
        <TeamClock entry={entry} size={clockSize} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <div
            style={{
              color: COLORS.paper,
              display: 'flex',
              fontSize: compact ? 16 : 19,
              fontWeight: 600,
              lineHeight: 1.05,
            }}
          >
            {truncate(entry.name, compact ? 13 : 17)}
          </div>
          <div style={{ color: COLORS.muted, display: 'flex', fontSize: compact ? 11 : 13 }}>
            @{truncate(entry.handle, compact ? 12 : 16)}
          </div>
        </div>
      </div>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div
          style={{
            color: entry.archetype ? entry.color : COLORS.muted,
            display: 'flex',
            fontSize: compact ? 12 : 15,
            fontWeight: 600,
          }}
        >
          {entry.archetype ? truncate(entry.archetype, compact ? 19 : 22) : '-'}
        </div>
        {entry.followers > 0 ? (
          <div
            style={{
              color: COLORS.muted,
              display: 'flex',
              fontFamily: 'GeistMono, monospace',
              fontSize: compact ? 10 : 12,
            }}
          >
            {formatFollowers(entry.followers)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TeamClock({ entry, size }: { entry: Entry; size: number }) {
  const avatarSize = size * 0.46;
  const max = Math.max(1, ...(entry.stats?.hourly ?? []));
  const bars =
    entry.stats?.hourly.map((count, hour) => ({
      angle: (hour / 24) * 360,
      height: Math.max(2, (count / max) * size * 0.18),
      hour,
    })) ?? [];

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
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'flex', height: size, left: 0, position: 'absolute', top: 0, width: size }}
      >
        <circle cx={size / 2} cy={size / 2} r={size * 0.28} fill="none" stroke={entry.color} opacity={0.18} />
        {bars.length > 0
          ? bars.map(bar => (
              <rect
                key={bar.hour}
                x={size / 2 - 1.4}
                y={size / 2 - size * 0.29 - bar.height}
                width={2.8}
                height={bar.height}
                fill={entry.color}
                opacity={0.9}
                transform={`rotate(${bar.angle}, ${size / 2}, ${size / 2})`}
              />
            ))
          : null}
      </svg>
      <div
        style={{
          alignItems: 'center',
          background: COLORS.ink,
          border: `1px solid ${entry.color}`,
          borderRadius: '50%',
          display: 'flex',
          height: avatarSize,
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          width: avatarSize,
        }}
      >
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt=""
            width={avatarSize}
            height={avatarSize}
            style={{ height: avatarSize, objectFit: 'cover', width: avatarSize }}
          />
        ) : (
          <div style={{ color: COLORS.muted, display: 'flex', fontSize: 13, fontWeight: 600 }}>
            {entry.handle.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

function typeCounts(entries: Entry[]): ArchetypeCount[] {
  const byName = new Map<string, ArchetypeCount>();
  for (const entry of entries) {
    if (!entry.archetype) continue;
    const existing = byName.get(entry.archetype);
    if (existing) {
      existing.count++;
    } else {
      byName.set(entry.archetype, { color: entry.color, count: 1, name: entry.archetype });
    }
  }
  return [...byName.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function selectRepresentatives(entries: Entry[]): Entry[] {
  const sorted = [...entries].sort((a, b) => b.followers - a.followers);
  const selected: Entry[] = [];
  const seenTypes = new Set<string>();

  for (const entry of sorted) {
    if (selected.length >= MAX_REPRESENTATIVES) break;
    const typeKey = entry.archetype ?? `pending-${entry.handle}`;
    if (seenTypes.has(typeKey)) continue;
    seenTypes.add(typeKey);
    selected.push(entry);
  }

  for (const entry of sorted) {
    if (selected.length >= MAX_REPRESENTATIVES) break;
    if (selected.includes(entry)) continue;
    selected.push(entry);
  }

  return selected;
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, Math.max(0, max - 3))}...` : value;
}

async function renderFallbackImage(err: unknown) {
  const fonts = await loadGeist();
  const message = err instanceof Error ? err.message : 'Unknown image error';

  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: COLORS.ink,
        color: COLORS.paper,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'GeistSans, sans-serif',
        gap: 18,
        height: '100%',
        justifyContent: 'center',
        padding: 64,
        textAlign: 'center',
        width: '100%',
      }}
    >
      <div style={{ color: COLORS.red, display: 'flex', fontSize: 24 }}>cronotype team image</div>
      <div style={{ display: 'flex', fontSize: 48, fontWeight: 600 }}>Couldn&apos;t render this gallery image.</div>
      <div style={{ color: COLORS.muted, display: 'flex', fontSize: 24, maxWidth: 760 }}>
        Wait a minute and try the download again.
      </div>
      <div style={{ color: COLORS.muted, display: 'flex', fontFamily: 'GeistMono, monospace', fontSize: 14 }}>
        {truncate(message, 96)}
      </div>
    </div>,
    { fonts, height: HEIGHT, width: WIDTH },
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

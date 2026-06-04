/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { getCardCronotype, getCardProfile } from '@/features/leaderboard/leaderboard-queries';
import { parseTeamHandles, parseTeamName } from '@/features/team/team-handles';
import { QUIET_THEME } from '@/lib/archetypes';
import { formatFollowers } from '@/lib/format';
import type { HourStats } from '@/types/cronotype';

const WIDTH = 1200;
const HEIGHT = 630;
const OG_PREVIEW_ENTRIES = 9;
const DOWNLOAD_COLUMNS = 4;

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

type ImageVariant = 'og' | 'download';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { handles } = parseTeamHandles(url.searchParams.get('handles') ?? '');
    const name = parseTeamName(url.searchParams.get('name') ?? '') || 'Team gallery';
    const variant: ImageVariant = url.searchParams.get('variant') === 'download' ? 'download' : 'og';
    const entries = await Promise.all(handles.map(handle => getEntry(handle)));
    return renderTeamImage({ entries, name, variant });
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

async function renderTeamImage({ entries, name, variant }: { entries: Entry[]; name: string; variant: ImageVariant }) {
  const fonts = await loadGeist();
  const counts = typeCounts(entries);
  const selected = variant === 'download' ? sortEntries(entries) : selectRepresentatives(entries, OG_PREVIEW_ENTRIES);
  const overflowCount = variant === 'og' ? Math.max(0, entries.length - selected.length) : 0;
  const visualCardCount = selected.length + (overflowCount > 0 ? 1 : 0);
  const columns =
    variant === 'download'
      ? Math.min(DOWNLOAD_COLUMNS, Math.max(1, selected.length))
      : overflowCount > 0
        ? 5
        : visualCardCount <= 4
          ? Math.max(1, visualCardCount)
          : visualCardCount <= 8
            ? 4
            : 5;
  const gap = columns >= 6 ? 12 : 16;
  const cardWidth = Math.floor((WIDTH - 88 - (columns - 1) * gap) / columns);
  const cardHeight = variant === 'download' ? 172 : columns >= 6 ? 142 : columns === 5 ? 146 : 164;
  const rows = Math.max(1, Math.ceil(visualCardCount / columns));
  const height = variant === 'download' ? Math.max(HEIGHT, 230 + rows * (cardHeight + 16)) : HEIGHT;

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
      <div style={{ alignItems: 'flex-start', display: 'flex', gap: 32, width: '100%' }}>
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div style={{ color: COLORS.muted, display: 'flex', fontSize: 24 }}>cronotype team</div>
          <div style={{ color: COLORS.paper, display: 'flex', fontSize: 54, fontWeight: 600, lineHeight: 1 }}>
            {truncate(name, 30)}
          </div>
        </div>
        <div
          style={{
            alignItems: 'baseline',
            color: COLORS.muted,
            display: 'flex',
            flexShrink: 0,
            fontFamily: 'GeistMono, monospace',
            gap: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            width: 158,
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
          {counts.slice(0, 4).map(count => (
            <TypePill key={count.name} count={count} />
          ))}
          {counts.length > 4 ? <TypeOverflowPill count={counts.length - 4} /> : null}
        </div>
      ) : null}

      <div
        style={{
          alignContent: 'flex-start',
          display: 'flex',
          flexWrap: 'wrap',
          gap,
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
              compact={columns >= 5}
              dense={columns >= 6}
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
        {overflowCount > 0 ? <OverflowCard count={overflowCount} cardHeight={cardHeight} width={cardWidth} /> : null}
      </div>
    </div>,
    { fonts, height, width: WIDTH },
  );
}

function OverflowCard({ cardHeight, count, width }: { cardHeight: number; count: number; width: number }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: COLORS.ink2,
        border: `1px solid ${COLORS.white12}`,
        borderRadius: 16,
        color: COLORS.paper,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        height: cardHeight,
        justifyContent: 'center',
        width,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          background: COLORS.ink,
          border: `1px solid ${COLORS.white12}`,
          borderRadius: '50%',
          display: 'flex',
          fontSize: 30,
          fontWeight: 600,
          height: 70,
          justifyContent: 'center',
          width: 70,
        }}
      >
        +{count}
      </div>
      <div style={{ color: COLORS.muted, display: 'flex', fontSize: 14 }}>more in the gallery</div>
    </div>
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

function TypeOverflowPill({ count }: { count: number }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: COLORS.white08,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 999,
        color: COLORS.muted,
        display: 'flex',
        fontSize: 16,
        padding: '7px 11px',
      }}
    >
      +{count}
    </div>
  );
}

function TeamImageCard({
  cardHeight,
  compact,
  dense,
  entry,
  width,
}: {
  cardHeight: number;
  compact: boolean;
  dense: boolean;
  entry: Entry;
  width: number;
}) {
  const clockSize = dense ? 58 : compact ? 72 : 86;
  const textWidth = width - clockSize - (dense ? 38 : compact ? 48 : 54);
  const nameLines = wrapText(entry.name, textWidth, dense ? 14 : compact ? 16 : 19);

  return (
    <div
      style={{
        background: COLORS.ink2,
        border: `1px solid ${entry.status === 'ok' ? COLORS.white12 : COLORS.line}`,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: dense ? 5 : 8,
        height: cardHeight,
        justifyContent: 'space-between',
        padding: dense ? 10 : compact ? 12 : 14,
        width,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flex: 1, gap: dense ? 8 : compact ? 10 : 12, minWidth: 0 }}>
        <TeamClock entry={entry} size={clockSize} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: textWidth }}>
          <div
            style={{
              color: COLORS.paper,
              display: 'flex',
              flexDirection: 'column',
              fontSize: dense ? 14 : compact ? 16 : 19,
              fontWeight: 600,
              lineHeight: 1.05,
            }}
          >
            {nameLines.map((line, index) => (
              <span key={`${entry.handle}-name-${index}`} style={{ display: 'flex', maxWidth: textWidth }}>
                {line}
              </span>
            ))}
          </div>
          <div style={{ color: COLORS.muted, display: 'flex', fontSize: dense ? 10 : compact ? 11 : 13 }}>
            @{truncate(entry.handle, dense ? 11 : compact ? 12 : 16)}
          </div>
        </div>
      </div>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div
          style={{
            color: entry.archetype ? entry.color : COLORS.muted,
            display: 'flex',
            fontSize: dense ? 10 : compact ? 12 : 15,
            fontWeight: 600,
          }}
        >
          {entry.archetype ? truncate(entry.archetype, dense ? 16 : compact ? 19 : 22) : '-'}
        </div>
        {entry.followers > 0 ? (
          <div
            style={{
              color: COLORS.muted,
              display: 'flex',
              fontFamily: 'GeistMono, monospace',
              fontSize: dense ? 9 : compact ? 10 : 12,
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
            style={{ borderRadius: '50%', height: avatarSize, objectFit: 'cover', width: avatarSize }}
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

function selectRepresentatives(entries: Entry[], limit: number): Entry[] {
  const sorted = sortEntries(entries);
  const selected: Entry[] = [];
  const seenTypes = new Set<string>();

  for (const entry of sorted) {
    if (selected.length >= limit) break;
    const typeKey = entry.archetype ?? `pending-${entry.handle}`;
    if (seenTypes.has(typeKey)) continue;
    seenTypes.add(typeKey);
    selected.push(entry);
  }

  for (const entry of sorted) {
    if (selected.length >= limit) break;
    if (selected.includes(entry)) continue;
    selected.push(entry);
  }

  return selected;
}

function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => b.followers - a.followers || a.handle.localeCompare(b.handle));
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, Math.max(0, max - 3))}...` : value;
}

function wrapText(value: string, maxWidth: number, fontSize: number) {
  const maxChars = Math.max(8, Math.floor(maxWidth / (fontSize * 0.58)));
  if (value.length <= maxChars) return [value];
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [truncate(value, maxChars)];
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === 1) break;
  }

  if (current && lines.length < 2) lines.push(current);
  const remainder = words.slice(lines.join(' ').split(/\s+/).filter(Boolean).length).join(' ');
  if (remainder && lines.length > 0) {
    lines[lines.length - 1] = truncate(`${lines[lines.length - 1]} ${remainder}`, maxChars);
  }

  return lines.slice(0, 2).map(line => truncate(line, maxChars));
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

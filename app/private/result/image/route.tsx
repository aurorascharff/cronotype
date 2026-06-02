import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { getPrivateResultCookie } from '@/features/profile/profile-private-queries';
import { ARCHETYPES } from '@/lib/archetypes';
import { formatCount } from '@/lib/format';

export const size = { height: 630, width: 1200 };
export const contentType = 'image/png';

export async function GET() {
  const result = await getPrivateResultCookie();
  if (!result) notFound();
  const archetype = ARCHETYPES[result.archetypeId];
  const displayName = result.profile.name ?? result.profile.login;
  const signal = result.stats.total >= 100 ? '100+' : formatCount(result.stats.total);

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#0a0a0a',
          color: '#f7f7f4',
          display: 'flex',
          fontFamily: 'Geist, Arial, sans-serif',
          height: '100%',
          justifyContent: 'center',
          padding: 54,
          width: '100%',
        }}
      >
        <div
          style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 24,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
            padding: 48,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ color: '#9ca3af', display: 'flex', fontSize: 28, gap: 14 }}>
              <span>@{result.profile.login}</span>
              <span>·</span>
              <span>private cronotype</span>
            </div>
            <div
              style={{
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 12,
                color: '#9ca3af',
                fontSize: 20,
                letterSpacing: 2,
                padding: '10px 14px',
                textTransform: 'uppercase',
              }}
            >
              Private
            </div>
          </div>

          <div style={{ alignItems: 'center', display: 'flex', gap: 54 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.profile.avatarUrl}
              width={190}
              height={190}
              style={{
                border: '5px solid rgba(255,255,255,0.12)',
                borderRadius: 999,
                objectFit: 'cover',
              }}
              alt=""
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ color: '#a1a1aa', fontSize: 28 }}>{displayName}</div>
              <div
                style={{
                  color: archetype.theme.accent,
                  fontSize: 96,
                  fontWeight: 650,
                  letterSpacing: -2,
                  lineHeight: 0.95,
                }}
              >
                {archetype.name}
              </div>
              <div style={{ color: '#a1a1aa', fontSize: 30, lineHeight: 1.35, maxWidth: 720 }}>{archetype.meaning}</div>
            </div>
          </div>

          <div style={{ color: '#d4d4d8', display: 'flex', gap: 44, fontSize: 28 }}>
            <span>{signal} signal commits</span>
            <span>{formatCount(result.profile.followers)} followers</span>
            <span>{result.percentile} percentile</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

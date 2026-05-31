import { ImageResponse } from 'next/og';

export const size = { height: 32, width: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(135deg, #a855f7 0%, #f59e0b 50%, #3b82f6 100%)',
          borderRadius: 6,
          color: 'white',
          display: 'flex',
          fontSize: 22,
          fontWeight: 900,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}

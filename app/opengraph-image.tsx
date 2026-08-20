import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Rapid Takeoff'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            fontSize: 104,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <span style={{ color: '#ffffff' }}>Rapid</span>
          <span style={{ color: '#f97316' }}>Takeoff</span>
        </div>
      </div>
    ),
    size
  )
}

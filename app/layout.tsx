import type { Metadata } from 'next'
import './globals.css'
import DemoHelp from './DemoHelp'

const siteName = 'Rapid Takeoff'
const description = 'AI-powered construction takeoffs and estimating. Turn blueprints into material quantities, labor estimates, and professional bids in minutes.'

export const metadata: Metadata = {
  metadataBase: new URL('https://blueprint-estimator.vercel.app'),
  title: siteName,
  description,
  applicationName: siteName,
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    url: '/',
    siteName,
    title: siteName,
    description,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Rapid Takeoff' }],
  },
  twitter: { card: 'summary_large_image', title: siteName, description, images: ['/opengraph-image'] },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <DemoHelp />
        <footer style={{ maxWidth: '768px', margin: '18px auto 28px', padding: '18px 16px 0', borderTop: '1px solid #27272a', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', lineHeight: 1.65 }}>
          <div>© 2026 Rapid Takeoff™ · v0.3.0 · Demo & Help</div>
          <div><strong>Rapid Takeoff™</strong> · <strong style={{ color: '#f97316', fontWeight: 800 }}>Cactus🌵Byte Studios™</strong> · All Rights Reserved</div>
        </footer>
      </body>
    </html>
  )
}

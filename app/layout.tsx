import './globals.css'

export const metadata = {
  title: 'RapidTakeoff',
  description: 'AI takeoff report generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer
          style={{
            maxWidth: '768px',
            margin: '18px auto 28px',
            padding: '18px 16px 0',
            borderTop: '1px solid #27272a',
            textAlign: 'center',
            color: '#a1a1aa',
            fontSize: '11px',
            lineHeight: 1.65,
          }}
        >
          <div>© 2026 RapidTakeoff™</div>
          <div>
            Powered by <strong style={{ color: '#f97316', fontWeight: 800 }}>Cactus🌵Byte Studios™</strong> · All Rights Reserved
          </div>
        </footer>
      </body>
    </html>
  )
}

'use client'

import { useEffect, useState } from 'react'

export default function SplashGate({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setLeaving(true), 1450)
    const hideTimer = window.setTimeout(() => setShowSplash(false), 1850)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  return (
    <>
      {showSplash && (
        <div
          aria-label="Rapid Takeoff loading"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '28px',
            background:
              'radial-gradient(circle at 50% 32%, rgba(249,115,22,.20), transparent 30rem), linear-gradient(145deg,#050505 0%,#111113 52%,#050505 100%)',
            opacity: leaving ? 0 : 1,
            transition: 'opacity 400ms ease',
          }}
        >
          <div style={{ width: 'min(92vw, 560px)', textAlign: 'center' }}>
            <div
              style={{
                margin: '0 auto 28px',
                fontSize: 'clamp(34px, 8vw, 60px)',
                lineHeight: 1,
                fontWeight: 950,
                letterSpacing: '-.055em',
                color: '#fff',
                textShadow: '0 0 30px rgba(249,115,22,.20)',
              }}
            >
              Cactus🌵Byte
              <div
                style={{
                  marginTop: '9px',
                  color: '#f97316',
                  fontSize: 'clamp(15px, 3.8vw, 23px)',
                  fontWeight: 900,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                }}
              >
                Studios™
              </div>
            </div>

            <div
              style={{
                width: '132px',
                height: '132px',
                margin: '0 auto 22px',
                borderRadius: '30px',
                display: 'grid',
                placeItems: 'center',
                border: '2px solid rgba(249,115,22,.78)',
                background: 'linear-gradient(145deg,#18181b,#09090b)',
                boxShadow: '0 0 0 7px rgba(249,115,22,.07), 0 24px 60px rgba(0,0,0,.55), 0 0 32px rgba(249,115,22,.22)',
              }}
            >
              <div
                style={{
                  fontSize: '52px',
                  fontWeight: 950,
                  letterSpacing: '-.09em',
                  color: '#fff',
                  transform: 'translateX(-2px)',
                }}
              >
                R<span style={{ color: '#f97316' }}>T</span>
              </div>
            </div>

            <div
              style={{
                fontSize: 'clamp(24px, 6vw, 38px)',
                fontWeight: 950,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                color: '#fff',
              }}
            >
              Rapid<span style={{ color: '#f97316' }}>Takeoff™</span>
            </div>
            <div
              style={{
                marginTop: '12px',
                color: '#a1a1aa',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
              }}
            >
              Powered by Cactus🌵Byte Studios™
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  )
}

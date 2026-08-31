'use client'

import { useState } from 'react'

const APK_URL = 'https://github.com/Brett81Ross/cactusbyte-studios/releases/download/android-latest/Rapid-Takeoff.apk'

export default function NativeInstall() {
  const [hint, setHint] = useState('')
  const install = () => {
    if (/CactusByteNative\/1\.0/i.test(navigator.userAgent)) {
      setHint('Rapid Takeoff is already running as the installed Android app.')
      return
    }
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setHint('Native iPhone/iPad installation will use TestFlight or the App Store — no browser shortcut.')
      return
    }
    setHint('Downloading the real Rapid Takeoff Android app…')
    window.location.assign(APK_URL)
  }

  return (
    <div style={{ position: 'fixed', left: 14, bottom: 14, zIndex: 2147483000 }}>
      {hint && <div style={{ marginBottom: 8, maxWidth: 320, padding: '8px 11px', borderRadius: 12, border: '1px solid rgba(249,115,22,.45)', background: '#09090b', color: '#e4e4e7', fontSize: 11, lineHeight: 1.35, boxShadow: '0 10px 28px rgba(0,0,0,.35)' }}>{hint}</div>}
      <button type="button" onClick={install} style={{ minHeight: 44, padding: '10px 14px', borderRadius: 14, border: '1px solid rgba(249,115,22,.7)', background: 'linear-gradient(180deg,#431407,#18181b)', color: '#fff7ed', fontWeight: 850, fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,.35)', cursor: 'pointer' }}>⬇ Install App</button>
    </div>
  )
}

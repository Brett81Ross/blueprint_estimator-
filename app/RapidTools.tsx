'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { SCALE_OPTIONS, TRADES } from '../lib/project-inputs'

const SETTINGS_KEY = 'rapid-takeoff-settings-v1'

type Props = {
  trade: string
  setTrade: (value: string) => void
  projectType: string
  setProjectType: (value: string) => void
  scale: string
  setScale: (value: string) => void
}

type SavedSettings = {
  trade: string
  projectType: string
  scale: string
}

export default function RapidTools({ trade, setTrade, projectType, setProjectType, scale, setScale }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [draftTrade, setDraftTrade] = useState(trade)
  const [draftProjectType, setDraftProjectType] = useState(projectType)
  const [draftScale, setDraftScale] = useState(scale)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as Partial<SavedSettings>
      if (saved.trade && TRADES.includes(saved.trade as (typeof TRADES)[number])) setTrade(saved.trade)
      if (saved.projectType) setProjectType(saved.projectType)
      if (saved.scale && SCALE_OPTIONS.includes(saved.scale as (typeof SCALE_OPTIONS)[number])) setScale(saved.scale)
    } catch {
      // Ignore malformed local preferences and keep safe defaults.
    }
  }, [setProjectType, setScale, setTrade])

  useEffect(() => {
    if (!shareOpen) return
    let active = true
    const url = window.location.origin
    void QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#09090b', light: '#fff7ed' },
    }).then(data => {
      if (active) setQrDataUrl(data)
    }).catch(() => {
      if (active) setQrDataUrl('')
    })
    return () => { active = false }
  }, [shareOpen])

  const openSettings = () => {
    setDraftTrade(trade)
    setDraftProjectType(projectType)
    setDraftScale(scale)
    setSettingsOpen(true)
  }

  const saveSettings = () => {
    const next: SavedSettings = {
      trade: draftTrade,
      projectType: draftProjectType.trim() || 'Residential',
      scale: draftScale,
    }
    setTrade(next.trade)
    setProjectType(next.projectType)
    setScale(next.scale)
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    setSettingsOpen(false)
  }

  const resetSettings = () => {
    window.localStorage.removeItem(SETTINGS_KEY)
    const next = { trade: 'General Contractor', projectType: 'Residential', scale: 'Auto Detect / Mixed Sheets' }
    setDraftTrade(next.trade)
    setDraftProjectType(next.projectType)
    setDraftScale(next.scale)
    setTrade(next.trade)
    setProjectType(next.projectType)
    setScale(next.scale)
  }

  const copyLink = async () => {
    const url = window.location.origin
    try {
      await navigator.clipboard.writeText(url)
      setShareMessage('Rapid Takeoff link copied.')
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
      setShareMessage('Rapid Takeoff link copied.')
    }
  }

  const shareApp = async () => {
    const url = window.location.origin
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rapid Takeoff™',
          text: 'Rapid Takeoff™ — evidence-backed construction takeoffs from Cactus🌵Byte Studios™.',
          url,
        })
        setShareMessage('Share sheet opened.')
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    await copyLink()
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button type="button" onClick={openSettings} className="mini-btn" aria-label="Open Rapid Takeoff settings">Settings</button>
        <button type="button" onClick={() => { setShareMessage(''); setShareOpen(true) }} className="mini-btn" aria-label="Share Rapid Takeoff">Share</button>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Rapid Takeoff settings">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">Device defaults</div>
                <h2 className="mt-1 text-xl font-black text-white">Rapid Takeoff Settings</h2>
              </div>
              <button type="button" className="mini-btn" onClick={() => setSettingsOpen(false)}>Close</button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-400">Default trade
                <select className="field mt-1" value={draftTrade} onChange={event => setDraftTrade(event.target.value)}>
                  {TRADES.map(value => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label className="block text-xs font-bold text-zinc-400">Default project type
                <input className="field mt-1" value={draftProjectType} onChange={event => setDraftProjectType(event.target.value)} placeholder="Residential" />
              </label>
              <label className="block text-xs font-bold text-zinc-400">Default scale handling
                <select className="field mt-1" value={draftScale} onChange={event => setDraftScale(event.target.value)}>
                  {SCALE_OPTIONS.map(value => <option key={value}>{value}</option>)}
                </select>
              </label>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-zinc-500">These defaults stay on this device. Project-specific quantities and uploaded plans are not stored by this setting.</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={resetSettings} className="min-h-12 rounded-lg border border-zinc-700 bg-zinc-950 px-4 font-bold text-zinc-300">Reset</button>
              <button type="button" onClick={saveSettings} className="min-h-12 rounded-lg bg-orange-500 px-4 font-black text-zinc-950 hover:bg-orange-400">Save Defaults</button>
            </div>
          </div>
        </div>
      )}

      {shareOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Share Rapid Takeoff">
          <div className="w-full max-w-sm rounded-2xl border border-orange-500/40 bg-zinc-900 p-5 text-center shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3 text-left">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">Share Rapid Takeoff™</div>
                <h2 className="mt-1 text-lg font-black text-white">Scan or send the app</h2>
              </div>
              <button type="button" className="mini-btn" onClick={() => setShareOpen(false)}>Close</button>
            </div>

            <div className="mx-auto max-w-[310px] rounded-3xl border-2 border-orange-500 bg-orange-50 p-4 shadow-[0_0_35px_rgba(249,115,22,0.18)]">
              <div className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-zinc-950">Rapid<span className="text-orange-600">Takeoff</span>™</div>
              {qrDataUrl ? <img src={qrDataUrl} alt="QR code for Rapid Takeoff" className="mx-auto aspect-square w-full max-w-[280px] rounded-xl" /> : <div className="grid aspect-square place-items-center rounded-xl bg-white text-sm font-bold text-zinc-600">Generating QR…</div>}
              <div className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-700">Cactus🌵Byte Studios™</div>
            </div>

            {shareMessage && <p role="status" className="mt-3 text-sm font-bold text-emerald-400">{shareMessage}</p>}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => void copyLink()} className="min-h-12 rounded-lg border border-zinc-700 bg-zinc-950 px-4 font-bold text-zinc-200">Copy Link</button>
              <button type="button" onClick={() => void shareApp()} className="min-h-12 rounded-lg bg-orange-500 px-4 font-black text-zinc-950 hover:bg-orange-400">Share</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

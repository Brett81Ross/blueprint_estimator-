'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'

interface FileWithPreview { file: File; preview: string }
interface ReportSection { title: string; lines: string[] }

const REVIEW_SECTIONS = [
  'Rapid Matrix Summary',
  'Material Takeoff + ProofTrace™',
  'SheetLink™ Cross-Checks',
  'Conflict Radar™',
  'Confidence Matrix™ Review Queue',
  'Mandatory Missing Information',
]

const CACTUSBYTE_RECOVERY_URL = 'https://cactusbyte-studios.vercel.app/rapid-takeoff-recovery'

export default function Home() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [trade, setTrade] = useState('General Contractor')
  const [ceilingHeight, setCeilingHeight] = useState('')
  const [projectType, setProjectType] = useState('Residential')
  const [location, setLocation] = useState('')
  const [sqft, setSqft] = useState('')
  const [floors, setFloors] = useState('')
  const [laborRate, setLaborRate] = useState('')
  const [scale, setScale] = useState('1/4" = 1\'0"')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [proAccess, setProAccess] = useState(false)
  const [couponOpen, setCouponOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponBusy, setCouponBusy] = useState(false)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    void fetch('/api/access', { cache: 'no-store' })
      .then(response => response.json())
      .then(data => { if (active) setProAccess(Boolean(data?.pro)) })
      .catch(() => {})
    return () => { active = false }
  }, [])


  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const recovery = params.get('recovery')
    if (!recovery) return
    if (recovery === 'linked') setCouponMessage('Lifetime Pro is now protected by your CactusByte ID for clean-install recovery.')
    else if (recovery === 'restored') { setProAccess(true); setCouponMessage('Lifetime Pro access restored from your CactusByte ID.') }
    else if (recovery === 'claim-required') setCouponError('Current lifetime Pro access was not found on this device. Open Protect Pro Access from the legacy Rapid Takeoff install where Pro is active.')
    else if (recovery === 'restore-failed') setCouponError('Pro restore could not be verified. Sign in to the CactusByte ID that owns the linked lifetime entitlement and try again.')
    else if (recovery === 'claim-failed') setCouponError('Pro protection could not be completed. Request a fresh secure link and try again from this Pro-enabled device.')
    else if (recovery === 'invalid-link') setCouponError('That recovery link is invalid or incomplete.')
    params.delete('recovery')
    const query = params.toString()
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }, [])

  useEffect(() => {
    if (report && reportRef.current) reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [report])

  useEffect(() => () => files.forEach(f => URL.revokeObjectURL(f.preview)), [files])

  const sections = useMemo<ReportSection[]>(() => {
    if (!report) return []
    const parsed: ReportSection[] = []
    let current: ReportSection = { title: 'Rapid Matrix Report', lines: [] }
    report.split('\n').forEach(raw => {
      const line = raw.trim()
      const heading = line.match(/^#{1,3}\s+(.+)$/)
      if (heading) {
        if (current.lines.length || current.title !== 'Rapid Matrix Report') parsed.push(current)
        current = { title: heading[1].trim(), lines: [] }
      } else if (line) current.lines.push(line)
    })
    if (current.lines.length || current.title !== 'Rapid Matrix Report') parsed.push(current)
    return parsed
  }, [report])

  const confidence = useMemo(() => {
    const text = report || ''
    return {
      verified: (text.match(/\bVERIFIED\b/g) || []).length,
      probable: (text.match(/\bPROBABLE\b/g) || []).length,
      review: (text.match(/\bNEEDS REVIEW\b/g) || []).length,
      conflicts: sections.find(s => s.title.toLowerCase().includes('conflict radar'))?.lines.filter(l => !/^none\.?$/i.test(l)).length || 0,
    }
  }, [report, sections])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const newFiles = Array.from(e.target.files).map(file => ({ file, preview: URL.createObjectURL(file) }))
    setFiles(prev => [...prev, ...newFiles])
    setReport(null)
    setErrorMessage(null)
  }

  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index))

  const handleUpload = async () => {
    if (!files.length || !ceilingHeight) return alert('At least one blueprint and Ceiling Height are required.')
    setLoading(true); setReport(null); setErrorMessage(null)
    const formData = new FormData()
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
    try {
      for (const f of files) {
        formData.append('files', f.file.type.startsWith('image/') ? await imageCompression(f.file, options) : f.file)
      }
      formData.append('trade', trade); formData.append('ceilingHeight', ceilingHeight)
      formData.append('projectType', projectType); formData.append('location', location)
      formData.append('sqft', sqft); formData.append('floors', floors); formData.append('laborRate', laborRate); formData.append('scale', scale)
      const response = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await response.json()
      if (response.ok) setReport(data.data)
      else setErrorMessage(data.error || 'Unknown server error.')
    } catch {
      setErrorMessage('Network Timeout: the blueprint set took too long to process. Try fewer or smaller files.')
    } finally { setLoading(false) }
  }

  const cleanText = (text: string) => text.replace(/\*\*/g, '').replace(/\*/g, '').trim()
  const handlePrint = () => window.print()
  const handleEmail = () => {
    if (!report) return
    window.location.href = `mailto:?subject=${encodeURIComponent(`Rapid Takeoff Matrix - ${trade} (${projectType})`)}&body=${encodeURIComponent(report)}`
  }

  const redeemCoupon = async () => {
    if (!couponCode.trim()) { setCouponError('Enter your Rapid Takeoff coupon code.'); return }
    setCouponBusy(true); setCouponError(null); setCouponMessage(null)
    try {
      const response = await fetch('/api/coupon/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: couponCode }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(String(data?.error || 'Coupon redemption failed.'))
      setProAccess(true); setCouponCode(''); setCouponOpen(false)
      setCouponMessage('Lifetime Pro access activated on this device.')
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : 'Coupon redemption failed.')
    } finally { setCouponBusy(false) }
  }

  const jumpTo = (title: string) => {
    document.getElementById(`section-${slug(title)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-zinc-950 font-sans text-zinc-100">
      <div className="w-full max-w-3xl mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        <span>Rapid Matrix Engine™</span><span>v0.3.0</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-3xl p-6 md:p-8 mb-6">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase">Rapid<span className="text-orange-500">Takeoff</span>™</h1>
          <p className="text-xs text-zinc-500 mt-2">Evidence-backed takeoffs powered by ProofTrace™, SheetLink™, Conflict Radar™ and Confidence Matrix™.</p>
        </div>

        <section className={`mb-6 rounded-xl border p-4 ${proAccess ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-orange-500/40 bg-orange-950/20'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${proAccess ? 'text-emerald-400' : 'text-orange-400'}`}>{proAccess ? 'Pro Access Active' : 'Have a Pro coupon?'}</div>
              <p className="mt-1 text-sm text-zinc-300">{proAccess ? 'Lifetime Rapid Takeoff Pro access is active on this device. Protect it with your CactusByte ID before any reinstall or signing migration.' : 'Redeem a single-use code for lifetime Pro, or restore Pro that was already linked to your CactusByte ID.'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {proAccess ? <button type="button" onClick={() => window.location.assign(`${CACTUSBYTE_RECOVERY_URL}?mode=claim`)} className="min-h-12 rounded-lg border border-emerald-400/70 bg-emerald-500 px-5 font-black text-zinc-950 hover:bg-emerald-400">Protect Pro Access</button> : <>
                <button type="button" onClick={() => { setCouponOpen(value => !value); setCouponError(null) }} className="min-h-12 rounded-lg border border-orange-400 bg-orange-500 px-5 font-black text-zinc-950 shadow-lg shadow-orange-950/40 hover:bg-orange-400">Free Pro Access Coupon</button>
                <button type="button" onClick={() => window.location.assign(`${CACTUSBYTE_RECOVERY_URL}?mode=restore`)} className="min-h-12 rounded-lg border border-zinc-600 bg-zinc-800 px-5 font-black text-zinc-100 hover:border-orange-400/60">Restore Pro Access</button>
              </>}
            </div>
          </div>
          {couponOpen && !proAccess && <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input aria-label="Rapid Takeoff coupon code" autoCapitalize="characters" autoComplete="off" spellCheck={false} value={couponCode} onChange={event => setCouponCode(event.target.value.toUpperCase())} onKeyDown={event => { if (event.key === 'Enter') void redeemCoupon() }} placeholder="RT-PRO-XXXX-XXXX-XXXX-XXXX" className="field" />
            <button type="button" disabled={couponBusy} onClick={() => void redeemCoupon()} className="min-h-12 rounded-lg bg-orange-500 px-5 font-black text-zinc-950 hover:bg-orange-400 disabled:opacity-50">{couponBusy ? 'Activating…' : 'Activate Pro'}</button>
          </div>}
          {couponError && <p role="alert" className="mt-3 text-sm font-bold text-red-400">{couponError}</p>}
          {couponMessage && <p role="status" className="mt-3 text-sm font-bold text-emerald-400">{couponMessage}</p>}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <select className="field" value={trade} onChange={e => setTrade(e.target.value)}>
            {['General Contractor','Architect','Carpenter / Framer','Concrete & Masonry','Electrician','Excavator','Flooring Specialist','HVAC Technician','Insulation Contractor','Landscaper','Low Voltage / Security','Painter','Plumber','Roofing Contractor','Siding Contractor','Structural Engineer','Boilermaker','Carpet / Linoleum Installer','Crane Operator','Dredger','Elevator Mechanic','Fence Contractor / Fencer','Glazier','Heavy Equipment Operator','Ironworker / Steel Erector','Construction Laborer','Lineman / Power Line Technician','Millwright','Pile Driver','Pipefitter / Steamfitter','Pipelayer','Plasterer','Sheet Metal Worker','Sign Display Worker','Steel Fixer / Rebar Installer','Teamster / Construction Hauling','Welder'].map(v => <option key={v}>{v}</option>)}
          </select>
          <input className="field" placeholder="Ceiling Height *" value={ceilingHeight} onChange={e => setCeilingHeight(e.target.value)} />
          <input className="field" placeholder="Project Type" value={projectType} onChange={e => setProjectType(e.target.value)} />
          <select className="field" value={scale} onChange={e => setScale(e.target.value)}>
            {['1/8" = 1\'0"','1/4" = 1\'0"','1/2" = 1\'0"','1" = 1\'0"','1:50','1:100'].map(v => <option key={v}>{v}</option>)}
          </select>
          <input className="field" placeholder="Total SqFt (Optional)" value={sqft} onChange={e => setSqft(e.target.value)} />
          <input className="field" placeholder="Number of Floors (Optional)" value={floors} onChange={e => setFloors(e.target.value)} />
          <input className="field" placeholder="Location (Optional)" value={location} onChange={e => setLocation(e.target.value)} />
          <input className="field" placeholder="Local Labor Rate (Optional)" value={laborRate} onChange={e => setLaborRate(e.target.value)} />
        </div>

        <div className="flex gap-4 mb-4">
          <label className="flex-1 border-2 border-orange-500/50 p-6 rounded-xl text-orange-500 text-center font-bold cursor-pointer hover:bg-orange-500/10">Take Blueprint Pics<input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} /></label>
          <label className="flex-1 border-2 border-dashed border-zinc-700 p-6 rounded-xl text-zinc-400 text-center font-bold cursor-pointer hover:bg-zinc-800">Upload Files<input type="file" multiple className="hidden" onChange={handleFileChange} /></label>
        </div>

        {!!files.length && <div className="flex flex-wrap gap-4 mb-6 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50">{files.map((f,i) => <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-700"><img src={f.preview} alt={`Upload ${i+1}`} className="object-cover w-full h-full"/><button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full w-5 h-5 text-xs font-bold">×</button></div>)}</div>}

        <button onClick={handleUpload} disabled={loading || !files.length} className="w-full bg-orange-500 text-zinc-950 font-black py-4 rounded-lg uppercase tracking-wider hover:bg-orange-400 disabled:opacity-50">
          {loading ? 'Rapid Matrix Engine™ analyzing…' : 'Run Rapid Matrix Engine™'}
        </button>
      </div>

      {(report || errorMessage) && <div ref={reportRef} className="w-full max-w-3xl">
        {errorMessage && <div className="text-red-400 font-bold p-4 bg-red-950/30 border border-red-900/50 rounded-xl mb-4">{errorMessage}</div>}
        {report && <>
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-2xl mb-4">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div><div className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">Rapid Review Console™</div><h2 className="text-xl font-black mt-1">Verification dashboard</h2></div>
              <div className="flex gap-2"><button onClick={handlePrint} className="mini-btn">PDF / Print</button><button onClick={handleEmail} className="mini-btn">Email</button></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <Metric label="Verified" value={confidence.verified} tone="green" />
              <Metric label="Probable" value={confidence.probable} tone="amber" />
              <Metric label="Needs Review" value={confidence.review} tone="red" />
              <Metric label="Radar Items" value={confidence.conflicts} tone="orange" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {REVIEW_SECTIONS.filter(title => sections.some(s => normalizeTitle(s.title).includes(normalizeTitle(title)))).map(title => <button key={title} onClick={() => jumpTo(sections.find(s => normalizeTitle(s.title).includes(normalizeTitle(title)))?.title || title)} className="text-left text-[10px] font-black uppercase tracking-wider p-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-orange-500/50">{title}</button>)}
            </div>
          </section>

          <div className="space-y-4">
            {sections.map((section,index) => <section id={`section-${slug(section.title)}`} key={`${section.title}-${index}`} className="scroll-mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-7 shadow-xl">
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">{sectionEyebrow(section.title)}</div>
              <h3 className="text-base md:text-lg font-black text-orange-500 uppercase tracking-widest border-b border-zinc-800 pb-3 mb-4">{cleanText(section.title)}</h3>
              <div className="space-y-3">{section.lines.map((line,i) => renderLine(line,i,cleanText))}</div>
            </section>)}
          </div>
        </>}
      </div>}
    </main>
  )
}

function Metric({label,value,tone}:{label:string;value:number;tone:string}) {
  const toneClass = tone === 'green' ? 'text-green-400 border-green-500/20' : tone === 'amber' ? 'text-amber-400 border-amber-500/20' : tone === 'red' ? 'text-red-400 border-red-500/20' : 'text-orange-400 border-orange-500/20'
  return <div className={`rounded-xl border bg-zinc-950 p-4 ${toneClass}`}><div className="text-2xl font-black">{value}</div><div className="text-[9px] uppercase tracking-widest text-zinc-500 mt-1">{label}</div></div>
}

function renderLine(line:string,i:number,clean:(s:string)=>string) {
  const trimmed = line.trim()
  if (!trimmed || /^\|?[-:\|\s]+\|?$/.test(trimmed)) return null
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map(clean).filter(Boolean)
    if (!parts.length || parts.join(' ').toLowerCase().includes('prooftrace source confidence confidence reason')) return null
    return <div key={i} className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4"><div className="font-extrabold text-orange-400 text-sm mb-3">{parts[0]}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{parts.slice(1).map((val,idx) => <div key={idx} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800"><span className="text-xs text-zinc-200 font-semibold">{decorateConfidence(val)}</span></div>)}</div></div>
  }
  const upper = trimmed.toUpperCase()
  const confidenceClass = upper.includes('NEEDS REVIEW') ? 'border-red-500/30 bg-red-950/15' : upper.includes('PROBABLE') ? 'border-amber-500/30 bg-amber-950/10' : upper.includes('VERIFIED') ? 'border-green-500/30 bg-green-950/10' : 'border-zinc-800 bg-zinc-950/40'
  if (/^[-•]\s*/.test(trimmed) || upper.includes('NEEDS REVIEW') || upper.includes('PROBABLE') || upper.includes('VERIFIED')) return <div key={i} className={`p-3 rounded-lg border ${confidenceClass} text-sm text-zinc-300 leading-relaxed`}>{decorateConfidence(clean(trimmed.replace(/^[-•]\s*/,'')))}</div>
  if (trimmed.includes(':')) { const [label,...rest] = trimmed.split(':'); return <div key={i} className="flex flex-col sm:flex-row sm:justify-between gap-1 p-3 rounded-lg border border-zinc-800 bg-zinc-950/40 text-sm"><span className="text-zinc-500 font-bold uppercase text-xs tracking-wider">{clean(label)}</span><span className="text-zinc-200 font-semibold">{decorateConfidence(clean(rest.join(':')))}</span></div> }
  return <p key={i} className="text-sm text-zinc-300 leading-relaxed">{decorateConfidence(clean(trimmed))}</p>
}

function decorateConfidence(text:string) {
  const pieces = text.split(/(NEEDS REVIEW|PROBABLE|VERIFIED)/g)
  return <>{pieces.map((part,i) => part === 'VERIFIED' ? <strong key={i} className="text-green-400">VERIFIED</strong> : part === 'PROBABLE' ? <strong key={i} className="text-amber-400">PROBABLE</strong> : part === 'NEEDS REVIEW' ? <strong key={i} className="text-red-400">NEEDS REVIEW</strong> : part)}</>
}

function normalizeTitle(value:string) { return value.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim() }
function slug(value:string) { return normalizeTitle(value).replace(/\s+/g,'-') }
function sectionEyebrow(title:string) {
  const t = title.toLowerCase()
  if (t.includes('prooftrace')) return 'ProofTrace™ evidence layer'
  if (t.includes('sheetlink')) return 'SheetLink™ reconciliation layer'
  if (t.includes('conflict radar')) return 'Conflict Radar™ risk layer'
  if (t.includes('confidence')) return 'Confidence Matrix™ verification layer'
  if (t.includes('missing')) return 'Contractor verification required'
  return 'Rapid Matrix Engine™ output'
}

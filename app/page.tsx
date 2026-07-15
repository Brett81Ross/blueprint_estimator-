'use client'

import { useState, useEffect, useRef } from 'react'
import imageCompression from 'browser-image-compression'

export default function Home(props: any) {
  const [files, setFiles] = useState<File[]>([])
  const [trade, setTrade] = useState('General Contractor')
  const [ceilingHeight, setCeilingHeight] = useState('')
  const [projectType, setProjectType] = useState('Residential')
  const [location, setLocation] = useState('')
  const [sqft, setSqft] = useState('')
  const [floors, setFloors] = useState('')
  const [laborRate, setLaborRate] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (report && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [report])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
      setReport(null) 
      setErrorMessage(null)
    }
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove))
  }

  const handleUpload = async () => {
    if (files.length === 0 || !ceilingHeight) return alert("Required fields missing.");
    
    setLoading(true); setReport(null); setErrorMessage(null);

    const formData = new FormData()
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }

    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const compressed = await imageCompression(file, options);
          formData.append('files', compressed);
        } else {
          formData.append('files', file); 
        }
      }
      formData.append('trade', trade); formData.append('ceilingHeight', ceilingHeight);
      formData.append('projectType', projectType); formData.append('location', location);
      formData.append('sqft', sqft); formData.append('floors', floors); formData.append('laborRate', laborRate);

      const response = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await response.json()
      if (response.ok) setReport(data.data) 
      else setErrorMessage(data.error)
    } catch (e: any) {
      setErrorMessage("System error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-zinc-950 font-sans text-zinc-100">
      <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-3xl p-6 md:p-8">
        <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase mb-6">Blueprint <span className="text-orange-500">AI Estimator</span></h1>
        
        <div className="space-y-4 mb-6">
          <select className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" value={trade} onChange={(e) => setTrade(e.target.value)}>
            <option>General Contractor</option><option>Electrical</option><option>Plumbing</option><option>HVAC</option>
          </select>
          <input className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" placeholder="Ceiling Height *" value={ceilingHeight} onChange={(e) => setCeilingHeight(e.target.value)} />
          <select className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
            <option>Residential</option><option>Commercial</option>
          </select>
          <input className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" placeholder="e.g., 2500" value={sqft} onChange={(e) => setSqft(e.target.value)} />
          <input className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" placeholder="e.g., 2" value={floors} onChange={(e) => setFloors(e.target.value)} />
          <input className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" placeholder="City, State" value={location} onChange={(e) => setLocation(e.target.value)} />
          <input className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" placeholder="e.g., $65/hr" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} />
        </div>

        <div className="flex gap-4 mb-6">
          <label className="flex-1 border-2 border-orange-500/50 p-6 rounded-xl text-orange-500 text-center font-bold cursor-pointer">Take Blueprint Pics<input type="file" className="hidden" onChange={handleFileChange} /></label>
          <label className="flex-1 border-2 border-dashed border-zinc-700 p-6 rounded-xl text-zinc-400 text-center font-bold cursor-pointer">Upload Files<input type="file" multiple className="hidden" onChange={handleFileChange} /></label>
        </div>
        
        <button onClick={handleUpload} disabled={loading || files.length === 0} className="w-full bg-orange-500 text-zinc-950 font-black py-4 rounded-lg uppercase">
          {loading ? 'Processing...' : 'Generate Takeoff Report'}
        </button>
      </div>

      {(report || errorMessage) && (
        <div ref={reportRef} className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-6">
          {errorMessage && <div className="text-red-400">{errorMessage}</div>}
          {report && (
            <div className="space-y-2">
              {report.split('\n').map((line, i) => (
                <p key={i} className="text-sm text-zinc-300 py-1">{line}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

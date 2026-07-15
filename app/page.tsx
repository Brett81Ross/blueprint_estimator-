'use client'

import { useState, useEffect, useRef } from 'react'
import imageCompression from 'browser-image-compression'

export default function Home(props: any) {
  // Form State
  const [files, setFiles] = useState<File[]>([])
  const [trade, setTrade] = useState('General Contractor')
  const [ceilingHeight, setCeilingHeight] = useState('')
  const [projectType, setProjectType] = useState('Residential')
  const [location, setLocation] = useState('')
  const [sqft, setSqft] = useState('')
  const [floors, setFloors] = useState('')
  const [laborRate, setLaborRate] = useState('')
  
  // App State
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
    if (files.length === 0 || !ceilingHeight) {
      alert("At least one blueprint and Ceiling Height are required.")
      return
    }
    
    setLoading(true)
    setReport(null)
    setErrorMessage(null)

    const formData = new FormData()
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    }

    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const compressedFile = await imageCompression(file, options);
          formData.append('files', compressedFile);
        } else {
          formData.append('files', file); 
        }
      }
      
      formData.append('trade', trade)
      formData.append('ceilingHeight', ceilingHeight)
      formData.append('projectType', projectType)
      formData.append('location', location)
      formData.append('sqft', sqft)
      formData.append('floors', floors)
      formData.append('laborRate', laborRate)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()

      if (response.ok) {
        setReport(data.data) 
      } else {
        setErrorMessage(data.error || `Server Error: Status ${response.status}`)
      }
    } catch (error: any) {
      setErrorMessage(`Frontend/Network Error: ${error?.message || 'Failed to communicate with the server.'}`)
    } finally {
      setLoading(false)
    }
  }

  const triggerPdfDownload = () => {
    window.print()
  }

  // AGGRESSIVE TEXT CLEANER - NOW REMOVING AI ARTIFACTS AND LATEX
  const formatReportText = (text: string) => {
    return text
      .replace(/###\s+/g, '') 
      .replace(/\*\*/g, '')   
      .replace(/\|/g, '')     
      .replace(/:{3,}/g, '')  // Removes ":::" and bar artifacts
      .replace(/-{3,}/g, '')  
      .replace(/\\text\{([^}]+)\}/gi, ' $1 ') 
      .replace(/\\times/gi, 'x')              
      .replace(/\^2/g, ' sq ft')              
      .replace(/\^3/g, ' cubic yds')          
      .replace(/\\/g, '')                     
      .replace(/\$(?![0-9])/g, '')            
      .replace(/^\s*\*\s*(?:\*\s*)?/gm, '')   
      .replace(/ +/g, ' ')                    
      .trim();
  }

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-zinc-950 font-sans text-zinc-100 selection:bg-orange-500 selection:text-white">
      
      <style jsx global>{`
        @media print {
          body, main, html { background: #ffffff !important; color: #000000 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-3xl mt-4 overflow-hidden relative">
        <div className="bg-zinc-950 border-b border-zinc-800 p-6 flex items-center justify-between">
          <h1 className="text-xl font-black tracking-widest text-white uppercase">Blueprint <span className="text-orange-500">AI Estimator</span></h1>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">Select Trade *</label>
              <select value={trade} onChange={(e) => setTrade(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white">
                <option>Electrical</option><option>Low Voltage</option><option>Plumbing</option><option>HVAC</option><option>Concrete</option><option>Framing</option><option>Roofing</option><option>General Contractor</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase text-orange-400">Ceiling Height *</label>
              <input type="text" placeholder="e.g., 10 ft" value={ceilingHeight} onChange={(e) => setCeilingHeight(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">Project Type</label>
              <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white">
                <option>Residential</option><option>Commercial</option><option>Industrial</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">Total SqFt (Optional)</label>
              <input type="number" placeholder="e.g., 2500" value={sqft} onChange={(e) => setSqft(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">Number of Floors (Optional)</label>
              <input type="number" placeholder="e.g., 2" value={floors} onChange={(e) => setFloors(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">Location (Optional)</label>
              <input type="text" placeholder="City, State" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">Local Labor Rate (Optional)</label>
              <input type="text" placeholder="e.g., $65/hr" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold text-zinc-400 uppercase">Upload Plans *</label>
            <div className="flex gap-4 w-full">
              <label className="flex-1 flex flex-col items-center justify-center py-6 border-2 border-orange-500/50 rounded-xl cursor-pointer bg-orange-500/10 text-orange-500">
                <span className="font-bold text-sm text-center">Take Blueprint Pics</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              </label>
              <label className="flex-1 flex flex-col items-center justify-center py-6 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer bg-zinc-950/50 text-zinc-400">
                <span className="font-bold text-sm text-center">Upload Files (Multi)</span>
                <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            {files.length > 0 && (
              <div className="flex flex-col gap-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <p className="text-sm text-zinc-300 truncate max-w-[80%]">📄 {file.name}</p>
                    <button onClick={() => removeFile(index)} className="text-red-500 font-bold px-2">X</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleUpload} disabled={files.length === 0 || !ceilingHeight || loading} className="w-full bg-orange-500 text-zinc-950 font-black text-lg py-5 rounded-xl uppercase tracking-wider">
            {loading ? 'Processing...' : 'Generate Takeoff Report'}
          </button>
        </div>
      </div>

      {(report || errorMessage) && (
        <div ref={reportRef} className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-8 mt-6">
          <div className="flex justify-between mb-8 border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-black text-white uppercase">Estimate Dashboard</h2>
            <button onClick={triggerPdfDownload} className="bg-zinc-100 text-zinc-900 font-bold text-xs py-2 px-4 rounded-lg">Download PDF</button>
          </div>
          {errorMessage && <div className="text-red-400 text-sm">{errorMessage}</div>}
          {report && (
            <div className="flex flex-col gap-4">
              {formatReportText(report).split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith('Project Overview')) return <div key={i} className="mt-8 mb-2 px-4 py-2 bg-blue-500/10 rounded-lg inline-block"><h3 className="text-lg font-black text-blue-400 uppercase">🏗️ {trimmed}</h3></div>;
                if (trimmed.startsWith('Material Takeoff')) return <div key={i} className="mt-8 mb-2 px-4 py-2 bg-emerald-500/10 rounded-lg inline-block"><h3 className="text-lg font-black text-emerald-400 uppercase">🧱 {trimmed}</h3></div>;
                if (trimmed.startsWith('Labor Takeoff')) return <div key={i} className="mt-8 mb-2 px-4 py-2 bg-amber-500/10 rounded-lg inline-block"><h3 className="text-lg font-black text-amber-400 uppercase">👷 {trimmed}</h3></div>;
                if (trimmed.startsWith('Cost Breakdown')) return <div key={i} className="mt-10 mb-2 px-4 py-2 bg-green-500/10 rounded-lg inline-block"><h3 className="text-xl font-black text-green-400 uppercase">💰 {trimmed}</h3></div>;
                if (trimmed.startsWith('Timeline')) return <div key={i} className="mt-8 mb-2 px-4 py-2 bg-purple-500/10 rounded-lg inline-block"><h3 className="text-lg font-black text-purple-400 uppercase">⏳ {trimmed}</h3></div>;
                if (trimmed.startsWith('Missing Information')) return <div key={i} className="mt-8 mb-2 px-4 py-2 bg-red-500/10 rounded-lg inline-block"><h3 className="text-lg font-black text-red-400 uppercase">⚠️ {trimmed}</h3></div>;

                if (trimmed.includes(':')) {
                  const [title, ...rest] = trimmed.split(':');
                  const value = rest.join(':').trim(); 
                  const isMoney = /\$[0-9]/.test(value);
                  return (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl gap-2">
                      <span className="text-zinc-500 font-bold text-xs uppercase">{title.trim()}</span>
                      <span className={isMoney ? "bg-emerald-400/10 text-emerald-400 font-black px-3 py-1 rounded" : "text-zinc-200 font-medium text-sm"}>{value}</span>
                    </div>
                  );
                }
                return <p key={i} className="text-sm text-zinc-400 font-medium px-2">{trimmed}</p>;
              })}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

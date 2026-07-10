'use client'

import { useState } from 'react'

export default function Home() {
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
    if (files.length <= 1) {
      setReport(null)
      setErrorMessage(null)
    }
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
    files.forEach((file) => {
      formData.append('files', file)
    })
    
    formData.append('trade', trade)
    formData.append('ceilingHeight', ceilingHeight)
    formData.append('projectType', projectType)
    formData.append('location', location)
    formData.append('sqft', sqft)
    formData.append('floors', floors)
    formData.append('laborRate', laborRate)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()

      if (response.ok) {
        setReport(data.result)
      } else {
        setErrorMessage(data.error || `Server Error: Status ${response.status}`)
      }
    } catch (error: any) {
      setErrorMessage(`Frontend/Network Error: ${error?.message || 'Failed to communicate with the server.'}`)
    } finally {
      setLoading(false)
    }
  }

  // UI Cleaner Helper: Cleans out markdown syntax artifacts dynamically
  const formatReportText = (text: string) => {
    return text
      .replace(/###\s+/g, '') // Cleans layout hashtags
      .replace(/\*\*/g, '')   // Cleans old bold indicators
      .replace(/\|/g, '')     // Cleans loose table dividers
      .replace(/-{3,}/g, '')  // Cleans markdown horizontal lines
  }

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-zinc-950 font-sans text-zinc-100 selection:bg-orange-500 selection:text-white">
      <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-3xl mt-4 md:mt-8 overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="bg-zinc-950 border-b border-zinc-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase">
              Blueprint <span className="text-orange-500">AI Estimator</span>
            </h1>
          </div>
          <span className="text-xs font-bold bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full border border-orange-500/20">
            PRO TOOL
          </span>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-8">
          
          {/* Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Trade *</label>
              <select 
                value={trade} onChange={(e) => setTrade(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option>Electrical</option>
                <option>Plumbing</option>
                <option>HVAC</option>
                <option>Concrete</option>
                <option>Framing</option>
                <option>Roofing</option>
                <option>General Contractor</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-orange-400">Ceiling Height *</label>
              <input 
                type="text" placeholder="e.g., 10 ft" value={ceilingHeight} onChange={(e) => setCeilingHeight(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Project Type</label>
              <select 
                value={projectType} onChange={(e) => setProjectType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option>Residential</option>
                <option>Commercial</option>
                <option>Industrial</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total SqFt (Optional)</label>
              <input 
                type="number" placeholder="e.g., 2500" value={sqft} onChange={(e) => setSqft(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Number of Floors (Optional)</label>
              <input 
                type="number" placeholder="e.g., 2" value={floors} onChange={(e) => setFloors(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Location (Optional)</label>
              <input 
                type="text" placeholder="City, State" value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Local Labor Rate (Optional)</label>
              <input 
                type="text" placeholder="e.g., $65/hr" value={laborRate} onChange={(e) => setLaborRate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <hr className="border-zinc-800" />

          {/* Upload Blocks */}
          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Upload Plans *</label>
            
            <div className="flex gap-4 w-full">
              <label className="flex-1 flex flex-col items-center justify-center py-6 border-2 border-orange-500/50 rounded-xl cursor-pointer bg-orange-500/10 hover:bg-orange-500/20 transition-all text-orange-500 group">
                <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="font-bold text-sm tracking-wide text-center">Take Blueprint Pics</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              </label>

              <label className="flex-1 flex flex-col items-center justify-center py-6 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer bg-zinc-950/50 hover:bg-zinc-800 transition-all text-zinc-400 group hover:text-white">
                <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                <span className="font-bold text-sm tracking-wide text-center">Upload Files (Multi)</span>
                <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            {/* List Selection Items */}
            {files.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <p className="text-sm text-zinc-300 font-bold truncate max-w-[80%]">📄 {file.name}</p>
                    <button 
                      onClick={() => removeFile(index)}
                      className="text-red-500/70 hover:text-red-500 font-bold px-2 py-1 bg-red-500/10 rounded-md transition-colors"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={files.length === 0 || !ceilingHeight || loading}
            className="w-full bg-orange-500 text-zinc-950 font-black text-lg py-5 px-4 rounded-xl disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed hover:bg-orange-400 active:scale-[0.98] transition-all duration-200 shadow-[0_0_20px_rgba(249,115,22,0.2)] disabled:shadow-none uppercase tracking-wider"
          >
            {loading ? '⚙️ Processing Assets...' : 'Generate Takeoff Report'}
          </button>
        </div>

        {/* MODERNIZED RESULTS LAYOUT CONTAINER */}
        {(report || errorMessage) && (
          <div className="p-6 md:p-8 bg-zinc-950 border-t border-zinc-800">
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
              Estimate Dashboard
            </h2>
            
            {errorMessage && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-medium text-sm whitespace-pre-wrap">
                <div className="font-bold text-red-500 uppercase tracking-wider text-xs mb-1">⚠️ Error Encountered</div>
                {errorMessage}
              </div>
            )}

            {report && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-inner text-zinc-200 leading-relaxed space-y-4">
                {/* Dynamically splits data string paragraphs into cleanly stylized typography items */}
                {formatReportText(report).split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  
                  if (!trimmed) return <div key={i} className="h-2"></div>;

                  // Transforms key titles into high-contrast section tags
                  if (
                    trimmed.startsWith('Project Overview') || 
                    trimmed.startsWith('Material Takeoff') || 
                    trimmed.startsWith('Labor Takeoff') || 
                    trimmed.startsWith('Cost Breakdown') || 
                    trimmed.startsWith('Timeline') || 
                    trimmed.startsWith('Missing Information')
                  ) {
                    return (
                      <h3 key={i} className="text-md font-black text-orange-400 uppercase tracking-widest border-b border-zinc-800 pb-2 mt-6 mb-3 first:mt-2">
                        {trimmed}
                      </h3>
                    );
                  }

                  // Styles standard informational field readouts
                  if (trimmed.includes(':')) {
                    const [title, value] = trimmed.split(/:(.+)/);
                    return (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center py-1 border-b border-zinc-800/40 text-sm">
                        <span className="font-bold text-zinc-400 w-48 shrink-0">{title.trim()}</span>
                        <span className="text-zinc-100 font-medium mt-0.5 sm:mt-0">{value?.trim()}</span>
                      </div>
                    );
                  }

                  // Default line parser fallback
                  return <p key={i} className="text-sm text-zinc-300 font-normal pl-1">{trimmed}</p>;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

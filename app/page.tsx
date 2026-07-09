'use client'

import { useState } from 'react'

export default function Home() {
  // Form State
  const [file, setFile] = useState<File | null>(null)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setReport(null) 
    }
  }

  const handleUpload = async () => {
    if (!file || !ceilingHeight) {
      alert("Blueprint and Ceiling Height are required.")
      return
    }
    
    setLoading(true)
    setReport(null)

    const formData = new FormData()
    formData.append('file', file)
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
        setReport(`Error: ${data.error}`)
      }
    } catch (error) {
      setReport("An unexpected error occurred while processing the blueprint.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-zinc-950 font-sans text-zinc-100 selection:bg-orange-500 selection:text-white">
      <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-3xl mt-4 md:mt-8 overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="bg-zinc-950 border-b border-zinc-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👷‍♂️</span>
            <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase">
              Blueprint <span className="text-orange-500">AI Estimator</span>
            </h1>
          </div>
          <span className="text-xs font-bold bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full border border-orange-500/20">
            PRO TOOL
          </span>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-8">
          
          {/* STEP 1 & 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Select Trade *</label>
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
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider text-orange-400">Ceiling Height *</label>
              <input 
                type="text" placeholder="e.g., 10 ft" value={ceilingHeight} onChange={(e) => setCeilingHeight(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Project Type</label>
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
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Total SqFt (Optional)</label>
              <input 
                type="number" placeholder="e.g., 2500" value={sqft} onChange={(e) => setSqft(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Location (Optional)</label>
              <input 
                type="text" placeholder="City, State" value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Local Labor Rate (Optional)</label>
              <input 
                type="text" placeholder="e.g., $65/hr" value={laborRate} onChange={(e) => setLaborRate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <hr className="border-zinc-800" />

          {/* STEP 3: UPLOAD */}
          <div className="flex flex-col gap-4">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Upload Plans *</label>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer bg-zinc-950/50 hover:bg-zinc-800 hover:border-orange-500 transition-all duration-200 group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-12 h-12 mb-4 text-zinc-500 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <p className="mb-2 text-sm text-zinc-300 font-semibold group-hover:text-white transition-colors">
                  Tap to upload blueprint or drag & drop
                </p>
                <p className="text-xs text-zinc-500">PDF, PNG, or JPG up to 10MB</p>
              </div>
              <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={handleFileChange} />
            </label>

            {file && (
              <div className="flex items-center justify-between p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <p className="text-sm text-orange-400 font-bold truncate">📄 {file.name}</p>
                <p className="text-xs text-orange-500/70 uppercase">Ready</p>
              </div>
            )}
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={handleUpload}
            disabled={!file || !ceilingHeight || loading}
            className="w-full bg-orange-500 text-zinc-950 font-black text-lg py-5 px-4 rounded-xl disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed hover:bg-orange-400 active:scale-[0.98] transition-all duration-200 shadow-[0_0_20px_rgba(249,115,22,0.2)] disabled:shadow-none uppercase tracking-wider"
          >
            {loading ? '⚙️ Analyzing Blueprint...' : 'Generate Takeoff Report'}
          </button>
        </div>

        {/* RESULTS SECTION */}
        {report && (
          <div className="p-6 md:p-8 bg-zinc-950 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-wide">Estimate Output</h2>
              <button className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors">
                ⬇ Download PDF
              </button>
            </div>
            {/* Prose formatting handles the Markdown tables nicely */}
            <div className="prose prose-invert prose-orange max-w-none text-zinc-300 whitespace-pre-wrap">
              {report}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

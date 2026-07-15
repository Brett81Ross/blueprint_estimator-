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

  // Anchor target reference for the scroll tracking engine
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

  // AGGRESSIVE TEXT CLEANER
  const formatReportText = (text: string) => {
    return text
      .replace(/###\s+/g, '') 
      .replace(/\*\*/g, '')   
      .replace(/\|/g, '')     
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
          body, main, html {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-w-none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-title {
            color: #f97316 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-border {
            border-color: #e4e4e7 !important;
          }
        }
      `}</style>

      {/* Main Wrapper Box */}
      <div className="no-print bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-3xl mt-4 md:mt-8 overflow-hidden relative">
        
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
                <option>Low Voltage</option>
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
            className="w-full bg-orange-500 text-zinc-950 font-black text-lg py-5 px-4 rounded-xl disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed hover:bg-orange-400 active:scale-[0.98] transition-all duration-200 shadow-[0_0_20px_rgba(249,115,22,0.2)] disabled:shadow-none uppercase tracking-wider flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="flex items-center gap-3 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="font-black tracking-wide">Generating Takeoff Report</span>
                <span className="relative flex h-4 w-4 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-50 scale-125"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 shadow-[0_0_10px_#10b981]"></span>
                </span>
              </div>
            ) : (
              'Generate Takeoff Report'
            )}
          </button>
        </div>
      </div>

      {/* NEW SAAS-STYLE DASHBOARD */}
      {(report || errorMessage) && (
        <div 
          ref={reportRef}
          className="print-area w-full max-w-3xl bg-zinc-950 border border-zinc-800 md:rounded-2xl p-4 md:p-8 mt-6 overflow-hidden relative shadow-2xl scroll-mt-6"
        >
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800 print-border">
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
              <span className="no-print w-2 h-8 bg-orange-500 rounded-full inline-block"></span>
              Estimate Dashboard
            </h2>
            <button 
              onClick={triggerPdfDownload}
              className="no-print bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-xs py-2.5 px-4 rounded-lg tracking-wider uppercase transition-colors shadow-sm"
            >
              ⬇️ Download PDF
            </button>
          </div>
          
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-medium text-sm whitespace-pre-wrap mb-4">
              <div className="font-bold text-red-500 uppercase tracking-wider text-xs mb-1">⚠️ Error Encountered</div>
              {errorMessage}
            </div>
          )}

          {report && (
            <div className="flex flex-col gap-4">
              {formatReportText(report).split('\n').map((line, i) => {
                const trimmed = line.trim();
                
                if (!trimmed) return null;

                // MODERN CARD HEADERS
                if (trimmed.startsWith('Project Overview')) return <div key={i} className="mt-8 mb-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg inline-block self-start"><h3 className="print-title text-lg font-black text-blue-400 uppercase tracking-widest">🏗️ {trimmed}</h3></div>;
                if (trimmed.startsWith('Material Takeoff')) return <div key={i} className="mt-8 mb-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg inline-block self-start"><h3 className="print-title text-lg font-black text-emerald-400 uppercase tracking-widest">🧱 {trimmed}</h3></div>;
                if (trimmed.startsWith('Labor Takeoff')) return <div key={i} className="mt-8 mb-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg inline-block self-start"><h3 className="print-title text-lg font-black text-amber-400 uppercase tracking-widest">👷 {trimmed}</h3></div>;
                if (trimmed.startsWith('Cost Breakdown')) return <div key={i} className="mt-10 mb-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg inline-block self-start"><h3 className="print-title text-xl font-black text-green-400 uppercase tracking-widest">💰 {trimmed}</h3></div>;
                if (trimmed.startsWith('Timeline')) return <div key={i} className="mt-8 mb-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg inline-block self-start"><h3 className="print-title text-lg font-black text-purple-400 uppercase tracking-widest">⏳ {trimmed}</h3></div>;
                if (trimmed.startsWith('Missing Information')) return <div key={i} className="mt-8 mb-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg inline-block self-start"><h3 className="print-title text-lg font-black text-red-400 uppercase tracking-widest">⚠️ {trimmed}</h3></div>;

                // STRUCTURED DATA ROWS
                if (trimmed.includes(':')) {
                  const [title, ...rest] = trimmed.split(':');
                  const value = rest.join(':').trim(); 
                  
                  // Money gets a glowing pill badge, regular text gets standard styling
                  const isMoney = /\$[0-9]/.test(value);

                  return (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors gap-2 sm:gap-4 print-border">
                      <span className="text-zinc-400 font-bold text-xs tracking-widest uppercase sm:w-1/3 shrink-0">{title.trim()}</span>
                      
                      {isMoney ? (
                        <span className="bg-emerald-400/10 text-emerald-400 font-black text-lg px-3 py-1 rounded-md border border-emerald-400/20 text-left sm:text-right self-start sm:self-auto">
                          {value}
                        </span>
                      ) : (
                        <span className="text-zinc-200 font-medium text-sm sm:text-base text-left sm:text-right">
                          {value}
                        </span>
                      )}
                    </div>
                  );
                }

                // REGULAR PARAGRAPH TEXT
                return <p key={i} className="text-sm text-zinc-400 font-medium px-2 leading-relaxed">{trimmed}</p>;
              })}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

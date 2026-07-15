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
    }
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove))
  }

  const handleUpload = async () => {
    if (files.length === 0 || !ceilingHeight) return alert("Required fields missing.");
    
    setLoading(true)
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
      setErrorMessage("System error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // UPDATED FORMATTER: More aggressive cleaning
  const formatReportText = (text: string) => {
    return text
      .replace(/###\s+/g, '') 
      .replace(/\*\*/g, '')   
      .replace(/\|/g, '')     
      .replace(/:{3,}/g, '')  
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
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-zinc-950 font-sans text-zinc-100">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl p-6 md:p-8">
        <h1 className="text-2xl font-black text-white uppercase mb-8">Blueprint <span className="text-orange-500">AI Estimator</span></h1>
        
        {/* Simplified Input Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <input className="bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm" value={trade} onChange={(e) => setTrade(e.target.value)} />
          <input className="bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm" placeholder="Ceiling Height *" value={ceilingHeight} onChange={(e) => setCeilingHeight(e.target.value)} />
        </div>
        <button onClick={handleUpload} className="w-full bg-orange-500 font-black py-4 rounded-xl uppercase">
          {loading ? 'Analyzing...' : 'Generate Report'}
        </button>
      </div>

      {report && (
        <div ref={reportRef} className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-8">
          {formatReportText(report).split('\n').map((line, i) => {
            if (!line.trim()) return null;
            // Clean section styling
            if (line.match(/(Overview|Takeoff|Cost|Timeline|Missing)/i)) {
              return <h3 key={i} className="text-xl font-bold text-orange-400 mt-8 mb-4 border-l-4 border-orange-500 pl-4">{line}</h3>;
            }
            if (line.includes(':')) {
              const [label, val] = line.split(':');
              return (
                <div key={i} className="flex justify-between py-2 border-b border-zinc-800 text-sm">
                  <span className="text-zinc-500 uppercase font-bold">{label}</span>
                  <span className={val.includes('$') ? "text-green-400 font-bold" : "text-zinc-200"}>{val}</span>
                </div>
              );
            }
            return <p key={i} className="text-zinc-300 py-1 text-sm">{line}</p>;
          })}
        </div>
      )}
    </main>
  )
}

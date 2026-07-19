'use client'

import { useState, useEffect, useRef } from 'react'
import imageCompression from 'browser-image-compression'

interface FileWithPreview {
  file: File;
  preview: string;
}

export default function Home(props: any) {
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

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (report && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [report])

  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }))
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
      setReport(null) 
      setErrorMessage(null)
    }
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove))
  }

  const handleUpload = async () => {
    if (files.length === 0 || !ceilingHeight) return alert("At least one blueprint and Ceiling Height are required.");
    
    setLoading(true); setReport(null); setErrorMessage(null);

    const formData = new FormData()
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }

    try {
      for (const f of files) {
        if (f.file.type.startsWith('image/')) {
          const compressed = await imageCompression(f.file, options);
          formData.append('files', compressed);
        } else {
          formData.append('files', f.file); 
        }
      }
      formData.append('trade', trade); formData.append('ceilingHeight', ceilingHeight);
      formData.append('projectType', projectType); formData.append('location', location);
      formData.append('sqft', sqft); formData.append('floors', floors); formData.append('laborRate', laborRate);
      formData.append('scale', scale);

      const response = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await response.json()
      
      if (response.ok) {
        setReport(data.data) 
      } else {
        // Renders the exact error message from the backend so you aren't blind
        setErrorMessage(data.error || "Unknown server error.")
      }
    } catch (e: any) {
      setErrorMessage("Network Timeout: Vercel killed the request because the blueprints took too long to process. Try uploading fewer images.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-zinc-950 font-sans text-zinc-100">
      <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-3xl p-6 md:p-8">
        <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase mb-6">Rapid<span className="text-orange-500">Takeoff</span></h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <select className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" value={trade} onChange={(e) => setTrade(e.target.value)}>
            <option>General Contractor</option>
            <option>Architect</option>
            <option>Carpenter / Framer</option>
            <option>Concrete & Masonry</option>
            <option>Electrician</option>
            <option>Excavator</option>
            <option>Flooring Specialist</option>
            <option>HVAC Technician</option>
            <option>Insulation Contractor</option>
            <option>Landscaper</option>
            <option>Low Voltage / Security</option>
            <option>Painter</option>
            <option>Plumber</option>
            <option>Roofing Contractor</option>
            <option>Siding Contractor</option>
            <option>Structural Engineer</option>
          </select>
          <input className="bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" placeholder="Ceiling Height *" value={ceilingHeight} onChange={(e) => setCeilingHeight(e.target.value)} />
          <input className="bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" placeholder="Project Type" value={projectType} onChange={(e) => setProjectType(e.target.value)} />
          <select className="w-full bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" value={scale} onChange={(e) => setScale(e.target.value)}>
            <option>1/8" = 1'0"</option>
            <option>1/4" = 1'0"</option>
            <option>1/2" = 1'0"</option>
            <option>1" = 1'0"</option>
            <option>1:50</option>
            <option>1:100</option>
          </select>
          <input className="bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" placeholder="Total SqFt (Optional)" value={sqft} onChange={(e) => setSqft(e.target.value)} />
          <input className="bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" placeholder="Number of Floors (Optional)" value={floors} onChange={(e) => setFloors(e.target.value)} />
          <input className="bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" placeholder="Location (Optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
          <input className="bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-white" placeholder="Local Labor Rate (Optional)" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} />
        </div>

        <div className="flex gap-4 mb-4">
          <label className="flex-1 border-2 border-orange-500/50 p-6 rounded-xl text-orange-500 text-center font-bold cursor-pointer hover:bg-orange-500/10">Take Blueprint Pics<input type="file" className="hidden" onChange={handleFileChange} /></label>
          <label className="flex-1 border-2 border-dashed border-zinc-700 p-6 rounded-xl text-zinc-400 text-center font-bold cursor-pointer hover:bg-zinc-800">Upload Files<input type="file" multiple className="hidden" onChange={handleFileChange} /></label>
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50">
            {files.map((f, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-700 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.preview} alt={`Upload preview ${i + 1}`} className="object-cover w-full h-full" />
                <button 
                  onClick={() => removeFile(i)} 
                  className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <button onClick={handleUpload} disabled={loading || files.length === 0} className="w-full bg-orange-500 text-zinc-950 font-black py-4 rounded-lg uppercase disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Processing...' : 'Generate Takeoff Report'}
        </button>
      </div>

      {(report || errorMessage) && (
        <div ref={reportRef} className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-6">
          {errorMessage && <div className="text-red-400 font-bold p-2 bg-red-950/20 rounded">{errorMessage}</div>}
          
          {report && (
            <div className="flex flex-col gap-6">
              {report.split('\n').map((line, i) => {
                if (line.includes('##') || line.match(/Overview|Takeoff|Cost|Timeline|Missing/i)) {
                  return (
                    <h3 key={i} className="text-md font-black text-orange-500 uppercase tracking-widest border-b border-zinc-700 pb-2 mt-4">
                      {line.replace(/#/g, '')}
                    </h3>
                  );
                }
                if (line.includes(':')) {
                  const [label, ...val] = line.split(':');
                  const valueText = val.join(':').trim();
                  const isMoney = /\$[0-9]/.test(valueText);
                  return (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                      <span className="text-zinc-500 font-bold text-xs uppercase tracking-wider">{label.trim()}</span>
                      <span className={`text-sm ${isMoney ? 'font-black text-green-400' : 'text-zinc-200 font-medium'}`}>
                        {valueText}
                      </span>
                    </div>
                  );
                }
                if (line.trim()) {
                  return <p key={i} className="text-sm text-zinc-400 font-normal leading-relaxed">{line}</p>;
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

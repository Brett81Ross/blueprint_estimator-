'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      // Clear previous report if a new file is selected
      setReport(null) 
    }
  }

  const handleUpload = async () => {
    if (!file) return
    
    setLoading(true)
    setReport(null)

    const formData = new FormData()
    formData.append('file', file)

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
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-start bg-gray-50 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl mt-10">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 tracking-tight">
          Blueprint Estimator
        </h1>

        <div className="flex flex-col gap-6">
          {/* Upload Dropzone */}
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200 ease-in-out">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <p className="mb-2 text-sm text-gray-600 font-semibold">
                Tap to upload blueprint
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, or PDF (Max 10MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileChange}
            />
          </label>

          {/* File Selection Feedback */}
          {file && (
            <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium">
                📄 Selected: {file.name}
              </p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            {loading ? 'Analyzing Blueprint...' : 'Generate Takeoff Report'}
          </button>
        </div>

        {/* Results Section */}
        {report && (
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Takeoff Analysis</h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {report}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    
    // This is where we will wire up the gemini-3.5-flash API route next!
    console.log("Blueprint ready for analysis:", file.name)
  }

  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Blueprint Estimator
        </h1>

        <div className="flex flex-col gap-4">
          {/* Upload Dropzone */}
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <p className="mb-2 text-sm text-gray-500 font-semibold">
                Tap to upload blueprint
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, or PDF</p>
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
            <p className="text-sm text-green-600 text-center font-medium">
              Selected: {file.name}
            </p>
          )}

          {/* Action Button */}
          <button
            onClick={handleUpload}
            disabled={!file}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Generate Takeoff Report
          </button>
        </div>
      </div>
    </main>
  )
}

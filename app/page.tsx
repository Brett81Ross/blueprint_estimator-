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
      <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-3xl

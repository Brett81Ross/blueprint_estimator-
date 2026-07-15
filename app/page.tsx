import imageCompression from 'browser-image-compression'; // ADD THIS AT THE TOP

// ... (keep all your state and other functions the same)

  const handleUpload = async () => {
    if (files.length === 0 || !ceilingHeight) {
      alert("At least one blueprint and Ceiling Height are required.")
      return
    }
    
    setLoading(true)
    setReport(null)
    setErrorMessage(null)

    const formData = new FormData()
    
    // COMPRESSION OPTIONS: Max 1MB size, max 1920px width/height
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    }

    try {
      // Loop through and compress each file before appending
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const compressedFile = await imageCompression(file, options);
          formData.append('files', compressedFile);
        } else {
          // If it's a PDF, don't try to compress it as an image
          formData.append('files', file); 
        }
      }
      
      // Append the text fields
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
        setReport(data.data) // NOTE: Changed to data.data to match backend response structure
      } else {
        setErrorMessage(data.error || `Server Error: Status ${response.status}`)
      }
    } catch (error: any) {
      setErrorMessage(`Frontend/Network Error: ${error?.message || 'Failed to communicate with the server.'}`)
    } finally {
      setLoading(false)
    }
  }

// ... (keep the rest of your UI the same)

import { useState } from 'react'

interface UploadState {
  uploading: boolean
  error: string | null
  success: boolean
}

interface UploadResult {
  url: string
  path: string
  fileName: string
}

export function useImageUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    error: null,
    success: false
  })

  const uploadImage = async (file: File): Promise<UploadResult | null> => {
    setState({ uploading: true, error: null, success: false })

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload an image file.')
      }

      // Validate file size (50MB max)
      if (file.size > 52428800) {
        throw new Error('File too large. Maximum size is 50MB.')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      setState({ uploading: false, error: null, success: true })
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setState({ uploading: false, error: errorMessage, success: false })
      return null
    }
  }

  const reset = () => {
    setState({ uploading: false, error: null, success: false })
  }

  return {
    uploadImage,
    reset,
    ...state
  }
}
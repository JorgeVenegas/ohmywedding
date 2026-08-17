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

export function useAudioUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    error: null,
    success: false,
  })

  const uploadAudio = async (file: File): Promise<UploadResult | null> => {
    setState({ uploading: true, error: null, success: false })

    try {
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/x-m4a', 'audio/flac']
      if (!allowedTypes.includes(file.type)) throw new Error('Formato no válido. Sube un archivo MP3, WAV, OGG o M4A.')
      if (file.size > 52428800) throw new Error('El archivo es muy grande. El máximo es 50 MB.')

      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type,
          folder: 'audio',
          fileSize: file.size,
          fileName: file.name,
        }),
      })

      if (!presignRes.ok) {
        const { error } = await presignRes.json()
        throw new Error(error ?? 'Failed to get upload URL')
      }

      const { presignedUrl, publicUrl, key } = await presignRes.json()

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) throw new Error('Upload to storage failed')

      setState({ uploading: false, error: null, success: true })
      return { url: publicUrl, path: key, fileName: file.name }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setState({ uploading: false, error: errorMessage, success: false })
      return null
    }
  }

  const reset = () => setState({ uploading: false, error: null, success: false })

  return { uploadAudio, reset, ...state }
}

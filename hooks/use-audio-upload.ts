import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const BUCKET = 'wedding-images'

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
      const allowedTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
        'audio/mp4', 'audio/aac', 'audio/x-m4a', 'audio/flac',
      ]
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Formato no válido. Sube un archivo MP3, WAV, OGG o M4A.')
      }

      if (file.size > 52428800) {
        throw new Error('El archivo es muy grande. El máximo es 50 MB.')
      }

      const fileExt = file.name.split('.').pop() || 'mp3'
      const fileName = `audio/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const supabase = createClientComponentClient()
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type })

      if (error) throw new Error(error.message)

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)

      setState({ uploading: false, error: null, success: true })
      return { url: publicUrl, path: data.path, fileName }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setState({ uploading: false, error: errorMessage, success: false })
      return null
    }
  }

  const reset = () => setState({ uploading: false, error: null, success: false })

  return { uploadAudio, reset, ...state }
}

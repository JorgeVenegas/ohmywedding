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

/** Compress + resize an image to max 1920px, max 2MB JPEG */
async function compressImage(file: File): Promise<File> {
  // Only compress raster images (not GIF)
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
    return file
  }
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX_PX = 1920
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX }
        else { width = Math.round(width * MAX_PX / height); height = MAX_PX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.85)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
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

      // Validate file size (50MB max before compression)
      if (file.size > 52428800) {
        throw new Error('File too large. Maximum size is 50MB.')
      }

      // Compress the image client-side before uploading
      const compressed = await compressImage(file)

      const fileExt = compressed.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const supabase = createClientComponentClient()
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, compressed, { cacheControl: '3600', upsert: false })

      if (error) throw new Error(error.message)

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)

      setState({ uploading: false, error: null, success: true })
      return { url: publicUrl, path: data.path, fileName }

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
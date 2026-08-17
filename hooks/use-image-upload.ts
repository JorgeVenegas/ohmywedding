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

interface CompressOptions {
  maxPx?: number
  quality?: number
  maxBytes?: number
}

async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxPx = 1920, quality = 0.85, maxBytes } = options
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) return file

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width); width = maxPx }
        else { width = Math.round(width * maxPx / height); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)

      const isPng = file.type === 'image/png'
      const isWebp = file.type === 'image/webp'
      const outputType = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg'
      const outputExt = isPng ? '.png' : isWebp ? '.webp' : '.jpg'
      const getName = (name: string) => name.replace(/\.[^.]+$/, outputExt)

      if (!maxBytes) {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], getName(file.name), { type: outputType }))
        }, outputType, isPng ? undefined : quality)
        return
      }

      const tryQuality = (q: number) => {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return }
          if (blob.size <= maxBytes || q <= 0.3) {
            resolve(new File([blob], getName(file.name), { type: outputType }))
          } else {
            tryQuality(Math.max(q - 0.08, 0.3))
          }
        }, outputType, isPng ? undefined : q)
      }
      tryQuality(quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export function useImageUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    error: null,
    success: false,
  })

  const uploadImage = async (file: File, compressOptions?: CompressOptions): Promise<UploadResult | null> => {
    setState({ uploading: true, error: null, success: false })

    try {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) throw new Error('Invalid file type. Please upload an image file.')
      if (file.size > 52428800) throw new Error('File too large. Maximum size is 50MB.')

      const compressed = await compressImage(file, compressOptions)

      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: compressed.type,
          folder: 'wedding-images',
          fileSize: compressed.size,
          fileName: compressed.name,
        }),
      })

      if (!presignRes.ok) {
        const { error } = await presignRes.json()
        throw new Error(error ?? 'Failed to get upload URL')
      }

      const { presignedUrl, publicUrl, key } = await presignRes.json()

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: compressed,
        headers: { 'Content-Type': compressed.type },
      })

      if (!uploadRes.ok) throw new Error('Upload to storage failed')

      setState({ uploading: false, error: null, success: true })
      return { url: publicUrl, path: key, fileName: compressed.name }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setState({ uploading: false, error: errorMessage, success: false })
      return null
    }
  }

  const reset = () => setState({ uploading: false, error: null, success: false })

  return { uploadImage, reset, ...state }
}

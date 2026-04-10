"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const BUCKET = 'wedding-images'

async function compressImage(file: File): Promise<File> {
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) return file
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
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const isPng = file.type === 'image/png'
      const outputType = isPng ? 'image/png' : 'image/jpeg'
      const outputExt = isPng ? '.png' : '.jpg'
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, outputExt), { type: outputType }))
      }, outputType, isPng ? undefined : 0.85)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

interface ImageUploadProps {
  onUpload: (url: string) => void
  currentImageUrl?: string
  placeholder?: string
  className?: string
}

export function ImageUpload({ onUpload, currentImageUrl, placeholder = "Upload an image", className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync previewUrl with currentImageUrl when it changes (e.g., when editing different photos)
  useEffect(() => {
    setPreviewUrl(currentImageUrl || null)
  }, [currentImageUrl])

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setUploading(true)

    try {
      const compressed = await compressImage(file)
      const fileExt = compressed.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const supabase = createClientComponentClient()
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, compressed, { cacheControl: '3600', upsert: false })

      URL.revokeObjectURL(objectUrl)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
      setPreviewUrl(publicUrl)
      onUpload(publicUrl)
    } catch {
      setPreviewUrl(currentImageUrl || null)
      URL.revokeObjectURL(objectUrl)
    } finally {
      setUploading(false)
    }
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const clearImage = () => {
    setPreviewUrl(null)
    onUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {previewUrl ? (
        <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={clearImage}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div
            className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
              dragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : placeholder}
                </p>
                <p className="text-xs text-gray-400">
                  Click or drag to add • Optional
                </p>
              </div>
            </div>
            
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
          </div>
        </div>
      )}
    </div>
  )
}
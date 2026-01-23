"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

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
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setPreviewUrl(result.url)
        onUpload(result.url)
      } else {
        console.error('Upload failed:', result.error)
        setPreviewUrl(currentImageUrl || null)
        // You might want to show a toast or error message here
      }
    } catch (error) {
      console.error('Upload error:', error)
      setPreviewUrl(currentImageUrl || null)
      // You might want to show a toast or error message here
    } finally {
      setUploading(false)
      // Clean up object URL
      URL.revokeObjectURL(objectUrl)
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
            className="w-full h-48 object-cover"
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
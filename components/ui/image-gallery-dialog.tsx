"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload, Loader2, Check } from 'lucide-react'
import { Button } from './button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useI18n } from '@/components/contexts/i18n-context'

interface Image {
  id: string
  url: string
  filename: string
  caption?: string
  created_at: string
}

interface ImageGalleryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage?: (url: string) => void
  weddingNameId: string
  mode?: 'select' | 'upload' | 'both'
}

export function ImageGalleryDialog({
  isOpen,
  onClose,
  onSelectImage,
  weddingNameId,
  mode = 'both'
}: ImageGalleryDialogProps) {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const { t } = useI18n()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchImages()
      setErrorMessage(null)
    }
  }, [isOpen, weddingNameId])

  const fetchImages = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      // Decode the wedding name ID in case it's URL encoded
      const decodedWeddingNameId = decodeURIComponent(weddingNameId)
      
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('wedding_name_id', decodedWeddingNameId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error('Error fetching images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setErrorMessage(null)
    const uploadedUrls: string[] = []

    try {
      // Decode the wedding name ID in case it's URL encoded
      const decodedWeddingNameId = decodeURIComponent(weddingNameId)
      console.log('Uploading file for wedding:', decodedWeddingNameId)
      console.log('Original weddingNameId:', weddingNameId)
      
      // Verify wedding exists
      const { data: wedding, error: weddingError } = await supabase
        .from('weddings')
        .select('wedding_name_id')
        .eq('wedding_name_id', decodedWeddingNameId)
        .single()
      
      console.log('Wedding query result:', { wedding, weddingError })
      
      if (weddingError || !wedding) {
        throw new Error('Wedding not found. Please make sure you are on a valid wedding page.')
      }
      
      for (const file of Array.from(files)) {
        console.log('Uploading file:', file.name)
        
        // Upload to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${decodedWeddingNameId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        console.log('Storage path:', filePath)
        
        const { error: uploadError, data } = await supabase.storage
          .from('wedding-images')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          throw new Error(`Failed to upload file: ${uploadError.message}`)
        }

        console.log('Upload successful, getting public URL...')
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('wedding-images')
          .getPublicUrl(filePath)

        console.log('Public URL:', publicUrl)

        // Save to images table
        const { error: dbError } = await supabase
          .from('images')
          .insert({
            wedding_name_id: decodedWeddingNameId,
            url: publicUrl,
            storage_path: filePath,
            filename: file.name,
            size: file.size,
            mime_type: file.type
          })

        if (dbError) {
          console.error('Database insert error:', dbError)
          throw new Error(`Failed to save image data: ${dbError.message}`)
        }
        
        console.log('Successfully saved to database')
        uploadedUrls.push(publicUrl)
      }

      // Refresh images list
      await fetchImages()
    } catch (error: any) {
      console.error('Error uploading images:', error)
      setErrorMessage(error?.message || 'Failed to upload images. Please try again.')
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleSelectImage = (url: string) => {
    setSelectedImageUrl(url)
    if (onSelectImage && mode === 'select') {
      onSelectImage(url)
      onClose()
    }
  }

  const handleConfirmSelection = () => {
    if (selectedImageUrl && onSelectImage) {
      onSelectImage(selectedImageUrl)
      onClose()
    }
  }

  if (!isOpen || !mounted) return null

  const showUpload = mode === 'upload' || mode === 'both'
  const showSelect = mode === 'select' || mode === 'both'

  const dialogContent = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'select' ? t('imageGallery.selectImage') : mode === 'upload' ? t('imageGallery.uploadImages') : t('imageGallery.title')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {showSelect && showUpload && t('imageGallery.uploadOrSelect')}
              {showSelect && !showUpload && t('imageGallery.chooseFromGallery')}
              {!showSelect && showUpload && t('imageGallery.uploadToGallery')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">{t('imageGallery.uploadError')}</h3>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="flex-shrink-0 text-red-400 hover:text-red-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          {/* Upload Section */}
          {showUpload && (
            <div className="mb-6">
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-700 font-medium mb-2">
                    {t('imageGallery.clickToUpload')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('imageGallery.fileFormats')}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </label>
              {uploading && (
                <div className="flex items-center justify-center gap-2 mt-4 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('imageGallery.uploading')}</span>
                </div>
              )}
            </div>
          )}

          {/* Images Grid */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>{t('imageGallery.noImagesYet')}</p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('imageGallery.yourImages')} ({images.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => showSelect && handleSelectImage(image.url)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageUrl === image.url
                          ? 'border-gray-800 ring-2 ring-gray-300'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-square relative bg-gray-100">
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="w-full h-full object-cover"
                        />
                        {selectedImageUrl === image.url && (
                          <div className="absolute inset-0 bg-gray-500/20 flex items-center justify-center">
                            <div className="bg-gray-800 rounded-full p-2">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-xs text-white truncate">{image.filename}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        {showSelect && (
          <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              {t('imageGallery.cancel')}
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={!selectedImageUrl}
            >
              {t('imageGallery.select')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(dialogContent, document.body)
}

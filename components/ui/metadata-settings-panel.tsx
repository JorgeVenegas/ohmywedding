"use client"

import React, { useState } from 'react'
import { Share2, Upload, X } from 'lucide-react'
import { Input } from './input'
import { Textarea } from './textarea'
import { Button } from './button'
import { useImageUpload } from '@/hooks/use-image-upload'

interface MetadataSettingsPanelProps {
  weddingNameId: string
  currentMetadata: {
    ogTitle?: string | null
    ogDescription?: string | null
    ogImageUrl?: string | null
  }
  onSave: (metadata: { ogTitle?: string; ogDescription?: string; ogImageUrl?: string }) => Promise<void>
}

export function MetadataSettingsPanel({
  weddingNameId,
  currentMetadata,
  onSave
}: MetadataSettingsPanelProps) {
  const [ogTitle, setOgTitle] = useState(currentMetadata.ogTitle || '')
  const [ogDescription, setOgDescription] = useState(currentMetadata.ogDescription || '')
  const [ogImageUrl, setOgImageUrl] = useState(currentMetadata.ogImageUrl || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const { uploadImage, uploading } = useImageUpload()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadImage(file)
      if (result?.url) {
        // Ensure we're using the full public URL
        const fullUrl = result.url.startsWith('http') 
          ? result.url 
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/wedding-images/${result.path}`
        setOgImageUrl(fullUrl)
      }
    } catch (error) {
      setSaveMessage('Failed to upload image')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    
    try {
      await onSave({
        ogTitle: ogTitle || undefined,
        ogDescription: ogDescription || undefined,
        ogImageUrl: ogImageUrl || undefined
      })
      setSaveMessage('Metadata saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage('Failed to save metadata')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Share2 className="w-5 h-5 text-gray-600" />
        <div>
          <h3 className="font-semibold text-gray-900">Social Sharing</h3>
          <p className="text-xs text-gray-500 mt-1">
            Customize how your wedding page appears when shared on social media
          </p>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Share Title
        </label>
        <Input
          type="text"
          value={ogTitle}
          onChange={(e) => setOgTitle(e.target.value)}
          placeholder="e.g., John & Jane's Wedding"
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Leave empty to use couple names automatically
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Share Description
        </label>
        <Textarea
          value={ogDescription}
          onChange={(e) => setOgDescription(e.target.value)}
          placeholder="e.g., Join us in celebrating our special day!"
          rows={3}
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Leave empty to generate from wedding details
        </p>
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Share Image
        </label>
        
        {ogImageUrl ? (
          <div className="relative">
            <img
              src={ogImageUrl}
              alt="OG preview"
              className="w-full h-40 object-cover rounded-lg border border-gray-300"
            />
            <button
              onClick={() => setOgImageUrl('')}
              className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center gap-2 py-4">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload image'}
              </span>
              <span className="text-xs text-gray-500">
                Recommended: 1200x630px
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
        
        <p className="text-xs text-gray-500">
          Leave empty to use hero section image
        </p>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save Metadata'}
        </Button>
        
        {saveMessage && (
          <p className={`text-sm mt-2 text-center ${
            saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
          }`}>
            {saveMessage}
          </p>
        )}
      </div>
    </div>
  )
}

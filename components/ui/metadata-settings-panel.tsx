"use client"

import React, { useState, useEffect } from 'react'
import { Share2, Upload, X, Images, Loader2, Check } from 'lucide-react'
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

interface GuestPhoto {
  id: string
  url: string
  file_name: string | null
}

function GuestPhotoPickerModal({
  weddingNameId,
  onSelect,
  onClose,
}: {
  weddingNameId: string
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const [photos, setPhotos] = useState<GuestPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/guest-photos?weddingNameId=${encodeURIComponent(weddingNameId)}`)
      .then(r => r.json())
      .then(data => {
        // Only non-video approved photos
        const approved = (data.photos ?? []).filter((p: any) =>
          p.status === 'approved' &&
          !p.mime_type?.startsWith('video/') &&
          !/\.(mp4|mov|webm|avi|mkv)$/i.test(p.file_name ?? '')
        )
        setPhotos(approved)
      })
      .finally(() => setLoading(false))
  }, [weddingNameId])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Pick from your photos</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500">
              <Images className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm">No approved photos yet.</p>
              <p className="text-xs mt-1 text-gray-400">Approve photos in the gallery to use them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setSelected(photo.url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selected === photo.url
                      ? 'border-[#420c14] shadow-lg'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.file_name ?? 'Photo'}
                    className="w-full h-full object-cover"
                  />
                  {selected === photo.url && (
                    <div className="absolute inset-0 bg-[#420c14]/20 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-[#420c14] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selected}
            onClick={() => { if (selected) { onSelect(selected); onClose() } }}
            className="bg-[#420c14] hover:bg-[#5a1a22] text-white"
          >
            Use this photo
          </Button>
        </div>
      </div>
    </div>
  )
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
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)

  const { uploadImage, uploading } = useImageUpload()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // OG images must be < 600 KB for WhatsApp; target 500 KB with max 1200px
      const result = await uploadImage(file, { maxPx: 1200, quality: 0.82, maxBytes: 500 * 1024 })
      if (result?.url) {
        setOgImageUrl(result.url)
      }
    } catch {
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
    } catch {
      setSaveMessage('Failed to save metadata')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
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

        {/* Image */}
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
            <div className="space-y-2">
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center gap-2 py-4">
                  <Upload className="w-7 h-7 text-gray-400" />
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

              <button
                type="button"
                onClick={() => setShowPhotoPicker(true)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Images className="w-4 h-4" />
                Pick from my submitted photos
              </button>
            </div>
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

      {showPhotoPicker && (
        <GuestPhotoPickerModal
          weddingNameId={weddingNameId}
          onSelect={url => setOgImageUrl(url)}
          onClose={() => setShowPhotoPicker(false)}
        />
      )}
    </>
  )
}

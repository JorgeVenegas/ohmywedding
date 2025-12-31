"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { useI18n } from '@/components/contexts/i18n-context'
import { Plus, Trash2, GripVertical, Image as ImageIcon, Check, Upload } from 'lucide-react'

type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

interface Photo {
  id: string
  url: string
  caption?: string
  alt?: string
}

// Helper functions
function isLightColor(color: string): boolean {
  if (color.startsWith('rgb')) {
    const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      const r = parseInt(match[1])
      const g = parseInt(match[2])
      const b = parseInt(match[3])
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance > 0.5
    }
  }
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

function getLightTint(hex: string, tintAmount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const newR = Math.round(r + (255 - r) * tintAmount)
  const newG = Math.round(g + (255 - g) * tintAmount)
  const newB = Math.round(b + (255 - b) * tintAmount)
  return `rgb(${newR}, ${newG}, ${newB})`
}

interface GalleryConfigFormProps {
  config: {
    variant?: string
    sectionTitle?: string
    sectionSubtitle?: string
    photos?: Photo[]
    backgroundColorChoice?: BackgroundColorChoice
    titleAlignment?: 'left' | 'center' | 'right'
    subtitleAlignment?: 'left' | 'center' | 'right'
  }
  onChange: (key: string, value: any) => void
}

export function GalleryConfigForm({ config, onChange }: GalleryConfigFormProps) {
  const { t } = useI18n()
  const [expandedPhoto, setExpandedPhoto] = useState<number | null>(null)
  
  // Get colors from page config
  const { config: pageConfig } = usePageConfig()
  const themeColors = pageConfig.siteSettings.theme?.colors
  
  const primaryColor = themeColors?.primary || '#d4a574'
  const secondaryColor = themeColors?.secondary || '#9ba082'
  const accentColor = themeColors?.accent || '#e6b5a3'

  const photos = config.photos || []

  // Color groups for background selection
  const colorGroups: { label: string; colors: { value: BackgroundColorChoice; color: string | null }[] }[] = [
    {
      label: t('config.none'),
      colors: [{ value: 'none', color: null }]
    },
    {
      label: t('config.primary'),
      colors: [
        { value: 'primary', color: primaryColor },
        { value: 'primary-light', color: getLightTint(primaryColor, 0.5) },
        { value: 'primary-lighter', color: getLightTint(primaryColor, 0.88) },
      ]
    },
    {
      label: t('config.secondary'),
      colors: [
        { value: 'secondary', color: secondaryColor },
        { value: 'secondary-light', color: getLightTint(secondaryColor, 0.5) },
        { value: 'secondary-lighter', color: getLightTint(secondaryColor, 0.88) },
      ]
    },
    {
      label: t('config.accent'),
      colors: [
        { value: 'accent', color: accentColor },
        { value: 'accent-light', color: getLightTint(accentColor, 0.5) },
        { value: 'accent-lighter', color: getLightTint(accentColor, 0.88) },
      ]
    }
  ]

  const currentBgChoice = config.backgroundColorChoice || 'none'

  // Variant options
  const variantOptions = [
    {
      value: 'carousel',
      label: t('config.galleryCarousel'),
      description: t('config.galleryCarouselDesc')
    },
    {
      value: 'banner',
      label: t('config.galleryBanner'),
      description: t('config.galleryBannerDesc')
    },
    {
      value: 'masonry',
      label: t('config.galleryMasonry'),
      description: t('config.galleryMasonryDesc')
    },
    {
      value: 'grid',
      label: t('config.galleryGrid'),
      description: t('config.galleryGridDesc')
    },
    {
      value: 'list',
      label: t('config.galleryList'),
      description: t('config.galleryListDesc')
    }
  ]

  const handleAddPhotos = (url: string) => {
    const newPhoto: Photo = {
      id: `photo-${Date.now()}-${Math.random()}`,
      url,
      caption: '',
      alt: ''
    }
    onChange('photos', [...photos, newPhoto])
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onChange('photos', newPhotos)
    if (expandedPhoto === index) {
      setExpandedPhoto(null)
    }
  }

  const handlePhotoChange = (index: number, key: string, value: any) => {
    const newPhotos = [...photos]
    newPhotos[index] = { ...newPhotos[index], [key]: value }
    onChange('photos', newPhotos)
  }

  const toggleExpanded = (index: number) => {
    setExpandedPhoto(expandedPhoto === index ? null : index)
  }

  return (
    <div className="space-y-6">
      {/* Variant Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('config.variant')}
        </label>
        <VariantDropdown
          options={variantOptions}
          value={config.variant || 'grid'}
          onChange={(value) => onChange('variant', value)}
        />
      </div>

      {/* Section Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('config.sectionTitle')}
        </label>
        <Input
          value={config.sectionTitle || ''}
          onChange={(e) => onChange('sectionTitle', e.target.value)}
          placeholder={t('gallery.title')}
        />
      </div>

      {/* Title Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('config.textAlignment')} ({t('config.sectionTitle')})
        </label>
        <div className="flex gap-2">
          {['left', 'center', 'right'].map((align) => (
            <Button
              key={align}
              variant={config.titleAlignment === align ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange('titleAlignment', align)}
              className="flex-1"
            >
              {t(`config.${align}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Section Subtitle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('config.sectionSubtitle')}
        </label>
        <Input
          value={config.sectionSubtitle || ''}
          onChange={(e) => onChange('sectionSubtitle', e.target.value)}
          placeholder={t('gallery.subtitle')}
        />
      </div>

      {/* Subtitle Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('config.textAlignment')} ({t('config.sectionSubtitle')})
        </label>
        <div className="flex gap-2">
          {['left', 'center', 'right'].map((align) => (
            <Button
              key={align}
              variant={config.subtitleAlignment === align ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange('subtitleAlignment', align)}
              className="flex-1"
            >
              {t(`config.${align}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">{t('config.backgroundColor')}</label>
        <div className="space-y-2">
          {colorGroups.map((group) => (
            <div key={group.label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">{group.label}</span>
              <div className="flex gap-1">
                {group.colors.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    onClick={() => onChange('backgroundColorChoice', colorOption.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                      currentBgChoice === colorOption.value 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ 
                      backgroundColor: colorOption.color || '#ffffff',
                      backgroundImage: colorOption.color === null ? 'linear-gradient(135deg, #fff 45%, #f0f0f0 45%, #f0f0f0 55%, #fff 55%)' : undefined
                    }}
                    title={colorOption.value === 'none' ? 'No background' : colorOption.value}
                  >
                    {currentBgChoice === colorOption.value && (
                      <Check 
                        className="w-4 h-4" 
                        style={{ 
                          color: colorOption.color && !isLightColor(colorOption.color) ? 'white' : '#1f2937'
                        }} 
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photos Section */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">{t('gallery.photos')}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.multiple = true
              input.onchange = async (e: any) => {
                const files = Array.from(e.target.files || []) as File[]
                for (const file of files) {
                  const formData = new FormData()
                  formData.append('file', file)
                  try {
                    const response = await fetch('/api/upload', {
                      method: 'POST',
                      body: formData
                    })
                    const result = await response.json()
                    if (result.success) {
                      handleAddPhotos(result.url)
                    }
                  } catch (error) {
                    console.error('Upload error:', error)
                  }
                }
              }
              input.click()
            }}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {t('gallery.addPhotos')}
          </Button>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">{t('gallery.noPhotosYet')}</p>
            <p className="text-xs text-gray-500">{t('gallery.uploadYourFirst')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors">
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={photo.alt || `Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(index)}
                        className="bg-white hover:bg-gray-100 text-gray-900 h-8 px-3"
                      >
                        {expandedPhoto === index ? t('common.close') : t('common.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePhoto(index)}
                        className="bg-red-500 hover:bg-red-600 text-white h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {expandedPhoto === index && (
                  <div className="mt-3 p-4 bg-white border-2 border-gray-300 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('config.uploadImage')}
                      </label>
                      <ImageUpload
                        currentImageUrl={photo.url}
                        onUpload={(url) => handlePhotoChange(index, 'url', url)}
                        placeholder={t('config.selectImage')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('gallery.photoCaption')}
                      </label>
                      <Textarea
                        value={photo.caption || ''}
                        onChange={(e) => handlePhotoChange(index, 'caption', e.target.value)}
                        placeholder={t('config.enterDescription')}
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alt Text
                      </label>
                      <Input
                        value={photo.alt || ''}
                        onChange={(e) => handlePhotoChange(index, 'alt', e.target.value)}
                        placeholder="Description for accessibility"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

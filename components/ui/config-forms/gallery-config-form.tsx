"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { ImageGalleryDialog } from '@/components/ui/image-gallery-dialog'
import { ImagePositionSelector } from '@/components/ui/image-position-selector'
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
  focalPoint?: { x: number; y: number }
  zoom?: number // 1 = 100%, 1.5 = 150%, 2 = 200% etc.
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
    gridColumns?: 2 | 3 | 4 | 5 | 6
    bannerHeight?: 'small' | 'medium' | 'large' | 'full'
    masonryColumns?: 2 | 3 | 4 | 5
    overlayOpacity?: number
    imageBrightness?: number
    useGradientOverlay?: boolean
    gradientColor1?: string
    gradientColor2?: string
  }
  onChange: (key: string, value: any) => void
  weddingNameId?: string
}

export function GalleryConfigForm({ config, onChange, weddingNameId }: GalleryConfigFormProps) {
  const { t } = useI18n()
  const [expandedPhoto, setExpandedPhoto] = useState<number | null>(null)
  const [showImageDialog, setShowImageDialog] = useState(false)
  
  // Get colors from page config
  const { config: pageConfig } = usePageConfig()
  const themeColors = pageConfig.siteSettings.theme?.colors
  
  const primaryColor = themeColors?.primary || '#d4a574'
  const secondaryColor = themeColors?.secondary || '#9ba082'
  const accentColor = themeColors?.accent || '#e6b5a3'

  // Create gradient color options
  const gradientColors = React.useMemo(() => [
    { value: 'palette:primary', displayColor: primaryColor, label: t('config.primary') },
    { value: 'palette:primary-light', displayColor: getLightTint(primaryColor, 0.5), label: t('config.primaryLight') },
    { value: 'palette:primary-lighter', displayColor: getLightTint(primaryColor, 0.88), label: t('config.primaryLighter') },
    { value: 'palette:secondary', displayColor: secondaryColor, label: t('config.secondary') },
    { value: 'palette:secondary-light', displayColor: getLightTint(secondaryColor, 0.5), label: t('config.secondaryLight') },
    { value: 'palette:secondary-lighter', displayColor: getLightTint(secondaryColor, 0.88), label: t('config.secondaryLighter') },
    { value: 'palette:accent', displayColor: accentColor, label: t('config.accent') },
    { value: 'palette:accent-light', displayColor: getLightTint(accentColor, 0.5), label: t('config.accentLight') },
    { value: 'palette:accent-lighter', displayColor: getLightTint(accentColor, 0.88), label: t('config.accentLighter') },
  ], [primaryColor, secondaryColor, accentColor, t])

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
    },
    {
      value: 'collage',
      label: t('config.galleryCollage'),
      description: t('config.galleryCollageDesc')
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

      {/* Grid Columns - Only show for grid variant */}
      {config.variant === 'grid' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('config.gridColumns')}
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((cols) => (
              <Button
                key={cols}
                variant={(config.gridColumns || 4) === cols ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('gridColumns', cols)}
                className="flex-1"
              >
                {cols}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Masonry Columns - Only show for masonry variant */}
      {config.variant === 'masonry' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('config.masonryColumns')}
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5].map((cols) => (
              <Button
                key={cols}
                variant={(config.masonryColumns || 4) === cols ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('masonryColumns', cols)}
                className="flex-1"
              >
                {cols}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Collage Options - Only show for collage variant */}
      {config.variant === 'collage' && (
        <>
          {/* Grid Columns */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.gridColumns')}
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((cols) => (
                <Button
                  key={cols}
                  variant={(config.gridColumns || 4) === cols ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange('gridColumns', cols)}
                  className="flex-1"
                >
                  {cols}
                </Button>
              ))}
            </div>
          </div>

          {/* Overlay Opacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.overlayOpacity')}: {config.overlayOpacity ?? 0}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.overlayOpacity ?? 0}
              onChange={(e) => onChange('overlayOpacity', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{t('config.transparent')}</span>
              <span>{t('config.dark')}</span>
            </div>
          </div>

          {/* Image Brightness */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.imageBrightness')}: {config.imageBrightness ?? 100}%
            </label>
            <input
              type="range"
              min="30"
              max="100"
              value={config.imageBrightness ?? 100}
              onChange={(e) => onChange('imageBrightness', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{t('config.darker')}</span>
              <span>{t('config.bright')}</span>
            </div>
          </div>

          {/* Use Gradient Overlay */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {t('config.useGradientOverlay')}
            </label>
            <Switch
              checked={config.useGradientOverlay || false}
              onCheckedChange={(checked) => onChange('useGradientOverlay', checked)}
            />
          </div>

          {/* Gradient Colors */}
          {config.useGradientOverlay && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('config.gradientColor')} 1
                </label>
                <div className="space-y-2">
                  {[
                    { label: t('config.primary'), colors: gradientColors.filter(c => c.value.includes('primary')) },
                    { label: t('config.secondary'), colors: gradientColors.filter(c => c.value.includes('secondary')) },
                    { label: t('config.accent'), colors: gradientColors.filter(c => c.value.includes('accent')) },
                  ].map((group) => (
                    <div key={group.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20">{group.label}</span>
                      <div className="flex gap-1">
                        {group.colors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => onChange('gradientColor1', color.value)}
                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                              config.gradientColor1 === color.value 
                                ? 'border-blue-500 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ backgroundColor: color.displayColor }}
                            title={color.label}
                          >
                            {config.gradientColor1 === color.value && (
                              <Check 
                                className="w-4 h-4" 
                                style={{ color: !isLightColor(color.displayColor) ? 'white' : '#1f2937' }} 
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('config.gradientColor')} 2
                </label>
                <div className="space-y-2">
                  {[
                    { label: t('config.primary'), colors: gradientColors.filter(c => c.value.includes('primary')) },
                    { label: t('config.secondary'), colors: gradientColors.filter(c => c.value.includes('secondary')) },
                    { label: t('config.accent'), colors: gradientColors.filter(c => c.value.includes('accent')) },
                  ].map((group) => (
                    <div key={group.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20">{group.label}</span>
                      <div className="flex gap-1">
                        {group.colors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => onChange('gradientColor2', color.value)}
                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                              config.gradientColor2 === color.value 
                                ? 'border-blue-500 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ backgroundColor: color.displayColor }}
                            title={color.label}
                          >
                            {config.gradientColor2 === color.value && (
                              <Check 
                                className="w-4 h-4" 
                                style={{ color: !isLightColor(color.displayColor) ? 'white' : '#1f2937' }} 
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

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
            onClick={() => setShowImageDialog(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {t('gallery.addPhotos')}
          </Button>
        </div>

        <ImageGalleryDialog
          isOpen={showImageDialog}
          onClose={() => setShowImageDialog(false)}
          onSelectImage={(urls) => {
            // Add all selected images as new photos
            const newPhotos: Photo[] = urls.map(url => ({
              id: `photo-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              url,
              caption: '',
              alt: ''
            }))
            onChange('photos', [...photos, ...newPhotos])
            setShowImageDialog(false)
          }}
          weddingNameId={weddingNameId || ''}
          mode="both"
        />

        {photos.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">{t('gallery.noPhotosYet')}</p>
            <p className="text-xs text-gray-500">{t('gallery.uploadYourFirst')}</p>
          </div>
        ) : (
          <>
            {/* Photo Grid Preview */}
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div 
                  key={photo.id} 
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    expandedPhoto === index 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleExpanded(index)}
                >
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={photo.alt || `Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  {/* Number Badge */}
                  <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
                    {index + 1}
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemovePhoto(index)
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Expanded Edit Panel - Shows below grid */}
            {expandedPhoto !== null && photos[expandedPhoto] && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {t('gallery.editPhoto')} #{expandedPhoto + 1}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedPhoto(null)}
                    className="h-7 px-2 text-gray-500"
                  >
                    {t('common.close')}
                  </Button>
                </div>

                {/* Photo Preview */}
                <div className="flex gap-4">
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                    {photos[expandedPhoto].url ? (
                      <img
                        src={photos[expandedPhoto].url}
                        alt={photos[expandedPhoto].alt || 'Photo'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t('gallery.photoCaption')}
                      </label>
                      <Textarea
                        value={photos[expandedPhoto].caption || ''}
                        onChange={(e) => handlePhotoChange(expandedPhoto, 'caption', e.target.value)}
                        placeholder={t('gallery.noCaption')}
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Replace Image */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('config.changeImage')}
                  </label>
                  <ImageUpload
                    currentImageUrl={photos[expandedPhoto].url}
                    onUpload={(url) => handlePhotoChange(expandedPhoto, 'url', url)}
                    placeholder={t('config.selectImage')}
                  />
                </div>

                {/* Focal Point Selector */}
                {photos[expandedPhoto].url && (
                  <ImagePositionSelector
                    imageUrl={photos[expandedPhoto].url}
                    position={photos[expandedPhoto].focalPoint || { x: 50, y: 50 }}
                    onChange={(position) => handlePhotoChange(expandedPhoto, 'focalPoint', position)}
                  />
                )}

                {/* Zoom/Crop Control */}
                {photos[expandedPhoto].url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('config.imageZoom')}: {Math.round((photos[expandedPhoto].zoom || 1) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="200"
                      step="5"
                      value={(photos[expandedPhoto].zoom || 1) * 100}
                      onChange={(e) => handlePhotoChange(expandedPhoto, 'zoom', parseInt(e.target.value) / 100)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{t('config.fitImage')}</span>
                      <span>{t('config.zoomIn')}</span>
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemovePhoto(expandedPhoto)}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('config.removePhoto')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

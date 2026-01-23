"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ImageGalleryDialog } from '@/components/ui/image-gallery-dialog'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { useI18n } from '@/components/contexts/i18n-context'
import { Image as ImageIcon, X, Check } from 'lucide-react'

// Helper to determine if a color is light (for contrast)
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

// Helper to create a light tint of a color
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

interface BannerConfigFormProps {
  config: {
    imageUrl?: string
    bannerHeight?: 'small' | 'medium' | 'large' | 'full'
    showText?: boolean
    title?: string
    subtitle?: string
    overlayOpacity?: number
    backgroundGradient?: boolean
    gradientColor1?: string
    gradientColor2?: string
    imageBrightness?: number
  }
  onChange: (key: string, value: any) => void
  weddingNameId?: string
}

export function BannerConfigForm({ config, onChange, weddingNameId }: BannerConfigFormProps) {
  const { t } = useI18n()
  const [showImageDialog, setShowImageDialog] = useState(false)
  const { config: pageConfig } = usePageConfig()
  
  // Get theme colors
  const themeColors = pageConfig.siteSettings.theme?.colors
  const primaryColor = themeColors?.primary || '#9CAF88'
  const secondaryColor = themeColors?.secondary || '#B8C5A6'
  const accentColor = themeColors?.accent || '#8B9A7A'

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
  
  const bannerHeight = config.bannerHeight || 'large'
  const showText = config.showText !== false // default to true
  const overlayOpacity = config.overlayOpacity ?? 40
  const imageBrightness = config.imageBrightness ?? 100

  return (
    <div className="space-y-6">
      {/* Banner Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('config.bannerImage')}
        </label>
        {config.imageUrl ? (
          <div className="space-y-2">
            <div className="relative group rounded-lg overflow-hidden border border-gray-300">
              <img
                src={config.imageUrl}
                alt="Banner"
                className="w-full h-40 object-cover"
              />
              <button
                onClick={() => onChange('imageUrl', '')}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImageDialog(true)}
              className="w-full"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              {t('config.changeImage')}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowImageDialog(true)}
            className="w-full"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {t('config.selectImage')}
          </Button>
        )}
      </div>

      <ImageGalleryDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onSelectImage={(urls) => onChange('imageUrl', urls[0])}
        weddingNameId={weddingNameId || ''}
        mode="both"
      />

      {/* Banner Height */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('config.bannerHeight')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={bannerHeight === 'small' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange('bannerHeight', 'small')}
            className="w-full"
          >
            {t('config.small')}
          </Button>
          <Button
            type="button"
            variant={bannerHeight === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange('bannerHeight', 'medium')}
            className="w-full"
          >
            {t('config.medium')}
          </Button>
          <Button
            type="button"
            variant={bannerHeight === 'large' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange('bannerHeight', 'large')}
            className="w-full"
          >
            {t('config.large')}
          </Button>
          <Button
            type="button"
            variant={bannerHeight === 'full' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange('bannerHeight', 'full')}
            className="w-full"
          >
            {t('config.fullScreen')}
          </Button>
        </div>
      </div>

      {/* Image Brightness */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('config.imageBrightness')}: {imageBrightness}%
        </label>
        <input
          type="range"
          min="30"
          max="100"
          value={imageBrightness}
          onChange={(e) => onChange('imageBrightness', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{t('config.darker')}</span>
          <span>{t('config.bright')}</span>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {t('config.useGradientOverlay')}
        </label>
        <Switch
          checked={config.backgroundGradient ?? false}
          onCheckedChange={(checked) => onChange('backgroundGradient', checked)}
        />
      </div>

      {config.backgroundGradient && (
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

      {/* Show Text Toggle */}
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <label className="text-sm font-medium text-gray-700">
          {t('config.showText')}
        </label>
        <Switch
          checked={showText}
          onCheckedChange={(checked) => onChange('showText', checked)}
        />
      </div>

      {/* Text Content - Only show if showText is true */}
      {showText && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.title')}
            </label>
            <Input
              type="text"
              value={config.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder={t('config.enterTitle')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.subtitle')}
            </label>
            <Textarea
              value={config.subtitle || ''}
              onChange={(e) => onChange('subtitle', e.target.value)}
              placeholder={t('config.enterSubtitle')}
              rows={2}
            />
          </div>

          {/* Overlay Opacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.overlayOpacity')}: {overlayOpacity}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={overlayOpacity}
              onChange={(e) => onChange('overlayOpacity', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  )
}

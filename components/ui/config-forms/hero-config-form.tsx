"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { ImageGalleryDialog } from '@/components/ui/image-gallery-dialog'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { useI18n } from '@/components/contexts/i18n-context'
import { Image as ImageIcon, X, Check, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { useParams } from 'next/navigation'

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

type BackgroundColorChoice = 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

interface HeroConfigFormProps {
  config: {
    variant?: string
    imagePosition?: string
    frameStyle?: string
    imageSize?: string
    backgroundColor?: string
    backgroundGradient?: boolean
    gradientColor1?: string
    gradientColor2?: string
    showDecorations?: boolean
    imageHeight?: 'small' | 'medium' | 'large' | 'full'
    imageWidth?: 'full' | 'centered'
    textAlignment?: string
    showTagline?: boolean
    tagline?: string
    showCountdown?: boolean
    showRSVPButton?: boolean
    heroImageUrl?: string
    overlayOpacity?: number
    imageBrightness?: number
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
  }
  onChange: (key: string, value: any) => void
  hasWeddingDate?: boolean
  weddingNameId?: string
}

export function HeroConfigForm({ config, onChange, hasWeddingDate = true, weddingNameId }: HeroConfigFormProps) {
  const [showImageDialog, setShowImageDialog] = useState(false)
  const { config: pageConfig } = usePageConfig()
  const { t } = useI18n()
  
  // Get theme colors
  const themeColors = pageConfig.siteSettings.theme?.colors
  const primaryColor = themeColors?.primary || '#9CAF88'
  const secondaryColor = themeColors?.secondary || '#B8C5A6'
  const accentColor = themeColors?.accent || '#8B9A7A'

  // Create color options with full, light, and lighter variants for background
  const bgColorGroups: { label: string; colors: { value: BackgroundColorChoice; color: string }[] }[] = [
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
  
  // Palette colors for gradient overlay (with lighter variants)
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

  // Check if hero image is provided
  const hasHeroImage = !!config.heroImageUrl && config.heroImageUrl.trim() !== ''

  // Variants that require an image
  const imageRequiredVariants = ['background', 'side-by-side', 'framed', 'stacked']
  
  // All available variants
  const allVariants = [
    { value: 'background', label: t('config.backgroundHero'), description: t('config.backgroundHeroDesc'), requiresImage: true },
    { value: 'side-by-side', label: t('config.sideBySide'), description: t('config.sideBySideDesc'), requiresImage: true },
    { value: 'framed', label: t('config.framedPhoto'), description: t('config.framedPhotoDesc'), requiresImage: true },
    { value: 'minimal', label: t('config.minimal'), description: t('config.minimalDesc'), requiresImage: false },
    { value: 'stacked', label: t('config.stacked'), description: t('config.stackedDesc'), requiresImage: true }
  ]

  // Filter variants based on whether image is provided
  const variants = hasHeroImage 
    ? allVariants 
    : allVariants.filter(v => !v.requiresImage)

  // Note: We no longer force minimal when no image - the user should upload an image
  // if they want to use an image-required variant. The variant dropdown already
  // filters to only show available variants.

  const imagePositions = [
    { value: 'left', label: t('config.left') },
    { value: 'right', label: t('config.right') }
  ]

  const frameStyles = [
    { value: 'circular', label: t('config.circular') },
    { value: 'rounded', label: t('config.rounded') },
    { value: 'square', label: t('config.square') },
    { value: 'polaroid', label: t('config.polaroid') }
  ]

  const imageSizes = [
    { value: 'small', label: t('config.small') },
    { value: 'medium', label: t('config.medium') },
    { value: 'large', label: t('config.large') }
  ]

  return (
    <div className="space-y-6">
      {/* Variant Selection */}
      <VariantDropdown
        label={t('config.layoutStyle')}
        value={config.variant || 'background'}
        options={variants}
        onChange={(value) => onChange('variant', value)}
        placeholder={t('config.layoutStyle')}
      />

      {/* Hero Image Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('config.heroImage')}
        </label>
        {config.heroImageUrl ? (
          <div className="space-y-2">
            <div className="relative group rounded-lg overflow-hidden border border-gray-300">
              <img
                src={config.heroImageUrl}
                alt="Hero"
                className="w-full h-40 object-cover"
              />
              <button
                onClick={() => onChange('heroImageUrl', '')}
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
        onSelectImage={(urls) => {
          const url = urls[0]
          // If currently on minimal variant and adding an image, switch to background
          // We need to call these in sequence to avoid state batching issues
          const shouldSwitchToBackground = config.variant === 'minimal' && !hasHeroImage && url
          
          // First update the image
          onChange('heroImageUrl', url)
          
          // Then update the variant after a timeout to ensure proper state update
          if (shouldSwitchToBackground) {
            setTimeout(() => {
              onChange('variant', 'background')
            }, 0)
          }
        }}
        weddingNameId={weddingNameId || ''}
        mode="both"
      />

      {/* Background specific options */}
      {config.variant === 'background' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.overlayOpacity')}: {config.overlayOpacity ?? 40}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.overlayOpacity ?? 40}
              onChange={(e) => onChange('overlayOpacity', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{t('config.transparent')}</span>
              <span>{t('config.dark')}</span>
            </div>
          </div>
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
                  Gradient Color 1
                </label>
                <div className="space-y-2">
                  {[
                    { label: 'Primary', colors: gradientColors.filter(c => c.value.includes('primary')) },
                    { label: 'Secondary', colors: gradientColors.filter(c => c.value.includes('secondary')) },
                    { label: 'Accent', colors: gradientColors.filter(c => c.value.includes('accent')) },
                  ].map((group) => (
                    <div key={group.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16">{group.label}</span>
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
                  Gradient Color 2
                </label>
                <div className="space-y-2">
                  {[
                    { label: 'Primary', colors: gradientColors.filter(c => c.value.includes('primary')) },
                    { label: 'Secondary', colors: gradientColors.filter(c => c.value.includes('secondary')) },
                    { label: 'Accent', colors: gradientColors.filter(c => c.value.includes('accent')) },
                  ].map((group) => (
                    <div key={group.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16">{group.label}</span>
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

      {/* Side-by-Side specific options */}
      {config.variant === 'side-by-side' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.imagePosition')}
            </label>
            <div className="flex gap-2">
              {imagePositions.map((position) => (
                <Button
                  key={position.value}
                  variant={config.imagePosition === position.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange('imagePosition', position.value)}
                >
                  {position.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.overlayOpacity')}: {config.overlayOpacity ?? 0}%
            </label>
            <input
              type="range"
              min="0"
              max="80"
              value={config.overlayOpacity ?? 0}
              onChange={(e) => onChange('overlayOpacity', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{t('config.none')}</span>
              <span>{t('config.dark')}</span>
            </div>
          </div>
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
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {t('config.useColorBackground')}
            </label>
            <Switch
              checked={config.useColorBackground ?? false}
              onCheckedChange={(checked) => onChange('useColorBackground', checked)}
            />
          </div>
          {config.useColorBackground && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('config.backgroundColor')}
              </label>
              <div className="space-y-2">
                {bgColorGroups.map((group) => (
                  <div key={group.label} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16">{group.label}</span>
                    <div className="flex gap-1">
                      {group.colors.map((colorOption) => (
                        <button
                          key={colorOption.value}
                          onClick={() => onChange('backgroundColorChoice', colorOption.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                            config.backgroundColorChoice === colorOption.value 
                              ? 'border-blue-500 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: colorOption.color }}
                          title={colorOption.value}
                        >
                          {config.backgroundColorChoice === colorOption.value && (
                            <Check 
                              className="w-4 h-4" 
                              style={{ color: !isLightColor(colorOption.color) ? 'white' : '#1f2937' }} 
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                  {t('config.gradientColor1')}
                </label>
                <div className="space-y-2">
                  {[
                    { label: t('config.primary'), colors: gradientColors.filter(c => c.value.includes('primary')) },
                    { label: t('config.secondary'), colors: gradientColors.filter(c => c.value.includes('secondary')) },
                    { label: t('config.accent'), colors: gradientColors.filter(c => c.value.includes('accent')) },
                  ].map((group) => (
                    <div key={group.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16">{group.label}</span>
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
                  {t('config.gradientColor2')}
                </label>
                <div className="space-y-2">
                  {[
                    { label: t('config.primary'), colors: gradientColors.filter(c => c.value.includes('primary')) },
                    { label: t('config.secondary'), colors: gradientColors.filter(c => c.value.includes('secondary')) },
                    { label: t('config.accent'), colors: gradientColors.filter(c => c.value.includes('accent')) },
                  ].map((group) => (
                    <div key={group.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16">{group.label}</span>
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

      {/* Framed specific options */}
      {config.variant === 'framed' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.imageFrame')}
            </label>
            <div className="flex flex-wrap gap-2">
              {frameStyles.map((style) => (
                <Button
                  key={style.value}
                  variant={config.frameStyle === style.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange('frameStyle', style.value)}
                >
                  {style.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.imageSize')}
            </label>
            <div className="flex gap-2">
              {imageSizes.map((size) => (
                <Button
                  key={size.value}
                  variant={config.imageSize === size.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange('imageSize', size.value)}
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Minimal specific options */}
      {config.variant === 'minimal' && (
        <>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {t('config.useGradientOverlay')}
            </label>
            <Switch
              checked={config.backgroundGradient ?? false}
              onCheckedChange={(checked) => onChange('backgroundGradient', checked)}
            />
          </div>
          
          {config.backgroundGradient ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('config.gradientColor1')}
                </label>
                <div className="space-y-2">
                  {[
                    { label: t('config.primary'), colors: gradientColors.filter(c => c.value.includes('primary')) },
                    { label: t('config.secondary'), colors: gradientColors.filter(c => c.value.includes('secondary')) },
                    { label: t('config.accent'), colors: gradientColors.filter(c => c.value.includes('accent')) },
                  ].map((group) => (
                    <div key={group.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16">{group.label}</span>
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
                  {t('config.gradientColor2')}
                </label>
                <div className="space-y-2">
                  {[
                    { label: t('config.primary'), colors: gradientColors.filter(c => c.value.includes('primary')) },
                    { label: t('config.secondary'), colors: gradientColors.filter(c => c.value.includes('secondary')) },
                    { label: t('config.accent'), colors: gradientColors.filter(c => c.value.includes('accent')) },
                  ].map((group) => (
                    <div key={group.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16">{group.label}</span>
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
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('config.backgroundColor')}
              </label>
              <div className="space-y-2">
                {bgColorGroups.map((group) => (
                  <div key={group.label} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16">{group.label}</span>
                    <div className="flex gap-1">
                      {group.colors.map((colorOption) => (
                        <button
                          key={colorOption.value}
                          onClick={() => onChange('backgroundColor', colorOption.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                            config.backgroundColor === colorOption.value 
                              ? 'border-blue-500 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: colorOption.color }}
                          title={colorOption.value}
                        >
                          {config.backgroundColor === colorOption.value && (
                            <Check 
                              className="w-4 h-4" 
                              style={{ color: !isLightColor(colorOption.color) ? 'white' : '#1f2937' }} 
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {t('config.showDecorations')}
            </label>
            <Switch
              checked={config.showDecorations ?? true}
              onCheckedChange={(checked) => onChange('showDecorations', checked)}
            />
          </div>
        </>
      )}

      {/* Stacked specific options */}
      {config.variant === 'stacked' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.imageWidth')}
            </label>
            <div className="flex gap-2">
              {[
                { value: 'centered', label: t('config.centered') },
                { value: 'full', label: t('config.full') }
              ].map((width) => (
                <Button
                  key={width.value}
                  variant={config.imageWidth === width.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange('imageWidth', width.value)}
                >
                  {width.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.imageHeight')}
            </label>
            <div className="flex gap-2">
              {[
                { value: 'small', label: t('config.small') },
                { value: 'medium', label: t('config.medium') },
                { value: 'large', label: t('config.large') }
              ].map((height) => (
                <Button
                  key={height.value}
                  variant={config.imageHeight === height.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange('imageHeight', height.value)}
                >
                  {height.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {t('config.showDecorations')}
            </label>
            <Switch
              checked={config.showDecorations ?? true}
              onCheckedChange={(checked) => onChange('showDecorations', checked)}
            />
          </div>
        </>
      )}

      {/* Content Options */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">{t('config.content')}</h4>
        
        {/* Text Alignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('config.textAlignment')}
          </label>
          <div className="flex gap-2">
            {[
              { value: 'left', label: t('config.left'), icon: AlignLeft },
              { value: 'center', label: t('config.center'), icon: AlignCenter },
              { value: 'right', label: t('config.right'), icon: AlignRight }
            ].map((alignment) => (
              <Button
                key={alignment.value}
                variant={config.textAlignment === alignment.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('textAlignment', alignment.value)}
                className="gap-1.5"
              >
                <alignment.icon className="w-4 h-4" />
                {alignment.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {t('config.showTagline')}
          </label>
          <Switch
            checked={config.showTagline ?? true}
            onCheckedChange={(checked) => onChange('showTagline', checked)}
          />
        </div>

        {config.showTagline && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.tagline')}
            </label>
            <Input
              type="text"
              value={config.tagline || ''}
              onChange={(e) => onChange('tagline', e.target.value)}
              placeholder={t('hero.tagline')}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">
              {t('config.showCountdown')}
            </label>
            {!hasWeddingDate && (
              <p className="text-xs text-gray-500 mt-0.5">
                {t('common.required')}
              </p>
            )}
          </div>
          <Switch
            checked={hasWeddingDate && (config.showCountdown ?? true)}
            onCheckedChange={(checked) => onChange('showCountdown', checked)}
            disabled={!hasWeddingDate}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {t('config.showRSVPButton')}
          </label>
          <Switch
            checked={config.showRSVPButton ?? true}
            onCheckedChange={(checked) => onChange('showRSVPButton', checked)}
          />
        </div>
      </div>
    </div>
  )
}
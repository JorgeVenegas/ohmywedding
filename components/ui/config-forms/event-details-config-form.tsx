"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { ImageUpload } from '@/components/ui/image-upload'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { Check, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'
type TextAlignment = 'left' | 'center' | 'right'

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

interface EventDetailsConfigFormProps {
  config: {
    variant?: string
    showCeremony?: boolean
    showReception?: boolean
    showMapLinks?: boolean
    showMap?: boolean
    showPhotos?: boolean
    ceremonyImageUrl?: string
    receptionImageUrl?: string
    ceremonyDescription?: string
    receptionDescription?: string
    sectionSubtitle?: string
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
    ceremonyTextAlignment?: TextAlignment
    receptionTextAlignment?: TextAlignment
  }
  onChange: (key: string, value: any) => void
}

export function EventDetailsConfigForm({ config, onChange }: EventDetailsConfigFormProps) {
  // Get colors from page config (theme settings)
  const { config: pageConfig } = usePageConfig()
  const themeColors = pageConfig.siteSettings.theme?.colors
  
  const primaryColor = themeColors?.primary || '#d4a574'
  const secondaryColor = themeColors?.secondary || '#9ba082'
  const accentColor = themeColors?.accent || '#e6b5a3'

  // Create color options with full, light, and lighter variants
  const colorGroups: { label: string; colors: { value: BackgroundColorChoice; color: string | null }[] }[] = [
    {
      label: 'None',
      colors: [{ value: 'none', color: null }]
    },
    {
      label: 'Primary',
      colors: [
        { value: 'primary', color: primaryColor },
        { value: 'primary-light', color: getLightTint(primaryColor, 0.5) },
        { value: 'primary-lighter', color: getLightTint(primaryColor, 0.88) },
      ]
    },
    {
      label: 'Secondary',
      colors: [
        { value: 'secondary', color: secondaryColor },
        { value: 'secondary-light', color: getLightTint(secondaryColor, 0.5) },
        { value: 'secondary-lighter', color: getLightTint(secondaryColor, 0.88) },
      ]
    },
    {
      label: 'Accent',
      colors: [
        { value: 'accent', color: accentColor },
        { value: 'accent-light', color: getLightTint(accentColor, 0.5) },
        { value: 'accent-lighter', color: getLightTint(accentColor, 0.88) },
      ]
    }
  ]

  const currentBgChoice = config.backgroundColorChoice || 'none'
  const isSplitVariant = config.variant === 'split'

  return (
    <div className="space-y-6">
      {/* Variant Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Style</label>
        <VariantDropdown
          value={config.variant || 'classic'}
          onChange={(value) => onChange('variant', value)}
          options={[
            { value: 'classic', label: 'Classic Cards', description: 'Traditional card layout with icons' },
            { value: 'elegant', label: 'Elegant Script', description: 'Romantic style with ornamental details' },
            { value: 'timeline', label: 'Timeline', description: 'Vertical timeline with connected events' },
            { value: 'minimal', label: 'Minimal Clean', description: 'Clean and modern minimalist design' },
            { value: 'split', label: 'Split Layout', description: 'Side-by-side image and details layout' },
          ]}
        />
      </div>

      {/* Section Subtitle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Section Subtitle</label>
        <Input
          value={config.sectionSubtitle ?? ''}
          onChange={(e) => onChange('sectionSubtitle', e.target.value)}
          placeholder="We invite you to celebrate with us..."
        />
      </div>

      {/* Background Color */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Background Color</label>
        <div className="space-y-2">
          {colorGroups.map((group) => (
            <div key={group.label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">{group.label}</span>
              <div className="flex gap-1">
                {group.colors.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    onClick={() => onChange('backgroundColorChoice', colorOption.value)}
                    className={`w-8 h-8 rounded-md border-2 transition-all flex items-center justify-center ${
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

      {/* Display Options */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-700">Display Options</label>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Show Embedded Map</span>
          <Switch
            checked={config.showMap ?? true}
            onCheckedChange={(checked) => onChange('showMap', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Show Map Links</span>
          <Switch
            checked={config.showMapLinks ?? true}
            onCheckedChange={(checked) => onChange('showMapLinks', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Show Venue Photos</span>
          <Switch
            checked={config.showPhotos ?? false}
            onCheckedChange={(checked) => onChange('showPhotos', checked)}
          />
        </div>
      </div>

      {/* Ceremony Section */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Ceremony</label>
          <Switch
            checked={config.showCeremony ?? true}
            onCheckedChange={(checked) => onChange('showCeremony', checked)}
          />
        </div>

        {config.showCeremony !== false && (
          <>
            {/* Ceremony Photo */}
            {config.showPhotos && (
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Venue Photo</span>
                <ImageUpload
                  currentImageUrl={config.ceremonyImageUrl}
                  onUpload={(url) => onChange('ceremonyImageUrl', url)}
                  placeholder="Upload ceremony venue photo"
                />
              </div>
            )}

            {/* Ceremony Description */}
            <div className="space-y-2">
              <span className="text-sm text-gray-600">Description</span>
              <Input
                value={config.ceremonyDescription ?? ''}
                onChange={(e) => onChange('ceremonyDescription', e.target.value)}
                placeholder="Join us as we exchange vows"
              />
            </div>

            {/* Ceremony Text Alignment - Only for Split variant */}
            {isSplitVariant && (
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Text Alignment</span>
                <div className="flex gap-2">
                  {[
                    { value: 'left', label: 'Left', icon: AlignLeft },
                    { value: 'center', label: 'Center', icon: AlignCenter },
                    { value: 'right', label: 'Right', icon: AlignRight }
                  ].map((alignment) => (
                    <Button
                      key={alignment.value}
                      variant={(config.ceremonyTextAlignment || 'center') === alignment.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onChange('ceremonyTextAlignment', alignment.value)}
                      className="gap-1.5"
                    >
                      <alignment.icon className="w-4 h-4" />
                      {alignment.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reception Section */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Reception</label>
          <Switch
            checked={config.showReception ?? true}
            onCheckedChange={(checked) => onChange('showReception', checked)}
          />
        </div>

        {config.showReception !== false && (
          <>
            {/* Reception Photo */}
            {config.showPhotos && (
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Venue Photo</span>
                <ImageUpload
                  currentImageUrl={config.receptionImageUrl}
                  onUpload={(url) => onChange('receptionImageUrl', url)}
                  placeholder="Upload reception venue photo"
                />
              </div>
            )}

            {/* Reception Description */}
            <div className="space-y-2">
              <span className="text-sm text-gray-600">Description</span>
              <Input
                value={config.receptionDescription ?? ''}
                onChange={(e) => onChange('receptionDescription', e.target.value)}
                placeholder="Dinner, dancing, and celebration"
              />
            </div>

            {/* Reception Text Alignment - Only for Split variant */}
            {isSplitVariant && (
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Text Alignment</span>
                <div className="flex gap-2">
                  {[
                    { value: 'left', label: 'Left', icon: AlignLeft },
                    { value: 'center', label: 'Center', icon: AlignCenter },
                    { value: 'right', label: 'Right', icon: AlignRight }
                  ].map((alignment) => (
                    <Button
                      key={alignment.value}
                      variant={(config.receptionTextAlignment || 'center') === alignment.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onChange('receptionTextAlignment', alignment.value)}
                      className="gap-1.5"
                    >
                      <alignment.icon className="w-4 h-4" />
                      {alignment.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

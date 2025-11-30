"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { ImageGalleryDialog } from '@/components/ui/image-gallery-dialog'
import { Image as ImageIcon, X, Check } from 'lucide-react'
import { usePageConfig } from '@/components/contexts/page-config-context'

type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

// Helper to determine if a color is light (for contrast)
function isLightColor(color: string): boolean {
  // Handle rgb() format
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

interface OurStoryConfigFormProps {
  config: {
    variant?: string
    textAlignment?: string
    showHowWeMet?: boolean
    showProposal?: boolean
    showPhotos?: boolean
    showHowWeMetPhoto?: boolean
    showProposalPhoto?: boolean
    howWeMetText?: string
    howWeMetPhoto?: string
    proposalText?: string
    proposalPhoto?: string
    photos?: string[]
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
  }
  onChange: (key: string, value: any) => void
  weddingNameId?: string
}

export function OurStoryConfigForm({ config, onChange, weddingNameId }: OurStoryConfigFormProps) {
  // Get colors from page config (theme settings)
  const { config: pageConfig } = usePageConfig()
  const themeColors = pageConfig.siteSettings.theme?.colors
  
  const [showHowWeMetImageDialog, setShowHowWeMetImageDialog] = useState(false)
  const [showProposalImageDialog, setShowProposalImageDialog] = useState(false)
  
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

  const variants = [
    { value: 'cards', label: 'Cards Layout', description: 'Side-by-side cards with photos and text' },
    { value: 'timeline', label: 'Timeline', description: 'Vertical timeline with milestones' },
    { value: 'minimal', label: 'Minimal', description: 'Clean text-focused layout' },
    { value: 'zigzag', label: 'Zigzag', description: 'Dynamic diagonal layout - modern and eye-catching' },
    { value: 'booklet', label: 'Booklet', description: 'Storybook-style stacked pages - romantic and narrative' }
  ]

  const currentChoice = config.backgroundColorChoice || (config.useColorBackground ? 'primary' : 'none')

  return (
    <div className="space-y-6">
      {/* Variant Selection */}
      <VariantDropdown
        label="Story Layout"
        value={config.variant || 'cards'}
        options={variants}
        onChange={(value) => onChange('variant', value)}
        placeholder="Choose story layout"
      />

      {/* Background Color Selection */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Background Color
          </label>
          <p className="text-xs text-gray-500">Choose a palette color for the section background</p>
        </div>
        <div className="space-y-3">
          {colorGroups.map((group) => (
            <div key={group.label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16 shrink-0">{group.label}</span>
              <div className="flex gap-2">
                {group.colors.map((option) => {
                  const isSelected = currentChoice === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange('backgroundColorChoice', option.value)}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ 
                          backgroundColor: option.color || '#ffffff',
                          backgroundImage: option.color ? undefined : 'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)',
                          backgroundSize: option.color ? undefined : '8px 8px',
                          backgroundPosition: option.color ? undefined : '0 0, 0 4px, 4px -4px, -4px 0px'
                        }}
                      >
                        {isSelected && (
                          <Check 
                            className="w-4 h-4" 
                            style={{ 
                              color: option.color 
                                ? (isLightColor(option.color) ? '#374151' : '#ffffff')
                                : '#374151'
                            }} 
                          />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Toggles */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Content Sections</h4>
        
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Show How We Met
          </label>
          <Switch
            checked={config.showHowWeMet ?? true}
            onCheckedChange={(checked) => onChange('showHowWeMet', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Show Proposal Story
          </label>
          <Switch
            checked={config.showProposal ?? true}
            onCheckedChange={(checked) => onChange('showProposal', checked)}
          />
        </div>
      </div>

      {/* Story Text */}
      {config.showHowWeMet && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How We Met Story
            </label>
            <Textarea
              value={config.howWeMetText || ''}
              onChange={(e) => onChange('howWeMetText', e.target.value)}
              placeholder="Tell your story about how you first met..."
              rows={4}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show How We Met Photo
            </label>
            <Switch
              checked={config.showHowWeMetPhoto ?? false}
              onCheckedChange={(checked) => onChange('showHowWeMetPhoto', checked)}
            />
          </div>
          
          {config.showHowWeMetPhoto && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How We Met Photo
              </label>
              {config.howWeMetPhoto ? (
                <div className="space-y-2">
                  <div className="relative group rounded-lg overflow-hidden border border-gray-300">
                    <img
                      src={config.howWeMetPhoto}
                      alt="How We Met"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      onClick={() => onChange('howWeMetPhoto', '')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHowWeMetImageDialog(true)}
                    className="w-full"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Change Image
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowHowWeMetImageDialog(true)}
                  className="w-full"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Select Image
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <ImageGalleryDialog
        isOpen={showHowWeMetImageDialog}
        onClose={() => setShowHowWeMetImageDialog(false)}
        onSelectImage={(url) => onChange('howWeMetPhoto', url)}
        weddingNameId={weddingNameId || ''}
        mode="both"
      />

      {config.showProposal && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Story
            </label>
            <Textarea
              value={config.proposalText || ''}
              onChange={(e) => onChange('proposalText', e.target.value)}
              placeholder="Share the story of your proposal..."
              rows={4}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show Proposal Photo
            </label>
            <Switch
              checked={config.showProposalPhoto ?? false}
              onCheckedChange={(checked) => onChange('showProposalPhoto', checked)}
            />
          </div>
          
          {config.showProposalPhoto && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposal Photo
              </label>
              {config.proposalPhoto ? (
                <div className="space-y-2">
                  <div className="relative group rounded-lg overflow-hidden border border-gray-300">
                    <img
                      src={config.proposalPhoto}
                      alt="Proposal"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      onClick={() => onChange('proposalPhoto', '')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProposalImageDialog(true)}
                    className="w-full"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Change Image
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowProposalImageDialog(true)}
                  className="w-full"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Select Image
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <ImageGalleryDialog
        isOpen={showProposalImageDialog}
        onClose={() => setShowProposalImageDialog(false)}
        onSelectImage={(url) => onChange('proposalPhoto', url)}
        weddingNameId={weddingNameId || ''}
        mode="both"
      />
    </div>
  )
}
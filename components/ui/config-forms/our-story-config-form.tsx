"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { ImageGalleryDialog } from '@/components/ui/image-gallery-dialog'
import { Image as ImageIcon, X, Check, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { useI18n } from '@/components/contexts/i18n-context'

type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'
type TextAlignment = 'left' | 'center' | 'right'

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
    sectionTitle?: string
    sectionSubtitle?: string
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
    howWeMetTextAlignment?: TextAlignment
    proposalTextAlignment?: TextAlignment
  }
  onChange: (key: string, value: any) => void
  weddingNameId?: string
}

export function OurStoryConfigForm({ config, onChange, weddingNameId }: OurStoryConfigFormProps) {
  // Get colors from page config (theme settings)
  const { config: pageConfig } = usePageConfig()
  const { t } = useI18n()
  const themeColors = pageConfig.siteSettings.theme?.colors
  
  const [showHowWeMetImageDialog, setShowHowWeMetImageDialog] = useState(false)
  const [showProposalImageDialog, setShowProposalImageDialog] = useState(false)
  
  const primaryColor = themeColors?.primary || '#d4a574'
  const secondaryColor = themeColors?.secondary || '#9ba082'
  const accentColor = themeColors?.accent || '#e6b5a3'

  // Create color options with full, light, and lighter variants
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

  const variants = [
    { value: 'cards', label: t('config.cardsLayout'), description: t('config.cardsLayoutDesc') },
    { value: 'timeline', label: t('config.timeline'), description: t('config.timelineDesc') },
    { value: 'minimal', label: t('config.minimal'), description: t('config.minimalCleanDesc') },
    { value: 'zigzag', label: t('config.zigzag'), description: t('config.zigzagDesc') },
    { value: 'booklet', label: t('config.booklet'), description: t('config.bookletDesc') },
    { value: 'split', label: t('config.splitView'), description: t('config.splitViewDesc') }
  ]

  const currentChoice = config.backgroundColorChoice || (config.useColorBackground ? 'primary' : 'none')

  return (
    <div className="space-y-6">
      {/* Variant Selection */}
      <VariantDropdown
        label={t('config.storyLayout')}
        value={config.variant || 'cards'}
        options={variants}
        onChange={(value) => onChange('variant', value)}
        placeholder={t('config.storyLayout')}
      />

      {/* Section Title & Subtitle */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-900 text-sm">{t('config.sectionContent')}</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('config.sectionTitle')}
          </label>
          <Input
            type="text"
            value={config.sectionTitle || ''}
            onChange={(e) => onChange('sectionTitle', e.target.value)}
            placeholder={t('ourStory.title')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('config.sectionSubtitle')}
          </label>
          <Input
            type="text"
            value={config.sectionSubtitle || ''}
            onChange={(e) => onChange('sectionSubtitle', e.target.value)}
            placeholder={t('ourStory.subtitle')}
          />
        </div>
      </div>

      {/* Background Color Selection */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">
            {t('config.backgroundColor')}
          </label>
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
        <h4 className="font-medium text-gray-900">{t('config.contentSections')}</h4>
        
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {t('config.showHowWeMet')}
          </label>
          <Switch
            checked={config.showHowWeMet ?? true}
            onCheckedChange={(checked) => onChange('showHowWeMet', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {t('config.showProposalStory')}
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
              {t('config.howWeMetStory')}
            </label>
            <Textarea
              value={config.howWeMetText || ''}
              onChange={(e) => onChange('howWeMetText', e.target.value)}
              placeholder={t('config.tellYourStory')}
              rows={4}
            />
          </div>
          
          {/* For split variant, always show photo option. For others, use toggle */}
          {config.variant !== 'split' && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t('config.showHowWeMetPhoto')}
              </label>
              <Switch
                checked={config.showHowWeMetPhoto ?? false}
                onCheckedChange={(checked) => onChange('showHowWeMetPhoto', checked)}
              />
            </div>
          )}
          
          {(config.showHowWeMetPhoto || config.variant === 'split') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('config.howWeMetPhoto')}
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
                    {t('config.changeImage')}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowHowWeMetImageDialog(true)}
                  className="w-full"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {t('config.selectImage')}
                </Button>
              )}
            </div>
          )}

          {/* How We Met Text Alignment - Only for Split variant */}
          {config.variant === 'split' && (
            <div className="space-y-2">
              <span className="text-sm text-gray-600">{t('config.textAlignment')}</span>
              <div className="flex gap-2">
                {[
                  { value: 'left', label: t('config.left'), icon: AlignLeft },
                  { value: 'center', label: t('config.center'), icon: AlignCenter },
                  { value: 'right', label: t('config.right'), icon: AlignRight }
                ].map((alignment) => (
                  <Button
                    key={alignment.value}
                    variant={(config.howWeMetTextAlignment || 'center') === alignment.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onChange('howWeMetTextAlignment', alignment.value)}
                    className="gap-1.5"
                  >
                    <alignment.icon className="w-4 h-4" />
                    {alignment.label}
                  </Button>
                ))}
              </div>
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
              {t('config.proposalStory')}
            </label>
            <Textarea
              value={config.proposalText || ''}
              onChange={(e) => onChange('proposalText', e.target.value)}
              placeholder={t('config.tellYourStory')}
              rows={4}
            />
          </div>
          
          {/* For split variant, always show photo option. For others, use toggle */}
          {config.variant !== 'split' && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t('config.showProposalPhoto')}
              </label>
              <Switch
                checked={config.showProposalPhoto ?? false}
                onCheckedChange={(checked) => onChange('showProposalPhoto', checked)}
              />
            </div>
          )}
          
          {(config.showProposalPhoto || config.variant === 'split') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('config.proposalPhoto')}
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
                    {t('config.changeImage')}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowProposalImageDialog(true)}
                  className="w-full"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {t('config.selectImage')}
                </Button>
              )}
            </div>
          )}

          {/* Proposal Text Alignment - Only for Split variant */}
          {config.variant === 'split' && (
            <div className="space-y-2">
              <span className="text-sm text-gray-600">{t('config.textAlignment')}</span>
              <div className="flex gap-2">
                {[
                  { value: 'left', label: t('config.left'), icon: AlignLeft },
                  { value: 'center', label: t('config.center'), icon: AlignCenter },
                  { value: 'right', label: t('config.right'), icon: AlignRight }
                ].map((alignment) => (
                  <Button
                    key={alignment.value}
                    variant={(config.proposalTextAlignment || 'center') === alignment.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onChange('proposalTextAlignment', alignment.value)}
                    className="gap-1.5"
                  >
                    <alignment.icon className="w-4 h-4" />
                    {alignment.label}
                  </Button>
                ))}
              </div>
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
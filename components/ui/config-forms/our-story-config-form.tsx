"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { ImageGalleryDialog } from '@/components/ui/image-gallery-dialog'
import { Image as ImageIcon, X } from 'lucide-react'

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
  }
  onChange: (key: string, value: any) => void
  weddingNameId?: string
}

export function OurStoryConfigForm({ config, onChange, weddingNameId }: OurStoryConfigFormProps) {
  const [showHowWeMetImageDialog, setShowHowWeMetImageDialog] = useState(false)
  const [showProposalImageDialog, setShowProposalImageDialog] = useState(false)
  
  const variants = [
    { value: 'cards', label: 'Cards Layout', description: 'Side-by-side cards with photos and text' },
    { value: 'timeline', label: 'Timeline', description: 'Vertical timeline with milestones' },
    { value: 'minimal', label: 'Minimal', description: 'Clean text-focused layout' },
    { value: 'zigzag', label: 'Zigzag', description: 'Dynamic diagonal layout - modern and eye-catching' },
    { value: 'booklet', label: 'Booklet', description: 'Storybook-style stacked pages - romantic and narrative' }
  ]

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
"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { VariantDropdown } from '@/components/ui/variant-dropdown'

interface OurStoryConfigFormProps {
  config: {
    variant?: string
    textAlignment?: string
    showHowWeMet?: boolean
    showProposal?: boolean
    showPhotos?: boolean
    howWeMetText?: string
    proposalText?: string
    photos?: string[]
  }
  onChange: (key: string, value: any) => void
}

export function OurStoryConfigForm({ config, onChange }: OurStoryConfigFormProps) {
  const variants = [
    { value: 'cards', label: 'Cards Layout', description: 'Side-by-side cards with photos and text' },
    { value: 'timeline', label: 'Timeline', description: 'Vertical timeline with milestones' },
    { value: 'minimal', label: 'Minimal', description: 'Clean text-focused layout' }
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

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Show Photos
          </label>
          <Switch
            checked={config.showPhotos ?? true}
            onCheckedChange={(checked) => onChange('showPhotos', checked)}
          />
        </div>
      </div>

      {/* Story Text */}
      {config.showHowWeMet && (
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
      )}

      {config.showProposal && (
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
      )}

      {/* Photos */}
      {config.showPhotos && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo URLs
          </label>
          <div className="space-y-2">
            {(config.photos || ['']).map((photo, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="url"
                  value={photo}
                  onChange={(e) => {
                    const newPhotos = [...(config.photos || [''])]
                    newPhotos[index] = e.target.value
                    onChange('photos', newPhotos)
                  }}
                  placeholder="https://example.com/photo.jpg"
                />
                {index > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPhotos = [...(config.photos || [])]
                      newPhotos.splice(index, 1)
                      onChange('photos', newPhotos)
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPhotos = [...(config.photos || []), '']
                onChange('photos', newPhotos)
              }}
            >
              Add Photo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
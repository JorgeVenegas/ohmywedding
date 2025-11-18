"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

interface HeroConfigFormProps {
  config: {
    variant?: string
    imagePosition?: string
    frameStyle?: string
    imageSize?: string
    backgroundColor?: string
    showDecorations?: boolean
    textAlignment?: string
    showTagline?: boolean
    tagline?: string
    showCountdown?: boolean
    showRSVPButton?: boolean
    heroImageUrl?: string
  }
  onChange: (key: string, value: any) => void
  hasWeddingDate?: boolean
}

export function HeroConfigForm({ config, onChange, hasWeddingDate = true }: HeroConfigFormProps) {
  const variants = [
    { value: 'background', label: 'Background Hero', description: 'Fullscreen background with overlay text' },
    { value: 'side-by-side', label: 'Side by Side', description: 'Split layout with image and content' },
    { value: 'framed', label: 'Framed Photo', description: 'Decorative frame around photo' },
    { value: 'minimal', label: 'Minimal', description: 'Text-focused with subtle decorations' }
  ]

  const imagePositions = [
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' }
  ]

  const frameStyles = [
    { value: 'circular', label: 'Circular' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'square', label: 'Square' },
    { value: 'polaroid', label: 'Polaroid' }
  ]

  const imageSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ]

  return (
    <div className="space-y-6">
      {/* Variant Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Layout Style
        </label>
        <div className="space-y-2">
          {variants.map((variant) => (
            <div
              key={variant.value}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                config.variant === variant.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onChange('variant', variant.value)}
            >
              <div className="font-medium text-sm">{variant.label}</div>
              <div className="text-xs text-gray-500">{variant.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hero Image URL
        </label>
        <Input
          type="url"
          value={config.heroImageUrl || ''}
          onChange={(e) => onChange('heroImageUrl', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Side-by-Side specific options */}
      {config.variant === 'side-by-side' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image Position
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
      )}

      {/* Framed specific options */}
      {config.variant === 'framed' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frame Style
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
              Image Size
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.backgroundColor || '#ffffff'}
                onChange={(e) => onChange('backgroundColor', e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                type="text"
                value={config.backgroundColor || ''}
                onChange={(e) => onChange('backgroundColor', e.target.value)}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show Decorations
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
        <h4 className="font-medium text-gray-900">Content Settings</h4>
        
        {/* Text Alignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Alignment
          </label>
          <div className="flex gap-2">
            {[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' }
            ].map((alignment) => (
              <Button
                key={alignment.value}
                variant={config.textAlignment === alignment.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('textAlignment', alignment.value)}
              >
                {alignment.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Show Tagline
          </label>
          <Switch
            checked={config.showTagline ?? true}
            onCheckedChange={(checked) => onChange('showTagline', checked)}
          />
        </div>

        {config.showTagline && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline Text
            </label>
            <Input
              type="text"
              value={config.tagline || ''}
              onChange={(e) => onChange('tagline', e.target.value)}
              placeholder="Join us as we tie the knot!"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">
              Show Countdown
            </label>
            {!hasWeddingDate && (
              <p className="text-xs text-gray-500 mt-0.5">
                Requires a wedding date to be set
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
            Show RSVP Button
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
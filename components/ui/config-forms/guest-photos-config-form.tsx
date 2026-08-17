"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { BackgroundColorPicker } from './shared'
import type { BackgroundColorChoice } from './shared'

interface GuestPhotosConfigFormProps {
  config: {
    title?: string
    subtitle?: string
    uploaderPlaceholder?: string
    variant?: string
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
    galleryLayout?: string
  }
  onChange: (key: string, value: unknown) => void
}

const VARIANT_OPTIONS = [
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Clean centered layout — lets the photos speak',
  },
  {
    value: 'hero',
    label: 'Hero',
    description: 'Full-width colored header with the gallery below',
  },
  {
    value: 'polaroid',
    label: 'Polaroid',
    description: 'Photos as polaroid prints with a vintage feel',
  },
  {
    value: 'hacienda',
    label: 'Hacienda',
    description: 'Lush botanical arches, warm terracotta tones',
  },
  {
    value: 'old-money',
    label: 'Old Money',
    description: 'Parchment & engraved rules — refined editorial',
  },
]

const LAYOUT_OPTIONS = [
  { value: 'masonry',    label: 'Masonry' },
  { value: 'grid',       label: 'Mosaic' },
  { value: 'rows',       label: 'Rows' },
  { value: 'collage',    label: 'Collage' },
  { value: 'carousel',   label: 'Carousel' },
  { value: 'film-strip', label: 'Film Strip' },
  { value: 'scattered',  label: 'Scattered' },
]

export function GuestPhotosConfigForm({ config, onChange }: GuestPhotosConfigFormProps) {
  const activeVariant = config.variant || 'minimal'
  const activeLayout = config.galleryLayout || 'masonry'

  return (
    <div className="space-y-6">
      {/* Variant */}
      <VariantDropdown
        label="Style"
        value={activeVariant}
        options={VARIANT_OPTIONS}
        onChange={(value) => onChange('variant', value)}
      />

      {/* Gallery layout */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photo Layout</label>
        <div className="grid grid-cols-2 gap-1.5">
          {LAYOUT_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              variant={activeLayout === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange('galleryLayout', value)}
              className="w-full"
            >
              {label}
            </Button>
          ))}
        </div>
        {activeLayout === 'film-strip' && (
          <p className="text-xs text-[#420c14]/50 mt-1.5">Horizontal scrolling strip — works best with many photos.</p>
        )}
        {activeLayout === 'scattered' && (
          <p className="text-xs text-[#420c14]/50 mt-1.5">Photos scattered like prints on a table — polaroid feel.</p>
        )}
        {activeLayout === 'rows' && (
          <p className="text-xs text-[#420c14]/50 mt-1.5">Photos fill each row edge-to-edge at the same height.</p>
        )}
        {activeLayout === 'collage' && (
          <p className="text-xs text-[#420c14]/50 mt-1.5">Editorial mix of large, tall, and wide photos — no gap.</p>
        )}
        {activeLayout === 'carousel' && (
          <p className="text-xs text-[#420c14]/50 mt-1.5">One photo at a time with arrow navigation and thumbnail strip.</p>
        )}
      </div>

      {/* Section text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <Input
          value={config.title ?? 'Share Your Photos'}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Share Your Photos"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
        <Input
          value={config.subtitle ?? ''}
          onChange={(e) => onChange('subtitle', e.target.value)}
          placeholder="Upload your favorite moments from our celebration"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name Field Label</label>
        <Input
          value={config.uploaderPlaceholder ?? 'Your name'}
          onChange={(e) => onChange('uploaderPlaceholder', e.target.value)}
          placeholder="Your name"
        />
        <p className="text-xs text-gray-400 mt-1">Placeholder shown on the name input guests fill out.</p>
      </div>

      {/* Background color */}
      <BackgroundColorPicker
        useColorBackground={config.useColorBackground}
        backgroundColorChoice={config.backgroundColorChoice}
        onUseColorBackgroundChange={(v) => onChange('useColorBackground', v)}
        onBackgroundColorChoiceChange={(v) => onChange('backgroundColorChoice', v)}
      />
    </div>
  )
}

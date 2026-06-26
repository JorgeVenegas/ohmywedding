"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { BackgroundColorPicker, type BackgroundColorChoice } from './shared'

type SectionHeight = 'compact' | 'normal' | 'large' | 'full'

interface NotesConfigFormProps {
  config: {
    sectionTitle?: string
    sectionSubtitle?: string
    bodyText?: string
    showTitle?: boolean
    showSubtitle?: boolean
    showBodyText?: boolean
    sectionHeight?: SectionHeight
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
  }
  onChange: (key: string, value: unknown) => void
}

const HEIGHT_OPTIONS: { value: SectionHeight; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal',  label: 'Normal'  },
  { value: 'large',   label: 'Large'   },
  { value: 'full',    label: 'Full Screen' },
]

export function NotesConfigForm({ config, onChange }: NotesConfigFormProps) {
  const showTitle = config.showTitle ?? true
  const showSubtitle = config.showSubtitle ?? true
  const showBodyText = config.showBodyText ?? true
  const sectionHeight: SectionHeight = config.sectionHeight || 'normal'

  return (
    <div className="space-y-6">
      {/* Section Height */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Section Height</label>
        <div className="grid grid-cols-2 gap-2">
          {HEIGHT_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              variant={sectionHeight === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange('sectionHeight', value)}
              className="w-full"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Subtitle */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Subtitle</label>
          <Switch
            checked={showSubtitle}
            onCheckedChange={(v) => onChange('showSubtitle', v)}
          />
        </div>
        {showSubtitle && (
          <Input
            value={config.sectionSubtitle || ''}
            onChange={(e) => onChange('sectionSubtitle', e.target.value)}
            placeholder="e.g. A note from us"
          />
        )}
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <Switch
            checked={showTitle}
            onCheckedChange={(v) => onChange('showTitle', v)}
          />
        </div>
        {showTitle && (
          <Input
            value={config.sectionTitle || ''}
            onChange={(e) => onChange('sectionTitle', e.target.value)}
            placeholder="e.g. A few things to know"
          />
        )}
      </div>

      {/* Body Text */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Body Text</label>
          <Switch
            checked={showBodyText}
            onCheckedChange={(v) => onChange('showBodyText', v)}
          />
        </div>
        {showBodyText && (
          <Textarea
            value={config.bodyText || ''}
            onChange={(e) => onChange('bodyText', e.target.value)}
            placeholder="Write your note here..."
            rows={5}
          />
        )}
      </div>

      {/* Background Color */}
      <BackgroundColorPicker
        useColorBackground={config.useColorBackground}
        backgroundColorChoice={config.backgroundColorChoice}
        onUseColorBackgroundChange={(v) => onChange('useColorBackground', v)}
        onBackgroundColorChoiceChange={(v) => onChange('backgroundColorChoice', v)}
      />
    </div>
  )
}

"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { useI18n } from '@/components/contexts/i18n-context'
import { BackgroundColorPicker, type BackgroundColorChoice } from './shared'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DressCodeConfigFormProps {
  config: {
    variant?: string
    sectionTitle?: string
    sectionSubtitle?: string
    dressCodeType?: string
    description?: string
    images?: string[]
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
  }
  onChange: (key: string, value: unknown) => void
}

export function DressCodeConfigForm({ config, onChange }: DressCodeConfigFormProps) {
  const { t } = useI18n()

  const images = config.images || []

  const addImage = (url: string) => {
    onChange('images', [...images, url])
  }

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index)
    onChange('images', updated)
  }

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('config.sectionTitle')}
        </label>
        <Input
          value={config.sectionTitle || ''}
          onChange={(e) => onChange('sectionTitle', e.target.value)}
          placeholder={t('dressCode.title')}
        />
      </div>

      {/* Section Subtitle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('config.sectionSubtitle')}
        </label>
        <Input
          value={config.sectionSubtitle || ''}
          onChange={(e) => onChange('sectionSubtitle', e.target.value)}
          placeholder={t('dressCode.subtitle')}
        />
      </div>

      {/* Dress Code Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('dressCode.title')}
        </label>
        <Input
          value={config.dressCodeType || ''}
          onChange={(e) => onChange('dressCodeType', e.target.value)}
          placeholder="Formal / Semi-formal / Casual / Black Tie"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('config.description')}
        </label>
        <Textarea
          value={config.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('config.images')}
        </label>
        <div className="space-y-3">
          {images.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-16 h-16 rounded overflow-hidden border flex-shrink-0">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeImage(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <ImageUpload
            onUpload={addImage}
            placeholder={t('config.addPhoto')}
          />
        </div>
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

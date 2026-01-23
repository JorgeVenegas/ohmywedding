"use client"

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { ImageUpload } from '@/components/ui/image-upload'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { useI18n } from '@/components/contexts/i18n-context'
import { Check, Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'

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

interface FAQItem {
  id?: string
  question: string
  answer: string
  images?: string[]
}

interface FAQConfigFormProps {
  config: {
    variant?: string
    sectionTitle?: string
    sectionSubtitle?: string
    allowMultipleOpen?: boolean
    showContactNote?: boolean
    contactNoteText?: string
    questions?: FAQItem[]
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
  }
  onChange: (key: string, value: any) => void
}

export function FAQConfigForm({ config, onChange }: FAQConfigFormProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)
  const { t } = useI18n()
  
  // Get colors from page config (theme settings)
  const { config: pageConfig } = usePageConfig()
  const themeColors = pageConfig.siteSettings.theme?.colors
  
  const primaryColor = themeColors?.primary || '#d4a574'
  const secondaryColor = themeColors?.secondary || '#9ba082'
  const accentColor = themeColors?.accent || '#e6b5a3'

  const questions = config.questions || []

  const addQuestion = () => {
    const newQuestion: FAQItem = {
      id: `faq-${Date.now()}`,
      question: '',
      answer: ''
    }
    onChange('questions', [...questions, newQuestion])
    setExpandedQuestion(questions.length)
  }

  const updateQuestion = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    onChange('questions', updated)
  }

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index)
    onChange('questions', updated)
    setExpandedQuestion(null)
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === questions.length - 1) return
    
    const updated = [...questions]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]]
    onChange('questions', updated)
    setExpandedQuestion(swapIndex)
  }

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
    { value: 'accordion', label: t('config.accordion'), description: t('config.accordionDesc') },
    { value: 'minimal', label: t('config.minimal'), description: t('config.minimalCleanDesc') },
    { value: 'cards', label: t('config.cardsGrid'), description: t('config.cardsGridDesc') },
    { value: 'elegant', label: t('config.elegant'), description: t('config.elegantScriptDesc') },
    { value: 'simple', label: t('config.simpleList'), description: t('config.simpleListDesc') }
  ]

  const currentChoice = config.backgroundColorChoice || (config.useColorBackground ? 'primary' : 'none')

  return (
    <div className="space-y-6">
      {/* Variant Selection */}
      <VariantDropdown
        label={t('config.faqStyle')}
        value={config.variant || 'accordion'}
        options={variants}
        onChange={(value) => onChange('variant', value)}
        placeholder={t('config.faqStyle')}
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
            placeholder={t('faq.title')}
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
            placeholder={t('faq.subtitle')}
          />
        </div>
      </div>

      {/* Color Background Selection */}
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

      {/* Display Options */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-900 text-sm">{t('config.displayOptions')}</h4>
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t('config.allowMultipleOpen')}
            </label>
          </div>
          <Switch
            checked={config.allowMultipleOpen ?? false}
            onCheckedChange={(checked) => onChange('allowMultipleOpen', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t('config.showContactNote')}
            </label>
          </div>
          <Switch
            checked={config.showContactNote ?? true}
            onCheckedChange={(checked) => onChange('showContactNote', checked)}
          />
        </div>

        {(config.showContactNote ?? true) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config.contactNoteText')}
            </label>
            <Textarea
              value={config.contactNoteText || ''}
              onChange={(e) => onChange('contactNoteText', e.target.value)}
              placeholder={t('faq.contactNote')}
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Questions Management */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 text-sm">{t('config.questions')}</h4>
            <p className="text-xs text-gray-500">{questions.length} {questions.length !== 1 ? t('config.questions').toLowerCase() : t('config.question').toLowerCase()}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addQuestion}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {t('config.addQuestion')}
          </Button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg">
            <p className="text-sm">{t('config.noQuestions')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {questions.map((item, index) => {
              const isExpanded = expandedQuestion === index
              return (
                <div 
                  key={item.id || index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Question Header */}
                  <div 
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => setExpandedQuestion(isExpanded ? null : index)}
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {item.question || <span className="text-gray-400 italic">{t('config.enterQuestion')}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveQuestion(index, 'up'); }}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title={t('config.moveUp')}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveQuestion(index, 'down'); }}
                        disabled={index === questions.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title={t('config.moveDown')}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeQuestion(index); }}
                        className="p-1 text-red-400 hover:text-red-600"
                        title={t('config.deleteQuestion')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Edit Form */}
                  {isExpanded && (
                    <div className="p-3 space-y-3 border-t border-gray-200">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {t('config.question')}
                        </label>
                        <Input
                          type="text"
                          value={item.question}
                          onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                          placeholder={t('config.enterQuestion')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {t('config.answer')}
                        </label>
                        <Textarea
                          value={item.answer}
                          onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                          placeholder={t('config.enterAnswer')}
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          {t('config.images')} ({t('config.optional')})
                        </label>
                        
                        {/* Images Grid */}
                        {item.images && item.images.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {item.images.map((imageUrl, imgIndex) => (
                              <div key={imgIndex} className="relative aspect-square rounded border border-gray-200 overflow-hidden group">
                                <img
                                  src={imageUrl}
                                  alt={`Image ${imgIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...questions]
                                    const newImages = [...(updated[index].images || [])]
                                    newImages.splice(imgIndex, 1)
                                    updated[index] = { ...updated[index], images: newImages }
                                    onChange('questions', updated)
                                  }}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Add Image Button */}
                        <ImageUpload
                          key={`upload-${index}-${item.images?.length || 0}`}
                          onUpload={(url) => {
                            const updated = [...questions]
                            const currentImages = updated[index].images || []
                            updated[index] = { ...updated[index], images: [...currentImages, url] }
                            onChange('questions', updated)
                          }}
                          currentImageUrl={undefined}
                          placeholder={t('config.uploadImage')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

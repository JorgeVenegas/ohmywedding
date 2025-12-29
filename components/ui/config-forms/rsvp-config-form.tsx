"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { useI18n } from '@/components/contexts/i18n-context'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { 
  BackgroundColorPicker, 
  type BackgroundColorChoice
} from '@/components/ui/config-forms/shared'

interface CustomQuestion {
  id: string
  question: string
  type: 'text' | 'textarea' | 'select' | 'checkbox'
  required: boolean
  options?: string[]
}

interface RSVPConfigFormProps {
  config: {
    variant?: string
    sectionTitle?: string
    sectionSubtitle?: string
    textAlignment?: string
    showMealPreferences?: boolean
    showCustomQuestions?: boolean
    customQuestions?: CustomQuestion[]
    embedForm?: boolean
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
  }
  onChange: (key: string, value: any) => void
}

export function RSVPConfigForm({ config, onChange }: RSVPConfigFormProps) {
  const { t } = useI18n()
  
  const variants = [
    { value: 'elegant', label: 'Elegant', description: 'Romantic invitation-style design with elegant typography' },
    { value: 'minimalistic', label: 'Minimalistic', description: 'Modern and clean with refined sophistication' },
    { value: 'cards', label: 'Cards', description: 'Contemporary card-based layout with smooth interactions' }
  ]

  const addCustomQuestion = () => {
    const newQuestions = [
      ...(config.customQuestions || []),
      {
        id: `q${Date.now()}`,
        question: '',
        type: 'text' as const,
        required: false,
        options: []
      }
    ]
    onChange('customQuestions', newQuestions)
  }

  const updateCustomQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...(config.customQuestions || [])]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    onChange('customQuestions', newQuestions)
  }

  const removeCustomQuestion = (index: number) => {
    const newQuestions = [...(config.customQuestions || [])]
    newQuestions.splice(index, 1)
    onChange('customQuestions', newQuestions)
  }

  return (
    <div className="space-y-6">
      {/* Variant Selection */}
      <VariantDropdown
        label={t('config.rsvpStyle')}
        value={config.variant || 'elegant'}
        options={variants}
        onChange={(value) => onChange('variant', value)}
        placeholder={t('config.rsvpStyle')}
      />

      {/* Background Color Picker */}
      <BackgroundColorPicker
        useColorBackground={config.useColorBackground}
        backgroundColorChoice={config.backgroundColorChoice}
        onUseColorBackgroundChange={(value) => onChange('useColorBackground', value)}
        onBackgroundColorChoiceChange={(value) => onChange('backgroundColorChoice', value)}
      />

      {/* Text Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('config.textAlignment')}
        </label>
        <div className="flex gap-2">
          {[
            { value: 'left', label: t('config.left'), icon: AlignLeft },
            { value: 'center', label: t('config.center'), icon: AlignCenter },
            { value: 'right', label: t('config.right'), icon: AlignRight }
          ].map((alignment) => (
            <Button
              key={alignment.value}
              variant={config.textAlignment === alignment.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange('textAlignment', alignment.value)}
              className="gap-1.5"
            >
              <alignment.icon className="w-4 h-4" />
              {alignment.label}
            </Button>
          ))}
        </div>
      </div>

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
            placeholder={t('rsvp.title')}
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
            placeholder={t('rsvp.subtitle')}
          />
        </div>
      </div>

      {/* Form Options - only show if embedded form is selected */}
      {config.variant === 'form' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">{t('config.formOptions')}</h4>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {t('config.showMealPreferences')}
            </label>
            <Switch
              checked={config.showMealPreferences ?? true}
              onCheckedChange={(checked) => onChange('showMealPreferences', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {t('config.enableCustomQuestions')}
            </label>
            <Switch
              checked={config.showCustomQuestions ?? false}
              onCheckedChange={(checked) => onChange('showCustomQuestions', checked)}
            />
          </div>

          {/* Custom Questions */}
          {config.showCustomQuestions && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-900">{t('config.customQuestions')}</h5>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCustomQuestion}
                >
                  {t('config.addQuestion')}
                </Button>
              </div>

              {(config.customQuestions || []).map((question, index) => (
                <div key={question.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {t('config.question')} {index + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomQuestion(index)}
                    >
                      {t('config.removeQuestion')}
                    </Button>
                  </div>

                  <Input
                    placeholder={t('config.enterQuestion')}
                    value={question.question}
                    onChange={(e) => updateCustomQuestion(index, 'question', e.target.value)}
                  />

                  <div className="flex gap-2">
                    <select
                      value={question.type}
                      onChange={(e) => updateCustomQuestion(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="text">{t('config.textInput')}</option>
                      <option value="textarea">{t('config.textArea')}</option>
                      <option value="select">{t('config.dropdown')}</option>
                      <option value="checkbox">{t('config.checkbox')}</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateCustomQuestion(index, 'required', e.target.checked)}
                        className="rounded"
                      />
                      <label className="text-sm text-gray-700">{t('config.required')}</label>
                    </div>
                  </div>

                  {(question.type === 'select' || question.type === 'checkbox') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('config.optionsOnePer')}
                      </label>
                      <Textarea
                        value={(question.options || []).join('\n')}
                        onChange={(e) => {
                          const options = e.target.value.split('\n').filter(opt => opt.trim())
                          updateCustomQuestion(index, 'options', options)
                        }}
                        placeholder="Option 1\nOption 2\nOption 3"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
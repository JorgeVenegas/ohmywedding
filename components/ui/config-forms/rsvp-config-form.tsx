"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

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
    textAlignment?: string
    showMealPreferences?: boolean
    showCustomQuestions?: boolean
    customQuestions?: CustomQuestion[]
    embedForm?: boolean
  }
  onChange: (key: string, value: any) => void
}

export function RSVPConfigForm({ config, onChange }: RSVPConfigFormProps) {
  const variants = [
    { value: 'cta', label: 'Call to Action', description: 'Simple button linking to dedicated RSVP page' },
    { value: 'form', label: 'Embedded Form', description: 'Full RSVP form with meal preferences and custom questions' }
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          RSVP Style
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

      {/* Form Options - only show if embedded form is selected */}
      {config.variant === 'form' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Form Options</h4>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show Meal Preferences
            </label>
            <Switch
              checked={config.showMealPreferences ?? true}
              onCheckedChange={(checked) => onChange('showMealPreferences', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Enable Custom Questions
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
                <h5 className="font-medium text-gray-900">Custom Questions</h5>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCustomQuestion}
                >
                  Add Question
                </Button>
              </div>

              {(config.customQuestions || []).map((question, index) => (
                <div key={question.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Question {index + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomQuestion(index)}
                    >
                      Remove
                    </Button>
                  </div>

                  <Input
                    placeholder="Enter your question..."
                    value={question.question}
                    onChange={(e) => updateCustomQuestion(index, 'question', e.target.value)}
                  />

                  <div className="flex gap-2">
                    <select
                      value={question.type}
                      onChange={(e) => updateCustomQuestion(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="text">Text Input</option>
                      <option value="textarea">Text Area</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateCustomQuestion(index, 'required', e.target.checked)}
                        className="rounded"
                      />
                      <label className="text-sm text-gray-700">Required</label>
                    </div>
                  </div>

                  {(question.type === 'select' || question.type === 'checkbox') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options (one per line)
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
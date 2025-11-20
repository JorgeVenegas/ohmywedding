"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { VariantDropdown } from '@/components/ui/variant-dropdown'

interface CountdownConfigFormProps {
  config: {
    variant?: string
    textAlignment?: string
    showDays?: boolean
    showHours?: boolean
    showMinutes?: boolean
    showSeconds?: boolean
    message?: string
  }
  onChange: (key: string, value: any) => void
}

export function CountdownConfigForm({ config, onChange }: CountdownConfigFormProps) {
  const variants = [
    { value: 'classic', label: 'Classic Cards', description: 'Elegant bordered cards with decorative corners' },
    { value: 'minimal', label: 'Minimal Clean', description: 'Clean typography with subtle separators' },
    { value: 'circular', label: 'Circular Progress', description: 'Animated progress circles' }
  ]

  return (
    <div className="space-y-6">
      {/* Variant Selection */}
      <VariantDropdown
        label="Countdown Style"
        value={config.variant || 'classic'}
        options={variants}
        onChange={(value) => onChange('variant', value)}
        placeholder="Choose countdown style"
      />

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

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Countdown Message
        </label>
        <Input
          type="text"
          value={config.message || ''}
          onChange={(e) => onChange('message', e.target.value)}
          placeholder='Until we say "I do"'
        />
      </div>

      {/* Time Units */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Display Options</h4>
        
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Show Days
          </label>
          <Switch
            checked={config.showDays ?? true}
            onCheckedChange={(checked) => onChange('showDays', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Show Hours
          </label>
          <Switch
            checked={config.showHours ?? true}
            onCheckedChange={(checked) => onChange('showHours', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Show Minutes
          </label>
          <Switch
            checked={config.showMinutes ?? true}
            onCheckedChange={(checked) => onChange('showMinutes', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Show Seconds
          </label>
          <Switch
            checked={config.showSeconds ?? false}
            onCheckedChange={(checked) => onChange('showSeconds', checked)}
          />
        </div>
      </div>
    </div>
  )
}
"use client"

import React from 'react'
import { Check } from 'lucide-react'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { useI18n } from '@/components/contexts/i18n-context'

export type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

interface BackgroundColorPickerProps {
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
  onUseColorBackgroundChange: (value: boolean) => void
  onBackgroundColorChoiceChange: (value: BackgroundColorChoice) => void
}

// Helper to determine if a color is light (for contrast)
function isLightColor(color: string): boolean {
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

export function BackgroundColorPicker({
  useColorBackground = false,
  backgroundColorChoice = 'none',
  onUseColorBackgroundChange,
  onBackgroundColorChoiceChange,
}: BackgroundColorPickerProps) {
  const { config: pageConfig } = usePageConfig()
  const { t } = useI18n()
  const themeColors = pageConfig.siteSettings.theme?.colors
  
  const primaryColor = themeColors?.primary || '#d4a574'
  const secondaryColor = themeColors?.secondary || '#9ba082'
  const accentColor = themeColors?.accent || '#e6b5a3'

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
    },
  ]

  return (
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
                const isSelected = backgroundColorChoice === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onBackgroundColorChoiceChange(option.value)
                      onUseColorBackgroundChange(option.value !== 'none')
                    }}
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
  )
}

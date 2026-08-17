"use client"

import React from 'react'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { useI18n } from '@/components/contexts/i18n-context'

export type BackgroundColorChoice =
  | 'none'
  | 'primary' | 'primary-light' | 'primary-lighter'
  | 'secondary' | 'secondary-light' | 'secondary-lighter'
  | 'accent' | 'accent-light' | 'accent-lighter'

interface BackgroundColorPickerProps {
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
  onUseColorBackgroundChange: (value: boolean) => void
  onBackgroundColorChoiceChange: (value: BackgroundColorChoice) => void
}

function getLightTint(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`
}

function isLight(color: string): boolean {
  const m = color.startsWith('rgb') ? color.match(/(\d+),\s*(\d+),\s*(\d+)/) : null
  if (m) return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255 > 0.55
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
}

export function BackgroundColorPicker({
  backgroundColorChoice = 'none',
  onUseColorBackgroundChange,
  onBackgroundColorChoiceChange,
}: BackgroundColorPickerProps) {
  const { config: pageConfig } = usePageConfig()
  const { t } = useI18n()
  const themeColors = pageConfig.siteSettings.theme?.colors
  const P = themeColors?.primary ?? '#d4a574'
  const S = themeColors?.secondary ?? '#9ba082'
  const A = themeColors?.accent ?? '#e6b5a3'

  type Swatch = { value: BackgroundColorChoice; color: string | null; label: string }
  const groups: { key: string; label: string; swatches: Swatch[] }[] = [
    {
      key: 'none',
      label: 'None',
      swatches: [{ value: 'none', color: null, label: 'None' }],
    },
    {
      key: 'primary',
      label: t('config.primary'),
      swatches: [
        { value: 'primary',         color: P,                    label: 'Full' },
        { value: 'primary-light',   color: getLightTint(P, 0.5), label: '50%' },
        { value: 'primary-lighter', color: getLightTint(P, 0.88), label: '88%' },
      ],
    },
    {
      key: 'secondary',
      label: t('config.secondary'),
      swatches: [
        { value: 'secondary',         color: S,                    label: 'Full' },
        { value: 'secondary-light',   color: getLightTint(S, 0.5), label: '50%' },
        { value: 'secondary-lighter', color: getLightTint(S, 0.88), label: '88%' },
      ],
    },
    {
      key: 'accent',
      label: t('config.accent'),
      swatches: [
        { value: 'accent',         color: A,                    label: 'Full' },
        { value: 'accent-light',   color: getLightTint(A, 0.5), label: '50%' },
        { value: 'accent-lighter', color: getLightTint(A, 0.88), label: '88%' },
      ],
    },
  ]

  const handleSelect = (value: BackgroundColorChoice) => {
    onBackgroundColorChoiceChange(value)
    onUseColorBackgroundChange(value !== 'none')
  }

  return (
    <div>
      {/* Section label */}
      <p className="text-[10px] uppercase tracking-[0.25em] font-medium mb-3" style={{ color: '#DDA46F' }}>
        Background
      </p>

      <div className="space-y-2">
        {groups.map(group => (
          <div key={group.key} className="flex items-center gap-2">
            {/* Group label */}
            <span
              className="text-[10px] uppercase tracking-[0.15em] shrink-0"
              style={{ color: 'rgba(66,12,20,0.4)', width: 52 }}
            >
              {group.label}
            </span>

            {/* Swatches */}
            <div className="flex gap-1.5">
              {group.swatches.map(swatch => {
                const selected = backgroundColorChoice === swatch.value
                return (
                  <button
                    key={swatch.value}
                    type="button"
                    title={swatch.label}
                    onClick={() => handleSelect(swatch.value)}
                    className="transition-all duration-150"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    {/* Swatch fill */}
                    <span
                      className="absolute inset-0 rounded-full transition-transform duration-150"
                      style={{
                        background: swatch.color
                          ? swatch.color
                          : 'repeating-conic-gradient(rgba(0,0,0,0.08) 0% 25%, transparent 0% 50%) 0 0 / 8px 8px',
                        border: swatch.color ? 'none' : '1.5px solid rgba(0,0,0,0.1)',
                        transform: selected ? 'scale(0.72)' : 'scale(1)',
                      }}
                    />
                    {/* Selection ring */}
                    <span
                      className="absolute inset-0 rounded-full transition-all duration-150"
                      style={{
                        border: selected ? '2px solid #420c14' : '2px solid transparent',
                        outline: selected ? '1.5px solid transparent' : 'none',
                      }}
                    />
                    {/* Inner dot for none-selected */}
                    {selected && swatch.color === null && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#420c14' }} />
                      </span>
                    )}
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

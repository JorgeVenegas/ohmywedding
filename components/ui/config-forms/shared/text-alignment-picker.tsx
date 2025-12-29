"use client"

import React from 'react'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { useI18n } from '@/components/contexts/i18n-context'

export type TextAlignment = 'left' | 'center' | 'right'

interface TextAlignmentPickerProps {
  value?: TextAlignment
  onChange: (value: TextAlignment) => void
  label?: string
}

export function TextAlignmentPicker({
  value = 'center',
  onChange,
  label,
}: TextAlignmentPickerProps) {
  const { t } = useI18n()
  
  const alignments: { value: TextAlignment; icon: React.ReactNode; label: string }[] = [
    { value: 'left', icon: <AlignLeft className="w-4 h-4" />, label: t('config.alignLeft') },
    { value: 'center', icon: <AlignCenter className="w-4 h-4" />, label: t('config.alignCenter') },
    { value: 'right', icon: <AlignRight className="w-4 h-4" />, label: t('config.alignRight') },
  ]

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex gap-2">
        {alignments.map(({ value: alignValue, icon, label: alignLabel }) => (
          <button
            key={alignValue}
            type="button"
            onClick={() => onChange(alignValue)}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded border transition-all ${
              value === alignValue
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 hover:bg-accent'
            }`}
            title={alignLabel}
          >
            {icon}
            <span className="text-xs">{alignLabel}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

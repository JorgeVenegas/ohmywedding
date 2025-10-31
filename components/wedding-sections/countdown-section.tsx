"use client"

import React from 'react'
import {
  CountdownClassicVariant,
  CountdownMinimalVariant,
  CountdownCircularVariant,
  BaseCountdownProps
} from './countdown-variants'
import { VariantSwitcher } from '@/components/ui/variant-switcher'
import { useComponentVariant } from '@/components/contexts/variant-context'

interface CountdownSectionProps extends BaseCountdownProps {
  variant?: 'classic' | 'minimal' | 'circular'
  showVariantSwitcher?: boolean
}

export function CountdownSection({
  weddingDate,
  theme,
  alignment,
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = false,
  message = "Until we say \"I do\"",
  variant = 'classic',
  showVariantSwitcher = true
}: CountdownSectionProps) {
  const { currentVariant, setVariant } = useComponentVariant('countdown')
  
  let activeVariant: string = variant || 'classic'
  
  if (showVariantSwitcher && currentVariant) {
    activeVariant = currentVariant
  }

  const countdownVariants = [
    {
      value: 'classic',
      label: 'Classic Cards',
      description: 'Elegant bordered cards with decorative corners'
    },
    {
      value: 'minimal',
      label: 'Minimal Clean',
      description: 'Clean typography with subtle separators'
    },
    {
      value: 'circular',
      label: 'Circular Progress',
      description: 'Animated progress circles'
    }
  ]

  const commonProps = {
    weddingDate,
    theme,
    alignment,
    showDays,
    showHours,
    showMinutes,
    showSeconds,
    message
  }

  const renderCountdownContent = () => {
    switch (activeVariant) {
      case 'minimal':
        return <CountdownMinimalVariant {...commonProps} />
      case 'circular':
        return <CountdownCircularVariant {...commonProps} />
      case 'classic':
      default:
        return <CountdownClassicVariant {...commonProps} />
    }
  }

  return (
    <div>
      {showVariantSwitcher && (
        <VariantSwitcher
          componentType="⏰ Countdown"
          currentVariant={activeVariant}
          variants={countdownVariants}
          onVariantChange={setVariant}
        />
      )}
      {renderCountdownContent()}
    </div>
  )
}

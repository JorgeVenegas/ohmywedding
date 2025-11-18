"use client"

import React from 'react'
import {
  CountdownClassicVariant,
  CountdownMinimalVariant,
  CountdownCircularVariant,
  BaseCountdownProps
} from './countdown-variants'
import { 
  useSectionVariants, 
  createVariantConfig, 
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'

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
  // Use standardized section behavior
  const {
    activeVariant,
    customConfig,
    shouldShowVariantSwitcher,
    setVariant,
    handleEditClick
  } = useSectionVariants('countdown', 'countdown', 'classic', variant, showVariantSwitcher)

  // Define variants
  const countdownVariants: VariantOption[] = [
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

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    showDays,
    showHours,
    showMinutes,
    showSeconds,
    message
  })

  const commonProps = {
    weddingDate,
    theme,
    alignment,
    showDays: config.showDays ?? true,
    showHours: config.showHours ?? true,
    showMinutes: config.showMinutes ?? true,
    showSeconds: config.showSeconds ?? false,
    message: config.message || message
  }

  const renderCountdownContent = (activeVariant: string) => {
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

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
      showDays: config.showDays ?? showDays,
      showHours: config.showHours ?? showHours,
      showMinutes: config.showMinutes ?? showMinutes,
      showSeconds: config.showSeconds ?? showSeconds,
      message: config.message || message
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="countdown"
      sectionType="countdown"
      onEditClick={onEditClick}
    >
      {renderCountdownContent(activeVariant)}
    </EditableSectionWrapper>
  )
}

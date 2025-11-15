"use client"

import React from 'react'
import {
  CountdownClassicVariant,
  CountdownMinimalVariant,
  CountdownCircularVariant,
  BaseCountdownProps
} from './countdown-variants'
import { useComponentVariant } from '@/components/contexts/variant-context'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'

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
  const editingContext = useEditingModeSafe()
  const customizeContext = useCustomizeSafe()
  
  // Get customized configuration if available
  const customConfig = customizeContext?.getSectionConfig('countdown') || {}
  
  // Use editing context if available, otherwise fall back to prop
  const shouldShowVariantSwitcher = editingContext?.isEditingMode ?? showVariantSwitcher
  
  let activeVariant: string = customConfig.variant || variant || 'classic'
  
  if (shouldShowVariantSwitcher && currentVariant) {
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
    showDays: customConfig.showDays ?? showDays,
    showHours: customConfig.showHours ?? showHours,
    showMinutes: customConfig.showMinutes ?? showMinutes,
    showSeconds: customConfig.showSeconds ?? showSeconds,
    message: customConfig.message || message
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

  const handleEditClick = (sectionId: string, sectionType: string) => {
    if (customizeContext) {
      const currentConfig = {
        variant: activeVariant,
        showDays: customConfig.showDays ?? showDays,
        showHours: customConfig.showHours ?? showHours,
        showMinutes: customConfig.showMinutes ?? showMinutes,
        showSeconds: customConfig.showSeconds ?? showSeconds,
        message: customConfig.message || message
      }
      customizeContext.openCustomizer(sectionId, sectionType, currentConfig)
    }
  }

  return (
    <EditableSectionWrapper
      sectionId="countdown"
      sectionType="countdown"
      onEditClick={handleEditClick}
    >
      {renderCountdownContent()}
    </EditableSectionWrapper>
  )
}

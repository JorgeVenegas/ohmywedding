"use client"

import React from 'react'
import {
  CountdownClassicVariant,
  CountdownMinimalVariant,
  CountdownCircularVariant,
  CountdownElegantVariant,
  CountdownModernVariant,
  BaseCountdownProps
} from './countdown-variants'
import { 
  useSectionVariants, 
  createVariantConfig, 
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'
import { useI18n } from '@/components/contexts/i18n-context'

// Helper to detect old hardcoded English defaults
function isOldHardcodedDefault(value: string | undefined): boolean {
  if (!value) return false
  const oldDefaults = [
    'Until we say "I do"',
    "Until we say \"I do\""
  ]
  return oldDefaults.includes(value)
}

interface CountdownSectionProps extends BaseCountdownProps {
  variant?: 'classic' | 'minimal' | 'circular' | 'elegant' | 'modern'
  showVariantSwitcher?: boolean
}

export function CountdownSection({
  weddingDate,
  theme,
  alignment,
  showYears = true,
  showMonths = true,
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  sectionTitle,
  sectionSubtitle,
  message,
  variant = 'classic',
  showVariantSwitcher = true
}: CountdownSectionProps) {
  const { t } = useI18n()
  
  // Use translated default for message
  const defaultMessage = t('countdown.untilWeSayIDo')
  
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
    },
    {
      value: 'elegant',
      label: 'Elegant Script',
      description: 'Romantic script style with flourishes'
    },
    {
      value: 'modern',
      label: 'Modern Bold',
      description: 'Bold contemporary cards with gradient'
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    showYears,
    showMonths,
    showDays,
    showHours,
    showMinutes,
    showSeconds,
    sectionTitle,
    sectionSubtitle,
    message,
    useColorBackground: false,
    backgroundColorChoice: 'none'
  })

  // Get the message - use translated default if not set or is old hardcoded English
  const getTranslatedMessage = () => {
    const configMessage = config.message
    if (configMessage && !isOldHardcodedDefault(configMessage)) {
      return configMessage
    }
    if (message && !isOldHardcodedDefault(message)) {
      return message
    }
    return defaultMessage
  }

  const commonProps = {
    weddingDate,
    theme,
    alignment,
    showYears: config.showYears ?? true,
    showMonths: config.showMonths ?? true,
    showDays: config.showDays ?? true,
    showHours: config.showHours ?? true,
    showMinutes: config.showMinutes ?? true,
    showSeconds: config.showSeconds ?? true,
    sectionTitle: config.sectionTitle || sectionTitle,
    sectionSubtitle: config.sectionSubtitle || sectionSubtitle,
    message: getTranslatedMessage(),
    useColorBackground: config.useColorBackground ?? false,
    backgroundColorChoice: config.backgroundColorChoice || 'none'
  }

  const renderCountdownContent = (activeVariant: string) => {
    switch (activeVariant) {
      case 'minimal':
        return <CountdownMinimalVariant {...commonProps} />
      case 'circular':
        return <CountdownCircularVariant {...commonProps} />
      case 'elegant':
        return <CountdownElegantVariant {...commonProps} />
      case 'modern':
        return <CountdownModernVariant {...commonProps} />
      case 'classic':
      default:
        return <CountdownClassicVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
      showYears: config.showYears ?? showYears,
      showMonths: config.showMonths ?? showMonths,
      showDays: config.showDays ?? showDays,
      showHours: config.showHours ?? showHours,
      showMinutes: config.showMinutes ?? showMinutes,
      showSeconds: config.showSeconds ?? showSeconds,
      sectionTitle: config.sectionTitle || sectionTitle,
      sectionSubtitle: config.sectionSubtitle || sectionSubtitle,
      message: getTranslatedMessage(),
      useColorBackground: config.useColorBackground ?? false,
      backgroundColorChoice: config.backgroundColorChoice || 'none'
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

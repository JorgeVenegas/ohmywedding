"use client"

import React from 'react'
import {
  RegistryCardsVariant,
  RegistryMinimalVariant,
  RegistryElegantVariant,
  RegistryGridVariant,
  BaseRegistryProps
} from './registry-variants'
import { 
  useSectionVariants, 
  createVariantConfig, 
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'
import { useI18n } from '@/components/contexts/i18n-context'

// Old hardcoded English defaults to detect
const OLD_ENGLISH_DEFAULTS = {
  title: ['Gift Registry', 'Registry'],
  subtitle: ['Your presence is the greatest gift'],
  message: ['Your presence is the greatest gift, but if you wish to honor us with a gift, we have registered at:']
}

function isOldHardcodedDefault(value: string | undefined, type: 'title' | 'subtitle' | 'message'): boolean {
  if (!value) return false
  return OLD_ENGLISH_DEFAULTS[type].includes(value)
}

interface RegistrySectionProps extends BaseRegistryProps {
  variant?: 'cards' | 'minimal' | 'elegant' | 'grid'
  showVariantSwitcher?: boolean
  showDescription?: boolean
  weddingNameId?: string
}

export function RegistrySection({
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  message,
  registries = [],
  customItems = [],
  showCustomRegistry = false,
  showDescription = true,
  variant = 'cards',
  showVariantSwitcher = true,
  useColorBackground = false,
  backgroundColorChoice = 'none',
  weddingNameId
}: RegistrySectionProps) {
  const { t } = useI18n()
  
  // Use standardized section behavior
  const {
    activeVariant,
    customConfig,
    shouldShowVariantSwitcher,
    setVariant,
    handleEditClick
  } = useSectionVariants('registry', 'registry', 'cards', variant, showVariantSwitcher)

  // Define variants
  const registryVariants: VariantOption[] = [
    {
      value: 'cards',
      label: 'Cards',
      description: 'Classic card-based layout'
    },
    {
      value: 'minimal',
      label: 'Minimal',
      description: 'Clean and simple list style'
    },
    {
      value: 'elegant',
      label: 'Elegant',
      description: 'Romantic style with decorative elements'
    },
    {
      value: 'grid',
      label: 'Grid',
      description: 'Compact grid layout for many items'
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    sectionTitle,
    sectionSubtitle,
    message,
    registries,
    customItems,
    showCustomRegistry,
    showDescription,
    useColorBackground,
    backgroundColorChoice
  })

  // Get translated values, treating old hardcoded English defaults as empty
  const getTranslatedTitle = () => {
    const configTitle = config.sectionTitle
    if (configTitle && !isOldHardcodedDefault(configTitle, 'title')) {
      return configTitle
    }
    if (sectionTitle && !isOldHardcodedDefault(sectionTitle, 'title')) {
      return sectionTitle
    }
    return undefined // Let variant use translated default
  }

  const getTranslatedSubtitle = () => {
    const configSubtitle = config.sectionSubtitle
    if (configSubtitle && !isOldHardcodedDefault(configSubtitle, 'subtitle')) {
      return configSubtitle
    }
    if (sectionSubtitle && !isOldHardcodedDefault(sectionSubtitle, 'subtitle')) {
      return sectionSubtitle
    }
    return undefined // Let variant use translated default
  }

  const getTranslatedMessage = () => {
    const configMessage = config.message
    if (configMessage && !isOldHardcodedDefault(configMessage, 'message')) {
      return configMessage
    }
    if (message && !isOldHardcodedDefault(message, 'message')) {
      return message
    }
    return undefined // Let variant use translated default
  }

  const commonProps: BaseRegistryProps = {
    theme,
    alignment,
    sectionTitle: getTranslatedTitle(),
    sectionSubtitle: getTranslatedSubtitle(),
    message: getTranslatedMessage(),
    registries: config.registries || registries,
    customItems: config.customItems || customItems,
    showCustomRegistry: config.showCustomRegistry ?? showCustomRegistry,
    showDescription: config.showDescription ?? showDescription,
    useColorBackground: config.useColorBackground ?? useColorBackground,
    backgroundColorChoice: config.backgroundColorChoice || backgroundColorChoice,
    weddingNameId
  }

  const renderRegistryContent = (activeVariant: string) => {
    switch (activeVariant) {
      case 'minimal':
        return <RegistryMinimalVariant {...commonProps} />
      case 'elegant':
        return <RegistryElegantVariant {...commonProps} />
      case 'grid':
        return <RegistryGridVariant {...commonProps} />
      case 'cards':
      default:
        return <RegistryCardsVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
      sectionTitle: getTranslatedTitle() || '',
      sectionSubtitle: getTranslatedSubtitle() || '',
      message: getTranslatedMessage() || '',
      registries: config.registries || registries,
      customItems: config.customItems || customItems,
      showCustomRegistry: config.showCustomRegistry ?? showCustomRegistry,
      showDescription: config.showDescription ?? showDescription,
      useColorBackground: config.useColorBackground ?? useColorBackground,
      backgroundColorChoice: config.backgroundColorChoice || backgroundColorChoice
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="registry"
      sectionType="registry"
      onEditClick={onEditClick}
    >
      {renderRegistryContent(activeVariant)}
    </EditableSectionWrapper>
  )
}

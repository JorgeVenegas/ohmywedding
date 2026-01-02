"use client"

import React from 'react'
import {
  RSVPElegantVariant,
  RSVPMinimalisticVariant,
  RSVPCardsVariant,
  BaseRSVPProps,
  CustomQuestion
} from './rsvp-variants'
import { 
  useSectionVariants, 
  createVariantConfig, 
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'
import { useI18n } from '@/components/contexts/i18n-context'

interface RSVPSectionProps extends BaseRSVPProps {
  variant?: 'elegant' | 'minimalistic' | 'cards'
  showVariantSwitcher?: boolean
  groupId?: string
}

export function RSVPSection({
  dateId,
  weddingNameId,
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  showMealPreferences = true,
  showCustomQuestions = false,
  customQuestions = [],
  embedForm = false,
  variant = 'elegant',
  showVariantSwitcher = true,
  groupId,
  useColorBackground,
  backgroundColorChoice
}: RSVPSectionProps) {
  const { t } = useI18n()
  
  // Use standardized section behavior
  const {
    activeVariant: actualVariant,
    customConfig,
    shouldShowVariantSwitcher,
    setVariant,
    handleEditClick
  } = useSectionVariants('rsvp', 'rsvp', variant, variant, showVariantSwitcher)

  // Define variants
  const rsvpVariants: VariantOption[] = [
    {
      value: 'elegant',
      label: 'Elegant',
      description: 'Romantic serif typography with floral accents'
    },
    {
      value: 'minimalistic',
      label: 'Minimalistic',
      description: 'Modern and clean with subtle sophistication'
    },
    {
      value: 'cards',
      label: 'Cards',
      description: 'Individual guest cards with contemporary style'
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    sectionTitle,
    sectionSubtitle,
    showMealPreferences,
    showCustomQuestions,
    customQuestions,
    embedForm,
    useColorBackground: false,
    backgroundColorChoice: 'none'
  })

  const commonProps = {
    dateId,
    weddingNameId,
    theme,
    alignment: {
      ...alignment,
      text: config.textAlignment || alignment?.text || 'center'
    },
    sectionTitle: config.sectionTitle || sectionTitle,
    sectionSubtitle: config.sectionSubtitle || sectionSubtitle,
    showMealPreferences: config.showMealPreferences ?? true,
    showCustomQuestions: config.showCustomQuestions ?? false,
    customQuestions: config.customQuestions || customQuestions,
    embedForm: config.embedForm ?? embedForm,
    groupId,
    useColorBackground: config.useColorBackground ?? useColorBackground,
    backgroundColorChoice: config.backgroundColorChoice ?? backgroundColorChoice
  }
  
  console.log('[RSVP Section] Config and props:', {
    'config.useColorBackground': config.useColorBackground,
    'config.backgroundColorChoice': config.backgroundColorChoice,
    'prop.useColorBackground': useColorBackground,
    'prop.backgroundColorChoice': backgroundColorChoice,
    'commonProps.useColorBackground': commonProps.useColorBackground,
    'commonProps.backgroundColorChoice': commonProps.backgroundColorChoice
  })

  const renderRSVPContent = (activeVariant: string) => {
    console.log('[RSVP Section] Rendering variant:', activeVariant, 'variant prop:', variant)
    switch (activeVariant) {
      case 'minimalistic':
        return <RSVPMinimalisticVariant {...commonProps} />
      case 'cards':
        return <RSVPCardsVariant {...commonProps} />
      case 'elegant':
      default:
        return <RSVPElegantVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
      variant: actualVariant,
      sectionTitle,
      sectionSubtitle,
      showMealPreferences: config.showMealPreferences ?? showMealPreferences,
      showCustomQuestions: config.showCustomQuestions ?? showCustomQuestions,
      customQuestions: config.customQuestions || customQuestions,
      embedForm: config.embedForm ?? embedForm
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="rsvp"
      sectionType="rsvp"
      onEditClick={onEditClick}
    >
      {renderRSVPContent(actualVariant)}
    </EditableSectionWrapper>
  )
}
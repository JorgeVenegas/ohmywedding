"use client"

import React from 'react'
import {
  RSVPElegantVariant,
  RSVPMinimalisticVariant,
  RSVPCardsVariant,
  RSVPHaciendaVariant,
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
  variant?: 'elegant' | 'minimalistic' | 'cards' | 'hacienda'
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
  showTravelInfo = true,
  showCustomQuestions = false,
  customQuestions = [],
  embedForm = false,
  variant = 'elegant',
  showVariantSwitcher = true,
  groupId,
  useColorBackground,
  backgroundColorChoice,
  requirePhoneVerification = true
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
    },
    {
      value: 'hacienda',
      label: 'Hacienda',
      description: 'Elegant hacienda-themed RSVP with ornamental accents',
      deluxeOnly: true
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    sectionTitle,
    sectionSubtitle,
    showMealPreferences,
    showTravelInfo,
    showCustomQuestions,
    customQuestions,
    embedForm,
    useColorBackground: false,
    backgroundColorChoice: 'none',
    requirePhoneVerification
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
    showTravelInfo: config.showTravelInfo ?? true,
    showCustomQuestions: config.showCustomQuestions ?? false,
    customQuestions: config.customQuestions || customQuestions,
    embedForm: config.embedForm ?? embedForm,
    groupId,
    useColorBackground: config.useColorBackground ?? useColorBackground,
    backgroundColorChoice: config.backgroundColorChoice ?? backgroundColorChoice,
    requirePhoneVerification: config.requirePhoneVerification ?? requirePhoneVerification
  }

  const renderRSVPContent = (activeVariant: string) => {
    switch (activeVariant) {
      case 'minimalistic':
        return <RSVPMinimalisticVariant {...commonProps} />
      case 'cards':
        return <RSVPCardsVariant {...commonProps} />
      case 'hacienda':
        return <RSVPHaciendaVariant {...commonProps} />
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
      showTravelInfo: config.showTravelInfo ?? showTravelInfo,
      showCustomQuestions: config.showCustomQuestions ?? showCustomQuestions,
      customQuestions: config.customQuestions || customQuestions,
      embedForm: config.embedForm ?? embedForm,
      requirePhoneVerification: config.requirePhoneVerification ?? requirePhoneVerification
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
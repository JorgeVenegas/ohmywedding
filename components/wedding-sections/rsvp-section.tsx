"use client"

import React from 'react'
import {
  RSVPCallToActionVariant,
  RSVPFormVariant,
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
  variant?: 'cta' | 'form'
  showVariantSwitcher?: boolean
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
  variant = 'cta',
  showVariantSwitcher = true
}: RSVPSectionProps) {
  const { t } = useI18n()
  
  // Use standardized section behavior
  const {
    activeVariant: actualVariant,
    customConfig,
    shouldShowVariantSwitcher,
    setVariant,
    handleEditClick
  } = useSectionVariants('rsvp', 'rsvp', embedForm ? 'form' : 'cta', variant, showVariantSwitcher)

  // Define variants
  const rsvpVariants: VariantOption[] = [
    {
      value: 'cta',
      label: t('config.callToAction'),
      description: t('config.callToActionDesc')
    },
    {
      value: 'form',
      label: t('config.embeddedForm'),
      description: t('config.embeddedFormDesc')
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    sectionTitle,
    sectionSubtitle,
    showMealPreferences,
    showCustomQuestions,
    customQuestions,
    embedForm
  })

  const commonProps = {
    dateId,
    weddingNameId,
    theme,
    alignment,
    sectionTitle: config.sectionTitle || sectionTitle,
    sectionSubtitle: config.sectionSubtitle || sectionSubtitle,
    showMealPreferences: config.showMealPreferences ?? true,
    showCustomQuestions: config.showCustomQuestions ?? false,
    customQuestions: config.customQuestions || customQuestions,
    embedForm: config.embedForm ?? embedForm
  }

  const renderRSVPContent = (activeVariant: string) => {
    switch (activeVariant) {
      case 'form':
        return <RSVPFormVariant {...commonProps} />
      case 'cta':
      default:
        return <RSVPCallToActionVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
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
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

interface RSVPSectionProps extends BaseRSVPProps {
  variant?: 'cta' | 'form'
  showVariantSwitcher?: boolean
}

export function RSVPSection({
  dateId,
  weddingNameId,
  theme,
  alignment,
  showMealPreferences = true,
  showCustomQuestions = false,
  customQuestions = [],
  embedForm = false,
  variant = 'cta',
  showVariantSwitcher = true
}: RSVPSectionProps) {
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
      label: 'Call to Action',
      description: 'Simple button linking to dedicated RSVP page - clean and direct'
    },
    {
      value: 'form',
      label: 'Embedded Form',
      description: 'Full RSVP form with meal preferences and custom questions - all-in-one solution'
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
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
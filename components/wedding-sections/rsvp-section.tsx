"use client"

import React from 'react'
import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'
import {
  RSVPCallToActionVariant,
  RSVPFormVariant,
  BaseRSVPProps,
  CustomQuestion
} from './rsvp-variants'
import { useComponentVariant } from '@/components/contexts/variant-context'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'

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
  // Always use the context hook (now safe to call without provider)
  const { currentVariant, setVariant } = useComponentVariant('rsvp')
  const editingContext = useEditingModeSafe()
  const customizeContext = useCustomizeSafe()
  
  // Get customized configuration if available
  const customConfig = customizeContext?.getSectionConfig('rsvp') || {}
  
  // Use editing context if available, otherwise fall back to prop
  const shouldShowVariantSwitcher = editingContext?.isEditingMode ?? showVariantSwitcher
  
  // Determine which variant to use
  let actualVariant: string = customConfig.variant || (embedForm ? 'form' : (variant || 'cta'))
  
  if (shouldShowVariantSwitcher && currentVariant) {
    actualVariant = currentVariant
  }

  const rsvpVariants = [
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

  const commonProps = {
    dateId,
    weddingNameId,
    theme,
    alignment,
    showMealPreferences: customConfig.showMealPreferences ?? showMealPreferences,
    showCustomQuestions: customConfig.showCustomQuestions ?? showCustomQuestions,
    customQuestions: customConfig.customQuestions || customQuestions,
    embedForm: customConfig.embedForm ?? embedForm
  }

  const renderRSVPContent = () => {
    switch (actualVariant) {
      case 'form':
        return <RSVPFormVariant {...commonProps} />
      case 'cta':
      default:
        return <RSVPCallToActionVariant {...commonProps} />
    }
  }

  const handleEditClick = (sectionId: string, sectionType: string) => {
    if (customizeContext) {
      const currentConfig = {
        variant: actualVariant,
        showMealPreferences: customConfig.showMealPreferences ?? showMealPreferences,
        showCustomQuestions: customConfig.showCustomQuestions ?? showCustomQuestions,
        customQuestions: customConfig.customQuestions || customQuestions,
        embedForm: customConfig.embedForm ?? embedForm
      }
      customizeContext.openCustomizer(sectionId, sectionType, currentConfig)
    }
  }

  return (
    <EditableSectionWrapper
      sectionId="rsvp"
      sectionType="rsvp"
      onEditClick={handleEditClick}
    >
      {renderRSVPContent()}
    </EditableSectionWrapper>
  )
}
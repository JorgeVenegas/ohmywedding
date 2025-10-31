"use client"

import React from 'react'
import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'
import {
  RSVPCallToActionVariant,
  RSVPFormVariant,
  BaseRSVPProps,
  CustomQuestion
} from './rsvp-variants'
import { VariantSwitcher } from '@/components/ui/variant-switcher'
import { useComponentVariant } from '@/components/contexts/variant-context'

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
  
  // Determine which variant to use
  let actualVariant: string = embedForm ? 'form' : (variant || 'cta')
  
  if (showVariantSwitcher && currentVariant) {
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
    showMealPreferences,
    showCustomQuestions,
    customQuestions,
    embedForm
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

  return (
    <div>
      {showVariantSwitcher && (
        <VariantSwitcher
          componentType="📝 RSVP"
          currentVariant={actualVariant}
          variants={rsvpVariants}
          onVariantChange={setVariant}
        />
      )}
      {renderRSVPContent()}
    </div>
  )
}
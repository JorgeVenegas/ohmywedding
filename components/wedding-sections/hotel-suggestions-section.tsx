"use client"

import React from 'react'
import {
  HotelSuggestionsHaciendaVariant,
  BaseHotelSuggestionsProps
} from './hotel-suggestions-variants'
import {
  useSectionVariants,
  createVariantConfig,
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'

interface HotelSuggestionsSectionProps extends BaseHotelSuggestionsProps {
  variant?: 'hacienda'
  showVariantSwitcher?: boolean
}

export function HotelSuggestionsSection({
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  hotels,
  useColorBackground,
  backgroundColorChoice,
  variant = 'hacienda',
  showVariantSwitcher = true,
}: HotelSuggestionsSectionProps) {
  const {
    activeVariant,
    customConfig,
    handleEditClick,
  } = useSectionVariants('hotelSuggestions', 'hotel-suggestions', 'hacienda', variant, showVariantSwitcher)

  const config = createVariantConfig(customConfig, {
    sectionTitle,
    sectionSubtitle,
    hotels,
    useColorBackground: useColorBackground ?? false,
    backgroundColorChoice: backgroundColorChoice || 'none',
  })

  const commonProps: BaseHotelSuggestionsProps = {
    theme,
    alignment,
    sectionTitle: config.sectionTitle || sectionTitle,
    sectionSubtitle: config.sectionSubtitle || sectionSubtitle,
    hotels: config.hotels || hotels,
    useColorBackground: config.useColorBackground ?? false,
    backgroundColorChoice: config.backgroundColorChoice || 'none',
  }

  const renderContent = () => {
    switch (activeVariant) {
      case 'hacienda':
      default:
        return <HotelSuggestionsHaciendaVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
      sectionTitle: config.sectionTitle || '',
      sectionSubtitle: config.sectionSubtitle || '',
      hotels: config.hotels || [],
      useColorBackground: config.useColorBackground ?? false,
      backgroundColorChoice: config.backgroundColorChoice || 'none',
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="hotel-suggestions"
      sectionType="hotel-suggestions"
      onEditClick={onEditClick}
    >
      {renderContent()}
    </EditableSectionWrapper>
  )
}

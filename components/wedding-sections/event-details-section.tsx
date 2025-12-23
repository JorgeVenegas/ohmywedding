"use client"

import React from 'react'
import {
  EventDetailsClassicVariant,
  EventDetailsElegantVariant,
  EventDetailsTimelineVariant,
  EventDetailsMinimalVariant,
  EventDetailsSplitVariant,
  BaseEventDetailsProps
} from './event-details-variants'
import { 
  useSectionVariants, 
  createVariantConfig, 
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'
import { useI18n } from '@/components/contexts/i18n-context'

type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

interface EventDetailsSectionProps extends Omit<BaseEventDetailsProps, 'backgroundColorChoice'> {
  variant?: 'classic' | 'elegant' | 'timeline' | 'minimal' | 'split'
  showVariantSwitcher?: boolean
  dateId?: string
  showPhotos?: boolean
  ceremonyImageUrl?: string
  receptionImageUrl?: string
  backgroundColorChoice?: BackgroundColorChoice
}

export function EventDetailsSection({
  wedding,
  weddingNameId,
  theme,
  alignment,
  showCeremony = true,
  showReception = true,
  showMapLinks = true,
  showMap = true,
  showPhotos = false,
  ceremonyImageUrl,
  receptionImageUrl,
  sectionTitle,
  sectionSubtitle,
  customEvents = [],
  variant = 'classic',
  showVariantSwitcher = true,
  useColorBackground = false,
  backgroundColorChoice = 'none'
}: EventDetailsSectionProps) {
  const { t } = useI18n()
  
  // Use standardized section behavior
  const {
    activeVariant,
    customConfig,
    shouldShowVariantSwitcher,
    setVariant,
    handleEditClick
  } = useSectionVariants('eventDetails', 'event-details', 'classic', variant, showVariantSwitcher)

  // Define variants
  const eventDetailsVariants: VariantOption[] = [
    {
      value: 'classic',
      label: t('config.classicCards'),
      description: t('config.classicCardsDesc')
    },
    {
      value: 'elegant',
      label: t('config.elegantScript'),
      description: t('config.elegantScriptDesc')
    },
    {
      value: 'timeline',
      label: t('config.timeline'),
      description: t('config.timelineDesc')
    },
    {
      value: 'minimal',
      label: t('config.minimalClean'),
      description: t('config.minimalCleanDesc')
    },
    {
      value: 'split',
      label: t('config.splitLayout'),
      description: t('config.splitLayoutDesc')
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    showCeremony,
    showReception,
    showMapLinks,
    showMap,
    showPhotos,
    ceremonyImageUrl,
    receptionImageUrl,
    ceremonyDescription: '',
    receptionDescription: '',
    sectionTitle,
    sectionSubtitle,
    events: [],
    customEvents,
    useColorBackground: false,
    backgroundColorChoice: 'none',
    ceremonyTextAlignment: 'center',
    receptionTextAlignment: 'center'
  })

  const commonProps = {
    wedding,
    weddingNameId,
    theme,
    alignment,
    showCeremony: config.showCeremony ?? showCeremony,
    showReception: config.showReception ?? showReception,
    showMapLinks: config.showMapLinks ?? showMapLinks,
    showMap: config.showMap ?? showMap,
    showPhotos: config.showPhotos ?? showPhotos,
    ceremonyImageUrl: config.ceremonyImageUrl ?? ceremonyImageUrl,
    receptionImageUrl: config.receptionImageUrl ?? receptionImageUrl,
    // Pass empty string as-is to hide description, undefined for default
    ceremonyDescription: config.ceremonyDescription !== undefined ? config.ceremonyDescription : undefined,
    receptionDescription: config.receptionDescription !== undefined ? config.receptionDescription : undefined,
    sectionTitle: config.sectionTitle || sectionTitle,
    sectionSubtitle: config.sectionSubtitle || sectionSubtitle,
    events: config.events, // New primary events array
    customEvents: config.customEvents || customEvents, // Legacy support
    useColorBackground: config.useColorBackground ?? false,
    backgroundColorChoice: config.backgroundColorChoice || 'none',
    ceremonyTextAlignment: config.ceremonyTextAlignment || 'center',
    receptionTextAlignment: config.receptionTextAlignment || 'center'
  }

  const renderEventDetailsContent = (activeVariant: string) => {
    switch (activeVariant) {
      case 'elegant':
        return <EventDetailsElegantVariant {...commonProps} />
      case 'timeline':
        return <EventDetailsTimelineVariant {...commonProps} />
      case 'minimal':
        return <EventDetailsMinimalVariant {...commonProps} />
      case 'split':
        return <EventDetailsSplitVariant {...commonProps} />
      case 'classic':
      default:
        return <EventDetailsClassicVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
      showCeremony: config.showCeremony ?? showCeremony,
      showReception: config.showReception ?? showReception,
      showMapLinks: config.showMapLinks ?? showMapLinks,
      showMap: config.showMap ?? showMap,
      showPhotos: config.showPhotos ?? showPhotos,
      ceremonyImageUrl: config.ceremonyImageUrl ?? ceremonyImageUrl,
      receptionImageUrl: config.receptionImageUrl ?? receptionImageUrl,
      ceremonyDescription: config.ceremonyDescription || '',
      receptionDescription: config.receptionDescription || '',
      sectionTitle: config.sectionTitle || sectionTitle || '',
      sectionSubtitle: config.sectionSubtitle || sectionSubtitle || '',
      events: config.events, // New primary events array
      customEvents: config.customEvents || customEvents, // Legacy support
      useColorBackground: config.useColorBackground ?? false,
      backgroundColorChoice: config.backgroundColorChoice || 'none',
      ceremonyTextAlignment: config.ceremonyTextAlignment || 'center',
      receptionTextAlignment: config.receptionTextAlignment || 'center'
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="event-details"
      sectionType="event-details"
      onEditClick={onEditClick}
    >
      {renderEventDetailsContent(activeVariant)}
    </EditableSectionWrapper>
  )
}
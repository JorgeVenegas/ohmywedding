"use client"

import React from 'react'
import {
  OurStoryTimelineVariant,
  OurStoryCardsVariant,
  OurStoryMinimalVariant,
  BaseOurStoryProps,
} from './our-story-variants'
import { 
  useSectionVariants, 
  createVariantConfig, 
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'

interface OurStorySectionProps extends BaseOurStoryProps {
  variant?: 'timeline' | 'cards' | 'minimal'
  showVariantSwitcher?: boolean
}

export function OurStorySection({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  showPhotos = true,
  howWeMetText = "Our love story began...",
  proposalText = "The proposal was magical...",
  photos = [],
  timeline = [],
  variant = 'cards',
  showVariantSwitcher = true
}: OurStorySectionProps) {
  // Use standardized section behavior
  const {
    activeVariant,
    customConfig,
    shouldShowVariantSwitcher,
    setVariant,
    handleEditClick
  } = useSectionVariants('ourStory', 'our-story', 'cards', variant, showVariantSwitcher)

  // Define variants
  const storyVariants: VariantOption[] = [
    {
      value: 'cards',
      label: 'Cards Layout',
      description: 'Card-based design with photos and story sections - great for multiple images'
    },
    {
      value: 'timeline',
      label: 'Timeline',
      description: 'Chronological timeline with alternating content - perfect for relationship milestones'
    },
    {
      value: 'minimal',
      label: 'Minimal',
      description: 'Clean text-focused layout - emphasizes written content'
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    showHowWeMet,
    showProposal,
    showPhotos,
    howWeMetText,
    proposalText,
    photos
  })

  const commonProps = {
    theme,
    alignment,
    showHowWeMet: config.showHowWeMet ?? true,
    showProposal: config.showProposal ?? true,
    showPhotos: config.showPhotos ?? true,
    howWeMetText: config.howWeMetText || howWeMetText,
    proposalText: config.proposalText || proposalText,
    photos: config.photos || photos,
    timeline
  }

  const renderStoryContent = (activeVariant: string) => {
    switch (activeVariant) {
      case 'timeline':
        return <OurStoryTimelineVariant {...commonProps} />
      case 'minimal':
        return <OurStoryMinimalVariant {...commonProps} />
      case 'cards':
      default:
        return <OurStoryCardsVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
      showHowWeMet: config.showHowWeMet ?? showHowWeMet,
      showProposal: config.showProposal ?? showProposal,
      showPhotos: config.showPhotos ?? showPhotos,
      howWeMetText: config.howWeMetText || howWeMetText,
      proposalText: config.proposalText || proposalText,
      photos: config.photos || photos
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="our-story"
      sectionType="our-story"
      onEditClick={onEditClick}
    >
      {renderStoryContent(activeVariant)}
    </EditableSectionWrapper>
  )
}
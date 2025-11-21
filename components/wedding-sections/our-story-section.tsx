"use client"

import React from 'react'
import {
  OurStoryTimelineVariant,
  OurStoryCardsVariant,
  OurStoryMinimalVariant,
  OurStoryZigzagVariant,
  OurStoryBookletVariant,
  BaseOurStoryProps,
} from './our-story-variants'
import { 
  useSectionVariants, 
  createVariantConfig, 
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'

interface OurStorySectionProps extends BaseOurStoryProps {
  variant?: 'timeline' | 'cards' | 'minimal' | 'zigzag' | 'booklet'
  showVariantSwitcher?: boolean
  showHowWeMetPhoto?: boolean
  showProposalPhoto?: boolean
}

export function OurStorySection({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  showPhotos = true,
  showHowWeMetPhoto = false,
  showProposalPhoto = false,
  howWeMetText = "Our love story began in the most unexpected way. From the moment we met, we knew there was something special between us. What started as a chance encounter blossomed into a beautiful friendship, and eventually, a love that we knew would last forever.",
  howWeMetPhoto,
  proposalText = "The proposal was a magical moment we'll cherish forever. Surrounded by the beauty of nature and the warmth of our love, the question was asked and answered with tears of joy. It was the perfect beginning to our next chapter together.",
  proposalPhoto,
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
    },
    {
      value: 'zigzag',
      label: 'Zigzag',
      description: 'Dynamic diagonal layout with alternating content - modern and eye-catching'
    },
    {
      value: 'booklet',
      label: 'Booklet',
      description: 'Storybook-style stacked pages with elegant typography - romantic and narrative'
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    showHowWeMet,
    showProposal,
    showPhotos,
    showHowWeMetPhoto,
    showProposalPhoto,
    howWeMetText,
    howWeMetPhoto,
    proposalText,
    proposalPhoto,
    photos
  })

  const commonProps = {
    theme,
    alignment,
    showHowWeMet: config.showHowWeMet ?? true,
    showProposal: config.showProposal ?? true,
    showPhotos: config.showPhotos ?? true,
    showHowWeMetPhoto: config.showHowWeMetPhoto ?? false,
    showProposalPhoto: config.showProposalPhoto ?? false,
    howWeMetText: config.howWeMetText || howWeMetText,
    howWeMetPhoto: (config.showHowWeMetPhoto && config.howWeMetPhoto) ? config.howWeMetPhoto : undefined,
    proposalText: config.proposalText || proposalText,
    proposalPhoto: (config.showProposalPhoto && config.proposalPhoto) ? config.proposalPhoto : undefined,
    photos: config.photos || photos,
    timeline
  }

  const renderStoryContent = (activeVariant: string) => {
    switch (activeVariant) {
      case 'timeline':
        return <OurStoryTimelineVariant {...commonProps} />
      case 'minimal':
        return <OurStoryMinimalVariant {...commonProps} />
      case 'zigzag':
        return <OurStoryZigzagVariant {...commonProps} />
      case 'booklet':
        return <OurStoryBookletVariant {...commonProps} />
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
      showHowWeMetPhoto: config.showHowWeMetPhoto ?? showHowWeMetPhoto,
      showProposalPhoto: config.showProposalPhoto ?? showProposalPhoto,
      howWeMetText: config.howWeMetText || howWeMetText,
      howWeMetPhoto: config.howWeMetPhoto || howWeMetPhoto,
      proposalText: config.proposalText || proposalText,
      proposalPhoto: config.proposalPhoto || proposalPhoto,
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
"use client"

import React from 'react'
import {
  OurStoryTimelineVariant,
  OurStoryCardsVariant,
  OurStoryMinimalVariant,
  OurStoryZigzagVariant,
  OurStoryBookletVariant,
  OurStorySplitVariant,
  BaseOurStoryProps,
} from './our-story-variants'
import { 
  useSectionVariants, 
  createVariantConfig, 
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'

interface OurStorySectionProps extends BaseOurStoryProps {
  variant?: 'timeline' | 'cards' | 'minimal' | 'zigzag' | 'booklet' | 'split'
  showVariantSwitcher?: boolean
  showHowWeMetPhoto?: boolean
  showProposalPhoto?: boolean
}

export function OurStorySection({
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  showHowWeMet = true,
  showProposal = true,
  showPhotos = true,
  showHowWeMetPhoto = false,
  showProposalPhoto = false,
  howWeMetText,
  howWeMetPhoto,
  proposalText,
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
    },
    {
      value: 'split',
      label: 'Split View',
      description: 'Full-width alternating layout with large photos - elegant and immersive'
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    showHowWeMet,
    showProposal,
    showPhotos,
    showHowWeMetPhoto,
    sectionTitle,
    sectionSubtitle,
    showProposalPhoto,
    howWeMetText,
    howWeMetPhoto,
    proposalText,
    proposalPhoto,
    photos,
    useColorBackground: false,
    backgroundColorChoice: 'none',
    howWeMetTextAlignment: 'center',
    proposalTextAlignment: 'center'
  })

  // Helper to check if text is an old hardcoded English default that should be replaced with i18n
  const isOldEnglishDefault = (text: string | undefined) => {
    if (!text) return false // empty string is NOT an old default, it's intentionally empty
    const oldDefaults = [
      'Our love story began in the most unexpected way',
      'The proposal was a magical moment'
    ]
    return oldDefaults.some(d => text.startsWith(d))
  }

  // Get text value: if config has a value (including empty string), use it; otherwise use prop
  const getHowWeMetText = () => {
    const value = config.howWeMetText !== undefined ? config.howWeMetText : howWeMetText
    // If it's an old English default, return undefined to use i18n default
    return isOldEnglishDefault(value) ? undefined : value
  }
  
  const getProposalText = () => {
    const value = config.proposalText !== undefined ? config.proposalText : proposalText
    // If it's an old English default, return undefined to use i18n default
    return isOldEnglishDefault(value) ? undefined : value
  }

  const commonProps = {
    theme,
    alignment,
    sectionTitle: config.sectionTitle || sectionTitle,
    sectionSubtitle: config.sectionSubtitle || sectionSubtitle,
    showHowWeMet: config.showHowWeMet ?? true,
    showProposal: config.showProposal ?? true,
    showPhotos: config.showPhotos ?? true,
    showHowWeMetPhoto: config.showHowWeMetPhoto ?? false,
    showProposalPhoto: config.showProposalPhoto ?? false,
    howWeMetText: getHowWeMetText(),
    howWeMetPhoto: config.howWeMetPhoto || howWeMetPhoto,
    proposalText: getProposalText(),
    proposalPhoto: config.proposalPhoto || proposalPhoto,
    photos: config.photos || photos,
    timeline,
    useColorBackground: config.useColorBackground ?? false,
    backgroundColorChoice: config.backgroundColorChoice || 'none',
    howWeMetTextAlignment: config.howWeMetTextAlignment || 'center',
    proposalTextAlignment: config.proposalTextAlignment || 'center'
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
      case 'split':
        return <OurStorySplitVariant {...commonProps} />
      case 'cards':
      default:
        return <OurStoryCardsVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    // For text fields, preserve empty strings - don't fall back to props
    // This allows users to intentionally clear text to use defaults
    const getEditHowWeMetText = () => {
      if (config.howWeMetText !== undefined) return config.howWeMetText
      // Only use prop if it's not an old default
      return isOldEnglishDefault(howWeMetText) ? '' : (howWeMetText || '')
    }
    
    const getEditProposalText = () => {
      if (config.proposalText !== undefined) return config.proposalText
      // Only use prop if it's not an old default
      return isOldEnglishDefault(proposalText) ? '' : (proposalText || '')
    }
    
    handleEditClick(sectionType, {
      sectionTitle: config.sectionTitle || sectionTitle || '',
      sectionSubtitle: config.sectionSubtitle || sectionSubtitle || '',
      showHowWeMet: config.showHowWeMet ?? showHowWeMet,
      showProposal: config.showProposal ?? showProposal,
      showPhotos: config.showPhotos ?? showPhotos,
      showHowWeMetPhoto: config.showHowWeMetPhoto ?? showHowWeMetPhoto,
      showProposalPhoto: config.showProposalPhoto ?? showProposalPhoto,
      howWeMetText: getEditHowWeMetText(),
      howWeMetPhoto: config.howWeMetPhoto || howWeMetPhoto,
      proposalText: getEditProposalText(),
      proposalPhoto: config.proposalPhoto || proposalPhoto,
      photos: config.photos || photos,
      useColorBackground: config.useColorBackground ?? false,
      backgroundColorChoice: config.backgroundColorChoice || 'none',
      howWeMetTextAlignment: config.howWeMetTextAlignment || 'center',
      proposalTextAlignment: config.proposalTextAlignment || 'center'
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
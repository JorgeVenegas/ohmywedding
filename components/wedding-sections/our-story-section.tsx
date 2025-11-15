"use client"

import React from 'react'
import {
  OurStoryTimelineVariant,
  OurStoryCardsVariant,
  OurStoryMinimalVariant,
  BaseOurStoryProps,
  TimelineEvent
} from './our-story-variants'
import { useComponentVariant } from '@/components/contexts/variant-context'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'

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
  // Always use the context hook (now safe to call without provider)
  const { currentVariant, setVariant } = useComponentVariant('ourStory')
  const editingContext = useEditingModeSafe()
  const customizeContext = useCustomizeSafe()
  
  // Get customized configuration if available
  const customConfig = customizeContext?.getSectionConfig('ourStory') || {}
  
  const hasContent = (customConfig.showHowWeMet ?? showHowWeMet) || 
                    (customConfig.showProposal ?? showProposal) || 
                    ((customConfig.showPhotos ?? showPhotos) && (customConfig.photos || photos).length > 0) || 
                    timeline.length > 0

  if (!hasContent) return null

  // Use editing context if available, otherwise fall back to prop
  const shouldShowVariantSwitcher = editingContext?.isEditingMode ?? showVariantSwitcher
  
  // Determine which variant to use
  let activeVariant: string = customConfig.variant || variant || 'cards'
  
  if (shouldShowVariantSwitcher && currentVariant) {
    activeVariant = currentVariant
  }

  const storyVariants = [
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

  const commonProps = {
    theme,
    alignment,
    showHowWeMet: customConfig.showHowWeMet ?? showHowWeMet,
    showProposal: customConfig.showProposal ?? showProposal,
    showPhotos: customConfig.showPhotos ?? showPhotos,
    howWeMetText: customConfig.howWeMetText || howWeMetText,
    proposalText: customConfig.proposalText || proposalText,
    photos: customConfig.photos || photos,
    timeline
  }

  const renderStoryContent = () => {
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

  const handleEditClick = (sectionId: string, sectionType: string) => {
    if (customizeContext) {
      const currentConfig = {
        variant: activeVariant,
        showHowWeMet: customConfig.showHowWeMet ?? showHowWeMet,
        showProposal: customConfig.showProposal ?? showProposal,
        showPhotos: customConfig.showPhotos ?? showPhotos,
        howWeMetText: customConfig.howWeMetText || howWeMetText,
        proposalText: customConfig.proposalText || proposalText,
        photos: customConfig.photos || photos
      }
      customizeContext.openCustomizer(sectionId, sectionType, currentConfig)
    }
  }

  return (
    <EditableSectionWrapper
      sectionId="our-story"
      sectionType="our-story"
      onEditClick={handleEditClick}
    >
      {renderStoryContent()}
    </EditableSectionWrapper>
  )
}
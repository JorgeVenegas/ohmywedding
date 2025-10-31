"use client"

import React from 'react'
import {
  OurStoryTimelineVariant,
  OurStoryCardsVariant,
  OurStoryMinimalVariant,
  BaseOurStoryProps,
  TimelineEvent
} from './our-story-variants'
import { VariantSwitcher } from '@/components/ui/variant-switcher'
import { useComponentVariant } from '@/components/contexts/variant-context'

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
  const hasContent = showHowWeMet || showProposal || (showPhotos && photos.length > 0) || timeline.length > 0

  if (!hasContent) return null

  // Always use the context hook (now safe to call without provider)
  const { currentVariant, setVariant } = useComponentVariant('ourStory')
  
  // Determine which variant to use
  let activeVariant: string = variant || 'cards'
  
  if (showVariantSwitcher && currentVariant) {
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
    showHowWeMet,
    showProposal,
    showPhotos,
    howWeMetText,
    proposalText,
    photos,
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

  return (
    <div>
      {showVariantSwitcher && (
        <VariantSwitcher
          componentType="💕 Our Story"
          currentVariant={activeVariant}
          variants={storyVariants}
          onVariantChange={setVariant}
        />
      )}
      {renderStoryContent()}
    </div>
  )
}
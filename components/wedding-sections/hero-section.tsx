"use client"

import React from 'react'
import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'
import { type Wedding } from '@/lib/wedding-data'
import { 
  HeroBackgroundVariant,
  HeroSideBySideVariant, 
  HeroFramedVariant,
  HeroMinimalVariant,
  BaseHeroProps
} from './hero-variants'
import { VariantSwitcher } from '@/components/ui/variant-switcher'
import { useComponentVariant } from '@/components/contexts/variant-context'

interface HeroSectionProps extends BaseHeroProps {
  variant?: 'background' | 'side-by-side' | 'framed' | 'minimal'
  imagePosition?: 'left' | 'right' // for side-by-side variant
  frameStyle?: 'circular' | 'rounded' | 'square' | 'polaroid' // for framed variant
  imageSize?: 'small' | 'medium' | 'large' // for framed variant
  backgroundColor?: string // for minimal variant
  showDecorations?: boolean // for minimal variant
  showVariantSwitcher?: boolean // enable/disable variant switcher
}

export function HeroSection({
  wedding,
  dateId,
  weddingNameId,
  theme,
  alignment,
  showTagline = true,
  tagline = "Join us as we tie the knot!",
  showCountdown = true,
  showRSVPButton = true,
  heroImageUrl,
  variant = 'background',
  imagePosition = 'left',
  frameStyle = 'circular',
  imageSize = 'medium',
  backgroundColor,
  showDecorations = true,
  showVariantSwitcher = true
}: HeroSectionProps) {
  // Always use the context hook (now safe to call without provider)
  const { currentVariant, setVariant } = useComponentVariant('hero')
  
  // Determine which variant to use
  let heroVariant: string = variant || 'background'
  
  if (showVariantSwitcher && currentVariant) {
    heroVariant = currentVariant
  } else if (!heroVariant) {
    // Fallback variant selection based on alignment
    heroVariant = alignment?.imagePosition === 'split-left' || alignment?.imagePosition === 'split-right' 
      ? 'side-by-side' 
      : alignment?.imagePosition === 'fullscreen' || alignment?.imagePosition === 'overlay' 
      ? 'background'
      : 'background'
  }

  // Fallback variant selection based on alignment
  if (!heroVariant) {
    heroVariant = alignment?.imagePosition === 'split-left' || alignment?.imagePosition === 'split-right' 
      ? 'side-by-side' 
      : alignment?.imagePosition === 'fullscreen' || alignment?.imagePosition === 'overlay' 
      ? 'background'
      : 'background'
  }

  const heroVariants = [
    {
      value: 'background',
      label: 'Background Hero',
      description: 'Fullscreen background image with overlay text - perfect for dramatic photos'
    },
    {
      value: 'side-by-side',
      label: 'Side by Side',
      description: 'Split layout with image and content side by side - great for portraits'
    },
    {
      value: 'framed',
      label: 'Framed Photo',
      description: 'Decorative frame around the photo with content below - elegant and classic'
    },
    {
      value: 'minimal',
      label: 'Minimal',
      description: 'Text-focused design with subtle decorations - clean and modern'
    }
  ]

  const commonProps = {
    wedding,
    dateId,
    weddingNameId,
    theme,
    alignment,
    showTagline: true,
    tagline: "Join us as we tie the knot!",
    showCountdown: true,
    showRSVPButton: true,
    heroImageUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2387&q=80'
  }

  const renderHeroContent = () => {
    switch (heroVariant) {
      case 'side-by-side':
        return (
          <HeroSideBySideVariant
            {...commonProps}
            imagePosition={alignment?.imagePosition === 'split-right' ? 'right' : imagePosition}
          />
        )

      case 'framed':
        return (
          <HeroFramedVariant
            {...commonProps}
            frameStyle={frameStyle}
            imageSize={imageSize}
          />
        )

      case 'minimal':
        return (
          <HeroMinimalVariant
            {...commonProps}
            backgroundColor={backgroundColor}
            showDecorations={showDecorations}
          />
        )

      case 'background':
      default:
        return (
          <HeroBackgroundVariant
            {...commonProps}
          />
        )
    }
  }

  return (
    <div>
      {showVariantSwitcher && (
        <VariantSwitcher
          componentType="🏠 Hero"
          currentVariant={heroVariant}
          variants={heroVariants}
          onVariantChange={setVariant}
        />
      )}
      {renderHeroContent()}
    </div>
  )
}
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
import { useComponentVariant } from '@/components/contexts/variant-context'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'

interface HeroSectionProps extends BaseHeroProps {
  variant?: 'background' | 'side-by-side' | 'framed' | 'minimal'
  imagePosition?: 'left' | 'right' // for side-by-side variant
  frameStyle?: 'circular' | 'rounded' | 'square' | 'polaroid' // for framed variant
  imageSize?: 'small' | 'medium' | 'large' // for framed variant
  backgroundColor?: string // for minimal variant
  showDecorations?: boolean // for minimal variant
  textAlignment?: 'left' | 'center' | 'right' // text alignment
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
  textAlignment = 'center',
  showVariantSwitcher = true
}: HeroSectionProps) {
  // Always use the context hook (now safe to call without provider)
  const { currentVariant, setVariant } = useComponentVariant('hero')
  const editingContext = useEditingModeSafe()
  const customizeContext = useCustomizeSafe()
  
  // Get customized configuration if available
  const customConfig = customizeContext?.getSectionConfig('hero') || {}
  
  // Use editing context if available, otherwise fall back to prop
  const shouldShowVariantSwitcher = editingContext?.isEditingMode ?? showVariantSwitcher
  
  // Create modified alignment object with custom text alignment
  const effectiveAlignment = {
    ...alignment,
    text: customConfig.textAlignment || textAlignment || alignment?.text || 'center'
  }
  
  // Determine which variant to use - prioritize custom config over variant context
  let heroVariant: string
  
  if (customConfig.variant) {
    // Use customize context variant (highest priority)
    heroVariant = customConfig.variant
  } else if (shouldShowVariantSwitcher && currentVariant) {
    // Use variant context if no customize config and editing mode
    heroVariant = currentVariant
  } else if (variant) {
    // Use prop variant
    heroVariant = variant
  } else {
    // Fallback variant selection based on alignment
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
    alignment: effectiveAlignment,
    showTagline: customConfig.showTagline ?? showTagline ?? true,
    tagline: customConfig.tagline || tagline || "Join us as we tie the knot!",
    showCountdown: customConfig.showCountdown ?? showCountdown ?? true,
    showRSVPButton: customConfig.showRSVPButton ?? showRSVPButton ?? true,
    heroImageUrl: customConfig.heroImageUrl || heroImageUrl || 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2387&q=80'
  }

  const renderHeroContent = () => {
    switch (heroVariant) {
      case 'side-by-side':
        return (
          <HeroSideBySideVariant
            {...commonProps}
            imagePosition={customConfig.imagePosition || (alignment?.imagePosition === 'split-right' ? 'right' : imagePosition)}
          />
        )

      case 'framed':
        return (
          <HeroFramedVariant
            {...commonProps}
            frameStyle={customConfig.frameStyle || frameStyle}
            imageSize={customConfig.imageSize || imageSize}
          />
        )

      case 'minimal':
        return (
          <HeroMinimalVariant
            {...commonProps}
            backgroundColor={customConfig.backgroundColor || backgroundColor}
            showDecorations={customConfig.showDecorations ?? showDecorations}
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

  const handleEditClick = (sectionId: string, sectionType: string) => {
    if (customizeContext) {
      const currentConfig = {
        variant: heroVariant,
        imagePosition: customConfig.imagePosition || (alignment?.imagePosition === 'split-right' ? 'right' : imagePosition),
        frameStyle: customConfig.frameStyle || frameStyle,
        imageSize: customConfig.imageSize || imageSize,
        backgroundColor: customConfig.backgroundColor || backgroundColor,
        showDecorations: customConfig.showDecorations ?? showDecorations,
        textAlignment: customConfig.textAlignment || textAlignment,
        showTagline: customConfig.showTagline ?? showTagline,
        tagline: customConfig.tagline || tagline,
        showCountdown: customConfig.showCountdown ?? showCountdown,
        showRSVPButton: customConfig.showRSVPButton ?? showRSVPButton,
        heroImageUrl: customConfig.heroImageUrl || heroImageUrl
      }
      customizeContext.openCustomizer(sectionId, sectionType, currentConfig)
    }
  }

  return (
    <EditableSectionWrapper
      sectionId="hero"
      sectionType="hero"
      onEditClick={handleEditClick}
    >
      {renderHeroContent()}
    </EditableSectionWrapper>
  )
}
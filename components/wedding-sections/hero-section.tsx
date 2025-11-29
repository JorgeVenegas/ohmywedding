"use client"

import React from 'react'
import { type Wedding } from '@/lib/wedding-data'
import { 
  HeroBackgroundVariant,
  HeroSideBySideVariant, 
  HeroFramedVariant,
  HeroMinimalVariant,
  HeroStackedVariant,
  BaseHeroProps
} from './hero-variants'
import { 
  useSectionVariants, 
  createVariantConfig, 
  SectionComponentProps,
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'

interface HeroSectionProps extends BaseHeroProps {
  variant?: 'background' | 'side-by-side' | 'framed' | 'minimal' | 'stacked'
  imagePosition?: 'left' | 'right' // for side-by-side variant
  frameStyle?: 'circular' | 'rounded' | 'square' | 'polaroid' // for framed variant
  imageSize?: 'small' | 'medium' | 'large' // for framed variant
  imageHeight?: 'small' | 'medium' | 'large' | 'full' // for stacked variant
  imageWidth?: 'full' | 'centered' // for stacked variant
  backgroundColor?: string // for minimal variant
  backgroundGradient?: boolean // for minimal variant
  gradientColor1?: string // gradient color 1
  gradientColor2?: string // gradient color 2
  showDecorations?: boolean // for minimal and stacked variants
  textAlignment?: 'left' | 'center' | 'right' // text alignment
  showVariantSwitcher?: boolean // enable/disable variant switcher
  overlayOpacity?: number // for background variant
  imageBrightness?: number // image brightness control
}

export function HeroSection({
  wedding,
  weddingNameId,
  dateId,
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
  imageHeight = 'medium',
  imageWidth = 'centered',
  backgroundColor,
  backgroundGradient = false,
  gradientColor1,
  gradientColor2,
  showDecorations = true,
  textAlignment = 'center',
  showVariantSwitcher = true,
  overlayOpacity = 40,
  imageBrightness = 100
}: HeroSectionProps) {
  // Check if hero image is provided
  const hasHeroImage = !!heroImageUrl && heroImageUrl.trim() !== ''
  
  // Variants that require an image
  const imageRequiredVariants = ['background', 'side-by-side', 'framed', 'stacked']
  
  // Determine default variant based on whether image is provided
  const effectiveDefaultVariant = hasHeroImage ? variant : 'minimal'
  
  // Use standardized section behavior
  const {
    activeVariant: heroVariant,
    customConfig,
    shouldShowVariantSwitcher,
    setVariant,
    handleEditClick
  } = useSectionVariants('hero', 'hero', effectiveDefaultVariant, effectiveDefaultVariant, showVariantSwitcher)

  // Force minimal variant if no image and current variant requires one
  const effectiveVariant = React.useMemo(() => {
    // Check customConfig heroImageUrl as well
    const customHasImage = customConfig.heroImageUrl && customConfig.heroImageUrl.trim() !== ''
    const actualHasImage = customHasImage || hasHeroImage
    
    if (!actualHasImage && imageRequiredVariants.includes(heroVariant)) {
      return 'minimal'
    }
    return heroVariant
  }, [heroVariant, hasHeroImage, customConfig.heroImageUrl])

  // Define variants
  const heroVariants: VariantOption[] = [
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
    },
    {
      value: 'stacked',
      label: 'Stacked',
      description: 'Content above with image below - perfect for showcasing landscape photos'
    }
  ]

  // Create modified alignment object with custom text alignment
  const effectiveAlignment = {
    ...alignment,
    text: customConfig.textAlignment || textAlignment || alignment?.text || 'center'
  }

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    showTagline,
    tagline,
    showCountdown,
    showRSVPButton,
    heroImageUrl,
    imagePosition,
    frameStyle,
    imageSize,
    imageHeight,
    imageWidth,
    backgroundColor,
    backgroundGradient,
    gradientColor1,
    gradientColor2,
    showDecorations,
    textAlignment,
    overlayOpacity,
    imageBrightness
  })

  const commonProps = {
    wedding,
    weddingNameId,
    dateId,
    theme,
    alignment: effectiveAlignment,
    showTagline: config.showTagline ?? true,
    tagline: config.tagline || "Join us as we tie the knot!",
    showCountdown: config.showCountdown ?? true,
    showRSVPButton: config.showRSVPButton ?? true,
    heroImageUrl: config.heroImageUrl || 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2387&q=80'
  }

  const renderHeroContent = (activeVariant: string) => {
    switch (activeVariant) {
      case 'side-by-side':
        return (
          <HeroSideBySideVariant
            {...commonProps}
            imagePosition={config.imagePosition || (alignment?.imagePosition === 'split-right' ? 'right' : 'left')}
            backgroundGradient={config.backgroundGradient ?? false}
            gradientColor1={config.gradientColor1}
            gradientColor2={config.gradientColor2}
            imageBrightness={config.imageBrightness ?? 100}
          />
        )
      case 'framed':
        return (
          <HeroFramedVariant
            {...commonProps}
            frameStyle={config.frameStyle || 'circular'}
            imageSize={config.imageSize || 'medium'}
          />
        )
      case 'minimal':
        return (
          <HeroMinimalVariant
            {...commonProps}
            backgroundColor={config.backgroundColor}
            backgroundGradient={config.backgroundGradient ?? false}
            gradientColor1={config.gradientColor1}
            gradientColor2={config.gradientColor2}
            showDecorations={config.showDecorations ?? true}
          />
        )
      case 'stacked':
        return (
          <HeroStackedVariant
            {...commonProps}
            showDecorations={config.showDecorations ?? true}
            imageHeight={config.imageHeight || 'medium'}
            imageWidth={config.imageWidth || 'centered'}
          />
        )
      case 'background':
      default:
        return (
          <HeroBackgroundVariant 
            {...commonProps} 
            overlayOpacity={config.overlayOpacity ?? 40}
            backgroundGradient={config.backgroundGradient ?? false}
            gradientColor1={config.gradientColor1}
            gradientColor2={config.gradientColor2}
            imageBrightness={config.imageBrightness ?? 100}
          />
        )
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
      imagePosition: config.imagePosition || (alignment?.imagePosition === 'split-right' ? 'right' : imagePosition),
      frameStyle: config.frameStyle || frameStyle,
      imageSize: config.imageSize || imageSize,
      imageHeight: config.imageHeight || imageHeight,
      imageWidth: config.imageWidth || imageWidth,
      backgroundColor: config.backgroundColor || backgroundColor,
      backgroundGradient: config.backgroundGradient ?? backgroundGradient,
      gradientColor1: config.gradientColor1 || gradientColor1,
      gradientColor2: config.gradientColor2 || gradientColor2,
      showDecorations: config.showDecorations ?? showDecorations,
      textAlignment: config.textAlignment || textAlignment,
      showTagline: config.showTagline ?? showTagline,
      tagline: config.tagline || tagline,
      showCountdown: config.showCountdown ?? showCountdown,
      showRSVPButton: config.showRSVPButton ?? showRSVPButton,
      heroImageUrl: config.heroImageUrl || heroImageUrl,
      overlayOpacity: config.overlayOpacity ?? overlayOpacity,
      imageBrightness: config.imageBrightness ?? imageBrightness
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="hero"
      sectionType="hero"
      onEditClick={onEditClick}
    >
      {renderHeroContent(effectiveVariant)}
    </EditableSectionWrapper>
  )
}
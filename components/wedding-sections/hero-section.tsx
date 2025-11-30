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
  overlayOpacity?: number // for background and side-by-side variants
  imageBrightness?: number // image brightness control
  useColorBackground?: boolean // for side-by-side variant
  backgroundColorChoice?: 'primary' | 'secondary' | 'accent' // for side-by-side variant
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
  imageBrightness = 100,
  useColorBackground = false,
  backgroundColorChoice = 'primary'
}: HeroSectionProps) {
  // Check if hero image is provided
  const hasHeroImage = !!heroImageUrl && heroImageUrl.trim() !== ''
  
  // Variants that require an image
  const imageRequiredVariants = ['background', 'side-by-side', 'framed', 'stacked']
  
  // Use the provided variant - no longer forcing minimal based on image
  // The config form handles filtering available variants
  
  // Use standardized section behavior
  const {
    activeVariant: heroVariant,
    customConfig,
    shouldShowVariantSwitcher,
    setVariant,
    handleEditClick,
    customizeContext
  } = useSectionVariants('hero', 'hero', variant, variant, showVariantSwitcher)

  // Check if we have an image (from props or customConfig)
  const effectiveHasImage = React.useMemo(() => {
    const customHasImage = customConfig?.heroImageUrl && customConfig.heroImageUrl.trim() !== ''
    console.log('Hero effectiveHasImage check:', { 
      customConfigHeroImageUrl: customConfig?.heroImageUrl, 
      hasHeroImage, 
      customHasImage,
      result: customHasImage || hasHeroImage
    })
    return customHasImage || hasHeroImage
  }, [hasHeroImage, customConfig?.heroImageUrl])

  // Only force minimal if the active variant requires an image but none is provided
  const effectiveVariant = React.useMemo(() => {
    console.log('Hero effectiveVariant check:', { 
      heroVariant, 
      effectiveHasImage,
      imageRequiredVariants,
      wouldForceMinimal: !effectiveHasImage && imageRequiredVariants.includes(heroVariant)
    })
    if (!effectiveHasImage && imageRequiredVariants.includes(heroVariant)) {
      return 'minimal'
    }
    return heroVariant
  }, [heroVariant, effectiveHasImage])

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
    imageBrightness,
    useColorBackground,
    backgroundColorChoice
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
            overlayOpacity={config.overlayOpacity ?? 0}
            useColorBackground={config.useColorBackground ?? false}
            backgroundColorChoice={config.backgroundColorChoice || 'primary'}
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
    // Use effectiveVariant instead of heroVariant to show the actual displayed variant
    if (customizeContext) {
      const configToPass = {
        variant: effectiveVariant,  // Use the actual displayed variant
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
        imageBrightness: config.imageBrightness ?? imageBrightness,
        useColorBackground: config.useColorBackground ?? useColorBackground,
        backgroundColorChoice: config.backgroundColorChoice || backgroundColorChoice
      }
      customizeContext.openCustomizer(sectionId, sectionType, configToPass)
    }
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
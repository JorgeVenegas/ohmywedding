"use client"

import React from 'react'
import {
  GalleryCarouselVariant,
  GalleryMasonryVariant,
  GalleryGridVariant,
  GalleryListVariant,
  GalleryCollageVariant,
  BaseGalleryProps
} from './gallery-variants'
import { 
  useSectionVariants, 
  createVariantConfig, 
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'
import { useI18n } from '@/components/contexts/i18n-context'

type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

interface GallerySectionProps extends Omit<BaseGalleryProps, 'backgroundColorChoice'> {
  variant?: 'carousel' | 'masonry' | 'grid' | 'list' | 'collage'
  showVariantSwitcher?: boolean
  dateId?: string
  backgroundColorChoice?: BackgroundColorChoice
  overlayOpacity?: number
  imageBrightness?: number
  useGradientOverlay?: boolean
  gradientColor1?: string
  gradientColor2?: string
  sectionTitle?: string
  sectionSubtitle?: string
  titleAlignment?: 'left' | 'center' | 'right'
  subtitleAlignment?: 'left' | 'center' | 'right'
  gridColumns?: 2 | 3 | 4 | 5 | 6
  masonryColumns?: 2 | 3 | 4 | 5
}

export function GallerySection({
  weddingNameId,
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  photos = [],
  variant = 'grid',
  showVariantSwitcher = true,
  backgroundColorChoice = 'none',
  titleAlignment = 'center',
  subtitleAlignment = 'center',
  gridColumns = 4,
  masonryColumns = 4,
  overlayOpacity = 0,
  imageBrightness = 100,
  useGradientOverlay = false,
  gradientColor1,
  gradientColor2
}: GallerySectionProps) {
  const { t } = useI18n()
  
  // Use standardized section behavior
  const {
    activeVariant,
    customConfig,
    shouldShowVariantSwitcher,
    setVariant,
    handleEditClick
  } = useSectionVariants('gallery', 'gallery', 'grid', variant, showVariantSwitcher)

  // Define variants
  const galleryVariants: VariantOption[] = [
    {
      value: 'carousel',
      label: t('gallery.carousel'),
      description: t('gallery.carouselDesc')
    },
    {
      value: 'masonry',
      label: t('gallery.masonry'),
      description: t('gallery.masonryDesc')
    },
    {
      value: 'grid',
      label: t('gallery.grid'),
      description: t('gallery.gridDesc')
    },
    {
      value: 'list',
      label: t('gallery.list'),
      description: t('gallery.listDesc')
    },
    {
      value: 'collage',
      label: t('gallery.collage'),
      description: t('gallery.collageDesc')
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    sectionTitle,
    sectionSubtitle,
    photos,
    backgroundColorChoice,
    titleAlignment,
    subtitleAlignment,
    gridColumns,
    masonryColumns,
    overlayOpacity,
    imageBrightness,
    useGradientOverlay,
    gradientColor1,
    gradientColor2
  })

  const commonProps = {
    weddingNameId,
    theme,
    alignment,
    sectionTitle: config.sectionTitle || sectionTitle,
    sectionSubtitle: config.sectionSubtitle || sectionSubtitle,
    photos: config.photos || photos,
    backgroundColorChoice: config.backgroundColorChoice || backgroundColorChoice,
    titleAlignment: config.titleAlignment || titleAlignment,
    subtitleAlignment: config.subtitleAlignment || subtitleAlignment,
    gridColumns: config.gridColumns || gridColumns,
    masonryColumns: config.masonryColumns || masonryColumns,
    overlayOpacity: config.overlayOpacity ?? overlayOpacity,
    imageBrightness: config.imageBrightness ?? imageBrightness,
    useGradientOverlay: config.useGradientOverlay ?? useGradientOverlay,
    gradientColor1: config.gradientColor1 || gradientColor1,
    gradientColor2: config.gradientColor2 || gradientColor2
  }

  const renderGalleryContent = (activeVariant: string) => {
    switch (activeVariant) {
      case 'carousel':
        return <GalleryCarouselVariant {...commonProps} />
      case 'masonry':
        return <GalleryMasonryVariant {...commonProps} />
      case 'list':
        return <GalleryListVariant {...commonProps} />
      case 'collage':
        return <GalleryCollageVariant {...commonProps} />
      case 'grid':
      default:
        return <GalleryGridVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
      sectionTitle: config.sectionTitle || sectionTitle || '',
      sectionSubtitle: config.sectionSubtitle || sectionSubtitle || '',
      photos: config.photos || photos,
      backgroundColorChoice: config.backgroundColorChoice || backgroundColorChoice,
      titleAlignment: config.titleAlignment || titleAlignment,
      subtitleAlignment: config.subtitleAlignment || subtitleAlignment,
      gridColumns: config.gridColumns || gridColumns,
      masonryColumns: config.masonryColumns || masonryColumns,
      overlayOpacity: config.overlayOpacity ?? overlayOpacity,
      imageBrightness: config.imageBrightness ?? imageBrightness,
      useGradientOverlay: config.useGradientOverlay ?? useGradientOverlay,
      gradientColor1: config.gradientColor1 || gradientColor1,
      gradientColor2: config.gradientColor2 || gradientColor2
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="gallery"
      sectionType="gallery"
      onEditClick={onEditClick}
    >
      {renderGalleryContent(activeVariant)}
    </EditableSectionWrapper>
  )
}
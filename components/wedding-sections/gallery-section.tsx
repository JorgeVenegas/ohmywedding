"use client"

import React from 'react'
import {
  GalleryCarouselVariant,
  GalleryBannerVariant,
  GalleryMasonryVariant,
  GalleryGridVariant,
  GalleryListVariant,
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
  variant?: 'carousel' | 'banner' | 'masonry' | 'grid' | 'list'
  showVariantSwitcher?: boolean
  dateId?: string
  backgroundColorChoice?: BackgroundColorChoice
  sectionTitle?: string
  sectionSubtitle?: string
  titleAlignment?: 'left' | 'center' | 'right'
  subtitleAlignment?: 'left' | 'center' | 'right'
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
  subtitleAlignment = 'center'
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
      value: 'banner',
      label: t('gallery.banner'),
      description: t('gallery.bannerDesc')
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
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    sectionTitle,
    sectionSubtitle,
    photos,
    backgroundColorChoice,
    titleAlignment,
    subtitleAlignment
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
    subtitleAlignment: config.subtitleAlignment || subtitleAlignment
  }

  const renderGalleryContent = (activeVariant: string) => {
    switch (activeVariant) {
      case 'carousel':
        return <GalleryCarouselVariant {...commonProps} />
      case 'banner':
        return <GalleryBannerVariant {...commonProps} />
      case 'masonry':
        return <GalleryMasonryVariant {...commonProps} />
      case 'list':
        return <GalleryListVariant {...commonProps} />
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
      subtitleAlignment: config.subtitleAlignment || subtitleAlignment
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
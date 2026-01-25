"use client"

import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseGalleryProps } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { getGalleryColorScheme } from './color-utils'

export function GalleryBannerVariant({
  weddingNameId,
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  photos = [],
  backgroundColorChoice = 'none',
  titleAlignment = 'center',
  subtitleAlignment = 'center',
  bannerHeight = 'large'
}: BaseGalleryProps) {
  const { t } = useI18n()

  const { bgColor, textColor, mutedTextColor, isColored } = getGalleryColorScheme(
    theme,
    backgroundColorChoice || 'none'
  )

  const featuredPhoto = photos[0]

  if (!featuredPhoto || !featuredPhoto.url) {
    return (
      <SectionWrapper
        theme={isColored ? undefined : theme}
        alignment={alignment}
        background={isColored ? 'default' : 'muted'}
        id="gallery"
        style={isColored ? { backgroundColor: bgColor } : undefined}
      >
        <div className="text-center py-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: textColor }}>
            {sectionTitle || t('gallery.title')}
          </h2>
          <p className="text-lg" style={{ color: mutedTextColor }}>
            {t('gallery.noPhotosYet')}. {t('gallery.uploadYourFirst')}
          </p>
        </div>
      </SectionWrapper>
    )
  }

  return (
    <section 
      id="gallery"
      className="relative w-full"
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      {/* Full-Width Banner - Single Featured Photo */}
      <div className={`relative w-full ${
        bannerHeight === 'small' ? 'h-[40vh] md:h-[50vh]' :
        bannerHeight === 'medium' ? 'h-[50vh] md:h-[60vh]' :
        bannerHeight === 'large' ? 'h-[60vh] md:h-[70vh] lg:h-[80vh]' :
        'h-screen'
      }`}>
        <Image
          src={featuredPhoto.url}
          alt={featuredPhoto.alt || 'Gallery banner'}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

        {/* Centered Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center px-6 max-w-4xl">
            <h2
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 drop-shadow-lg"
              style={{
                fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 
                            theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
              }}
            >
              {sectionTitle || t('gallery.title')}
            </h2>
            {sectionSubtitle && (
              <p className="text-xl md:text-2xl lg:text-3xl drop-shadow-lg opacity-90">
                {sectionSubtitle}
              </p>
            )}
            {featuredPhoto.caption && (
              <p className="mt-8 text-lg md:text-xl italic opacity-80">
                "{featuredPhoto.caption}"
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

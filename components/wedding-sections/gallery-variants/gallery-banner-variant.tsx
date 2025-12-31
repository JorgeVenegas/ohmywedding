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
  subtitleAlignment = 'center'
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
    <SectionWrapper
      theme={isColored ? undefined : theme}
      alignment={alignment}
      background={isColored ? 'default' : 'muted'}
      id="gallery"
      className="!px-0 !py-0"
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      {/* Full-Width Banner */}
      <div className="relative w-full">
        {/* Banner Image */}
        <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[75vh] bg-black">
          <Image
            src={featuredPhoto.url}
            alt={featuredPhoto.alt || 'Gallery banner'}
            fill
            className="object-contain"
            priority
            sizes="100vw"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Centered Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-white text-center px-6 text-${titleAlignment}`}>
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
              <p className={`text-xl md:text-2xl lg:text-3xl drop-shadow-lg text-${subtitleAlignment}`}>
                {sectionSubtitle}
              </p>
            )}
            {featuredPhoto.caption && (
              <p className="mt-6 text-lg md:text-xl italic opacity-90">
                {featuredPhoto.caption}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Photos Grid (if more than 1 photo) */}
      {photos.length > 1 && (
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.slice(1).map((photo) => photo.url ? (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                <Image
                  src={photo.url}
                  alt={photo.alt || 'Gallery photo'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                {photo.caption && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <p className="text-white text-center text-sm">{photo.caption}</p>
                  </div>
                )}
              </div>
            ) : null)}
          </div>
        </div>
      )}
    </SectionWrapper>
  )
}

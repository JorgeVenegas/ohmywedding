"use client"

import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseGalleryProps } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { getGalleryColorScheme } from './color-utils'

export function GalleryMasonryVariant({
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

  if (photos.length === 0) {
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
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      {/* Section Header */}
      <div className={`mb-12 text-${titleAlignment}`}>
        <h2
          className="text-3xl md:text-5xl font-bold mb-4"
          style={{
            fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 
                        theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif',
            color: theme?.colors?.foreground || '#1f2937'
          }}
        >
          {sectionTitle || t('gallery.title')}
        </h2>
        <div 
          className={`w-24 h-1 rounded mb-6 ${titleAlignment === 'center' ? 'mx-auto' : titleAlignment === 'right' ? 'ml-auto' : ''}`}
          style={{ backgroundColor: theme?.colors?.accent || '#e8a76a' }}
        />
        {sectionSubtitle && (
          <p className={`text-lg md:text-xl text-muted-foreground text-${subtitleAlignment}`}>
            {sectionSubtitle}
          </p>
        )}
      </div>

      {/* Masonry Grid - Pinterest Style */}
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {photos.filter(photo => photo.url).map((photo) => (
          <div 
            key={photo.id} 
            className="break-inside-avoid mb-4 group"
          >
            <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="relative w-full">
                <Image
                  src={photo.url}
                  alt={photo.alt || 'Gallery photo'}
                  width={400}
                  height={400}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              {photo.caption && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium">{photo.caption}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Count */}
      <div className="text-center mt-12">
        <p className="text-sm" style={{ color: mutedTextColor }}>
          {photos.filter(p => p.url).length} {photos.filter(p => p.url).length === 1 ? t('gallery.photo') : t('gallery.photos')}
        </p>
      </div>
    </SectionWrapper>
  )
}

"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
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
  subtitleAlignment = 'center',
  masonryColumns = 4
}: BaseGalleryProps) {
  const { t } = useI18n()
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const { bgColor, textColor, mutedTextColor, isColored } = getGalleryColorScheme(
    theme,
    backgroundColorChoice || 'none'
  )

  const validPhotos = photos.filter(photo => photo.url)

  if (validPhotos.length === 0) {
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

  // Create varied aspect ratios for visual interest
  const getAspectRatio = (index: number) => {
    const patterns = ['aspect-square', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-square', 'aspect-[5/4]']
    return patterns[index % patterns.length]
  }

  return (
    <>
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

        {/* Masonry Grid - CSS Columns for Pinterest Style */}
        <div className={`gap-4 w-full ${
          masonryColumns === 2 ? 'columns-2' :
          masonryColumns === 3 ? 'columns-2 md:columns-3' :
          masonryColumns === 4 ? 'columns-2 md:columns-3 lg:columns-4' :
          'columns-2 md:columns-3 lg:columns-5'
        }`}>
          {validPhotos.map((photo, index) => (
            <div 
              key={photo.id} 
              className="break-inside-avoid mb-4 cursor-pointer"
              onClick={() => setSelectedPhoto(photo.url)}
            >
              <div className={`relative ${getAspectRatio(index)} rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 [&:hover_img]:scale-105 [&:hover_.overlay]:opacity-100`}>
                <Image
                  src={photo.url}
                  alt={photo.alt || 'Gallery photo'}
                  fill
                  className="object-cover transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  unoptimized
                />
                {/* Gradient overlay on hover */}
                <div className="overlay absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300">
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-sm font-medium line-clamp-2">{photo.caption}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedPhoto}
              alt="Full size photo"
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  )
}

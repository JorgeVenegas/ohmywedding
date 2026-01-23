"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseGalleryProps } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { getGalleryColorScheme } from './color-utils'

export function GalleryGridVariant({
  weddingNameId,
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  photos = [],
  backgroundColorChoice = 'none',
  titleAlignment = 'center',
  subtitleAlignment = 'center',
  gridColumns = 4
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

        {/* Uniform Grid with staggered animation */}
        <div className={`grid gap-3 md:gap-4 w-full ${
          gridColumns === 2 ? 'grid-cols-2' :
          gridColumns === 3 ? 'grid-cols-2 md:grid-cols-3' :
          gridColumns === 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
          gridColumns === 5 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' :
          'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
        }`}>
          {validPhotos.map((photo, index) => (
            <div 
              key={photo.id} 
              className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-gray-100 cursor-pointer [&:hover_img]:scale-110 [&:hover_.overlay]:bg-black/40 [&:hover_.caption]:opacity-100 [&:hover_.caption]:translate-y-0"
              style={{
                animationDelay: `${index * 50}ms`
              }}
              onClick={() => setSelectedPhoto(photo.url)}
            >
              <Image
                src={photo.url}
                alt={photo.alt || 'Gallery photo'}
                fill
                className="object-cover transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                unoptimized
              />
              {/* Hover Overlay with Caption */}
              <div className="overlay absolute inset-0 bg-black/0 transition-all duration-300 flex items-center justify-center">
                {photo.caption && (
                  <p className="caption text-white text-center text-sm font-medium px-4 opacity-0 transition-all duration-300 transform translate-y-4">
                    {photo.caption}
                  </p>
                )}
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

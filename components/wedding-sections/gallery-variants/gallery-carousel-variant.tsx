"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionWrapper } from '../section-wrapper'
import { BaseGalleryProps } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { getGalleryColorScheme } from './color-utils'

export function GalleryCarouselVariant({
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
  const [currentIndex, setCurrentIndex] = useState(0)

  const { bgColor, textColor, mutedTextColor, isColored } = getGalleryColorScheme(
    theme,
    backgroundColorChoice || 'none'
  )

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

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

  const currentPhoto = photos[currentIndex]

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

      {/* Carousel */}
      <div className="relative max-w-5xl mx-auto">
        {/* Main Image */}
        {currentPhoto.url ? (
          <div className="relative aspect-[16/9] md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.alt || `Photo ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
          </div>
        ) : (
          <div className="relative aspect-[16/9] md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">{t('config.uploadImage')}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
              onClick={nextSlide}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Caption */}
        {currentPhoto.caption && (
          <div className="mt-6 text-center">
            <p className="text-lg text-muted-foreground italic">{currentPhoto.caption}</p>
          </div>
        )}

        {/* Indicators */}
        {photos.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {photos.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 opacity-100'
                    : 'opacity-50'
                }`}
                style={{
                  backgroundColor: theme?.colors?.accent || '#e8a76a'
                }}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}

        {/* Counter */}
        <div className="text-center mt-4 text-sm" style={{ color: mutedTextColor }}>
          {currentIndex + 1} {t('gallery.of')} {photos.length}
        </div>
      </div>
    </SectionWrapper>
  )
}

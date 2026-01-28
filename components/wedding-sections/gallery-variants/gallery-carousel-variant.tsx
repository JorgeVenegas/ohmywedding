"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionWrapper } from '../section-wrapper'
import { AnimatedSection } from '../animated-section'
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
  const [isTransitioning, setIsTransitioning] = useState(false)

  const { bgColor, textColor, mutedTextColor, dividerColor, isColored } = getGalleryColorScheme(
    theme,
    backgroundColorChoice || 'none'
  )

  const validPhotos = photos.filter(p => p.url)

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [isTransitioning])

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % validPhotos.length)
  }, [currentIndex, validPhotos.length, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide((currentIndex - 1 + validPhotos.length) % validPhotos.length)
  }, [currentIndex, validPhotos.length, goToSlide])

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (validPhotos.length <= 1) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [validPhotos.length, nextSlide])

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

  const currentPhoto = validPhotos[currentIndex]

  return (
    <SectionWrapper
      theme={isColored ? undefined : theme}
      alignment={alignment}
      background={isColored ? 'default' : 'muted'}
      id="gallery"
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      {/* Section Header */}
      <AnimatedSection className={`mb-8 md:mb-12 text-${titleAlignment}`}>
        <h2
          className="text-3xl md:text-5xl font-bold mb-4"
          style={{
            fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 
                        theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif',
            color: textColor
          }}
        >
          {sectionTitle || t('gallery.title')}
        </h2>
        <div 
          className={`w-24 h-1 rounded mb-6 ${titleAlignment === 'center' ? 'mx-auto' : titleAlignment === 'right' ? 'ml-auto' : ''}`}
          style={{ backgroundColor: isColored ? dividerColor : (theme?.colors?.accent || '#e8a76a') }}
        />
        {sectionSubtitle && (
          <p className={`text-lg md:text-xl text-${subtitleAlignment}`} style={{ color: mutedTextColor }}>
            {sectionSubtitle}
          </p>
        )}
      </AnimatedSection>

      {/* Carousel */}
      <AnimatedSection delay={100} className="relative max-w-5xl mx-auto">
        {/* Main Image Container */}
        <div className="relative aspect-[4/3] md:aspect-[16/10] rounded-xl overflow-hidden shadow-2xl bg-gray-100">
          {validPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                index === currentIndex 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-105'
              }`}
            >
              <Image
                src={photo.url}
                alt={photo.alt || `Photo ${index + 1}`}
                fill
                className="object-cover"
                style={{
                  objectPosition: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center',
                  transform: photo.zoom && photo.zoom > 1 ? `scale(${photo.zoom})` : undefined,
                  transformOrigin: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center'
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority={index === 0}
              />
            </div>
          ))}
          
          {/* Gradient overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Navigation Buttons */}
        {validPhotos.length > 1 && (
          <>
            <button
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
              onClick={prevSlide}
              disabled={isTransitioning}
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-800" />
            </button>
            <button
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
              onClick={nextSlide}
              disabled={isTransitioning}
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-gray-800" />
            </button>
          </>
        )}

        {/* Caption */}
        {currentPhoto.caption && (
          <div className="mt-6 text-center">
            <p 
              className="text-lg md:text-xl italic"
              style={{ color: mutedTextColor }}
            >
              "{currentPhoto.caption}"
            </p>
          </div>
        )}

        {/* Dot Indicators */}
        {validPhotos.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {validPhotos.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8'
                    : 'w-2 opacity-50 hover:opacity-75'
                }`}
                style={{
                  backgroundColor: theme?.colors?.accent || '#e8a76a'
                }}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        )}

        {/* Counter */}
        <div className="text-center mt-4 text-sm" style={{ color: mutedTextColor }}>
          {currentIndex + 1} / {validPhotos.length}
        </div>
      </AnimatedSection>
    </SectionWrapper>
  )
}

"use client"

import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { AnimatedSection } from '../animated-section'
import { BaseGalleryProps } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { getGalleryColorScheme } from './color-utils'

export function GalleryListVariant({
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

  const { bgColor, textColor, mutedTextColor, dividerColor, isColored } = getGalleryColorScheme(
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
    <SectionWrapper
      theme={isColored ? undefined : theme}
      alignment={alignment}
      background={isColored ? 'default' : 'muted'}
      id="gallery"
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      {/* Section Header */}
      <AnimatedSection className={`mb-12 text-${titleAlignment}`}>
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

      {/* Elegant Vertical List */}
      <div className="max-w-4xl mx-auto space-y-16 w-full">
        {validPhotos.map((photo, index) => (
          <AnimatedSection 
            key={photo.id}
            index={index}
            className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
          >
            {/* Photo */}
            <div className="flex-1 w-full">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500 [&:hover_img]:scale-105">
                <Image
                  src={photo.url}
                  alt={photo.alt || `Photo ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 ease-out"
                  style={{
                    objectPosition: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center',
                    transform: photo.zoom && photo.zoom > 1 ? `scale(${photo.zoom})` : undefined,
                    transformOrigin: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center'
                  }}
                  sizes="(max-width: 768px) 100vw, 600px"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Caption Area */}
            <div className={`flex-1 w-full ${index % 2 === 0 ? 'md:pl-4' : 'md:pr-4'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center font-medium text-lg"
                  style={{ 
                    backgroundColor: isColored ? dividerColor : (theme?.colors?.accent || '#e8a76a'),
                    color: isColored ? textColor : '#ffffff'
                  }}
                >
                  {index + 1}
                </div>
                <div 
                  className="flex-1 h-px"
                  style={{ backgroundColor: isColored ? dividerColor : `${theme?.colors?.accent || '#e8a76a'}40` }}
                />
              </div>
              
              {photo.caption && (
                <p 
                  className="text-lg md:text-xl leading-relaxed"
                  style={{ 
                    color: textColor,
                    fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                  }}
                >
                  {photo.caption}
                </p>
              )}
            </div>
          </AnimatedSection>
        ))}
      </div>
    </SectionWrapper>
  )
}

"use client"

import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseGalleryProps } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { Camera } from 'lucide-react'
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

      {/* Vertical List */}
      <div className="max-w-4xl mx-auto space-y-12">
        {photos.filter(photo => photo.url).map((photo, index) => (
          <div 
            key={photo.id}
            className="group"
          >
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Photo Number/Icon */}
              <div className="flex-shrink-0">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: theme?.colors?.accent || '#e8a76a' }}
                >
                  <Camera className="w-5 h-5" />
                </div>
              </div>

              {/* Photo and Content */}
              <div className="flex-1">
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden shadow-lg mb-4 group-hover:shadow-xl transition-shadow duration-300 bg-gray-100">
                  <Image
                    src={photo.url}
                    alt={photo.alt || `Photo ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 800px"
                    unoptimized={photo.url.includes('blob:')}
                  />
                </div>
                
                {/* Caption */}
                {photo.caption && (
                  <div className="pl-4 border-l-4" style={{ borderColor: theme?.colors?.accent || '#e8a76a' }}>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      {photo.caption}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider (not for last item) */}
            {index < photos.filter(p => p.url).length - 1 && (
              <div className="mt-12 w-full h-px bg-gray-200" />
            )}
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

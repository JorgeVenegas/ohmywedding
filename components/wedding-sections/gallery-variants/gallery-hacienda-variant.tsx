"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { AnimatedSection } from '../animated-section'
import { BaseGalleryProps } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { getGalleryColorScheme } from './color-utils'
import {
  CandleGlow, HaciendaSectionTitle,
  FloralDivider, CenterMedallion, CharroStar,
} from '../hacienda-ornaments'

export function GalleryHaciendaVariant({
  weddingNameId, theme, alignment, sectionTitle, sectionSubtitle,
  photos = [], backgroundColorChoice = 'none',
  titleAlignment = 'center', subtitleAlignment = 'center', gridColumns = 4,
}: BaseGalleryProps) {
  const { t } = useI18n()
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (selectedPhoto && !isClosing) {
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    }
  }, [selectedPhoto, isClosing])

  const handleClosePhoto = () => {
    setIsVisible(false)
    setIsClosing(true)
    setTimeout(() => { setSelectedPhoto(null); setIsClosing(false) }, 300)
  }

  const primary = theme?.colors?.primary || '#2D4A32'
  const accent = theme?.colors?.accent || '#C0A882'
  const secondary = theme?.colors?.secondary || '#FAF6EF'
  const validPhotos = photos.filter(photo => photo.url)

  const { textColor, mutedTextColor, isColored } = getGalleryColorScheme(
    theme, backgroundColorChoice || 'none'
  )

  const getLightTint = (hex: string, tintAmount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    return `rgb(${Math.round(r + (255 - r) * tintAmount)}, ${Math.round(g + (255 - g) * tintAmount)}, ${Math.round(b + (255 - b) * tintAmount)})`
  }

  const getBackgroundColor = () => {
    if (!backgroundColorChoice || backgroundColorChoice === 'none') return secondary
    if (!theme?.colors) return secondary
    if (backgroundColorChoice.includes('-light')) {
      const baseKey = backgroundColorChoice.split('-')[0] as 'primary' | 'secondary' | 'accent'
      const baseColor = theme.colors[baseKey] || '#9CAF88'
      return backgroundColorChoice.endsWith('lighter')
        ? getLightTint(baseColor, 0.88)
        : getLightTint(baseColor, 0.5)
    }
    return theme.colors[backgroundColorChoice as 'primary' | 'secondary' | 'accent'] || secondary
  }

  const backgroundColor = getBackgroundColor()

  if (validPhotos.length === 0) {
    return (
      <section id="gallery" className="w-full py-16 sm:py-20 relative overflow-hidden" style={{ backgroundColor }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <CandleGlow position="top" intensity="medium" />
          <CandleGlow position="bottom" intensity="subtle" />
        </div>
        <div className="relative z-10 text-center max-w-3xl mx-auto px-6 sm:px-8">
          <HaciendaSectionTitle
            title={sectionTitle || t('gallery.title')} subtitle={sectionSubtitle}
            titleColor={isColored ? textColor : primary}
            subtitleColor={isColored ? mutedTextColor : accent} accentColor={accent} />
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 mb-5">
            <CharroStar color={`${accent}70`} size={20} />
            <CenterMedallion color={`${accent}75`} size="sm" />
            <CharroStar color={`${accent}70`} size={20} />
          </div>
          <p className="text-sm font-light" style={{ color: isColored ? mutedTextColor : `${primary}80` }}>
            {t('gallery.noPhotosYet')}. {t('gallery.uploadYourFirst')}
          </p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section id="gallery" className="w-full relative overflow-hidden" style={{ backgroundColor }}>
        {/* Hacienda header */}
        <div className="relative z-10 py-12 sm:py-16">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <CandleGlow position="top" intensity="subtle" />
          </div>
          <div className="max-w-3xl mx-auto px-6 sm:px-8 relative z-10">
            <AnimatedSection className={`text-${titleAlignment}`}>
              <HaciendaSectionTitle
                title={sectionTitle || t('gallery.title')} subtitle={sectionSubtitle}
                titleColor={isColored ? textColor : primary}
                subtitleColor={isColored ? mutedTextColor : accent} accentColor={accent} />
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6">
                <CharroStar color={`${accent}65`} size={20} />
                <CenterMedallion color={`${accent}70`} size="sm" />
                <CharroStar color={`${accent}65`} size={20} />
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Full-width collage grid -- no gaps, smart wide images */}
        <div className="relative">
          <div
            className={`grid w-full gap-0 auto-rows-auto ${
              gridColumns === 2 ? 'grid-cols-2' :
              gridColumns === 3 ? 'grid-cols-2 md:grid-cols-3' :
              gridColumns === 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
              gridColumns === 5 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' :
              'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
            }`}
          >
            {validPhotos.map((photo, index) => {
              const totalPhotos = validPhotos.length
              const cols = gridColumns
              const remainder = totalPhotos % cols
              const emptySpaces = remainder === 0 ? 0 : cols - remainder

              const wideImageIndices: number[] = []
              if (emptySpaces > 0) {
                const step = Math.floor(totalPhotos / emptySpaces)
                for (let i = 0; i < emptySpaces; i++) {
                  let position = Math.min((i + 1) * step - 1, totalPhotos - 1)
                  if (position === totalPhotos - 1 && emptySpaces > 1) {
                    position = totalPhotos - 2
                  }
                  wideImageIndices.push(position)
                }
              }

              const isWide = wideImageIndices.includes(index)

              return (
                <AnimatedSection
                  key={photo.id}
                  index={index}
                  className={`relative overflow-hidden cursor-pointer group ${
                    isWide ? 'col-span-2 aspect-[2/1]' : 'aspect-square'
                  }`}
                  onClick={() => setSelectedPhoto(photo.url)}
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt || 'Gallery photo'}
                    fill
                    className="object-cover"
                    style={{
                      objectPosition: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center',
                      transform: photo.zoom && photo.zoom > 1 ? `scale(${photo.zoom})` : undefined,
                      transformOrigin: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center',
                    }}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    loading="lazy"
                  />
                  {photo.caption && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 z-10">
                      <p className="text-white text-center text-sm font-medium">{photo.caption}</p>
                    </div>
                  )}
                </AnimatedSection>
              )
            })}
          </div>
        </div>

        {/* Bottom hacienda divider */}
        <div className="relative z-10 py-10 sm:py-14">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <CandleGlow position="bottom" intensity="subtle" />
          </div>
          <div className="max-w-3xl mx-auto px-6 sm:px-8 relative z-10">
            <FloralDivider color={`${accent}55`} />
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={handleClosePhoto}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            onClick={handleClosePhoto}>
            <X className="w-6 h-6" />
          </button>
          <div className={`relative max-w-6xl max-h-[90vh] w-full h-full transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <Image src={selectedPhoto} alt="Full size photo" fill className="object-contain" sizes="100vw" unoptimized />
          </div>
        </div>
      )}
    </>
  )
}

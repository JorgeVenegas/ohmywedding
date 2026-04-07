"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { AnimatedSection } from '../animated-section'
import { BaseGalleryProps } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { getGalleryColorScheme } from './color-utils'
import {
  HaciendaTilePattern, CandleGlow, HaciendaSectionTitle,
  BotanicalCorner, FloralDivider, ScrapbookPhoto, TornPaperEdge,
} from '../hacienda-ornaments'

export function GalleryHaciendaVariant({
  weddingNameId, theme, alignment, sectionTitle, sectionSubtitle,
  photos = [], backgroundColorChoice = 'none',
  titleAlignment = 'center', subtitleAlignment = 'center', masonryColumns = 3,
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
    setIsVisible(false); setIsClosing(true)
    setTimeout(() => { setSelectedPhoto(null); setIsClosing(false) }, 300)
  }

  const { bgColor, textColor, mutedTextColor, isColored } = getGalleryColorScheme(
    theme, backgroundColorChoice || 'none'
  )

  const primary = theme?.colors?.primary || '#2D4A32'
  const accent = theme?.colors?.accent || '#C0A882'
  const secondary = theme?.colors?.secondary || '#FAF6EF'
  const validPhotos = photos.filter((photo) => photo.url)

  if (validPhotos.length === 0) {
    return (
      <SectionWrapper theme={isColored ? undefined : theme} alignment={alignment}
        background={isColored ? 'default' : 'muted'} id="gallery"
        style={isColored ? { backgroundColor: bgColor } : { backgroundColor: secondary }}>
        <div className="text-center py-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl mb-4"
            style={{ fontFamily: 'var(--font-display, cursive)', color: isColored ? textColor : primary, fontWeight: 400 }}>
            {sectionTitle || t('gallery.title')}
          </h2>
          <p className="text-sm font-light" style={{ color: isColored ? mutedTextColor : `${primary}80` }}>
            {t('gallery.noPhotosYet')}. {t('gallery.uploadYourFirst')}
          </p>
        </div>
      </SectionWrapper>
    )
  }

  const getAspectRatio = (index: number) => {
    const patterns = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-[5/6]']
    return patterns[index % patterns.length]
  }

  const archClip = 'polygon(0% 20%, 1% 14%, 3% 9%, 7% 5%, 13% 2%, 20% 0.5%, 30% 0%, 50% 0%, 70% 0%, 80% 0.5%, 87% 2%, 93% 5%, 97% 9%, 99% 14%, 100% 20%, 100% 100%, 0% 100%)'

  // Pattern: every 4th = scrapbook, every 6th = torn edge, every 3rd = arch
  const shouldUseArch = (index: number) => index % 3 === 0 && index % 4 !== 0 && index % 6 !== 0
  const shouldUseScrapbook = (index: number) => index % 4 === 0
  const shouldUseTornEdge = (index: number) => index % 6 === 2
  const getScrapbookRotation = (index: number) => {
    const rotations = [-3, 2.5, -2, 3.5, -1.5, 2]
    return rotations[index % rotations.length]
  }

  return (
    <>
      <SectionWrapper theme={isColored ? undefined : theme} alignment={alignment}
        background={isColored ? 'default' : 'default'} id="gallery"
        style={isColored ? { backgroundColor: bgColor } : { backgroundColor: secondary }}>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <HaciendaTilePattern color={isColored ? textColor : primary} opacity={0.02} />
          <CandleGlow position="top" intensity="medium" />
          <CandleGlow position="bottom" intensity="subtle" />
          <BotanicalCorner position="top-left" color={`${accent}20`} size="lg" />
          <BotanicalCorner position="bottom-right" color={`${accent}20`} size="lg" />
          <BotanicalCorner position="top-right" color={`${accent}12`} size="md" />
        </div>

        <div className="relative z-10">
          <AnimatedSection className={`mb-14 sm:mb-18 text-${titleAlignment}`}>
            <HaciendaSectionTitle
              title={sectionTitle || t('gallery.title')} subtitle={sectionSubtitle}
              titleColor={isColored ? textColor : primary}
              subtitleColor={isColored ? mutedTextColor : accent} accentColor={accent} />
          </AnimatedSection>

          {/* Masonry Grid */}
          <div className={`gap-5 sm:gap-6 w-full ${
            masonryColumns === 2 ? 'columns-2'
              : masonryColumns === 3 ? 'columns-2 md:columns-3'
                : masonryColumns === 4 ? 'columns-2 md:columns-3 lg:columns-4'
                  : 'columns-2 md:columns-3 lg:columns-5'
          }`}>
            {validPhotos.map((photo, index) => {
              const isArch = shouldUseArch(index)
              const isScrapbook = shouldUseScrapbook(index)
              const isTorn = shouldUseTornEdge(index)

              // Scrapbook-style: rotated, white border, tape strip
              if (isScrapbook) {
                return (
                  <AnimatedSection key={photo.id} index={index}
                    className="break-inside-avoid mb-5 sm:mb-6 cursor-pointer"
                    onClick={() => setSelectedPhoto(photo.url)}>
                    <ScrapbookPhoto rotation={getScrapbookRotation(index)} accentColor={accent}>
                      <div className={`relative ${getAspectRatio(index)} overflow-hidden`}>
                        <Image src={photo.url} alt={photo.alt || 'Gallery photo'} fill
                          className="object-cover"
                          style={{
                            objectPosition: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center',
                            transform: photo.zoom && photo.zoom > 1 ? `scale(${photo.zoom})` : undefined,
                            transformOrigin: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center',
                          }}
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" loading="lazy" />
                      </div>
                      {photo.caption && (
                        <p className="text-center text-[10px] sm:text-xs font-light italic mt-2 px-1 line-clamp-1"
                          style={{ color: `${primary}99`, fontFamily: 'var(--font-body, sans-serif)' }}>
                          {photo.caption}
                        </p>
                      )}
                    </ScrapbookPhoto>
                  </AnimatedSection>
                )
              }

              // Torn paper edge photo
              if (isTorn) {
                return (
                  <AnimatedSection key={photo.id} index={index}
                    className="break-inside-avoid mb-5 sm:mb-6 cursor-pointer group"
                    onClick={() => setSelectedPhoto(photo.url)}>
                    <TornPaperEdge side="bottom" bgColor={secondary}>
                      <div className={`relative ${getAspectRatio(index)} overflow-hidden`}>
                        <Image src={photo.url} alt={photo.alt || 'Gallery photo'} fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          style={{
                            objectPosition: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center',
                            transform: photo.zoom && photo.zoom > 1 ? `scale(${photo.zoom})` : undefined,
                            transformOrigin: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center',
                          }}
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                          {photo.caption && (
                            <div className="absolute bottom-4 left-0 right-0 px-3">
                              <p className="text-white text-xs font-light line-clamp-2" style={{ fontFamily: 'var(--font-body, sans-serif)' }}>{photo.caption}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TornPaperEdge>
                  </AnimatedSection>
                )
              }

              // Regular or arch photo
              return (
                <AnimatedSection key={photo.id} index={index}
                  className="break-inside-avoid mb-5 sm:mb-6 cursor-pointer group"
                  onClick={() => setSelectedPhoto(photo.url)}>
                  <div className={`relative ${getAspectRatio(index)} overflow-hidden transition-all duration-500 hover:shadow-2xl`}
                    style={{
                      clipPath: isArch ? archClip : undefined,
                      borderRadius: isArch ? undefined : '0.75rem',
                      boxShadow: isArch
                        ? `0 8px 30px rgba(0,0,0,0.2), inset 0 0 0 4px ${accent}35`
                        : '0 4px 18px rgba(0,0,0,0.12)',
                    }}>
                    <Image src={photo.url} alt={photo.alt || 'Gallery photo'} fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      style={{
                        objectPosition: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center',
                        transform: photo.zoom && photo.zoom > 1 ? `scale(${photo.zoom})` : undefined,
                        transformOrigin: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center',
                      }}
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                          <p className="text-white text-xs sm:text-sm font-light line-clamp-2" style={{ fontFamily: 'var(--font-body, sans-serif)' }}>{photo.caption}</p>
                        </div>
                      )}
                    </div>
                    {isArch && (
                      <div className="absolute inset-0 pointer-events-none transition-all duration-500 group-hover:shadow-[inset_0_0_40px_rgba(192,168,130,0.25)]"
                        style={{ clipPath: archClip, boxShadow: `inset 0 0 0 4px ${accent}40` }} />
                    )}
                    {!isArch && (
                      <div className="absolute inset-0 pointer-events-none border-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ borderColor: `${accent}40` }} />
                    )}
                  </div>
                </AnimatedSection>
              )
            })}
          </div>

          {/* Bottom floral divider */}
          <div className="mt-14 sm:mt-18">
            <FloralDivider color={`${accent}45`} />
          </div>
        </div>
      </SectionWrapper>

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
            <Image src={selectedPhoto} alt="Full size photo" fill className="object-contain" sizes="100vw" />
          </div>
        </div>
      )}
    </>
  )
}

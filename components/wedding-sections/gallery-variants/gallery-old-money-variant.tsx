"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { BaseGalleryProps } from './types'
import { getColorScheme } from '../countdown-variants/types'
import { AnimatedSection } from '../animated-section'
import { useI18n } from '@/components/contexts/i18n-context'

const EDITORIAL_BG = '#F6F1EB'
const EDITORIAL_INK = '#211D1A'
const EDITORIAL_MUTED = '#8A7B6E'
const EDITORIAL_HAIRLINE = 'rgba(33,29,26,0.12)'

interface GalleryOldMoneyVariantProps extends BaseGalleryProps {
  bgStyle?: string
  accentMetal?: string
  showOrnaments?: boolean
  gridColumns?: 2 | 3 | 4
}


export function GalleryOldMoneyVariant({
  weddingNameId,
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  photos = [],
  backgroundColorChoice,
  bgStyle = 'ivory',
  accentMetal = 'gold',
  showOrnaments = true,
  gridColumns = 3,
}: GalleryOldMoneyVariantProps) {
  const { t } = useI18n()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const { bgColor, sectionTextColor, isColored } = getColorScheme(theme, backgroundColorChoice, false)
  const bg = isColored && bgColor ? bgColor : EDITORIAL_BG
  const ink = isColored && sectionTextColor ? sectionTextColor : EDITORIAL_INK
  const muted = isColored && sectionTextColor ? `${sectionTextColor}90` : EDITORIAL_MUTED
  const hairline = isColored && sectionTextColor ? `${sectionTextColor}20` : EDITORIAL_HAIRLINE
  const primary = isColored && sectionTextColor ? sectionTextColor : (theme?.colors?.primary || EDITORIAL_INK)

  const title = sectionTitle || t('gallery.title')

  const openLightbox = (i: number) => setLightboxIndex(i)
  const closeLightbox = () => setLightboxIndex(null)
  const prevPhoto = () => setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length))
  const nextPhoto = () => setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length))

  return (
    <section id="gallery" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
      {/* Section header */}
      <AnimatedSection>
        <div
          className="px-8 sm:px-14 md:px-20"
          style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(2.5rem, 5vw, 4rem)' }}
        >
          {sectionSubtitle && (
            <p
              data-custom-font
              className="text-[10px] uppercase tracking-[0.5em] mb-5"
              style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '10px' }}
            >
              {sectionSubtitle}
            </p>
          )}
          <div className="flex items-end justify-between gap-4">
            <div
              role="heading"
              aria-level={2}
              style={{
                fontFamily: 'var(--font-display, serif)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2.2rem, 5vw, 4.5rem)',
                color: primary,
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>
            {photos.length > 0 && (
              <p
                data-custom-font
                style={{ fontFamily: 'var(--font-heading, serif)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.45em', color: muted, fontWeight: 300, whiteSpace: 'nowrap', paddingBottom: '0.4rem' }}
              >
                {photos.length} {photos.length === 1 ? 'image' : 'images'}
              </p>
            )}
          </div>
          <div style={{ height: '1px', background: hairline, marginTop: '2rem' }} />
        </div>
      </AnimatedSection>

      {/* Gallery */}
      {photos.length === 0 ? (
        <AnimatedSection delay={100}>
          <div className="px-8 sm:px-14 md:px-20" style={{ paddingTop: '4rem', paddingBottom: 'clamp(5rem, 10vw, 8rem)' }}>
            <p
              data-custom-font
              style={{ fontFamily: 'var(--font-display, serif)', fontStyle: 'italic', fontWeight: 300, fontSize: '1rem', color: muted }}
            >
              {t('gallery.noPhotos')}
            </p>
          </div>
        </AnimatedSection>
      ) : (
        <div style={{ paddingBottom: 'clamp(5rem, 10vw, 8rem)' }}>
          {/* Featured first image — full bleed */}
          {photos.length >= 1 && (
            <AnimatedSection delay={80}>
              <button
                className="w-full relative overflow-hidden group block focus:outline-none"
                style={{ aspectRatio: '16/7' }}
                onClick={() => openLightbox(0)}
              >
                <Image
                  src={photos[0].url}
                  alt={photos[0].alt || photos[0].caption || ''}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                  style={{ filter: 'brightness(0.95) sepia(0.04)' }}
                  sizes="100vw"
                  priority
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `${ink}12` }}
                />
              </button>
            </AnimatedSection>
          )}

          {/* Remaining — uniform-ratio editorial grid, each image staggered individually */}
          {photos.length > 1 && (
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${Math.min(gridColumns, 3)}, 1fr)`, gap: '3px', marginTop: '3px' }}
            >
              {photos.slice(1).map((photo, i) => (
                <AnimatedSection key={photo.id || i + 1} delay={160 + i * 80}>
                  <button
                    className="w-full relative overflow-hidden group focus:outline-none block"
                    style={{ aspectRatio: '4/5' }}
                    onClick={() => openLightbox(i + 1)}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.alt || photo.caption || ''}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      style={{ filter: 'brightness(0.95) sepia(0.04)' }}
                      sizes={`${Math.round(100 / Math.min(gridColumns, 3))}vw`}
                    />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `${ink}15` }}
                    />
                  </button>
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(20,16,12,0.96)', backdropFilter: 'blur(2px)' }}
          onClick={closeLightbox}
        >
          <button
            className="absolute top-6 right-6 z-10 flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-50"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onClick={closeLightbox}
          >
            <X className="w-5 h-5" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-50"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onClick={(e) => { e.stopPropagation(); prevPhoto() }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-50"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onClick={(e) => { e.stopPropagation(); nextPhoto() }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="relative max-w-5xl max-h-[88vh] w-full h-full mx-16" onClick={(e) => e.stopPropagation()}>
            <Image
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].alt || ''}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <p style={{ fontFamily: 'var(--font-heading, serif)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.4)' }}>
              {photos[lightboxIndex].caption || ''}
            </p>
            {photos.length > 1 && (
              <p style={{ fontFamily: 'var(--font-heading, serif)', fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.35)' }}>
                {lightboxIndex + 1} / {photos.length}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

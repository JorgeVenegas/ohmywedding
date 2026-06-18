"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { BaseDressCodeProps, getColorScheme } from './types'
import { AnimatedSection } from '../animated-section'
import { useI18n } from '@/components/contexts/i18n-context'

const EDITORIAL_BG = '#F6F1EB'
const EDITORIAL_INK = '#211D1A'
const EDITORIAL_MUTED = '#8A7B6E'
const EDITORIAL_HAIRLINE = 'rgba(33,29,26,0.12)'

interface DressCodeOldMoneyVariantProps extends BaseDressCodeProps {
  bgStyle?: string
  accentMetal?: string
  showOrnaments?: boolean
}

export function DressCodeOldMoneyVariant({
  theme,
  sectionTitle,
  sectionSubtitle,
  dressCodeType,
  description,
  images = [],
  useColorBackground,
  backgroundColorChoice,
  bgStyle = 'ivory',
  accentMetal = 'gold',
  showOrnaments = true,
}: DressCodeOldMoneyVariantProps) {
  const { t } = useI18n()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [lightboxVisible, setLightboxVisible] = useState(false)

  const { bgColor, titleColor, bodyTextColor, isColored } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const bg = isColored && bgColor ? bgColor : EDITORIAL_BG
  const ink = isColored && titleColor ? titleColor : EDITORIAL_INK
  const muted = isColored && bodyTextColor ? `${bodyTextColor}CC` : EDITORIAL_MUTED
  const hairline = isColored && titleColor ? `${titleColor}22` : EDITORIAL_HAIRLINE
  const primary = isColored && titleColor ? titleColor : (theme?.colors?.primary || EDITORIAL_INK)

  const title = sectionTitle || t('dressCode.title')
  const subtitle = sectionSubtitle || t('dressCode.subtitle')

  const openLightbox = (url: string) => { setSelectedImage(url); setTimeout(() => setLightboxVisible(true), 10) }
  const closeLightbox = () => { setLightboxVisible(false); setTimeout(() => setSelectedImage(null), 300) }

  return (
    <>
      <section id="dress-code" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
        <div
          className="max-w-xl mx-auto px-8 sm:px-14 md:px-10 text-center"
          style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)' }}
        >
          <AnimatedSection>
            {subtitle && (
              <p
                data-custom-font
                className="text-[10px] uppercase tracking-[0.5em] mb-5"
                style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '11px' }}
              >
                {subtitle}
              </p>
            )}
            <div
              style={{
                fontFamily: 'var(--font-display, serif)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(1.75rem, 3vw, 2.2rem)',
                color: muted,
                lineHeight: 1.2,
                marginBottom: '3rem',
              }}
            >
              {title}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={80}>
            <div style={{ height: '1px', background: hairline, maxWidth: '80px', margin: '0 auto 3rem' }} />
          </AnimatedSection>

          {/* Dress code type — the editorial centrepiece, uses div to avoid global h2 override */}
          {dressCodeType && (
            <AnimatedSection delay={120}>
              <div
                role="heading"
                aria-level={2}
                style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 'clamp(3rem, 8vw, 7rem)',
                  color: primary,
                  lineHeight: 1.0,
                  letterSpacing: '-0.01em',
                  marginBottom: '3rem',
                }}
              >
                {dressCodeType}
              </div>
            </AnimatedSection>
          )}

          {description && (
            <AnimatedSection delay={160}>
              <p
                data-custom-font
                style={{
                  fontFamily: 'var(--font-body, sans-serif)',
                  fontWeight: 300,
                  fontSize: '1rem',
                  lineHeight: 1.85,
                  color: muted,
                  maxWidth: '38ch',
                  margin: '0 auto',
                  whiteSpace: 'pre-line',
                }}
              >
                {description}
              </p>
            </AnimatedSection>
          )}

          {images.length > 0 && (
            <AnimatedSection delay={200} className="mt-12 sm:mt-16">
              <div style={{ height: '1px', background: hairline, marginBottom: '2.5rem' }} />
              {images.length === 1 ? (
                <button
                  className="relative w-full overflow-hidden group block focus:outline-none"
                  style={{ aspectRatio: '4/5' }}
                  onClick={() => openLightbox(images[0])}
                >
                  <Image
                    src={images[0]}
                    alt="Dress code reference"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    style={{ filter: 'brightness(0.95) sepia(0.06)' }}
                    sizes="(max-width: 640px) 90vw, 520px"
                  />
                </button>
              ) : (
                <div className="grid gap-2" style={{ gridTemplateColumns: images.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)' }}>
                  {images.map((img, i) => (
                    <button key={i} className="relative overflow-hidden group focus:outline-none" style={{ aspectRatio: '3/4' }} onClick={() => openLightbox(img)}>
                      <Image src={img} alt="Dress code reference" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" style={{ filter: 'brightness(0.95) sepia(0.06)' }} sizes="33vw" />
                    </button>
                  ))}
                </div>
              )}
            </AnimatedSection>
          )}
        </div>
      </section>

      {selectedImage && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity duration-300 ${lightboxVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(20,16,12,0.96)' }}
          onClick={closeLightbox}
        >
          <button className="absolute top-6 right-6 flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-50" style={{ color: 'rgba(255,255,255,0.55)' }} onClick={closeLightbox}>
            <X className="w-5 h-5" />
          </button>
          <div className="relative max-w-4xl max-h-[88vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image src={selectedImage} alt="Full size" fill className="object-contain" sizes="100vw" />
          </div>
        </div>
      )}
    </>
  )
}

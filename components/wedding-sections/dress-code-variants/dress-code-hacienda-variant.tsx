"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { BaseDressCodeProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { AnimatedSection } from '../animated-section'
import {
  HaciendaSectionTitle, HaciendaTilePattern, CandleGlow,
  FloralDivider, OrnateCorner,
} from '../hacienda-ornaments'

export function DressCodeHaciendaVariant({
  theme, sectionTitle, sectionSubtitle, dressCodeType, description,
  images = [], useColorBackground = false, backgroundColorChoice = 'none',
}: BaseDressCodeProps) {
  const { t } = useI18n()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLightboxVisible, setIsLightboxVisible] = useState(false)
  const [isLightboxClosing, setIsLightboxClosing] = useState(false)

  const colorScheme = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const { bgColor, isColored } = colorScheme
  const primary = colorScheme.primary
  const secondary = colorScheme.secondary
  const accent = colorScheme.accent

  const isAccentBg = backgroundColorChoice === 'accent' || backgroundColorChoice === 'accent-light' || backgroundColorChoice === 'accent-lighter'
  const isSecondaryBg = backgroundColorChoice === 'secondary' || backgroundColorChoice === 'secondary-light' || backgroundColorChoice === 'secondary-lighter'
  const needsDarkText = isColored && (isAccentBg || isSecondaryBg)

  const titleColor = needsDarkText ? primary : colorScheme.titleColor
  const subtitleColor = needsDarkText ? `${primary}99` : colorScheme.subtitleColor
  const bodyColor = needsDarkText ? primary : colorScheme.bodyTextColor

  const title = sectionTitle || t('dressCode.title')
  const subtitle = sectionSubtitle || t('dressCode.subtitle')

  const openLightbox = (url: string) => {
    setSelectedImage(url)
    setIsLightboxClosing(false)
    setTimeout(() => setIsLightboxVisible(true), 10)
  }
  const closeLightbox = () => {
    setIsLightboxVisible(false)
    setIsLightboxClosing(true)
    setTimeout(() => { setSelectedImage(null); setIsLightboxClosing(false) }, 300)
  }

  return (
    <>
      <section id="dress-code" className="w-full py-16 sm:py-20 md:py-24 relative overflow-hidden"
        style={{ backgroundColor: isColored ? bgColor : secondary }}>
        <HaciendaTilePattern color={isColored ? secondary : primary} opacity={0.05} />
        <CandleGlow position="top" intensity="subtle" />

        <div className="max-w-2xl mx-auto px-6 sm:px-8 md:px-10 relative z-10">
          <AnimatedSection className="mb-8 sm:mb-12">
            <HaciendaSectionTitle title={title} subtitle={subtitle}
              titleColor={titleColor} subtitleColor={subtitleColor} accentColor={accent} />
          </AnimatedSection>

          {/* Dress code card */}
          <AnimatedSection delay={100}>
            <div className="relative p-7 sm:p-10 border overflow-hidden text-center"
              style={{
                backgroundColor: isColored ? `${secondary}08` : `${primary}04`,
                borderColor: `${accent}25`,
              }}>
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}60, ${accent}, ${accent}60, transparent)` }} />

              <OrnateCorner position="top-left" color={`${accent}80`} size="sm" />
              <OrnateCorner position="top-right" color={`${accent}80`} size="sm" />
              <OrnateCorner position="bottom-left" color={`${accent}60`} size="sm" />
              <OrnateCorner position="bottom-right" color={`${accent}60`} size="sm" />

              <div className="relative z-10">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4"
                  style={{
                    maskImage: "url('/assets/Icons/Dresscode.svg')",
                    WebkitMaskImage: "url('/assets/Icons/Dresscode.svg')",
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    backgroundColor: accent,
                  }}
                />

                {dressCodeType && (
                  <h3 className="text-xl sm:text-2xl font-light tracking-wide uppercase mb-3"
                    style={{ color: titleColor, fontFamily: 'var(--font-display, serif)', letterSpacing: '0.15em' }}>
                    {dressCodeType}
                  </h3>
                )}

                <FloralDivider color={accent} className="!w-36 sm:!w-44 mb-5" />

                {description && (
                  <p className="text-sm sm:text-base font-light leading-relaxed max-w-lg mx-auto whitespace-pre-line"
                    style={{ color: bodyColor, fontFamily: 'var(--font-body, sans-serif)' }}>
                    {description}
                  </p>
                )}

                {images.length === 1 && (
                  <div className="mt-8 -mx-7 sm:-mx-10">
                    {/* center diamond divider */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${accent}50)` }} />
                      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: accent, opacity: 0.6 }} />
                      <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${accent}50)` }} />
                    </div>
                    <div
                      className="relative mx-4 sm:mx-6 overflow-hidden group cursor-pointer"
                      style={{ boxShadow: `0 2px 24px ${accent}18` }}
                      onClick={() => openLightbox(images[0])}>
                      {/* thin top accent bar */}
                      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}90, transparent)` }} />
                      <div className="flex items-center justify-center">
                        <Image
                          src={images[0]}
                          alt="Dress code reference"
                          width={600}
                          height={600}
                          className="max-h-[55vh] sm:max-h-[60vh] w-full h-auto object-contain sepia-[.04] brightness-[1.01] transition-transform duration-700 group-hover:scale-[1.015]"
                          sizes="(max-width: 640px) 85vw, 520px"
                        />
                      </div>
                      {/* thin bottom accent bar */}
                      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}70, transparent)` }} />
                    </div>
                  </div>
                )}

                {images.length > 1 && (
                  <div className="mt-8 -mx-7 sm:-mx-10">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${accent}50)` }} />
                      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: accent, opacity: 0.6 }} />
                      <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${accent}50)` }} />
                    </div>
                    <div className={`grid gap-1 mx-4 sm:mx-6 ${images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                      {images.map((img, i) => (
                        <div key={i}
                          className="relative overflow-hidden cursor-pointer group"
                          onClick={() => openLightbox(img)}>
                          <div className="flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]">
                            <Image
                              src={img}
                              alt="Dress code reference"
                              width={300}
                              height={300}
                              className="max-h-48 sm:max-h-56 w-full h-auto object-contain"
                              sizes="(max-width: 640px) 45vw, 200px"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${accent}40, ${accent}70, ${accent}40, transparent)` }} />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300 ${isLightboxVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeLightbox}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            onClick={closeLightbox}>
            <X className="w-6 h-6" />
          </button>
          <div className={`relative max-w-4xl max-h-[85vh] w-full h-full transition-all duration-300 ${isLightboxVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <Image src={selectedImage} alt="Full size" fill className="object-contain" sizes="100vw" />
          </div>
        </div>
      )}
    </>
  )
}

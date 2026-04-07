"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, X, Shirt } from 'lucide-react'
import { AnimatedSection } from '../animated-section'
import { BaseFAQProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import {
  HaciendaTilePattern, CandleGlow, IronLineDivider,
  HaciendaSectionTitle, FloralDivider, OrnateCorner, BotanicalCorner,
} from '../hacienda-ornaments'

function AnimatedFAQItem({ index, children }: { index: number; children: React.ReactNode }) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false })
  return (
    <div ref={ref}
      className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: isVisible ? `${index * 80}ms` : '0ms' }}>
      {children}
    </div>
  )
}

export function FAQHaciendaVariant({
  theme, alignment, sectionTitle, sectionSubtitle,
  questions = [], allowMultipleOpen = false,
  showContactNote = false, contactNoteText,
  useColorBackground = true, backgroundColorChoice = 'primary',
}: BaseFAQProps) {
  const { t } = useI18n()
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLightboxClosing, setIsLightboxClosing] = useState(false)
  const [isLightboxVisible, setIsLightboxVisible] = useState(false)

  const { bgColor, bodyTextColor, cardBorder, isColored, primary, secondary, accent } = getColorScheme(
    theme, backgroundColorChoice, useColorBackground
  )

  const title = sectionTitle || t('faq.title')
  const subtitle = sectionSubtitle || t('faq.subtitle')
  const darkBg = primary || '#2D4A32'
  const creamText = secondary || '#FAF6EF'
  const goldAccent = accent || '#C0A882'
  const useDarkBg = !!isColored
  // Use the actual bgColor from getColorScheme instead of always using darkBg
  const sectionBg = useDarkBg ? (bgColor || darkBg) : creamText
  // Determine if the section bg is a light color for text contrast
  const isAccentBg = backgroundColorChoice === 'accent' || backgroundColorChoice === 'accent-light' || backgroundColorChoice === 'accent-lighter'
  const isSecondaryBg = backgroundColorChoice === 'secondary' || backgroundColorChoice === 'secondary-light' || backgroundColorChoice === 'secondary-lighter'
  const isLightBg = isAccentBg || isSecondaryBg
  const headingColor = useDarkBg ? (isLightBg ? darkBg : creamText) : darkBg
  const bodyColor = useDarkBg ? (isLightBg ? `${darkBg}DD` : `${creamText}DD`) : (bodyTextColor || '#374151')
  const chevronColor = goldAccent

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) { next.delete(index) }
      else { if (!allowMultipleOpen) next.clear(); next.add(index) }
      return next
    })
  }

  const openLightbox = (url: string) => {
    setSelectedImage(url); setIsLightboxClosing(false)
    setTimeout(() => setIsLightboxVisible(true), 10)
  }
  const closeLightbox = () => {
    setIsLightboxVisible(false); setIsLightboxClosing(true)
    setTimeout(() => { setSelectedImage(null); setIsLightboxClosing(false) }, 300)
  }

  const dressCodeQuestions = questions.filter((q) => /dress|vestimenta|codigo|code|attire|traje/i.test(q.question))
  const otherQuestions = questions.filter((q) => !dressCodeQuestions.includes(q))

  return (
    <>
      <section id="faq" className="w-full py-16 sm:py-20 md:py-28 relative overflow-hidden"
        style={{ backgroundColor: sectionBg }}>
        {/* Rich layered background */}
        <HaciendaTilePattern color={useDarkBg ? creamText : darkBg} opacity={useDarkBg ? 0.025 : 0.015} />
        <CandleGlow position="top-left" intensity={useDarkBg ? 'medium' : 'subtle'} />
        <CandleGlow position="top-right" intensity={useDarkBg ? 'medium' : 'subtle'} />

        {/* Botanical corners */}
        <BotanicalCorner position="top-right" color={`${goldAccent}${useDarkBg ? '35' : '25'}`} size="md" />
        <BotanicalCorner position="bottom-left" color={`${goldAccent}${useDarkBg ? '30' : '20'}`} size="sm" />

        {/* Top/bottom gold edges */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${goldAccent}30, transparent)` }} />
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${goldAccent}30, transparent)` }} />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <AnimatedSection className="mb-12 sm:mb-16">
            <HaciendaSectionTitle title={title} subtitle={subtitle}
              titleColor={headingColor} subtitleColor={`${headingColor}99`} accentColor={goldAccent} />
          </AnimatedSection>

          {/* Dress Code Section — ornate card with corner decorations */}
          {dressCodeQuestions.length > 0 && (
            <AnimatedSection delay={100} className="mb-14 sm:mb-18">
              <div className="relative p-7 sm:p-10 rounded-2xl border overflow-hidden"
                style={{
                  backgroundColor: useDarkBg ? `${creamText}06` : `${darkBg}04`,
                  borderColor: `${goldAccent}25`,
                }}>
                <CandleGlow position="center" intensity="subtle" />

                {/* Ornate corners on dress code card */}
                <OrnateCorner position="top-left" color={`${goldAccent}40`} size="sm" />
                <OrnateCorner position="top-right" color={`${goldAccent}40`} size="sm" />
                <OrnateCorner position="bottom-left" color={`${goldAccent}30`} size="sm" />
                <OrnateCorner position="bottom-right" color={`${goldAccent}30`} size="sm" />

                <div className="flex items-center gap-2.5 mb-5 relative z-10">
                  <Shirt className="w-5 h-5" style={{ color: goldAccent }} />
                  <h3 className="text-lg sm:text-xl font-medium tracking-wide uppercase"
                    style={{ color: headingColor, fontFamily: 'var(--font-heading, serif)', letterSpacing: '0.15em' }}>
                    {t('faq.dressCode') || 'Dress Code'}
                  </h3>
                </div>
                <FloralDivider color={goldAccent} className="!w-40 sm:!w-48 !mx-0 mb-6" />
                <div className="space-y-4 relative z-10">
                  {dressCodeQuestions.map((q, i) => (
                    <div key={`dc-${i}`}>
                      <p className="text-sm sm:text-base font-medium mb-1" style={{ color: headingColor }}>{q.question}</p>
                      <p className="text-sm sm:text-base font-light leading-relaxed" style={{ color: bodyColor }}>{q.answer}</p>
                      {q.images && q.images.length > 0 && (
                        <div className="flex gap-2.5 mt-3 flex-wrap">
                          {q.images.map((img, j) => (
                            <button key={j} onClick={() => openLightbox(img)}
                              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border transition-all duration-300 hover:scale-105 hover:shadow-lg"
                              style={{ borderColor: `${goldAccent}30` }}>
                              <Image src={img} alt="Dress code reference" fill className="object-cover" sizes="80px" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* FAQ Accordion */}
          <div className="space-y-0">
            {otherQuestions.map((q, index) => (
              <AnimatedFAQItem key={index} index={index}>
                <IronLineDivider color={useDarkBg ? creamText : darkBg} />
                <div className="py-1">
                  <button onClick={() => toggleItem(index)}
                    className="w-full flex items-center justify-between py-4 sm:py-5 text-left group transition-colors">
                    <span className="text-sm sm:text-base font-medium pr-4 leading-snug"
                      style={{ color: headingColor, fontFamily: 'var(--font-heading, serif)' }}>
                      {q.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform duration-300 ${openItems.has(index) ? 'rotate-180' : ''}`}
                      style={{ color: chevronColor }} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-400 ease-in-out ${openItems.has(index) ? 'max-h-[600px] opacity-100 pb-5' : 'max-h-0 opacity-0'}`}>
                    <p className="text-sm sm:text-base font-light leading-relaxed whitespace-pre-line"
                      style={{ color: bodyColor, fontFamily: 'var(--font-body, sans-serif)' }}>
                      {q.answer}
                    </p>
                    {q.images && q.images.length > 0 && (
                      <div className="flex gap-2.5 mt-4 flex-wrap">
                        {q.images.map((img, j) => (
                          <button key={j} onClick={() => openLightbox(img)}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            style={{ borderColor: `${goldAccent}30` }}>
                            <Image src={img} alt="FAQ image" fill className="object-cover" sizes="80px" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedFAQItem>
            ))}
            <IronLineDivider color={useDarkBg ? creamText : darkBg} />
          </div>

          {showContactNote && contactNoteText && (
            <AnimatedSection delay={300} className="mt-12 sm:mt-16 text-center">
              <p className="text-sm font-light italic"
                style={{ color: `${headingColor}80`, fontFamily: 'var(--font-body, sans-serif)' }}>
                {contactNoteText}
              </p>
            </AnimatedSection>
          )}
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

"use client"

import React from 'react'
import Image from 'next/image'
import { ExternalLink, Phone, MapPin, DollarSign, Navigation } from 'lucide-react'
import { BaseHotelSuggestionsProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { AnimatedSection } from '../animated-section'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import {
  HaciendaSectionTitle, HaciendaTilePattern, CandleGlow,
  FloralDivider, OrnateCorner,
} from '../hacienda-ornaments'

function AnimatedHotelCard({ index, children }: { index: number; children: React.ReactNode }) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15, triggerOnce: false })
  return (
    <div ref={ref}
      className={`transition-all duration-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: isVisible ? `${index * 120}ms` : '0ms' }}>
      {children}
    </div>
  )
}

export function HotelSuggestionsHaciendaVariant({
  theme, sectionTitle, sectionSubtitle, hotels = [],
  useColorBackground = false, backgroundColorChoice = 'none',
}: BaseHotelSuggestionsProps) {
  const { t } = useI18n()

  const colorScheme = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const { bgColor, isColored, primary, secondary, accent } = colorScheme

  const title = sectionTitle || t('hotelSuggestions.title')
  const subtitle = sectionSubtitle || t('hotelSuggestions.subtitle')
  const darkBg = primary
  const creamText = secondary
  const goldAccent = accent
  const useDarkBg = !!isColored
  const sectionBg = useDarkBg ? (bgColor || darkBg) : creamText

  const isAccentBg = backgroundColorChoice === 'accent' || backgroundColorChoice === 'accent-light' || backgroundColorChoice === 'accent-lighter'
  const isSecondaryBg = backgroundColorChoice === 'secondary' || backgroundColorChoice === 'secondary-light' || backgroundColorChoice === 'secondary-lighter'
  const isLightBg = isAccentBg || isSecondaryBg
  const headingColor = useDarkBg ? (isLightBg ? darkBg : creamText) : darkBg
  const bodyColor = useDarkBg ? (isLightBg ? `${darkBg}DD` : `${creamText}DD`) : `${darkBg}CC`
  const mutedColor = useDarkBg ? (isLightBg ? `${darkBg}99` : `${creamText}80`) : `${darkBg}80`

  return (
    <section id="hotel-suggestions" className="w-full py-16 sm:py-20 md:py-28 relative overflow-hidden"
      style={{ backgroundColor: sectionBg }}>
      <HaciendaTilePattern color={useDarkBg ? creamText : darkBg} opacity={0.04} />
      <CandleGlow position="top-left" intensity={useDarkBg ? 'medium' : 'subtle'} />
      <CandleGlow position="bottom" intensity={useDarkBg ? 'medium' : 'subtle'} />

      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${goldAccent}30, transparent)` }} />
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${goldAccent}30, transparent)` }} />

      <div className="max-w-5xl mx-auto px-6 sm:px-8 md:px-10 relative z-10">
        <AnimatedSection className="mb-12 sm:mb-16">
          <HaciendaSectionTitle title={title} subtitle={subtitle}
            titleColor={headingColor} subtitleColor={`${headingColor}99`} accentColor={goldAccent} />
        </AnimatedSection>

        {hotels.length === 0 ? (
          <AnimatedSection delay={100}>
            <div className="text-center py-8">
              <p className="text-sm italic" style={{ color: mutedColor, fontFamily: 'var(--font-body, sans-serif)' }}>
                {t('hotelSuggestions.subtitle')}
              </p>
            </div>
          </AnimatedSection>
        ) : (
        <div className={hotels.length === 1 ? 'flex justify-center' : 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8'}>
          {hotels.map((hotel, index) => (
            <AnimatedHotelCard key={index} index={index}>
              <div className={`relative rounded-2xl border overflow-hidden group transition-all duration-300 hover:shadow-lg${hotels.length === 1 ? ' w-full max-w-lg' : ''}`}
                style={{
                  backgroundColor: useDarkBg ? `${creamText}08` : `${darkBg}03`,
                  borderColor: `${goldAccent}25`,
                }}>
                <OrnateCorner position="top-left" color={`${goldAccent}60`} size="sm" />
                <OrnateCorner position="top-right" color={`${goldAccent}60`} size="sm" />

                {hotel.imageUrl && (
                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    <Image
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0" style={{
                      background: `linear-gradient(to top, ${useDarkBg ? sectionBg : darkBg}40, transparent 60%)`
                    }} />
                  </div>
                )}

                <div className="p-5 sm:p-6 space-y-3">
                  <h3 className="text-lg sm:text-xl font-medium tracking-wide"
                    style={{ color: headingColor, fontFamily: 'var(--font-heading, serif)' }}>
                    {hotel.name}
                  </h3>

                  {hotel.description && (
                    <p className="text-sm leading-relaxed font-light"
                      style={{ color: bodyColor, fontFamily: 'var(--font-body, sans-serif)' }}>
                      {hotel.description}
                    </p>
                  )}

                  <FloralDivider color={goldAccent} className="!w-24 !mx-0 my-3" />

                  <div className="space-y-2">
                    {hotel.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: goldAccent }} />
                        <span className="text-sm" style={{ color: bodyColor }}>{hotel.address}</span>
                      </div>
                    )}
                    {hotel.distanceToVenue && (
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 flex-shrink-0" style={{ color: goldAccent }} />
                        <span className="text-sm" style={{ color: mutedColor }}>{hotel.distanceToVenue}</span>
                      </div>
                    )}
                    {hotel.priceRange && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: goldAccent }} />
                        <span className="text-sm" style={{ color: mutedColor }}>{hotel.priceRange}</span>
                      </div>
                    )}
                    {hotel.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0" style={{ color: goldAccent }} />
                        <a href={`tel:${hotel.phone}`} className="text-sm hover:underline" style={{ color: bodyColor }}>
                          {hotel.phone}
                        </a>
                      </div>
                    )}
                    {hotel.bookingCode && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: `${goldAccent}15`, borderLeft: `3px solid ${goldAccent}50` }}>
                        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: mutedColor }}>
                          {t('hotelSuggestions.bookingCode')}:
                        </span>
                        <span className="text-sm font-semibold tracking-wide" style={{ color: headingColor }}>
                          {hotel.bookingCode}
                        </span>
                      </div>
                    )}
                  </div>

                  {hotel.websiteUrl && (
                    <a
                      href={hotel.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105"
                      style={{
                        color: useDarkBg ? (isLightBg ? creamText : darkBg) : creamText,
                        backgroundColor: useDarkBg ? (isLightBg ? darkBg : `${creamText}20`) : darkBg,
                        border: `1px solid ${goldAccent}40`,
                      }}
                    >
                      {t('hotelSuggestions.viewHotel')}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </AnimatedHotelCard>
          ))}
        </div>
        )}
      </div>
    </section>
  )
}

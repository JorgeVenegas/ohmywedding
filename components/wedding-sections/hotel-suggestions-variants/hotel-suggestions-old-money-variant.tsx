"use client"

import React from 'react'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { BaseHotelSuggestionsProps, getColorScheme } from './types'
import { AnimatedSection } from '../animated-section'
import { useI18n } from '@/components/contexts/i18n-context'

const EDITORIAL_BG = '#F6F1EB'
const EDITORIAL_INK = '#211D1A'
const EDITORIAL_MUTED = '#8A7B6E'
const EDITORIAL_HAIRLINE = 'rgba(33,29,26,0.12)'

interface HotelSuggestionsOldMoneyVariantProps extends BaseHotelSuggestionsProps {
  bgStyle?: string
  accentMetal?: string
  showOrnaments?: boolean
}

export function HotelSuggestionsOldMoneyVariant({
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  hotels = [],
  useColorBackground,
  backgroundColorChoice,
  bgStyle = 'ivory',
  accentMetal = 'gold',
  showOrnaments = true,
}: HotelSuggestionsOldMoneyVariantProps) {
  const { t } = useI18n()

  const { bgColor, titleColor, bodyTextColor, isColored } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const bg = isColored && bgColor ? bgColor : EDITORIAL_BG
  const ink = isColored && titleColor ? titleColor : EDITORIAL_INK
  const muted = isColored && bodyTextColor ? `${bodyTextColor}CC` : EDITORIAL_MUTED
  const hairline = isColored && titleColor ? `${titleColor}22` : EDITORIAL_HAIRLINE
  const primary = isColored && titleColor ? titleColor : (theme?.colors?.primary || EDITORIAL_INK)

  const title = sectionTitle || t('hotelSuggestions.title')

  return (
    <section id="hotel-suggestions" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
      <div
        className="px-8 sm:px-14 md:px-20"
        style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)' }}
      >
        {/* Section heading */}
        <AnimatedSection className="mb-14 sm:mb-20">
          <div>
            {sectionSubtitle && (
              <p
                data-custom-font
                className="uppercase tracking-[0.5em] mb-5"
                style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '18px' }}
              >
                {sectionSubtitle}
              </p>
            )}
            <div
              role="heading"
              aria-level={2}
              style={{
                fontFamily: 'var(--font-display, serif)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2.4rem, 5vw, 4.5rem)',
                color: primary,
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>
          </div>
        </AnimatedSection>

        {hotels.length === 0 ? (
          <AnimatedSection delay={80}>
            <div style={{ height: '1px', background: hairline, marginBottom: '2rem' }} />
            <p
              data-custom-font
              style={{ fontFamily: 'var(--font-display, serif)', fontStyle: 'italic', fontWeight: 300, fontSize: '1rem', color: muted }}
            >
              {t('hotelSuggestions.noHotels')}
            </p>
          </AnimatedSection>
        ) : (
          <div className="max-w-3xl">
            {hotels.map((hotel, i) => (
              <AnimatedSection key={i} delay={i * 100 + 80}>
                <div className={i > 0 ? 'mt-16 sm:mt-20' : ''}>
                  <div style={{ height: '1px', background: hairline, marginBottom: '2.5rem' }} />

                  {hotel.imageUrl && (
                    <div className="w-full relative overflow-hidden mb-8" style={{ aspectRatio: '16/8' }}>
                      <Image
                        src={hotel.imageUrl}
                        alt={hotel.name}
                        fill
                        className="object-cover transition-transform duration-1000 hover:scale-[1.02]"
                        style={{ filter: 'brightness(0.93) sepia(0.05)' }}
                        sizes="(max-width: 768px) 100vw, 768px"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10">
                    <div className="sm:col-span-2">
                      {hotel.priceRange && (
                        <p
                          data-custom-font
                          className="uppercase tracking-[0.5em] mb-3"
                          style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '18px' }}
                        >
                          {hotel.priceRange}
                        </p>
                      )}
                      <div
                        role="heading"
                        aria-level={3}
                        style={{
                          fontFamily: 'var(--font-display, serif)',
                          fontStyle: 'italic',
                          fontWeight: 300,
                          fontSize: 'clamp(1.7rem, 3vw, 2.5rem)',
                          color: primary,
                          lineHeight: 1.15,
                          marginBottom: '1rem',
                        }}
                      >
                        {hotel.name}
                      </div>
                      {hotel.description && (
                        <p
                          data-custom-font
                          style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '1rem', lineHeight: 1.8, color: muted }}
                        >
                          {hotel.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      {hotel.address && (
                        <div>
                          <p data-custom-font className="uppercase tracking-[0.4em] mb-1" style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '18px' }}>Address</p>
                          <p data-custom-font style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '0.9375rem', color: muted }}>{hotel.address}</p>
                        </div>
                      )}
                      {hotel.distanceToVenue && (
                        <div>
                          <p data-custom-font className="uppercase tracking-[0.4em] mb-1" style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '18px' }}>Distance</p>
                          <p data-custom-font style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '0.9375rem', color: muted }}>{hotel.distanceToVenue}</p>
                        </div>
                      )}
                      {hotel.phone && (
                        <div>
                          <p data-custom-font className="uppercase tracking-[0.4em] mb-1" style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '18px' }}>Phone</p>
                          <a href={`tel:${hotel.phone}`} data-custom-font style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '0.9375rem', color: muted }}>{hotel.phone}</a>
                        </div>
                      )}
                      {hotel.bookingCode && (
                        <div>
                          <p data-custom-font className="uppercase tracking-[0.4em] mb-1" style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '18px' }}>{t('hotelSuggestions.bookingCode')}</p>
                          <p data-custom-font style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '0.9375rem', color: muted }}>{hotel.bookingCode}</p>
                        </div>
                      )}
                      {hotel.websiteUrl && (
                        <a
                          href={hotel.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-2 group transition-opacity hover:opacity-50"
                          style={{ fontFamily: 'var(--font-heading, serif)', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.45em', fontWeight: 300, color: ink }}
                        >
                          {t('hotelSuggestions.bookNow')}
                          <span className="h-px w-4 group-hover:w-7 transition-all duration-400 block" style={{ background: ink }} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

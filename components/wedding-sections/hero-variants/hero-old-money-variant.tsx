"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseHeroProps } from './types'
import { useEnvelope } from '@/components/contexts/envelope-context'
import { getOldMoneyColors, OldMoneyBgStyle, OldMoneyAccentMetal } from '../old-money-ornaments'
import { resolveColor } from '@/lib/color-utils'
import { formatWeddingDate, calculateDaysUntilWedding } from '@/lib/wedding-utils-client'
import { useI18n } from '@/components/contexts/i18n-context'

export interface HeroOldMoneyVariantProps extends BaseHeroProps {
  overlayOpacity?: number
  imageBrightness?: number
  bgStyle?: OldMoneyBgStyle
  accentMetal?: OldMoneyAccentMetal
  showOrnaments?: boolean
  taglineTopPadding?: number
  taglineFontSize?: string
  backgroundGradient?: boolean
  gradientColor1?: string
  gradientColor2?: string
  textPosition?: 'top' | 'center' | 'bottom'
}

export function HeroOldMoneyVariant({
  wedding,
  dateId,
  weddingNameId,
  theme,
  alignment,
  showTagline = true,
  tagline,
  showCountdown = true,
  showRSVPButton = true,
  heroImageUrl,
  overlayOpacity = 50,
  imageBrightness = 82,
  bgStyle = 'charcoal',
  accentMetal = 'gold',
  showOrnaments = true,
  taglineTopPadding = 0,
  taglineFontSize = 'sm',
  backgroundGradient = false,
  gradientColor1,
  gradientColor2,
  textPosition = 'bottom',
}: HeroOldMoneyVariantProps) {
  const { isOpened: envelopeOpened } = useEnvelope()
  const { t, locale } = useI18n()
  const [scrollY, setScrollY] = useState(0)
  const daysUntil = calculateDaysUntilWedding(wedding.wedding_date)
  const formattedDate = formatWeddingDate(wedding.wedding_date, locale)

  const resolvedGradientColor1 = resolveColor(gradientColor1, theme)
  const resolvedGradientColor2 = resolveColor(gradientColor2, theme)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const venueName = wedding.ceremony_venue_name || wedding.reception_venue_name

  return (
    <SectionWrapper
      theme={{ ...theme, spacing: { section: 'p-0', container: 'w-full max-w-none h-full' } }}
      alignment={alignment}
      background="primary"
      className="h-[100dvh] max-h-[100dvh] relative overflow-hidden"
      id="hero"
    >
      {/* Background */}
      <div
        className="absolute inset-0 w-full z-0"
        style={{ height: '120%', top: '-10%', transform: `translateY(${scrollY * 0.08}px)` }}
      >
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt="Wedding"
            fill
            className="object-cover"
            style={{ filter: `brightness(${imageBrightness}%)` }}
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-stone-900" />
        )}

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom,
              rgba(10,8,6,${overlayOpacity / 100 * 0.30}) 0%,
              rgba(10,8,6,${overlayOpacity / 100 * 0.10}) 35%,
              rgba(10,8,6,${overlayOpacity / 100 * 0.25}) 60%,
              rgba(8,6,4,${overlayOpacity / 100 * 0.90}) 100%)`,
          }}
        />

        {/* Color/gradient overlay */}
        {backgroundGradient && resolvedGradientColor1 && resolvedGradientColor2 && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${resolvedGradientColor1} 0%, ${resolvedGradientColor2} 100%)`,
              opacity: 0.5,
            }}
          />
        )}
      </div>

      {/* Content — anchored by textPosition */}
      <div className={`relative z-20 h-full flex flex-col px-8 sm:px-14 md:px-20 ${
        textPosition === 'top' ? 'justify-start pt-20 sm:pt-24' :
        textPosition === 'center' ? 'justify-center' :
        'justify-end pb-12 sm:pb-16'
      }`}>

        {/* Days until — top-right */}
        {showCountdown && wedding.wedding_date && daysUntil > 0 && (
          <div
            className={`absolute top-8 right-8 sm:top-10 sm:right-14 text-right transition-all duration-1000 delay-[200ms] ${envelopeOpened ? 'opacity-100' : 'opacity-0'}`}
          >
            <div
              className="uppercase tracking-[0.35em] font-light"
              style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-heading, serif)', fontSize: 'clamp(0.85rem, 1.5vw, 1.1rem)' }}
            >
              {daysUntil} {daysUntil === 1 ? t('countdown.day') : t('countdown.days')}
            </div>
          </div>
        )}

        {/* Tagline eyebrow */}
        {showTagline && (
          <div
            className={`transition-all duration-1000 delay-[300ms] mb-5 ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <p
              className="text-[18px] uppercase tracking-[0.55em] font-light"
              style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-heading, serif)' }}
            >
              {tagline || t('hero.weInviteYou')}
            </p>
          </div>
        )}

        {/* Partner names — editorial scale via div (avoids global h1 !important overrides) */}
        <div
          className={`transition-all duration-1000 delay-[400ms] ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div
            role="heading"
            aria-level={1}
            style={{
              fontFamily: 'var(--font-display, serif)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(2.8rem, 7vw, 6.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              color: '#FFFFFF',
              textShadow: '0 2px 40px rgba(0,0,0,0.3)',
            }}
          >
            {wedding.partner1_first_name}
            <span
              style={{
                fontFamily: 'inherit',
                fontSize: 'clamp(1.8rem, 4.5vw, 4rem)',
                display: 'inline-block',
                margin: '0 0.3em',
                opacity: 0.7,
              }}
            >
              &
            </span>
            {wedding.partner2_first_name}
          </div>
        </div>

        {/* Hairline */}
        <div
          className={`mt-6 transition-all duration-1000 delay-[600ms] ${envelopeOpened ? 'opacity-100' : 'opacity-0'}`}
          style={{ height: '1px', background: 'rgba(255,255,255,0.25)', maxWidth: '420px' }}
        />

        {/* Date + venue */}
        <div
          className={`mt-5 flex flex-wrap items-center gap-3 transition-all duration-1000 delay-[700ms] ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {formattedDate && (
            <span
              className="text-[16px] sm:text-[16px] uppercase tracking-[0.45em] font-light"
              style={{ color: 'rgba(255,255,255,0.60)', fontFamily: 'var(--font-heading, serif)' }}
            >
              {formattedDate}
            </span>
          )}
          {venueName && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '16px' }}>·</span>
              <span
                className="text-[16px] sm:text-[16px] uppercase tracking-[0.45em] font-light"
                style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-heading, serif)' }}
              >
                {venueName}
              </span>
            </>
          )}
        </div>

        {/* RSVP — text link */}
        {showRSVPButton && weddingNameId && (
          <div
            className={`mt-8 transition-all duration-1000 delay-[900ms] ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <a
              href="#rsvp"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#rsvp')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="group inline-flex items-center gap-4 text-[18px] uppercase tracking-[0.5em] font-light transition-opacity duration-300 hover:opacity-60"
              style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-heading, serif)' }}
            >
              <span>{t('hero.rsvpNow')}</span>
              <span
                className="block h-px w-8 group-hover:w-14 transition-all duration-500"
                style={{ background: 'rgba(255,255,255,0.4)' }}
              />
            </a>
          </div>
        )}
      </div>

    </SectionWrapper>
  )
}

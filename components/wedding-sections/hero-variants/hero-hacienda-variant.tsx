"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'
import { useEnvelope } from '@/components/contexts/envelope-context'
import { ChevronDown } from 'lucide-react'
import { BotanicalCorner, CandleGlow, FloralDivider, SideBorderScrollwork, DetailedBorderDivider, CharroStar, VineAccent } from '../hacienda-ornaments'
import { resolveColor } from '@/lib/color-utils'
import { calculateDaysUntilWedding } from '@/lib/wedding-utils-client'
import { useI18n } from '@/components/contexts/i18n-context'

interface HeroHaciendaVariantProps extends BaseHeroProps {
  overlayOpacity?: number
  imageBrightness?: number
  backgroundGradient?: boolean
  gradientColor1?: string
  gradientColor2?: string
  taglineTopPadding?: number
  taglineFontSize?: string
}

export function HeroHaciendaVariant({
  wedding, dateId, weddingNameId, theme, alignment,
  showTagline = true, tagline, showCountdown = true, showRSVPButton = true,
  heroImageUrl, overlayOpacity = 55, imageBrightness = 80,
  backgroundGradient = false, gradientColor1, gradientColor2,
  taglineTopPadding = 0, taglineFontSize = 'sm',
}: HeroHaciendaVariantProps) {
  const { isOpened: envelopeOpened } = useEnvelope()
  const { t } = useI18n()
  const accent = theme?.colors?.accent || '#C0A882'
  const primary = theme?.colors?.primary || '#2D4A32'
  const [scrollY, setScrollY] = useState(0)
  const daysUntil = calculateDaysUntilWedding(wedding.wedding_date)
  const resolvedGradientColor1 = resolveColor(gradientColor1, theme)
  const resolvedGradientColor2 = resolveColor(gradientColor2, theme)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <SectionWrapper
      theme={{ ...theme, spacing: { section: 'p-0', container: 'w-full max-w-none h-full' } }}
      alignment={alignment} background="primary"
      className="h-[100dvh] max-h-[100dvh] relative overflow-hidden" id="hero"
    >
      {/* Background with parallax */}
      <div className="absolute inset-0 w-full z-0"
        style={{ height: '120%', top: '-10%', transform: `translateY(${scrollY * 0.12}px)` }}>
        {heroImageUrl && (
          <Image src={heroImageUrl} alt="Wedding hero" fill className="object-cover"
            style={{ filter: `brightness(${imageBrightness}%)` }} priority sizes="100vw" />
        )}
        {/* Warm cinematic overlay */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg,
            rgba(15,12,8,${overlayOpacity / 100 * 0.92}) 0%,
            rgba(35,28,16,${overlayOpacity / 100 * 0.5}) 30%,
            rgba(30,24,14,${overlayOpacity / 100 * 0.35}) 55%,
            rgba(20,16,10,${overlayOpacity / 100 * 0.5}) 75%,
            rgba(12,10,6,${overlayOpacity / 100 * 0.9}) 100%)`,
        }} />
        {/* Color / gradient overlay */}
        {backgroundGradient && resolvedGradientColor1 && resolvedGradientColor2 ? (
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, ${resolvedGradientColor1} 0%, ${resolvedGradientColor2} 100%)`,
            opacity: 0.55,
          }} />
        ) : null}
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 25%, rgba(15,12,8,${overlayOpacity / 100 * 0.55}) 100%)` }} />
      </div>



      {/* Warm glows */}
      <div className={`absolute inset-0 z-[2] pointer-events-none transition-opacity duration-1500 ${envelopeOpened ? 'delay-500' : 'opacity-0'}`}
        style={{ opacity: envelopeOpened ? overlayOpacity / 100 : 0 }}>
        <CandleGlow position="top-left" intensity="medium" />
        <CandleGlow position="top-right" intensity="medium" />
        <CandleGlow position="center" intensity="strong" />
      </div>

      {/* Floating particles */}
      <div className={`absolute inset-0 z-[3] pointer-events-none transition-opacity duration-2000 ${envelopeOpened ? 'delay-1000' : 'opacity-0'}`}
        style={{ opacity: envelopeOpened ? overlayOpacity / 100 : 0 }}>
        {[
          { top: '12%', left: '15%', size: 3, delay: '0s', dur: '6s' },
          { top: '20%', left: '78%', size: 2.5, delay: '1.5s', dur: '7s' },
          { top: '35%', left: '88%', size: 2, delay: '3s', dur: '5s' },
          { top: '65%', left: '8%', size: 2.5, delay: '2s', dur: '8s' },
          { top: '75%', left: '70%', size: 3, delay: '4s', dur: '6s' },
          { top: '45%', left: '92%', size: 2, delay: '1s', dur: '7s' },
          { top: '85%', left: '25%', size: 2, delay: '3.5s', dur: '5.5s' },
        ].map((p, i) => (
          <div key={i} className="absolute rounded-full" style={{
            top: p.top, left: p.left, width: p.size, height: p.size,
            backgroundColor: accent, opacity: 0.3,
            animation: `haciendaFloat ${p.dur} ease-in-out infinite`, animationDelay: p.delay,
            boxShadow: `0 0 ${p.size * 3}px ${accent}40`,
          }} />
        ))}
        <style>{`
          @keyframes haciendaFloat {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
            50% { transform: translateY(-12px) scale(1.3); opacity: 0.45; }
          }
        `}</style>
      </div>

      {/* === BOTANICAL CORNER SPRAYS === */}
      <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ${envelopeOpened ? 'opacity-100 delay-500' : 'opacity-0'}`}
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}>
        <BotanicalCorner position="top-left" color={accent} size="sm" />
        <BotanicalCorner position="top-right" color={accent} size="sm" />
        <BotanicalCorner position="bottom-left" color={accent} size="sm" />
        <BotanicalCorner position="bottom-right" color={accent} size="sm" />
      </div>



      {/* Side border scrollwork — hidden on mobile */}
      <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1200 hidden sm:block ${envelopeOpened ? 'opacity-100 delay-800' : 'opacity-0'}`}
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}>
        <SideBorderScrollwork color={accent} side="left" />
        <SideBorderScrollwork color={accent} side="right" />
      </div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-6 sm:px-8 flex flex-col items-center justify-center h-full">
        {/* Hacienda-styled countdown */}
        {showCountdown && wedding.wedding_date && daysUntil > 0 && (
          <div className={`transition-all duration-700 delay-[400ms] mb-4 sm:mb-5 ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <VineAccent color={accent} flip className="!w-8 sm:!w-12 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" />
              <div className="text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl font-light tabular-nums leading-none"
                  style={{
                    color: '#FFFFFF', fontFamily: 'var(--font-heading, serif)',
                    textShadow: `0 0 30px ${accent}60, 0 0 60px ${accent}30, 0 2px 12px rgba(0,0,0,0.5)`,
                  }}>
                  {daysUntil}
                </div>
                <div className="mt-1.5 text-[10px] sm:text-xs uppercase tracking-[0.35em] font-medium"
                  style={{ color: '#FFFFFF', fontFamily: 'var(--font-heading, serif)',
                    textShadow: `0 0 20px ${accent}50, 0 1px 4px rgba(0,0,0,0.5)` }}>
                  {daysUntil === 1 ? t('countdown.day') : t('countdown.days')} {t('hero.untilBigDay')}
                </div>
              </div>
              <VineAccent color={accent} className="!w-8 sm:!w-12 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" />
            </div>
          </div>
        )}
        {showCountdown && wedding.wedding_date && daysUntil === 0 && (
          <div className={`transition-all duration-700 delay-[400ms] mb-4 sm:mb-5 ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <VineAccent color={accent} flip className="!w-8 sm:!w-12" />
              <span className="text-sm sm:text-base uppercase tracking-[0.3em] font-medium"
                style={{ color: '#FFFFFF', fontFamily: 'var(--font-heading, serif)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                {t('hero.todayIsTheDay')}
              </span>
              <VineAccent color={accent} className="!w-8 sm:!w-12" />
            </div>
          </div>
        )}

        {/* Divider between countdown and names */}
        <div className={`w-full transition-all duration-700 delay-[700ms] ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <DetailedBorderDivider color={accent} className="mb-4 sm:mb-5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] !max-w-[160px] sm:!max-w-sm" />
        </div>

        <HeroTextContent
          wedding={wedding} dateId={dateId} weddingNameId={weddingNameId}
          theme={theme} alignment={alignment}
          showTagline={false}
          showCountdown={false} showRSVPButton={false} isOverlay={true}
        />

        {/* Lema / Tagline - hacienda style */}
        {showTagline && tagline && (
          <div
            className={`transition-all duration-700 delay-[1100ms] ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} text-center w-full`}
            style={{ paddingTop: taglineTopPadding ? `${taglineTopPadding}px` : undefined }}
          >
            <p
              className={`font-light tracking-[0.2em] uppercase whitespace-pre-line text-${taglineFontSize}`}
              style={{
                color: `${accent}CC`,
                fontFamily: 'var(--font-heading, serif)',
                textShadow: `0 0 20px ${accent}40, 0 1px 4px rgba(0,0,0,0.4)`,
              }}
            >
              {tagline}
            </p>
          </div>
        )}

        {/* Floral divider above RSVP */}
        {showRSVPButton && weddingNameId && (
          <div className={`transition-all duration-700 delay-[1500ms] ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <FloralDivider color={accent} className="mb-6 sm:mb-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" />
          </div>
        )}

        {/* RSVP CTA */}
        {showRSVPButton && weddingNameId && (
          <div className={`transition-all duration-700 delay-[1800ms] ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <a href="#rsvp"
              onClick={(e) => { e.preventDefault(); document.querySelector('#rsvp')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="group/btn relative inline-block px-12 sm:px-16 py-3.5 sm:py-4 text-[11px] sm:text-xs uppercase tracking-[0.4em] transition-all duration-500 active:scale-[0.98] backdrop-blur-sm overflow-hidden"
              style={{
                color: '#FFFFFF', border: `1.5px solid ${accent}80`,
                fontFamily: 'var(--font-heading, serif)',
                background: `linear-gradient(180deg, ${accent}18 0%, transparent 50%, ${accent}10 100%)`,
                boxShadow: `inset 0 1px 0 ${accent}30, 0 0 20px ${accent}15`,
                textShadow: `0 0 12px ${accent}40`,
              }}>
              {/* Hover fill layer */}
              <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-400" style={{ background: `${accent}` }} />
              <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t border-l transition-all duration-300 group-hover/btn:w-5 group-hover/btn:h-5" style={{ borderColor: `${accent}90` }} />
              <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t border-r transition-all duration-300 group-hover/btn:w-5 group-hover/btn:h-5" style={{ borderColor: `${accent}90` }} />
              <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b border-l transition-all duration-300 group-hover/btn:w-5 group-hover/btn:h-5" style={{ borderColor: `${accent}90` }} />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b border-r transition-all duration-300 group-hover/btn:w-5 group-hover/btn:h-5" style={{ borderColor: `${accent}90` }} />
              <span className="relative z-10" style={{ color: 'inherit', textShadow: 'inherit' }}>{t('hero.rsvpNow')}</span>
            </a>
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className={`absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-20 transition-all duration-700 delay-[2200ms] ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <a href="#countdown"
          onClick={(e) => { e.preventDefault(); document.querySelector('#countdown')?.scrollIntoView({ behavior: 'smooth' }) }}
          className="flex flex-col items-center cursor-pointer" style={{ color: `${accent}70` }}>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </a>
      </div>
    </SectionWrapper>
  )
}

"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'
import { useEnvelope } from '@/components/contexts/envelope-context'
import { ChevronDown } from 'lucide-react'
import { BotanicalCorner, CandleGlow, FloralDivider, SideBorderScrollwork, DetailedBorderDivider } from '../hacienda-ornaments'
import { resolveColor } from '@/lib/color-utils'

interface HeroHaciendaVariantProps extends BaseHeroProps {
  overlayOpacity?: number
  imageBrightness?: number
  backgroundGradient?: boolean
  gradientColor1?: string
  gradientColor2?: string
}

export function HeroHaciendaVariant({
  wedding, dateId, weddingNameId, theme, alignment,
  showTagline = true, tagline, showCountdown = true, showRSVPButton = true,
  heroImageUrl, overlayOpacity = 55, imageBrightness = 80,
  backgroundGradient = false, gradientColor1, gradientColor2,
}: HeroHaciendaVariantProps) {
  const { isOpened: envelopeOpened } = useEnvelope()
  const accent = theme?.colors?.accent || '#C0A882'
  const primary = theme?.colors?.primary || '#2D4A32'
  const [scrollY, setScrollY] = useState(0)
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
      <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ${envelopeOpened ? 'opacity-100 delay-500' : 'opacity-0'}`}>
        <BotanicalCorner position="top-left" color={accent} size="sm" />
        <BotanicalCorner position="top-right" color={accent} size="sm" />
        <BotanicalCorner position="bottom-left" color={accent} size="sm" />
        <BotanicalCorner position="bottom-right" color={accent} size="sm" />
      </div>

      {/* Border frame */}
      <div className={`absolute inset-4 sm:inset-8 md:inset-12 z-10 pointer-events-none transition-opacity duration-1000 ${envelopeOpened ? 'opacity-100 delay-700' : 'opacity-0'}`}>
        <div className="absolute inset-0" style={{ border: `1.5px solid ${accent}90` }} />
        <div className="absolute inset-2" style={{ border: `1px solid ${accent}50` }} />
        <div className="absolute inset-3.5" style={{ border: `1px solid ${accent}30` }} />
        {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2`}>
            <div className="w-full h-full rounded-full" style={{ backgroundColor: accent, opacity: 0.8 }} />
          </div>
        ))}
      </div>

      {/* Side border scrollwork */}
      <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1200 ${envelopeOpened ? 'opacity-100 delay-800' : 'opacity-0'}`}>
        <SideBorderScrollwork color={accent} side="left" />
        <SideBorderScrollwork color={accent} side="right" />
      </div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-6 sm:px-8 flex flex-col items-center justify-center h-full">
        {/* Asset 5 above the names */}
        <div className={`w-full transition-all duration-700 delay-[700ms] ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <DetailedBorderDivider color={accent} className="mb-4 sm:mb-5" />
        </div>
        <HeroTextContent
          wedding={wedding} dateId={dateId} weddingNameId={weddingNameId}
          theme={theme} alignment={alignment}
          showTagline={showTagline} tagline={tagline}
          showCountdown={showCountdown} showRSVPButton={false} isOverlay={true}
        />

        {/* Floral divider above RSVP */}
        {showRSVPButton && weddingNameId && (
          <div className={`transition-all duration-700 delay-[1500ms] ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <FloralDivider color={accent} className="mb-6 sm:mb-8" />
          </div>
        )}

        {/* RSVP CTA */}
        {showRSVPButton && weddingNameId && (
          <div className={`transition-all duration-700 delay-[1800ms] ${envelopeOpened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <a href="#rsvp"
              onClick={(e) => { e.preventDefault(); document.querySelector('#rsvp')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="group relative inline-block px-12 sm:px-16 py-3 sm:py-3.5 text-[11px] sm:text-xs uppercase tracking-[0.4em] font-medium transition-all duration-500 hover:shadow-[0_0_30px_rgba(192,168,130,0.15)] active:scale-[0.98]"
              style={{
                color: accent, border: `1.5px solid ${accent}60`,
                fontFamily: 'var(--font-heading, serif)',
                background: `linear-gradient(135deg, rgba(192,168,130,0.05) 0%, rgba(192,168,130,0.12) 100%)`,
              }}>
              <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 transition-all duration-300 group-hover:w-5 group-hover:h-5" style={{ borderColor: accent }} />
              <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 transition-all duration-300 group-hover:w-5 group-hover:h-5" style={{ borderColor: accent }} />
              <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 transition-all duration-300 group-hover:w-5 group-hover:h-5" style={{ borderColor: accent }} />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 transition-all duration-300 group-hover:w-5 group-hover:h-5" style={{ borderColor: accent }} />
              RSVP
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

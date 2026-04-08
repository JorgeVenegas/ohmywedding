"use client"

import React, { useState } from 'react'
import { ExternalLink, Gift, Heart } from 'lucide-react'
import { BaseRegistryProps, getColorScheme, getProviderLogoUrl, RegistryProvider } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { getWeddingPath } from '@/lib/wedding-url'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import Link from 'next/link'
import {
  HaciendaSectionTitle, HaciendaTilePattern, CandleGlow,
  IronLineDivider, OrnateCorner, BotanicalCorner, SideBorderScrollwork,
} from '../hacienda-ornaments'

interface RegistryHaciendaItemProps {
  registry: RegistryProvider
  index: number
  onNoUrl: () => void
  cardBg: string
  cardBorder: string
  primary: string
  secondary: string
  accent: string
  titleColor: string
  mutedTextColor: string
  showDescription: boolean
}

function RegistryHaciendaItem({ registry, index, onNoUrl, cardBg, cardBorder, primary, secondary, accent, titleColor, mutedTextColor, showDescription }: RegistryHaciendaItemProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false })
  const { t } = useI18n()
  const hasUrl = registry.url && registry.url.trim() !== ''

  return (
    <div
      ref={ref}
      className={`relative w-full h-full transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: isVisible ? `${index * 120}ms` : '0ms' }}
    >
      {/* Main card */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg h-full flex flex-col border"
        style={{ backgroundColor: cardBg, borderColor: `${accent}30` }}>
        {/* Ornate corners */}
        <OrnateCorner position="top-left" color={`${accent}40`} size="sm" />
        <OrnateCorner position="top-right" color={`${accent}40`} size="sm" />
        <OrnateCorner position="bottom-left" color={`${accent}30`} size="sm" />
        <OrnateCorner position="bottom-right" color={`${accent}30`} size="sm" />
        {/* Warm glow */}
        <CandleGlow position="center" intensity="subtle" />

        {/* Banner accent */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}60, ${primary}40, ${accent}60, transparent)` }} />

        <div className="relative z-10 p-7 sm:p-9 text-center flex-1 flex flex-col justify-center">
          {/* Provider logo */}
          <div className="mb-5 relative inline-block mx-auto">
            <div className="absolute -inset-3 rounded-full" style={{ border: `1px solid ${accent}20` }} />
            <div className="h-18 sm:h-22 flex items-center justify-center">
              <img src={getProviderLogoUrl(registry)} alt={registry.name}
                className="max-h-14 sm:max-h-18 max-w-[130px] sm:max-w-[150px] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.parentElement!.innerHTML = `<span class="text-4xl font-light" style="color: ${accent}; font-family: var(--font-display, cursive)">${registry.name.charAt(0)}</span>`
                }} />
            </div>
          </div>

          {/* Divider */}
          <IronLineDivider color={accent} />

          <h3 className="text-lg sm:text-xl font-light mb-2 tracking-wide mt-3"
            style={{ color: titleColor, fontFamily: 'var(--font-heading, serif)' }}>
            {registry.name}
          </h3>

          {showDescription && registry.description && (
            <p className="text-sm mb-5 font-light italic line-clamp-2 px-3" style={{ color: mutedTextColor }}>{registry.description}</p>
          )}

          <div className="flex justify-center mt-auto pt-4">
            {hasUrl ? (
              <a href={registry.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-light tracking-[0.15em] uppercase transition-all duration-300 hover:shadow-lg hover:opacity-90 border"
                style={{ backgroundColor: 'transparent', borderColor: `${accent}60`, color: accent }}>
                {t('registry.visitRegistry')}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button onClick={onNoUrl}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-light tracking-[0.15em] uppercase transition-all duration-300 hover:shadow-lg hover:opacity-90 border"
                style={{ backgroundColor: 'transparent', borderColor: `${accent}60`, color: accent }}>
                {t('registry.visitRegistry')}
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function RegistryHaciendaVariant({
  theme, sectionTitle, sectionSubtitle, message,
  registries = [], showCustomRegistry = false, customItems = [],
  showDescription = true, useColorBackground = false,
  backgroundColorChoice = 'none', weddingNameId,
}: BaseRegistryProps) {
  const [showAlert, setShowAlert] = useState(false)
  const colorScheme = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const { bgColor, cardBorder, isColored } = colorScheme
  const primary = colorScheme.primary || theme?.colors?.primary || '#2D4A32'
  const secondary = colorScheme.secondary || theme?.colors?.secondary || '#FAF6EF'
  const accent = colorScheme.accent || theme?.colors?.accent || '#C0A882'
  const { t } = useI18n()

  // Gold/accent and secondary bgs need dark text for contrast
  const isAccentBg = backgroundColorChoice === 'accent' || backgroundColorChoice === 'accent-light' || backgroundColorChoice === 'accent-lighter'
  const isSecondaryBg = backgroundColorChoice === 'secondary' || backgroundColorChoice === 'secondary-light' || backgroundColorChoice === 'secondary-lighter'
  const needsDarkText = isColored && (isAccentBg || isSecondaryBg)

  const titleColor = needsDarkText ? primary : colorScheme.titleColor
  const subtitleColor = needsDarkText ? `${primary}99` : colorScheme.subtitleColor
  const bodyTextColor = needsDarkText ? primary : colorScheme.bodyTextColor
  const mutedTextColor = needsDarkText ? `${primary}80` : colorScheme.mutedTextColor
  const cardBg = needsDarkText ? `${secondary}CC` : colorScheme.cardBg

  const title = sectionTitle || t('registry.title')
  const subtitle = sectionSubtitle || t('registry.subtitle')
  const messageText = message || t('registry.message')

  const hasRegistries = registries.length > 0
  const hasCustomRegistry = showCustomRegistry && !!weddingNameId

  return (
    <section id="registry" className="w-full py-16 sm:py-20 md:py-24 relative overflow-hidden"
      style={{ backgroundColor: isColored ? bgColor : secondary }}>
      <HaciendaTilePattern color={primary} opacity={0.05} />
      <CandleGlow position="top" intensity="subtle" />
      <BotanicalCorner position="top-left" color={`${accent}60`} size="sm" />
      <BotanicalCorner position="bottom-right" color={`${accent}60`} size="sm" />
      <BotanicalCorner position="top-right" color={`${accent}45`} size="sm" />
      <BotanicalCorner position="bottom-left" color={`${accent}45`} size="sm" />
      <SideBorderScrollwork color={`${accent}50`} side="left" />
      <SideBorderScrollwork color={`${accent}50`} side="right" />

      <div className="max-w-4xl mx-auto px-6 sm:px-8 md:px-10 relative z-10">
        {/* Section header */}
        <div className="mb-6 sm:mb-10 text-center">
          <HaciendaSectionTitle title={title} titleColor={titleColor} subtitleColor={subtitleColor} accentColor={accent} />
          <p className="text-base sm:text-lg font-light italic max-w-xl mx-auto mt-3"
            style={{ color: subtitleColor, fontFamily: 'var(--font-body, sans-serif)' }}>
            {subtitle}
          </p>
        </div>

        {/* Message */}
        {messageText && (
          <div className="mb-8 p-6 sm:p-8 rounded-2xl text-center relative border"
            style={{
              backgroundColor: isColored ? 'rgba(255,255,255,0.1)' : `${secondary}`,
              borderColor: `${accent}20`,
            }}>
            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t border-l" style={{ borderColor: `${accent}40` }} />
            <div className="absolute top-2 right-2 w-4 h-4 border-t border-r" style={{ borderColor: `${accent}40` }} />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l" style={{ borderColor: `${accent}30` }} />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r" style={{ borderColor: `${accent}30` }} />
            <p className="text-base sm:text-lg italic font-light" style={{ color: bodyTextColor }}>
              &ldquo;{messageText}&rdquo;
            </p>
          </div>
        )}

        {/* Registry grid */}
        {!hasRegistries && !hasCustomRegistry ? (
          <div className="text-center py-14 px-8 rounded-2xl border border-dashed"
            style={{ borderColor: `${accent}30`, backgroundColor: isColored ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
            <Gift className="w-12 h-12 mx-auto mb-4 opacity-25" style={{ color: accent }} />
            <p className="text-base font-light" style={{ color: mutedTextColor }}>{t('registry.noRegistriesYet')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto [&>*:last-child:nth-child(odd)]:md:col-span-2 [&>*:last-child:nth-child(odd)]:md:max-w-lg [&>*:last-child:nth-child(odd)]:md:mx-auto">
            {registries.map((registry, index) => (
              <RegistryHaciendaItem
                key={registry.id} registry={registry} index={index}
                onNoUrl={() => setShowAlert(true)}
                cardBg={cardBg} cardBorder={cardBorder} primary={primary}
                secondary={secondary} accent={accent} titleColor={titleColor}
                mutedTextColor={mutedTextColor} showDescription={showDescription}
              />
            ))}

            {/* Custom Registry Card */}
            {showCustomRegistry && weddingNameId && (
              <div className="relative w-full h-full">
                <Link href={getWeddingPath(weddingNameId, '/registry')}
                  className="block relative rounded-2xl overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-2xl h-full border"
                  style={{ backgroundColor: cardBg, borderColor: `${accent}30` }}>
                  <OrnateCorner position="top-left" color={`${accent}40`} size="sm" />
                  <OrnateCorner position="top-right" color={`${accent}40`} size="sm" />
                  <OrnateCorner position="bottom-left" color={`${accent}30`} size="sm" />
                  <OrnateCorner position="bottom-right" color={`${accent}30`} size="sm" />
                  <CandleGlow position="center" intensity="subtle" />
                  <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}60, ${primary}40, ${accent}60, transparent)` }} />
                  <div className="relative z-10 p-8 sm:p-10 text-center">
                    <div className="mb-5 relative inline-block">
                      <div className="absolute -inset-3 rounded-full" style={{ border: `1px solid ${accent}20` }} />
                      <div className="h-18 sm:h-22 flex items-center justify-center">
                        <Heart className="w-14 h-14 sm:w-16 sm:h-16" style={{ color: accent }} fill={accent} />
                      </div>
                    </div>
                    <IronLineDivider color={accent} />
                    <h3 className="text-lg sm:text-xl font-light mb-2 tracking-wide mt-3"
                      style={{ color: titleColor, fontFamily: 'var(--font-heading, serif)' }}>
                      {t('registry.customTitle') || 'Our Custom Registry'}
                    </h3>
                    {showDescription && (
                      <p className="text-sm mb-5 font-light italic line-clamp-2 px-3" style={{ color: mutedTextColor }}>
                        {t('registry.customDescription') || 'Support our special experiences and dreams'}
                      </p>
                    )}
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-light tracking-[0.15em] uppercase transition-all duration-300 hover:shadow-lg hover:opacity-90 border"
                        style={{ backgroundColor: 'transparent', borderColor: `${accent}60`, color: accent }}>
                        {t('registry.visitRegistry')}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

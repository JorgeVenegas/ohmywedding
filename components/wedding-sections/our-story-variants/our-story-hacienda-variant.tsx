"use client"

import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { AnimatedSection } from '../animated-section'
import { BaseOurStoryProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import {
  BaroqueFrame, BotanicalCorner, FloralDivider, SideBorderScrollwork,
  CandleGlow, HaciendaSectionTitle,
  DecorativeQuoteBlock,
} from '../hacienda-ornaments'

export function OurStoryHaciendaVariant({
  theme, alignment, sectionTitle, sectionSubtitle,
  showHowWeMet = true, showProposal = true,
  showHowWeMetPhoto = true, showProposalPhoto = true,
  howWeMetText, howWeMetPhoto, proposalText, proposalPhoto,
  useColorBackground, backgroundColorChoice,
}: BaseOurStoryProps) {
  const { t } = useI18n()
  const { bgColor, titleColor, subtitleColor, sectionTextColor, isColored } = getColorScheme(
    theme, backgroundColorChoice, useColorBackground
  )

  const primary = theme?.colors?.primary || '#2D4A32'
  const accent = theme?.colors?.accent || '#C0A882'
  const secondary = theme?.colors?.secondary || '#FAF6EF'

  const title = sectionTitle || t('ourStory.title')
  const subtitle = sectionSubtitle || t('ourStory.subtitle')
  // Gold/accent and secondary bgs need dark text for contrast
  const isAccentBg = backgroundColorChoice === 'accent' || backgroundColorChoice === 'accent-light' || backgroundColorChoice === 'accent-lighter'
  const isSecondaryBg = backgroundColorChoice === 'secondary' || backgroundColorChoice === 'secondary-light' || backgroundColorChoice === 'secondary-lighter'
  const needsDarkText = isColored && (isAccentBg || isSecondaryBg)
  const renderTextColor = needsDarkText ? primary : (isColored ? (sectionTextColor || primary) : (theme?.colors?.foreground || '#374151'))
  const renderTitleColor = needsDarkText ? primary : (isColored ? (titleColor || primary) : primary)

  return (
    <SectionWrapper
      theme={isColored ? undefined : theme} alignment={alignment}
      background={isColored ? 'default' : 'default'} id="our-story"
      style={{ backgroundColor: isColored ? bgColor : secondary }}
    >
      {/* Rich background layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <CandleGlow position="top-right" intensity="medium" />
        <CandleGlow position="bottom" intensity="medium" />
        {/* LARGE botanical corners — visible like reference */}
        <BotanicalCorner position="top-left" color={`${accent}60`} size="sm" />
        <BotanicalCorner position="bottom-right" color={`${accent}60`} size="sm" />
        <BotanicalCorner position="top-right" color={`${accent}45`} size="sm" />
        <BotanicalCorner position="bottom-left" color={`${accent}45`} size="sm" />
        <SideBorderScrollwork color={`${accent}42`} side="left" />
        <SideBorderScrollwork color={`${accent}42`} side="right" />
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 md:px-10 relative z-10">
        {/* Section title */}
        <AnimatedSection className="mb-14 sm:mb-20">
          <HaciendaSectionTitle
            title={title} subtitle={subtitle}
            titleColor={renderTitleColor}
            subtitleColor={needsDarkText ? `${primary}99` : (isColored ? (subtitleColor || accent) : accent)}
            accentColor={needsDarkText ? primary : accent}
          />
        </AnimatedSection>

        {/* === HOW WE MET — Text first, then photo (mobile: text, photo; desktop: text left, photo right) === */}
        {showHowWeMet && (
          <AnimatedSection delay={200} className="mb-24 sm:mb-32">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
              {/* Text content */}
              <div className={`${showHowWeMetPhoto && howWeMetPhoto ? 'md:col-span-6' : 'md:col-span-12'} space-y-5 order-1`}>
                <h3 className="text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.06em]"
                  style={{ fontFamily: 'var(--font-heading, serif)', color: renderTitleColor, fontWeight: 400, letterSpacing: '0.04em' }}>
                  {t('ourStory.howWeMet')}
                </h3>
                <div className="w-28 sm:w-32">
                  <svg viewBox="0 0 100 12" fill="none" className="w-full">
                    <line x1="0" y1="6" x2="30" y2="6" stroke={accent} strokeWidth="0.8" opacity="0.4" />
                    <path d="M30 6 C35 6, 37 2, 42 2 C47 2, 49 6, 50 6 C51 6, 53 10, 58 10 C63 10, 65 6, 70 6"
                      stroke={accent} strokeWidth="1" fill="none" opacity="0.6" />
                    <line x1="70" y1="6" x2="100" y2="6" stroke={accent} strokeWidth="0.8" opacity="0.4" />
                    <circle cx="50" cy="6" r="2" fill={accent} opacity="0.4" />
                  </svg>
                </div>

                <DecorativeQuoteBlock color={accent} bgColor={`${accent}06`}>
                  <div className="text-sm sm:text-base leading-[1.9] font-light whitespace-pre-line"
                    style={{ color: renderTextColor, fontFamily: 'var(--font-body, sans-serif)' }}>
                    {howWeMetText || t('ourStory.howWeMetPlaceholder')}
                  </div>
                </DecorativeQuoteBlock>
              </div>

              {/* Photo in Baroque frame */}
              {showHowWeMetPhoto && howWeMetPhoto && (
                <div className="md:col-span-6 order-2">
                  <BaroqueFrame color={accent} showTop={false} showBottom={false}>
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image src={howWeMetPhoto} alt="How we met" fill
                        className="object-cover" sizes="(max-width: 768px) 90vw, 40vw" priority />
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ boxShadow: `inset 0 0 80px rgba(0,0,0,0.12)` }} />
                    </div>
                  </BaroqueFrame>
                </div>
              )}
            </div>
          </AnimatedSection>
        )}

        {/* === THE PROPOSAL — Text first, then photo (mobile: text, photo; desktop: photo left, text right) === */}
        {showProposal && (
          <AnimatedSection delay={400}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
              {/* Text content — on mobile comes first (order-1), on desktop goes right (md:order-2) */}
              <div className={`${showProposalPhoto && proposalPhoto ? 'md:col-span-6 md:order-2' : 'md:col-span-12'} space-y-5 order-1`}>
                <h3 className="text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.06em]"
                  style={{ fontFamily: 'var(--font-heading, serif)', color: renderTitleColor, fontWeight: 400, letterSpacing: '0.04em' }}>
                  {t('ourStory.proposal')}
                </h3>
                <div className="w-28 sm:w-32">
                  <svg viewBox="0 0 100 12" fill="none" className="w-full">
                    <line x1="0" y1="6" x2="30" y2="6" stroke={accent} strokeWidth="0.8" opacity="0.4" />
                    <path d="M30 6 C35 6, 37 2, 42 2 C47 2, 49 6, 50 6 C51 6, 53 10, 58 10 C63 10, 65 6, 70 6"
                      stroke={accent} strokeWidth="1" fill="none" opacity="0.6" />
                    <line x1="70" y1="6" x2="100" y2="6" stroke={accent} strokeWidth="0.8" opacity="0.4" />
                    <circle cx="50" cy="6" r="2" fill={accent} opacity="0.4" />
                  </svg>
                </div>

                <DecorativeQuoteBlock color={accent} bgColor={`${accent}06`}>
                  <div className="text-sm sm:text-base leading-[1.9] font-light whitespace-pre-line"
                    style={{ color: renderTextColor, fontFamily: 'var(--font-body, sans-serif)' }}>
                    {proposalText || t('ourStory.proposalPlaceholder')}
                  </div>
                </DecorativeQuoteBlock>
              </div>

              {/* Photo in Baroque frame — on mobile comes second (order-2), on desktop goes left (md:order-1) */}
              {showProposalPhoto && proposalPhoto && (
                <div className="md:col-span-6 md:order-1 order-2">
                  <BaroqueFrame color={accent} showTop={false} showBottom={false}>
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image src={proposalPhoto} alt="The proposal" fill
                        className="object-cover" sizes="(max-width: 768px) 90vw, 40vw" />
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ boxShadow: `inset 0 0 80px rgba(0,0,0,0.12)` }} />
                    </div>
                  </BaroqueFrame>
                </div>
              )}
            </div>
          </AnimatedSection>
        )}

        {/* Bottom floral divider */}
        <div className="mt-16 sm:mt-20">
          <FloralDivider color={`${accent}50`} />
        </div>
      </div>
    </SectionWrapper>
  )
}

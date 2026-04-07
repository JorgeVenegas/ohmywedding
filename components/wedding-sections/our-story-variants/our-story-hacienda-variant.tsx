"use client"

import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { AnimatedSection } from '../animated-section'
import { BaseOurStoryProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import {
  BaroqueFrame, BotanicalCorner, FloralDivider,
  HaciendaTilePattern, CandleGlow, HaciendaSectionTitle,
  ScrapbookPhoto, GoldTapeAccent, DecorativeQuoteBlock, TornPaperEdge,
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
        <HaciendaTilePattern color={isColored ? secondary : primary} opacity={0.025} />
        <CandleGlow position="top-right" intensity="medium" />
        <CandleGlow position="bottom" intensity="medium" />
        {/* LARGE botanical corners — visible like reference */}
        <BotanicalCorner position="top-left" color={`${accent}30`} size="lg" />
        <BotanicalCorner position="bottom-right" color={`${accent}30`} size="lg" />
        <BotanicalCorner position="top-right" color={`${accent}20`} size="md" />
        <BotanicalCorner position="bottom-left" color={`${accent}20`} size="md" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section title */}
        <AnimatedSection className="mb-14 sm:mb-20">
          <HaciendaSectionTitle
            title={title} subtitle={subtitle}
            titleColor={renderTitleColor}
            subtitleColor={needsDarkText ? `${primary}99` : (isColored ? (subtitleColor || accent) : accent)}
            accentColor={needsDarkText ? primary : accent}
          />
        </AnimatedSection>

        {/* === HOW WE MET — Text left, Baroque-framed photo right with scrapbook accent === */}
        {showHowWeMet && (
          <AnimatedSection delay={200} className="mb-24 sm:mb-32">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
              {/* Left: Text content */}
              <div className={`${showHowWeMetPhoto && howWeMetPhoto ? 'md:col-span-6 md:order-1' : 'md:col-span-12'} space-y-5`}>
                <h3 className="text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.06em]"
                  style={{ fontFamily: 'var(--font-heading, serif)', color: renderTitleColor, fontWeight: 400, letterSpacing: '0.04em' }}>
                  {t('ourStory.howWeMet')}
                </h3>
                {/* Ornate scrollwork accent */}
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

              {/* Right: Photo composition — Baroque frame + scrapbook accent */}
              {showHowWeMetPhoto && howWeMetPhoto && (
                <div className="md:col-span-6 md:order-2 relative mt-8 md:mt-0">
                  {/* Main photo in elaborate Baroque frame */}
                  <BaroqueFrame color={accent} className="relative z-10">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image src={howWeMetPhoto} alt="How we met" fill
                        className="object-cover" sizes="(max-width: 768px) 90vw, 40vw" priority />
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ boxShadow: `inset 0 0 80px rgba(0,0,0,0.12)` }} />
                    </div>
                  </BaroqueFrame>

                  {/* Scrapbook accent photo — overlapping, rotated, with tape */}
                  {proposalPhoto && (
                    <div className="absolute -bottom-10 -right-4 sm:-right-10 z-20 w-[42%] sm:w-[40%]">
                      <ScrapbookPhoto rotation={4} accentColor={accent}>
                        <div className="relative aspect-square overflow-hidden">
                          <Image src={proposalPhoto} alt="Detail" fill className="object-cover"
                            sizes="(max-width: 768px) 35vw, 15vw" />
                        </div>
                      </ScrapbookPhoto>
                    </div>
                  )}

                  {/* Background decorative arch outline */}
                  <div className="absolute -bottom-6 -left-6 w-[35%] h-[28%] rounded-t-full border-2 opacity-15 hidden sm:block"
                    style={{ borderColor: accent }} />
                </div>
              )}
            </div>
          </AnimatedSection>
        )}

        {/* === THE PROPOSAL — Photo left with torn edge, text right === */}
        {showProposal && (
          <AnimatedSection delay={400}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
              {/* Left: Photo with torn edge + scrapbook accent */}
              {showProposalPhoto && proposalPhoto && (
                <div className="md:col-span-6 md:order-1 relative">
                  {/* Main photo with torn paper edge */}
                  <TornPaperEdge side="right" bgColor={secondary} className="relative z-10 shadow-xl">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image src={proposalPhoto} alt="The proposal" fill className="object-cover"
                        sizes="(max-width: 768px) 90vw, 40vw" />
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ boxShadow: `inset 0 0 60px rgba(0,0,0,0.1)` }} />
                    </div>
                  </TornPaperEdge>

                  {/* Overlapping scrapbook accent with how-we-met photo */}
                  {howWeMetPhoto && (
                    <div className="absolute -bottom-8 -right-4 sm:-right-8 z-20 w-[38%] sm:w-[36%]">
                      <ScrapbookPhoto rotation={-3} accentColor={accent}>
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image src={howWeMetPhoto} alt="Detail" fill className="object-cover"
                            sizes="(max-width: 768px) 30vw, 12vw" />
                        </div>
                      </ScrapbookPhoto>
                    </div>
                  )}

                  {/* Tape accent on torn photo */}
                  <div className="absolute top-4 left-6 z-20 hidden sm:block">
                    <GoldTapeAccent color={accent} rotation={-12} />
                  </div>
                  <div className="absolute bottom-16 right-8 z-20 hidden sm:block">
                    <GoldTapeAccent color={accent} rotation={8} />
                  </div>
                </div>
              )}

              {/* Right: text content */}
              <div className={`${showProposalPhoto && proposalPhoto ? 'md:col-span-6 md:order-2' : 'md:col-span-12'} space-y-5`}>
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

"use client"

import React from 'react'
import Image from 'next/image'
import { BaseOurStoryProps, getColorScheme } from './types'
import { AnimatedSection } from '../animated-section'
import { useI18n } from '@/components/contexts/i18n-context'

const EDITORIAL_BG = '#F6F1EB'
const EDITORIAL_INK = '#211D1A'
const EDITORIAL_MUTED = '#8A7B6E'
const EDITORIAL_HAIRLINE = 'rgba(33,29,26,0.12)'
const EDITORIAL_GHOST = 'rgba(33,29,26,0.07)'

interface OurStoryOldMoneyVariantProps extends BaseOurStoryProps {
  bgStyle?: string
  accentMetal?: string
  showOrnaments?: boolean
}

export function OurStoryOldMoneyVariant({
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  showHowWeMet = true,
  showProposal = true,
  showPhotos = true,
  showHowWeMetPhoto = false,
  showProposalPhoto = false,
  howWeMetText,
  howWeMetPhoto,
  proposalText,
  proposalPhoto,
  photos = [],
  bgStyle = 'ivory',
  accentMetal = 'gold',
  showOrnaments = true,
  useColorBackground,
  backgroundColorChoice,
}: OurStoryOldMoneyVariantProps) {
  const { t } = useI18n()

  const { bgColor, sectionTextColor, isColored } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const bg = isColored && bgColor ? bgColor : EDITORIAL_BG
  const ink = isColored && sectionTextColor ? sectionTextColor : (theme?.colors?.foreground || EDITORIAL_INK)
  const primary = isColored && sectionTextColor ? sectionTextColor : (theme?.colors?.primary || EDITORIAL_INK)
  const accent = isColored && sectionTextColor ? sectionTextColor : (theme?.colors?.primary || EDITORIAL_MUTED)
  const muted = isColored && sectionTextColor ? sectionTextColor : (theme?.colors?.muted || EDITORIAL_MUTED)
  const mutedSubtle = isColored
    ? (theme?.colors?.secondary || sectionTextColor || EDITORIAL_MUTED)
    : (theme?.colors?.muted || EDITORIAL_MUTED)
  const hairline = isColored && sectionTextColor ? `${sectionTextColor}30` : (theme?.colors?.primary ? `${theme.colors.primary}20` : EDITORIAL_HAIRLINE)
  const ghost = isColored && sectionTextColor ? `${sectionTextColor}08` : (theme?.colors?.primary ? `${theme.colors.primary}10` : EDITORIAL_GHOST)

  const title = sectionTitle || t('ourStory.title')
  const howWeMetBody = howWeMetText || t('ourStory.howWeMetDefault')
  const proposalBody = proposalText || t('ourStory.proposalDefault')

  const paraStyle = {
    fontFamily: 'var(--font-body, sans-serif)',
    fontWeight: 300,
    fontSize: '1rem',
    lineHeight: 1.9,
    color: mutedSubtle,
  }
  const capStyle = {
    fontFamily: 'var(--font-display, serif)',
    fontStyle: 'italic' as const,
    fontWeight: 400,
    fontSize: '3.75em',
    lineHeight: 0.72,
    float: 'left' as const,
    marginRight: '0.1em',
    marginTop: '0.05em',
    color: accent,
  }

  const renderParagraphs = (text: string) =>
    text.split('\n').map((line, i) =>
      line.trim() === '' ? (
        <div key={i} style={{ height: '0.6rem' }} />
      ) : (
        <p key={i} data-custom-font style={paraStyle}>
          <span style={capStyle}>{line.charAt(0)}</span>
          {line.slice(1)}
        </p>
      )
    )

  return (
    <section id="our-story" className="relative overflow-hidden" style={{ backgroundColor: bg }}>

      {/* Section header */}
      <AnimatedSection>
        <div
          className="px-8 sm:px-14 md:px-20"
          style={{ paddingTop: 'clamp(4rem, 8vw, 7rem)', paddingBottom: 'clamp(1rem, 2vw, 2rem)' }}
        >
          {sectionSubtitle && (
            <p
              data-custom-font
              className="uppercase tracking-[0.5em] mb-5"
              style={{ color: mutedSubtle, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '11px' }}
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
              lineHeight: 1.15,
              maxWidth: '18ch',
            }}
          >
            {title}
          </div>
        </div>
      </AnimatedSection>

      {/* Chapter I — How We Met — image left, text right */}
      {showHowWeMet && (
        <AnimatedSection delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {(showHowWeMetPhoto || showPhotos) && howWeMetPhoto ? (
              <div
                className="relative overflow-hidden order-2 md:order-1"
                style={{ height: 'clamp(380px, 55vw, 620px)' }}
              >
                <Image
                  src={howWeMetPhoto}
                  alt={t('ourStory.howWeMet')}
                  fill
                  className="object-cover"
                  style={{ filter: 'brightness(0.95) sepia(0.05)' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div
                  className="absolute inset-0 pointer-events-none hidden md:block"
                  style={{ background: `linear-gradient(to right, transparent 70%, ${bg} 100%)` }}
                />
              </div>
            ) : (
              <div className="order-2 md:order-1" style={{ height: 'clamp(380px, 55vw, 620px)', background: `${ink}05` }} />
            )}

            <div
              className="order-1 md:order-2 flex flex-col justify-center px-8 sm:px-14 md:pl-16 md:pr-20"
              style={{ paddingTop: 'clamp(1.5rem, 3vw, 2.5rem)', paddingBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}
            >
              <p
                data-custom-font
                className="uppercase tracking-[0.4em] mb-4"
                style={{ color: ink, fontFamily: 'var(--font-heading, serif)', fontWeight: 400, fontSize: '11px' }}
              >
                {t('ourStory.howWeMet')}
              </p>
              <div style={{ height: '1px', background: hairline, marginBottom: '1.75rem', maxWidth: '60px' }} />

              <div className="space-y-3">
                {renderParagraphs(howWeMetBody)}
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Hairline between chapters */}
      {showHowWeMet && showProposal && (
        <div className="mx-8 sm:mx-14 md:mx-20" style={{ height: '1px', background: hairline }} />
      )}

      {/* Chapter II — The Proposal — text left, image right */}
      {showProposal && (
        <AnimatedSection delay={200}>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div
              className="flex flex-col justify-center px-8 sm:px-14 md:pl-20 md:pr-16"
              style={{ paddingTop: 'clamp(1.5rem, 3vw, 2.5rem)', paddingBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}
            >
              <p
                data-custom-font
                className="uppercase tracking-[0.4em] mb-4"
                style={{ color: ink, fontFamily: 'var(--font-heading, serif)', fontWeight: 400, fontSize: '11px' }}
              >
                {t('ourStory.proposal')}
              </p>
              <div style={{ height: '1px', background: hairline, marginBottom: '1.75rem', maxWidth: '60px' }} />

              <div className="space-y-3">
                {renderParagraphs(proposalBody)}
              </div>
            </div>

            {(showProposalPhoto || showPhotos) && proposalPhoto ? (
              <div
                className="relative overflow-hidden"
                style={{ height: 'clamp(380px, 55vw, 620px)' }}
              >
                <Image
                  src={proposalPhoto}
                  alt={t('ourStory.proposal')}
                  fill
                  className="object-cover"
                  style={{ filter: 'brightness(0.95) sepia(0.05)' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div
                  className="absolute inset-0 pointer-events-none hidden md:block"
                  style={{ background: `linear-gradient(to left, transparent 70%, ${bg} 100%)` }}
                />
              </div>
            ) : (
              <div style={{ height: 'clamp(380px, 55vw, 620px)', background: `${ink}05` }} />
            )}
          </div>
        </AnimatedSection>
      )}

      {/* Additional photos strip */}
      {showPhotos && photos.length > 0 && (
        <AnimatedSection delay={300}>
          <div style={{ paddingTop: 'clamp(2rem, 4vw, 4rem)', paddingBottom: 'clamp(4rem, 8vw, 7rem)' }}>
            <div className="px-8 sm:px-14 md:px-20 mb-8">
              <div style={{ height: '1px', background: hairline }} />
            </div>
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: photos.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
              }}
            >
              {photos.map((photo, i) => (
                <div
                  key={photo.id || i}
                  className="relative overflow-hidden"
                  style={{ aspectRatio: i % 3 === 1 ? '3/4' : '4/5' }}
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt || photo.caption || ''}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                    style={{ filter: 'brightness(0.96) sepia(0.04)' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

    </section>
  )
}

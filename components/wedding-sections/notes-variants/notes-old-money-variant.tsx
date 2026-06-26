"use client"

import React from 'react'
import { BaseNotesProps, getColorScheme } from './types'
import { AnimatedSection } from '../animated-section'

const EDITORIAL_BG = '#F6F1EB'
const EDITORIAL_INK = '#211D1A'
const EDITORIAL_MUTED = '#8A7B6E'
const EDITORIAL_HAIRLINE = 'rgba(33,29,26,0.12)'

interface NotesOldMoneyVariantProps extends BaseNotesProps {
  bgStyle?: string
  accentMetal?: string
}

const HEIGHT_PADDING: Record<string, { top: string; bottom: string }> = {
  compact: { top: 'clamp(2.5rem, 5vw, 4rem)', bottom: 'clamp(2.5rem, 5vw, 4rem)' },
  normal:  { top: 'clamp(5rem, 10vw, 8rem)',  bottom: 'clamp(5rem, 10vw, 8rem)'  },
  large:   { top: 'clamp(8rem, 15vw, 12rem)', bottom: 'clamp(8rem, 15vw, 12rem)' },
  full:    { top: 'clamp(5rem, 10vw, 8rem)',  bottom: 'clamp(5rem, 10vw, 8rem)'  },
}

export function NotesOldMoneyVariant({
  theme,
  sectionTitle,
  sectionSubtitle,
  bodyText,
  showTitle = true,
  showSubtitle = true,
  showBodyText = true,
  sectionHeight = 'normal',
  useColorBackground,
  backgroundColorChoice,
}: NotesOldMoneyVariantProps) {
  const { bgColor, titleColor, mutedTextColor, isColored } = getColorScheme(theme, backgroundColorChoice, useColorBackground)

  const bg = isColored && bgColor ? bgColor : EDITORIAL_BG
  const ink = isColored && titleColor ? titleColor : EDITORIAL_INK
  const muted = isColored && mutedTextColor ? mutedTextColor : EDITORIAL_MUTED
  const hairline = isColored && titleColor ? `${titleColor}22` : EDITORIAL_HAIRLINE
  const primary = isColored && titleColor ? titleColor : (theme?.colors?.primary || EDITORIAL_INK)

  const pad = HEIGHT_PADDING[sectionHeight] || HEIGHT_PADDING.normal
  const isFull = sectionHeight === 'full'

  return (
    <section
      id="notes"
      className="relative overflow-hidden"
      style={{
        backgroundColor: bg,
        ...(isFull ? { minHeight: '100vh', display: 'flex', alignItems: 'center' } : {}),
      }}
    >
      <div
        className="max-w-2xl mx-auto px-8 sm:px-14 md:px-16 w-full"
        style={{ paddingTop: pad.top, paddingBottom: pad.bottom }}
      >
        <AnimatedSection>
          <div>
            {showSubtitle && sectionSubtitle && (
              <p
                data-custom-font
                className="uppercase tracking-[0.5em] mb-5"
                style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '18px' }}
              >
                {sectionSubtitle}
              </p>
            )}
            {showTitle && sectionTitle && (
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
                  marginBottom: showBodyText && bodyText ? '2.5rem' : 0,
                }}
              >
                {sectionTitle}
              </div>
            )}
          </div>
        </AnimatedSection>

        {showBodyText && bodyText && (
          <AnimatedSection delay={80}>
            {(showSubtitle && sectionSubtitle) || (showTitle && sectionTitle) ? (
              <div style={{ height: '1px', background: hairline, marginBottom: '2.5rem' }} />
            ) : null}
            <p
              data-custom-font
              style={{
                fontFamily: 'var(--font-body, sans-serif)',
                fontWeight: 300,
                fontSize: '1.0625rem',
                lineHeight: 1.85,
                color: ink,
                whiteSpace: 'pre-line',
              }}
            >
              {bodyText}
            </p>
          </AnimatedSection>
        )}
      </div>
    </section>
  )
}

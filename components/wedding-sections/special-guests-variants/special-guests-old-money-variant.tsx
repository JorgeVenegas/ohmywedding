"use client"

import React from 'react'
import { BaseSpecialGuestsProps, GuestPerson, getColorScheme } from './types'
import { AnimatedSection } from '../animated-section'
import { useI18n } from '@/components/contexts/i18n-context'

const EDITORIAL_BG = '#F6F1EB'
const EDITORIAL_INK = '#211D1A'
const EDITORIAL_MUTED = '#8A7B6E'
const EDITORIAL_HAIRLINE = 'rgba(33,29,26,0.12)'

function Hairline({ color }: { color: string }) {
  return <div style={{ height: '1px', background: color, margin: '3rem 0' }} />
}

function PersonEntry({ person, nameColor, roleColor }: { person: GuestPerson; nameColor: string; roleColor: string }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <p
        data-custom-font
        style={{
          fontFamily: 'var(--font-heading, serif)',
          fontWeight: 300,
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          lineHeight: 1.2,
          color: nameColor,
        }}
      >
        {person.name}
      </p>
      {person.role && (
        <p
          data-custom-font
          style={{
            fontFamily: 'var(--font-body, sans-serif)',
            fontWeight: 300,
            fontSize: '13px',
            color: roleColor,
            marginTop: '0.2rem',
          }}
        >
          {person.role}
        </p>
      )}
    </div>
  )
}

export function SpecialGuestsOldMoneyVariant({
  theme,
  sectionTitle,
  sectionSubtitle,
  introText,
  showTitle = true,
  showSubtitle = true,
  showIntroText = true,
  showParents = true,
  brideParentsTitle,
  brideParents = [],
  showBrideParents = true,
  groomParentsTitle,
  groomParents = [],
  showGroomParents = true,
  partyGroups = [],
  useColorBackground,
  backgroundColorChoice,
}: BaseSpecialGuestsProps) {
  const { t } = useI18n()
  const { bgColor, isColored, ink, muted, hairline, primary } = getColorScheme(theme, backgroundColorChoice, useColorBackground)

  const effectiveTitle             = sectionTitle    || t('specialGuests.title')
  const effectiveSubtitle          = sectionSubtitle || t('specialGuests.subtitle')
  const effectiveIntroText         = introText       || t('specialGuests.intro')
  const effectiveBrideParentsTitle = brideParentsTitle || t('specialGuests.brideParentsTitle')
  const effectiveGroomParentsTitle = groomParentsTitle || t('specialGuests.groomParentsTitle')

  const bg = isColored && bgColor ? bgColor : EDITORIAL_BG
  const inkColor = isColored ? ink : EDITORIAL_INK
  const mutedColor = isColored ? muted : EDITORIAL_MUTED
  const hairlineColor = isColored ? hairline : EDITORIAL_HAIRLINE
  const primaryColor = isColored ? primary : (theme?.colors?.primary || EDITORIAL_INK)

  const visiblePartyGroups = partyGroups.filter(g => g.show !== false)
  const showParentsBlock = showParents && (showBrideParents || showGroomParents)

  return (
    <section id="special-guests" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
      <div
        className="max-w-3xl mx-auto px-8 sm:px-14 md:px-16"
        style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)' }}
      >
        {/* Section header */}
        <AnimatedSection>
          {showSubtitle && (
            <p
              data-custom-font
              className="uppercase tracking-[0.5em] mb-5"
              style={{ color: mutedColor, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '18px' }}
            >
              {effectiveSubtitle}
            </p>
          )}
          {showTitle && (
            <div
              role="heading"
              aria-level={2}
              style={{
                fontFamily: 'var(--font-display, serif)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2.4rem, 5vw, 4.5rem)',
                color: primaryColor,
                lineHeight: 1.15,
              }}
            >
              {effectiveTitle}
            </div>
          )}
        </AnimatedSection>

        {/* Intro text */}
        {showIntroText && (
          <AnimatedSection delay={60}>
            <Hairline color={hairlineColor} />
            <p
              data-custom-font
              style={{
                fontFamily: 'var(--font-body, sans-serif)',
                fontWeight: 300,
                fontSize: '1.0625rem',
                lineHeight: 1.85,
                color: inkColor,
                whiteSpace: 'pre-line',
              }}
            >
              {effectiveIntroText}
            </p>
          </AnimatedSection>
        )}

        {/* Parents block */}
        {showParentsBlock && (
          <AnimatedSection delay={100}>
            <Hairline color={hairlineColor} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              {showBrideParents && brideParents.length > 0 && (
                <div>
                  <p
                    data-custom-font
                    className="uppercase tracking-[0.4em] mb-5"
                    style={{ fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '18px', color: mutedColor }}
                  >
                    {effectiveBrideParentsTitle}
                  </p>
                  {brideParents.map(p => (
                    <PersonEntry key={p.id} person={p} nameColor={primaryColor} roleColor={mutedColor} />
                  ))}
                </div>
              )}
              {showGroomParents && groomParents.length > 0 && (
                <div>
                  <p
                    data-custom-font
                    className="uppercase tracking-[0.4em] mb-5"
                    style={{ fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '18px', color: mutedColor }}
                  >
                    {effectiveGroomParentsTitle}
                  </p>
                  {groomParents.map(p => (
                    <PersonEntry key={p.id} person={p} nameColor={primaryColor} roleColor={mutedColor} />
                  ))}
                </div>
              )}
            </div>
          </AnimatedSection>
        )}

        {/* Party groups */}
        {visiblePartyGroups.map((group, i) => (
          <AnimatedSection key={group.id} delay={140 + i * 40}>
            <Hairline color={hairlineColor} />
            <p
              data-custom-font
              className="uppercase tracking-[0.4em] mb-8 text-center"
              style={{ fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '18px', color: mutedColor }}
            >
              {group.title}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
              {group.people.map(p => (
                <div key={p.id} className="text-center" style={{ marginBottom: '1.25rem' }}>
                  <p
                    data-custom-font
                    style={{
                      fontFamily: 'var(--font-heading, serif)',
                      fontWeight: 300,
                      fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                      lineHeight: 1.25,
                      color: primaryColor,
                    }}
                  >
                    {p.name}
                  </p>
                  {p.role && (
                    <p
                      data-custom-font
                      style={{
                        fontFamily: 'var(--font-body, sans-serif)',
                        fontWeight: 300,
                        fontSize: '12px',
                        color: mutedColor,
                        marginTop: '0.2rem',
                      }}
                    >
                      {p.role}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  )
}

"use client"

import React, { useState } from 'react'
import { BaseFAQProps, defaultQuestions, getColorScheme } from './types'
import { AnimatedSection } from '../animated-section'
import { useI18n } from '@/components/contexts/i18n-context'

const EDITORIAL_BG = '#F6F1EB'
const EDITORIAL_INK = '#211D1A'
const EDITORIAL_MUTED = '#8A7B6E'
const EDITORIAL_HAIRLINE = 'rgba(33,29,26,0.12)'

interface FAQOldMoneyVariantProps extends BaseFAQProps {
  bgStyle?: string
  accentMetal?: string
  showOrnaments?: boolean
}

export function FAQOldMoneyVariant({
  theme,
  alignment,
  questions,
  allowMultipleOpen = false,
  sectionTitle,
  sectionSubtitle,
  showContactNote = true,
  contactNoteText,
  useColorBackground,
  backgroundColorChoice,
  bgStyle = 'ivory',
  accentMetal = 'gold',
  showOrnaments = true,
}: FAQOldMoneyVariantProps) {
  const { t } = useI18n()
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const { bgColor, titleColor, mutedTextColor, isColored } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const bg = isColored && bgColor ? bgColor : EDITORIAL_BG
  const ink = isColored && titleColor ? titleColor : EDITORIAL_INK
  const muted = isColored && mutedTextColor ? mutedTextColor : EDITORIAL_MUTED
  const hairline = isColored && titleColor ? `${titleColor}22` : EDITORIAL_HAIRLINE
  const primary = isColored && titleColor ? titleColor : (theme?.colors?.primary || EDITORIAL_INK)

  const title = sectionTitle || t('faq.title')
  const faqItems = questions && questions.length > 0 ? questions : defaultQuestions

  const toggle = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        if (!allowMultipleOpen) next.clear()
        next.add(index)
      }
      return next
    })
  }

  return (
    <section id="faq" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
      <div
        className="max-w-2xl mx-auto px-8 sm:px-14 md:px-16"
        style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)' }}
      >

        {/* Section heading */}
        <AnimatedSection className="mb-14 sm:mb-20">
          <div>
            {sectionSubtitle && (
              <p
                data-custom-font
                className="text-[10px] uppercase tracking-[0.5em] mb-5"
                style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '11px' }}
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
              }}
            >
              {title}
            </div>
          </div>
        </AnimatedSection>

        {/* Items */}
        <AnimatedSection delay={100}>
          <div>
            <div style={{ height: '1px', background: hairline }} />
            {faqItems.map((item, i) => {
              const isOpen = openItems.has(i)
              return (
                <div key={i}>
                  <button
                    className="w-full text-left py-6 sm:py-7 flex items-start justify-between gap-6 group"
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                  >
                    {/* Question — div avoids global p size/font override when used as heading */}
                    <div
                      style={{
                        fontFamily: 'var(--font-heading, serif)',
                        fontStyle: isOpen ? 'italic' : 'normal',
                        fontWeight: 400,
                        fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
                        color: isOpen ? ink : `${ink}CC`,
                        lineHeight: 1.5,
                        transition: 'color 0.2s, font-style 0.2s',
                        flex: 1,
                        textAlign: 'left',
                      }}
                    >
                      {item.question}
                    </div>
                    {/* +/− indicator */}
                    <div style={{ flexShrink: 0, width: '14px', height: '14px', marginTop: '3px', position: 'relative', opacity: isOpen ? 1 : 0.45, transition: 'opacity 0.2s' }}>
                      <span style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: ink, transform: 'translateY(-50%)' }} />
                      {!isOpen && (
                        <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: ink, transform: 'translateX(-50%)' }} />
                      )}
                    </div>
                  </button>

                  {/* Answer */}
                  <div style={{ maxHeight: isOpen ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <p
                      data-custom-font
                      style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '1rem', lineHeight: 1.85, color: muted, paddingBottom: '1.75rem' }}
                    >
                      {item.answer}
                    </p>
                  </div>

                  <div style={{ height: '1px', background: hairline }} />
                </div>
              )
            })}
          </div>
        </AnimatedSection>

        {/* Contact note */}
        {showContactNote && (
          <AnimatedSection delay={200}>
            <p
              data-custom-font
              style={{
                fontFamily: 'var(--font-heading, serif)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '1.0625rem',
                color: muted,
                lineHeight: 1.75,
                marginTop: '3rem',
              }}
            >
              {contactNoteText || t('faq.contactNote')}
            </p>
          </AnimatedSection>
        )}
      </div>
    </section>
  )
}

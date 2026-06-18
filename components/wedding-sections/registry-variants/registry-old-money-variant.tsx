"use client"

import React from 'react'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { BaseRegistryProps, getProviderLogoUrl, getColorScheme } from './types'
import { AnimatedSection } from '../animated-section'
import { useI18n } from '@/components/contexts/i18n-context'

const EDITORIAL_BG = '#F6F1EB'
const EDITORIAL_INK = '#211D1A'
const EDITORIAL_MUTED = '#8A7B6E'
const EDITORIAL_HAIRLINE = 'rgba(33,29,26,0.12)'

interface RegistryOldMoneyVariantProps extends BaseRegistryProps {
  bgStyle?: string
  accentMetal?: string
  showOrnaments?: boolean
}

export function RegistryOldMoneyVariant({
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  message,
  registries = [],
  customItems = [],
  showCustomRegistry = false,
  showDescription = true,
  showMessage = true,
  cashRegistry,
  useColorBackground,
  backgroundColorChoice,
  weddingNameId,
  bgStyle = 'ivory',
  accentMetal = 'gold',
  showOrnaments = true,
}: RegistryOldMoneyVariantProps) {
  const { t } = useI18n()

  const { bgColor, titleColor, mutedTextColor, isColored } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const bg = isColored && bgColor ? bgColor : EDITORIAL_BG
  const ink = isColored && titleColor ? titleColor : EDITORIAL_INK
  const muted = isColored && mutedTextColor ? mutedTextColor : EDITORIAL_MUTED
  const hairline = isColored && titleColor ? `${titleColor}22` : EDITORIAL_HAIRLINE
  const primary = isColored && titleColor ? titleColor : (theme?.colors?.primary || EDITORIAL_INK)

  const title = sectionTitle || t('registry.title')
  const registryMessage = message || t('registry.message')

  return (
    <section id="registry" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
      <div
        className="max-w-2xl mx-auto px-8 sm:px-14 md:px-16"
        style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)' }}
      >
        <AnimatedSection className="mb-12 sm:mb-16">
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

        {registryMessage && showMessage && (
          <AnimatedSection delay={80}>
            <p
              data-custom-font
              style={{
                fontFamily: 'var(--font-body, sans-serif)',
                fontWeight: 300,
                fontSize: '1rem',
                lineHeight: 1.75,
                color: muted,
                maxWidth: '48ch',
                marginBottom: '3.5rem',
              }}
            >
              {registryMessage}
            </p>
          </AnimatedSection>
        )}

        {registries.length > 0 && (
          <AnimatedSection delay={120}>
            <div>
              <div style={{ height: '1px', background: hairline }} />
              {registries.map((registry, i) => (
                <React.Fragment key={registry.id || i}>
                  <a
                    href={registry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-6 sm:py-7 group transition-opacity duration-200 hover:opacity-50"
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex-shrink-0 overflow-hidden" style={{ width: '40px', height: '32px' }}>
                        <Image
                          src={getProviderLogoUrl(registry)}
                          alt={registry.name}
                          width={40}
                          height={32}
                          className="object-contain h-full w-full"
                          style={{ filter: 'grayscale(1) opacity(0.55)' }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-heading, serif)',
                            fontWeight: 400,
                            fontSize: '1rem',
                            color: ink,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {registry.name}
                        </div>
                        {registry.description && showDescription && (
                          <p
                            data-custom-font
                            style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '0.9375rem', color: muted, marginTop: '2px' }}
                          >
                            {registry.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="hidden sm:block h-px w-5 group-hover:w-8 transition-all duration-400" style={{ background: muted }} />
                      <ExternalLink style={{ width: '13px', height: '13px', color: muted, opacity: 0.6 }} />
                    </div>
                  </a>
                  <div style={{ height: '1px', background: hairline }} />
                </React.Fragment>
              ))}
            </div>
          </AnimatedSection>
        )}

        {cashRegistry?.enabled && (
          <AnimatedSection delay={180}>
            <div style={{ marginTop: '3.5rem' }}>
              <div style={{ height: '1px', background: hairline, marginBottom: '3rem' }} />
              {cashRegistry.title && (
                <div
                  role="heading"
                  aria-level={3}
                  style={{
                    fontFamily: 'var(--font-display, serif)',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    fontSize: 'clamp(2.2rem, 4vw, 3.25rem)',
                    color: primary,
                    lineHeight: 1.2,
                    marginBottom: '1.25rem',
                  }}
                >
                  {cashRegistry.title}
                </div>
              )}
              {cashRegistry.description && (
                <p
                  data-custom-font
                  style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '1rem', lineHeight: 1.75, color: muted, marginBottom: '1.75rem', maxWidth: '40ch' }}
                >
                  {cashRegistry.description}
                </p>
              )}
              {cashRegistry.bank && (
                <div className="space-y-2">
                  {cashRegistry.accountOwner && (
                    <p data-custom-font style={{ fontFamily: 'var(--font-heading, serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(1.25rem, 2.5vw, 1.625rem)', color: ink, lineHeight: 1.2 }}>
                      {cashRegistry.accountOwner}
                    </p>
                  )}
                  <p data-custom-font style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '1rem', color: muted }}>{cashRegistry.bank}</p>
                  {cashRegistry.clabe && (
                    <p data-custom-font style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '0.9375rem', color: muted, letterSpacing: '0.1em' }}>{cashRegistry.clabe}</p>
                  )}
                </div>
              )}
            </div>
          </AnimatedSection>
        )}

        {registries.length === 0 && !cashRegistry?.enabled && (
          <AnimatedSection delay={80}>
            <div style={{ height: '1px', background: hairline, marginBottom: '2rem' }} />
            <p
              data-custom-font
              style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '1rem', color: muted }}
            >
              {t('registry.comingSoon')}
            </p>
          </AnimatedSection>
        )}
      </div>
    </section>
  )
}

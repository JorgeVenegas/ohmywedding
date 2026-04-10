"use client"

import React, { useState } from 'react'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { type CashRegistry } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

interface CashRegistryCardProps {
  cashRegistry: CashRegistry
  index: number
  /** Card background color */
  cardBg: string
  /** Border/accent color */
  accentColor: string
  /** Primary/dark color for text */
  titleColor: string
  /** Muted text color */
  mutedTextColor: string
  /** Whether the card is displayed in a grid (cards/grid variant) or list (minimal/elegant) */
  layout?: 'card' | 'row'
}

export function CashRegistryCard({
  cashRegistry,
  index,
  cardBg,
  accentColor,
  titleColor,
  mutedTextColor,
  layout = 'card',
}: CashRegistryCardProps) {
  const [copied, setCopied] = useState(false)
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false })
  const { t } = useI18n()

  const copyClabe = () => {
    if (!cashRegistry.clabe) return
    navigator.clipboard.writeText(cashRegistry.clabe).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const title = cashRegistry.title || t('registry.cashTitle')

  if (layout === 'row') {
    return (
      <div
        ref={ref}
        className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
        style={{ transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
      >
        <div
          className="flex items-center justify-between p-4 rounded-lg border-l-4"
          style={{ backgroundColor: cardBg, borderLeftColor: accentColor, borderColor: `${accentColor}30`, border: `1px solid ${accentColor}30`, borderLeftWidth: '4px' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
              <span className="text-sm font-semibold" style={{ color: accentColor }}>$</span>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: titleColor }}>{title}</p>
              {cashRegistry.description && (
                <p className="text-xs mt-0.5" style={{ color: mutedTextColor }}>{cashRegistry.description}</p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 text-right space-y-1">
            {cashRegistry.accountOwner && (
              <p className="text-xs font-medium" style={{ color: titleColor }}>{cashRegistry.accountOwner}</p>
            )}
            {cashRegistry.bank && (
              <p className="text-xs" style={{ color: mutedTextColor }}>{cashRegistry.bank}</p>
            )}
            {cashRegistry.clabe && (
              <button
                onClick={copyClabe}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-all duration-200"
                style={{ backgroundColor: copied ? `${accentColor}20` : `${accentColor}10`, color: accentColor, border: `1px solid ${accentColor}30` }}
              >
                <span className="font-mono tracking-wide">{cashRegistry.clabe}</span>
                <span className="uppercase tracking-wider text-[10px]">{copied ? t('registry.copied') : t('registry.copy')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden shadow-lg h-full"
        style={{ backgroundColor: cardBg, border: `2px solid ${accentColor}25` }}
      >
        {/* Top accent line */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, ${accentColor}, ${accentColor}60, transparent)` }} />

        <div className="p-6 sm:p-8 text-center flex-1 flex flex-col justify-center gap-4">
          {/* Monogram-style accent */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full"
            style={{ backgroundColor: `${accentColor}12`, border: `1px solid ${accentColor}30` }}>
            <span className="text-2xl font-light" style={{ color: accentColor, fontFamily: 'var(--font-display, serif)' }}>$</span>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1" style={{ color: titleColor }}>
              {title}
            </h3>
            {cashRegistry.description && (
              <p className="text-sm italic font-light" style={{ color: mutedTextColor }}>
                {cashRegistry.description}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px w-16 mx-auto" style={{ backgroundColor: `${accentColor}35` }} />

          {/* Bank info */}
          <div className="space-y-3">
            {cashRegistry.accountOwner && (
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: mutedTextColor }}>
                  {t('registry.accountOwner')}
                </p>
                <p className="text-sm font-medium" style={{ color: titleColor }}>
                  {cashRegistry.accountOwner}
                </p>
              </div>
            )}

            {cashRegistry.bank && (
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: mutedTextColor }}>
                  {t('registry.bank')}
                </p>
                <p className="text-sm font-medium" style={{ color: titleColor }}>
                  {cashRegistry.bank}
                </p>
              </div>
            )}

            {cashRegistry.clabe && (
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: mutedTextColor }}>
                  {t('registry.clabe')}
                </p>
                <button
                  onClick={copyClabe}
                  className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 w-full justify-center"
                  style={{ backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}30`, color: titleColor }}
                >
                  <span className="font-mono text-sm tracking-widest">{cashRegistry.clabe}</span>
                  <span
                    className="text-[10px] uppercase tracking-wider font-medium flex-shrink-0 transition-all duration-200"
                    style={{ color: copied ? accentColor : mutedTextColor }}
                  >
                    {copied ? t('registry.copied') : t('registry.copy')}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, ${accentColor}60, ${accentColor}40, transparent)` }} />
      </div>
    </div>
  )
}

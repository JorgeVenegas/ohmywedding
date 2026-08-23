"use client"

import { UploadArea } from "./upload-area"
import type { BaseVariantProps } from "./types"
import { resolveBackground } from "./types"
import {
  BotanicalCorner,
  CandleGlow,
  SideBorderScrollwork,
  FloralDivider,
  HaciendaSectionTitle,
} from "@/components/wedding-sections/hacienda-ornaments"

const TERRA = '#7c3522'
const SAGE = '#4a5e3a'
const CREAM = '#faf4ea'
const GOLD = '#c0956a'

export function HaciendaVariant(props: BaseVariantProps) {
  const { theme, primary, title, subtitle, useColorBackground, backgroundColorChoice, uploadsEnabled } = props
  const { bgColor, needsLightText } = resolveBackground(theme, useColorBackground, backgroundColorChoice)

  const bg = bgColor ?? CREAM
  const terra = theme?.colors?.primary || TERRA
  const gold = theme?.colors?.accent || GOLD
  const sage = theme?.colors?.secondary || SAGE
  // When a colored bg is active and it's light, terra (= primary) would sit on a same-hue
  // tinted bg → use deep neutral ink instead for guaranteed contrast
  const textCol = needsLightText ? '#f5f2eb' : (bgColor ? '#1e140e' : terra)
  const subCol = needsLightText ? 'rgba(245,242,235,0.7)' : (bgColor ? 'rgba(30,20,14,0.5)' : `${terra}90`)

  return (
    <section className="relative overflow-hidden" style={{ background: bg }}>
      {/* Atmospheric layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <CandleGlow position="top-right" intensity="medium" />
        <CandleGlow position="bottom" intensity="medium" />
        <BotanicalCorner position="top-left" color={`${gold}55`} size="sm" />
        <BotanicalCorner position="bottom-right" color={`${gold}55`} size="sm" />
        <BotanicalCorner position="top-right" color={`${sage}40`} size="sm" />
        <BotanicalCorner position="bottom-left" color={`${sage}40`} size="sm" />
        <SideBorderScrollwork color={`${gold}38`} side="left" />
        <SideBorderScrollwork color={`${gold}38`} side="right" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-16">
        {/* Hacienda-style header */}
        <div className="text-center mb-10">
          <HaciendaSectionTitle
            title={title}
            subtitle={subtitle}
            accentColor={gold}
            titleColor={textCol}
            subtitleColor={subCol}
          />
        </div>

        <FloralDivider color={`${gold}60`} className="mb-10" />

        {uploadsEnabled && (
          <UploadArea
            {...props}
            zoneBg={needsLightText ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)'}
            zoneBorder={`${gold}55`}
            zoneBorderDragging={terra}
            zoneBgDragging={`${terra}0c`}
            zoneRadius="0.25rem"
            inputBg={needsLightText ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)'}
            inputBorder={`${gold}50`}
            inputRadius="0.25rem"
            buttonBg={terra}
            textColor={needsLightText ? '#f5f2eb' : terra}
            mutedColor={needsLightText ? 'rgba(245,242,235,0.55)' : `${terra}70`}
          />
        )}

        <FloralDivider color={`${gold}60`} className="mt-10" />
      </div>
    </section>
  )
}

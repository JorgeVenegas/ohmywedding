"use client"

import React from 'react'
import { MapPin, Clock, ExternalLink } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { AnimatedSection } from '../animated-section'
import { BaseEventDetailsProps, buildEventList, getMapUrl, getColorScheme, formatWeddingTime } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { HaciendaTilePattern, CandleGlow, HaciendaSectionTitle, FloralDivider, CenterMedallion, VineAccent } from '../hacienda-ornaments'

/** Centered event block with large medallion ornament. */
function EventBlock({
  event, index, total, accent,
  textColor, titleColor, mutedColor, showMapLinks, formatTime,
}: {
  event: any; index: number; total: number
  accent: string
  textColor: string; titleColor: string; mutedColor: string
  showMapLinks: boolean; formatTime: (t: string | null) => string
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15, triggerOnce: false })
  const isLast = index === total - 1

  return (
    <div ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: isVisible ? `${index * 180}ms` : '0ms' }}>

      {/* Large medallion ornament */}
      <div className="flex justify-center mb-6">
        <CenterMedallion color={accent} size="sm" />
      </div>

      {/* Event content — centered */}
      <div className="text-center max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
          <VineAccent color={`${accent}99`} flip />
          <h3 className="text-2xl sm:text-3xl"
            style={{ fontFamily: 'var(--font-display, cursive)', color: titleColor, fontWeight: 400 }}>
            {event.title}
          </h3>
          <VineAccent color={`${accent}99`} />
        </div>

        {event.time && (
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Clock className="w-3.5 h-3.5" style={{ color: accent }} />
            <span className="text-sm sm:text-base font-light tracking-wide uppercase"
              style={{ color: accent, fontFamily: 'var(--font-heading, serif)' }}>
              {formatTime(event.time)}
            </span>
          </div>
        )}

        {/* Event image */}
        {event.imageUrl && (
          <div className="my-5 overflow-hidden rounded-lg shadow-md relative mx-auto max-w-md"
            style={{ border: `2px solid ${accent}30`, boxShadow: `0 4px 20px ${accent}15` }}>
            <img
              src={event.imageUrl}
              alt={event.venue ? `${event.venue}` : event.title}
              className="w-full h-auto object-cover aspect-[16/10] sepia-[.08] brightness-[1.02]"
              loading="lazy"
            />
            <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t border-l opacity-30" style={{ borderColor: accent }} />
            <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t border-r opacity-30" style={{ borderColor: accent }} />
            <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b border-l opacity-30" style={{ borderColor: accent }} />
            <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b border-r opacity-30" style={{ borderColor: accent }} />
          </div>
        )}

        {event.venue && <p className="text-sm sm:text-base font-medium mb-1.5" style={{ color: textColor }}>{event.venue}</p>}

        {event.address && (
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: mutedColor }} />
            <span className="text-xs sm:text-sm font-light" style={{ color: mutedColor }}>{event.address}</span>
          </div>
        )}

        {event.description && (
          <p className="text-xs sm:text-sm font-light italic mt-3 leading-relaxed max-w-sm mx-auto"
            style={{ color: mutedColor, fontFamily: 'var(--font-body, sans-serif)' }}>
            {event.description}
          </p>
        )}

        {showMapLinks && event.address && (
          <a href={getMapUrl(event.address)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-light tracking-wide uppercase transition-all duration-300 hover:opacity-70 group"
            style={{ color: accent }}>
            <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            <span>Ver mapa</span>
          </a>
        )}
      </div>

      {!isLast && <div className="my-14 sm:my-16" />}
    </div>
  )
}

export function EventDetailsHaciendaVariant(props: BaseEventDetailsProps) {
  const {
    wedding, theme, alignment, showMapLinks = true,
    sectionTitle, sectionSubtitle, useColorBackground, backgroundColorChoice,
  } = props

  const { t } = useI18n()
  const { bgColor, sectionTextColor, sectionTextColorAlt, subtitleColor, isColored } = getColorScheme(
    theme, backgroundColorChoice, useColorBackground
  )

  const primary = theme?.colors?.primary || '#2D4A32'
  const accent = theme?.colors?.accent || '#C0A882'
  const secondary = theme?.colors?.secondary || '#FAF6EF'

  const title = sectionTitle || t('eventDetails.title')
  const subtitle = sectionSubtitle || t('eventDetails.joinUsForOurCelebration')

  const isAccentBg = backgroundColorChoice === 'accent' || backgroundColorChoice === 'accent-light' || backgroundColorChoice === 'accent-lighter'
  const isSecondaryBg = backgroundColorChoice === 'secondary' || backgroundColorChoice === 'secondary-light' || backgroundColorChoice === 'secondary-lighter'
  const needsDarkText = isColored && (isAccentBg || isSecondaryBg)

  const renderTitleColor = needsDarkText ? primary : (sectionTextColor || primary)
  const renderTextColor = needsDarkText ? primary : (sectionTextColor || primary)
  const renderMutedColor = needsDarkText ? `${primary}99` : (sectionTextColorAlt || `${primary}99`)

  const events = buildEventList(props)
  if (events.length === 0) return null

  return (
    <SectionWrapper
      theme={isColored ? undefined : theme} alignment={alignment}
      background={isColored ? 'default' : 'default'} id="event-details"
      style={{ backgroundColor: isColored ? bgColor : secondary }}>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <HaciendaTilePattern color={isColored ? secondary : accent} opacity={0.08} />
        <CandleGlow position="top" intensity="subtle" />
        <CandleGlow position="bottom" intensity="subtle" />
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 md:px-10 relative z-10 flex flex-col items-center justify-center">
        <AnimatedSection className="mb-10 sm:mb-14 w-full">
          <HaciendaSectionTitle
            title={title} subtitle={subtitle}
            titleColor={renderTitleColor}
            subtitleColor={needsDarkText ? `${primary}99` : (isColored ? (subtitleColor || accent) : accent)}
            accentColor={needsDarkText ? primary : accent}
          />
        </AnimatedSection>

        <div className="w-full">
          {events.map((event, index) => (
            <EventBlock
              key={event.id}
              event={event} index={index} total={events.length}
              accent={accent}
              textColor={renderTextColor} titleColor={renderTitleColor} mutedColor={renderMutedColor}
              showMapLinks={showMapLinks} formatTime={formatWeddingTime}
            />
          ))}
        </div>

        {/* Bottom closing ornament */}
        <div className="mt-10 sm:mt-14 w-full">
          <FloralDivider color={`${accent}55`} />
        </div>
      </div>
    </SectionWrapper>
  )
}

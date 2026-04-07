"use client"

import React from 'react'
import { MapPin, Clock, ExternalLink, Church, Wine, Music } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { AnimatedSection } from '../animated-section'
import { BaseEventDetailsProps, buildEventList, getMapUrl, getColorScheme, getEventIconType, formatWeddingTime } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { HaciendaTilePattern, CandleGlow, HaciendaSectionTitle, CharroStar, FloralDivider, DamaskPattern, BotanicalCorner } from '../hacienda-ornaments'

function EventIcon({ type, color }: { type: string; color: string }) {
  const cls = 'w-5 h-5 sm:w-6 sm:h-6'
  const iconType = getEventIconType(type as any)
  switch (iconType) {
    case 'ceremony': return <Church className={cls} style={{ color }} />
    case 'reception': return <Music className={cls} style={{ color }} />
    default: return <Wine className={cls} style={{ color }} />
  }
}

/** Ornate timeline node with double ring + corner accent dots. */
function TimelineNode({ type, accent, primary, secondary }: { type: string; accent: string; primary: string; secondary: string }) {
  return (
    <div className="relative flex flex-col items-center z-10 flex-shrink-0">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center relative"
        style={{ backgroundColor: primary }}>
        <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: accent }} />
        <div className="absolute inset-1.5 rounded-full border" style={{ borderColor: `${accent}40` }} />
        {/* 4 accent dots */}
        {[0, 90, 180, 270].map(deg => (
          <div key={deg} className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: accent, opacity: 0.5,
              transform: `rotate(${deg}deg) translateY(-26px)`,
              top: '50%', left: '50%', marginTop: -3, marginLeft: -3,
            }} />
        ))}
        <EventIcon type={type} color={secondary} />
      </div>
    </div>
  )
}

function TimelineItem({
  event, index, total, side, accent, primary, secondary,
  textColor, titleColor, mutedColor, showMapLinks, formatTime,
}: {
  event: any; index: number; total: number; side: 'left' | 'right'
  accent: string; primary: string; secondary: string
  textColor: string; titleColor: string; mutedColor: string
  showMapLinks: boolean; formatTime: (t: string | null) => string
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false })
  const isLast = index === total - 1

  return (
    <div ref={ref}
      className={`relative flex items-start transition-all duration-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: isVisible ? `${index * 150}ms` : '0ms' }}>
      <div className={`flex-1 min-w-0 ${side === 'left' ? 'pr-6 sm:pr-10 text-right' : 'invisible'}`}>
        {side === 'left' && (
          <EventCard event={event} accent={accent} textColor={textColor} titleColor={titleColor}
            mutedColor={mutedColor} showMapLinks={showMapLinks} formatTime={formatTime} align="right" />
        )}
      </div>

      <div className="relative flex flex-col items-center z-10 flex-shrink-0 w-14 sm:w-16">
        <TimelineNode type={event.type || 'custom'} accent={accent} primary={primary} secondary={secondary} />
        {!isLast && (
          <div className="w-px flex-1 min-h-[40px]"
            style={{ backgroundImage: `repeating-linear-gradient(to bottom, ${accent}50 0px, ${accent}50 6px, transparent 6px, transparent 12px)` }} />
        )}
      </div>

      <div className={`flex-1 min-w-0 ${side === 'right' ? 'pl-6 sm:pl-10 text-left' : 'invisible'}`}>
        {side === 'right' && (
          <EventCard event={event} accent={accent} textColor={textColor} titleColor={titleColor}
            mutedColor={mutedColor} showMapLinks={showMapLinks} formatTime={formatTime} align="left" />
        )}
      </div>
    </div>
  )
}

/** Event card with ornate corner accents and gold border details. */
function EventCard({
  event, accent, textColor, titleColor, mutedColor, showMapLinks, formatTime, align,
}: {
  event: any; accent: string; textColor: string; titleColor: string; mutedColor: string
  showMapLinks: boolean; formatTime: (t: string | null) => string; align: 'left' | 'right' | 'center'
}) {
  const justifyClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
  return (
    <div className="pb-8 sm:pb-10 relative">
      {/* Ornate corner brackets — hidden on centered (mobile) */}
      {align !== 'center' && (
        <>
          <div className="absolute top-0" style={{ [align === 'right' ? 'right' : 'left']: 0 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d={align === 'right'
                ? 'M28 0 L28 20 M8 0 L28 0 M28 4 C24 4, 22 6, 22 10'
                : 'M0 0 L0 20 M0 0 L20 0 M0 4 C4 4, 6 6, 6 10'}
                stroke={accent} strokeWidth="0.8" opacity="0.35" />
              <circle cx={align === 'right' ? 28 : 0} cy="0" r="1.5" fill={accent} opacity="0.25" />
            </svg>
          </div>
          <div className="absolute bottom-4" style={{ [align === 'right' ? 'right' : 'left']: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d={align === 'right'
                ? 'M20 20 L20 6 M6 20 L20 20'
                : 'M0 20 L0 6 M0 20 L14 20'}
                stroke={accent} strokeWidth="0.6" opacity="0.2" />
            </svg>
          </div>
        </>
      )}

      <h3 className="text-xl sm:text-2xl mb-1.5"
        style={{ fontFamily: 'var(--font-display, cursive)', color: titleColor, fontWeight: 400 }}>
        {event.title}
      </h3>

      {/* Event image — hacienda styled */}
      {event.imageUrl && (
        <div className="mb-4 -mx-1 overflow-hidden rounded-lg shadow-md relative"
          style={{ border: `2px solid ${accent}30`, boxShadow: `0 4px 20px ${accent}15, inset 0 0 0 1px ${accent}10` }}>
          <img
            src={event.imageUrl}
            alt={event.venue ? `${event.venue}` : event.title}
            className="w-full h-auto object-cover aspect-[16/10] sepia-[.08] brightness-[1.02]"
            loading="lazy"
          />
          {/* Ornate corner accents on image */}
          <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t border-l opacity-30" style={{ borderColor: accent }} />
          <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t border-r opacity-30" style={{ borderColor: accent }} />
          <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b border-l opacity-30" style={{ borderColor: accent }} />
          <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b border-r opacity-30" style={{ borderColor: accent }} />
        </div>
      )}

      {event.time && (
        <div className={`flex items-center gap-1.5 mb-2 ${justifyClass}`}>
          <Clock className="w-3.5 h-3.5" style={{ color: accent }} />
          <span className="text-xs sm:text-sm font-light tracking-wide uppercase"
            style={{ color: accent, fontFamily: 'var(--font-heading, serif)' }}>
            {formatTime(event.time)}
          </span>
        </div>
      )}

      {event.venue && <p className="text-sm font-medium mb-1" style={{ color: textColor }}>{event.venue}</p>}

      {event.address && (
        <div className={`flex items-start gap-1.5 mb-2 ${justifyClass}`}>
          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: mutedColor }} />
          <span className="text-xs sm:text-sm font-light" style={{ color: mutedColor }}>{event.address}</span>
        </div>
      )}

      {event.description && (
        <p className="text-xs sm:text-sm font-light italic mt-2 leading-relaxed"
          style={{ color: mutedColor, fontFamily: 'var(--font-body, sans-serif)' }}>
          {event.description}
        </p>
      )}

      {showMapLinks && event.address && (
        <a href={getMapUrl(event.address)} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-light tracking-wide uppercase transition-all duration-300 hover:opacity-70 group"
          style={{ color: accent }}>
          <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          <span>Ver mapa</span>
        </a>
      )}
    </div>
  )
}

/** Centered mobile event item — node on top, card below. */
function MobileEventItem({
  event, index, total, accent, primary, secondary,
  textColor, titleColor, mutedColor, showMapLinks, formatTime,
}: {
  event: any; index: number; total: number
  accent: string; primary: string; secondary: string
  textColor: string; titleColor: string; mutedColor: string
  showMapLinks: boolean; formatTime: (t: string | null) => string
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false })
  const isLast = index === total - 1

  return (
    <div ref={ref}
      className={`flex flex-col items-center text-center transition-all duration-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: isVisible ? `${index * 150}ms` : '0ms' }}>
      <TimelineNode type={event.type || 'custom'} accent={accent} primary={primary} secondary={secondary} />
      <div className="mt-4 w-full max-w-sm">
        <EventCard event={event} accent={accent} textColor={textColor} titleColor={titleColor}
          mutedColor={mutedColor} showMapLinks={showMapLinks} formatTime={formatTime} align="center" />
      </div>
      {!isLast && (
        <div className="w-px h-8" style={{ backgroundImage: `repeating-linear-gradient(to bottom, ${accent}50 0px, ${accent}50 6px, transparent 6px, transparent 12px)` }} />
      )}
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

  // Gold/accent bg needs dark text for contrast (cream on gold is unreadable)
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
        <DamaskPattern color={isColored ? secondary : accent} opacity={0.035} />
        <HaciendaTilePattern color={isColored ? secondary : primary} opacity={0.012} />
        <CandleGlow position="top" intensity="subtle" />
        <CandleGlow position="bottom" intensity="subtle" />
        <BotanicalCorner position="top-right" color={`${accent}30`} size="md" />
        <BotanicalCorner position="bottom-left" color={`${accent}25`} size="sm" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <AnimatedSection className="mb-14 sm:mb-18">
          <HaciendaSectionTitle
            title={title} subtitle={subtitle}
            titleColor={renderTitleColor}
            subtitleColor={needsDarkText ? `${primary}99` : (isColored ? (subtitleColor || accent) : accent)}
            accentColor={needsDarkText ? primary : accent}
          />
        </AnimatedSection>

        <div className="relative">
          {/* Top ornament */}
          <div className="hidden md:flex justify-center mb-6"><CharroStar color={accent} size={22} /></div>

          <div className="space-y-0">
            {events.map((event, index) => (
              <div key={event.id} className="hidden md:block">
                <TimelineItem
                  event={event} index={index} total={events.length}
                  side={index % 2 === 0 ? 'left' : 'right'}
                  accent={accent} primary={primary} secondary={secondary}
                  textColor={renderTextColor} titleColor={renderTitleColor} mutedColor={renderMutedColor}
                  showMapLinks={showMapLinks} formatTime={formatWeddingTime} />
              </div>
            ))}
            {events.map((event, index) => (
              <div key={`mobile-${event.id}`} className="md:hidden">
                <MobileEventItem
                  event={event} index={index} total={events.length}
                  accent={accent} primary={primary} secondary={secondary}
                  textColor={renderTextColor} titleColor={renderTitleColor} mutedColor={renderMutedColor}
                  showMapLinks={showMapLinks} formatTime={formatWeddingTime} />
              </div>
            ))}
          </div>

          {/* Bottom ornament */}
          <div className="hidden md:flex justify-center mt-6"><CharroStar color={accent} size={22} /></div>
        </div>

        {/* Bottom floral divider */}
        <div className="mt-14 sm:mt-18">
          <FloralDivider color={`${accent}55`} />
        </div>
      </div>
    </SectionWrapper>
  )
}

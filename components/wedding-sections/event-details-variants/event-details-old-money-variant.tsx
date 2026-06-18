"use client"

import React from 'react'
import Image from 'next/image'
import { Clock, MapPin } from 'lucide-react'
import { BaseEventDetailsProps, buildEventList, formatDayLabel, groupEventsByDate, getMapUrl, getColorScheme } from './types'
import { AnimatedSection } from '../animated-section'
import { OldMoneyIcon } from './old-money-icon'
import { useI18n } from '@/components/contexts/i18n-context'

const EDITORIAL_BG = '#F6F1EB'
const EDITORIAL_INK = '#211D1A'
const EDITORIAL_MUTED = '#8A7B6E'
const EDITORIAL_HAIRLINE = 'rgba(33,29,26,0.12)'

// Same icon set as hacienda — rendered as engraved monochrome emblems
const EVENT_ICONS = [
  '/assets/Icons/Asset%201.svg',
  '/assets/Icons/Asset%202.svg',
  '/assets/Icons/Asset%203.svg',
  '/assets/Icons/Asset%204.svg',
  '/assets/Icons/Asset%205.svg',
  '/assets/Icons/Asset%206.svg',
  '/assets/Icons/Asset%207.svg',
  '/assets/Icons/Bouquet.svg',
  '/assets/Icons/BrideGroom.svg',
  '/assets/Icons/Camera.svg',
  '/assets/Icons/Chruch.svg',
  '/assets/Icons/Dresscode.svg',
  '/assets/Icons/Rings.svg',
  '/assets/Icons/Shoes.svg',
  '/assets/Icons/Toast.svg',
] as const

interface EventDetailsOldMoneyVariantProps extends BaseEventDetailsProps {
  bgStyle?: string
  accentMetal?: string
  showOrnaments?: boolean
  iconWeight?: 'fine' | 'light' | 'regular' | 'bold'
  iconSize?: 'sm' | 'md' | 'lg' | 'xl'
}

export function EventDetailsOldMoneyVariant({
  wedding,
  weddingNameId,
  theme,
  alignment,
  events,
  dayLabels,
  showMapLinks = true,
  showMap = false,
  mapAddress,
  venueImageUrl,
  sectionTitle,
  sectionSubtitle,
  useColorBackground,
  backgroundColorChoice,
  showCeremony = true,
  showReception = true,
  ceremonyImageUrl,
  receptionImageUrl,
  ceremonyDescription,
  receptionDescription,
  customEvents = [],
  bgStyle = 'ivory',
  accentMetal = 'gold',
  showOrnaments = true,
  iconWeight = 'regular',
  iconSize = 'lg',
}: EventDetailsOldMoneyVariantProps) {

  const iconPx = iconSize === 'sm' ? 72 : iconSize === 'md' ? 96 : iconSize === 'xl' ? 152 : 120
  const iconStrokeWidth = iconWeight === 'fine' ? 0.5 : iconWeight === 'light' ? 0.8 : iconWeight === 'bold' ? 2.8 : 1.0
  const { t, locale } = useI18n()

  const { bgColor, sectionTextColor, isColored } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const bg = isColored && bgColor ? bgColor : EDITORIAL_BG
  const ink = isColored && sectionTextColor ? sectionTextColor : EDITORIAL_INK
  const muted = isColored && sectionTextColor ? `${sectionTextColor}90` : EDITORIAL_MUTED
  const hairline = isColored && sectionTextColor ? `${sectionTextColor}20` : EDITORIAL_HAIRLINE
  const primary = isColored && sectionTextColor ? sectionTextColor : (theme?.colors?.primary || EDITORIAL_INK)

  const title = sectionTitle || t('eventDetails.title')

  const eventList = buildEventList({
    wedding, weddingNameId, events, showCeremony, showReception, customEvents,
    ceremonyImageUrl, receptionImageUrl, ceremonyDescription, receptionDescription,
  })
  const groups = groupEventsByDate(eventList, wedding.wedding_date || undefined)

  let globalEventIndex = 0

  return (
    <section id="event-details" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
      <div
        className="max-w-3xl mx-auto px-8 sm:px-14 md:px-20"
        style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)' }}
      >
        {/* Section heading */}
        <AnimatedSection className="mb-16 sm:mb-24">
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

        {groups.map((group, gi) => (
          <div key={group.date} className={gi > 0 ? 'mt-16' : ''}>
            {groups.length > 1 && (
              <AnimatedSection delay={gi * 80}>
                <div className="mb-12">
                  <p
                    data-custom-font
                    className="text-[10px] uppercase tracking-[0.5em]"
                    style={{ color: muted, fontFamily: 'var(--font-heading, serif)', fontWeight: 300, fontSize: '11px' }}
                  >
                    {formatDayLabel(group.date, locale, dayLabels)}
                  </p>
                  <div style={{ height: '1px', background: hairline, marginTop: '1rem' }} />
                </div>
              </AnimatedSection>
            )}

            <div>
              {group.events.map((event, ei) => {
                const fallbackIcon = globalEventIndex++
                const resolvedIconIndex = event.iconIndex !== undefined ? event.iconIndex : fallbackIcon % EVENT_ICONS.length

                return (
                  <AnimatedSection key={event.id} delay={gi * 80 + ei * 100 + 80}>
                    <div className={ei > 0 ? 'mt-20 sm:mt-28' : ''}>

                      {/* Inline SVG icon — size and stroke-width are truly independent */}
                      <div className="mb-8">
                        <OldMoneyIcon
                          src={EVENT_ICONS[resolvedIconIndex % EVENT_ICONS.length]}
                          color={primary}
                          size={iconPx}
                          strokeWidth={iconStrokeWidth}
                        />
                      </div>

                      {/* Cinematic full-width image */}
                      {event.imageUrl && (
                        <div className="w-full relative overflow-hidden mb-10" style={{ aspectRatio: '16/7' }}>
                          <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-cover"
                            style={{ filter: 'brightness(0.92) sepia(0.06)' }}
                            sizes="100vw"
                          />
                        </div>
                      )}

                      {/* Event name */}
                      <div
                        role="heading"
                        aria-level={3}
                        style={{
                          fontFamily: 'var(--font-display, serif)',
                          fontStyle: 'italic',
                          fontWeight: 300,
                          fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                          color: primary,
                          lineHeight: 1.15,
                          marginBottom: '1.5rem',
                        }}
                      >
                        {event.title}
                      </div>

                      <div style={{ height: '1px', background: hairline, marginBottom: '1.5rem', maxWidth: '80px' }} />

                      {/* Time with clock icon */}
                      {event.time && (
                        <div className="flex items-center gap-2.5 mb-3">
                          <Clock
                            style={{ width: '13px', height: '13px', color: primary, opacity: 0.7, flexShrink: 0 }}
                            strokeWidth={1.5}
                          />
                          <p
                            data-custom-font
                            style={{
                              fontFamily: 'var(--font-heading, serif)',
                              fontWeight: 300,
                              fontSize: '1.25rem',
                              color: ink,
                              letterSpacing: '0.02em',
                            }}
                          >
                            {event.time}
                          </p>
                        </div>
                      )}

                      {/* Venue name */}
                      {event.venue && (
                        <p
                          data-custom-font
                          style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '1.125rem', color: muted, marginBottom: '0.25rem' }}
                        >
                          {event.venue}
                        </p>
                      )}

                      {/* Address with map pin icon */}
                      {event.address && (
                        <div className="flex items-start gap-2 mb-1">
                          <MapPin
                            style={{ width: '12px', height: '12px', color: muted, opacity: 0.7, flexShrink: 0, marginTop: '3px' }}
                            strokeWidth={1.5}
                          />
                          <p
                            data-custom-font
                            style={{ fontFamily: 'var(--font-body, sans-serif)', fontWeight: 300, fontSize: '1.0625rem', color: muted, opacity: 0.7 }}
                          >
                            {event.address}
                          </p>
                        </div>
                      )}

                      {event.description && (
                        <p
                          data-custom-font
                          style={{
                            fontFamily: 'var(--font-display, serif)',
                            fontStyle: 'italic',
                            fontWeight: 300,
                            fontSize: '1rem',
                            color: muted,
                            lineHeight: 1.75,
                            marginTop: '1rem',
                          }}
                        >
                          {event.description}
                        </p>
                      )}

                      {showMapLinks && event.address && (
                        <a
                          href={getMapUrl(event.address, event.mapLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-5 group transition-opacity duration-200 hover:opacity-50"
                          style={{ fontFamily: 'var(--font-heading, serif)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.45em', fontWeight: 300, color: muted }}
                        >
                          {t('eventDetails.viewOnMap')}
                          <span className="block h-px w-5 group-hover:w-8 transition-all duration-400" style={{ background: muted }} />
                        </a>
                      )}

                      {ei < group.events.length - 1 && (
                        <div style={{ height: '1px', background: hairline, marginTop: '5rem' }} />
                      )}
                    </div>
                  </AnimatedSection>
                )
              })}
            </div>

            {gi < groups.length - 1 && (
              <div style={{ height: '1px', background: hairline, marginTop: '6rem' }} />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

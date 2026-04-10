"use client"

import { useTranslation } from '@/components/contexts/i18n-context'
import Image from 'next/image'

type DecorationSize = 'sm' | 'md' | 'lg' | 'xl'
type NamesSize = 'sm' | 'md' | 'lg' | 'xl'

const NAMES_SIZES: Record<NamesSize, { main: string; amp: string }> = {
  sm: { main: 'clamp(2rem, 5vw, 3.5rem)',  amp: 'clamp(1.5rem, 4vw, 2.75rem)' },
  md: { main: 'clamp(3rem, 7vw, 6rem)',     amp: 'clamp(2.25rem, 5.5vw, 4.5rem)' },
  lg: { main: 'clamp(4.5rem, 10vw, 9rem)',  amp: 'clamp(3.25rem, 8vw, 7rem)' },
  xl: { main: 'clamp(6rem, 14vw, 12rem)',   amp: 'clamp(4.5rem, 11vw, 9rem)' },
}

const SEAL_SIZES: Record<DecorationSize, { image: string; fallback: string; px: number }> = {
  sm: { image: 'w-32 h-32 sm:w-40 sm:h-40', fallback: 'w-24 h-24 sm:w-32 sm:h-32', px: 160 },
  md: { image: 'w-48 h-48 sm:w-64 sm:h-64', fallback: 'w-32 h-32 sm:w-40 sm:h-40', px: 256 },
  lg: { image: 'w-64 h-64 sm:w-80 sm:h-80', fallback: 'w-40 h-40 sm:w-56 sm:h-56', px: 320 },
  xl: { image: 'w-80 h-80 sm:w-96 sm:h-96', fallback: 'w-56 h-56 sm:w-72 sm:h-72', px: 384 },
}

interface HaciendaEnvelopeProps {
  envelopeFalling: boolean
  envelopeOpening: boolean
  handleEnvelopeClick: () => void
  primaryColor: string
  secondaryColor: string
  textColor: string
  secondaryTextColor: string
  displayFontFamily?: string
  bodyFontFamily?: string
  coupleNames: string
  coupleInitials: string
  weddingDate: string
  guestGroup: { id: string; name: string; wedding_id: string } | null
  decorationImageUrl?: string
  decorationSize?: DecorationSize
  namesSize?: NamesSize
  decorationVerticalPos?: number
}

export function HaciendaEnvelope({
  envelopeFalling,
  envelopeOpening,
  handleEnvelopeClick,
  primaryColor,
  secondaryColor,
  textColor,
  secondaryTextColor,
  displayFontFamily,
  bodyFontFamily,
  coupleNames,
  coupleInitials,
  weddingDate,
  guestGroup,
  decorationImageUrl,
  decorationSize = 'md',
  namesSize = 'md',
  decorationVerticalPos = 38,
}: HaciendaEnvelopeProps) {
  const { t } = useTranslation()

  return (
    <>
      {/* Overlay to block scrolling and interactions */}
      {!envelopeFalling && (
        <div
          className="fixed inset-0 z-29"
          style={{ backgroundColor: 'transparent', pointerEvents: 'auto' }}
        />
      )}

      {/* Layer 1: Back rectangle (full screen, primary color) - slides LEFT */}
      <div
        className="fixed inset-0 z-30"
        style={{
          backgroundColor: primaryColor,
          transform: envelopeFalling ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: envelopeFalling ? 'none' : 'auto',
          cursor: envelopeFalling ? 'default' : 'pointer',
        }}
        onClick={!envelopeFalling ? handleEnvelopeClick : undefined}
      >
        {/* Layer 2: Paper card background (secondary color, rounded top) */}
        <div
          className="absolute"
          style={{
            top: '6%',
            left: '8%',
            right: '8%',
            bottom: '30%',
            backgroundColor: secondaryColor,
            borderRadius: '50% 50% 4px 4px / 30% 30% 0 0',
          }}
        />

        {/* Names text — centered on the full paper; right half may be under the flap but text is centered */}
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{
            top: '4%',
            left: '8%',
            right: '8%',
            bottom: '28%',
            overflow: 'visible',
          }}
        >
          <div className="text-center w-full px-6" style={{ overflow: 'visible' }}>
            {(() => {
              const parts = (coupleNames || "You're Invited").split(/\s*&\s*/)
              return parts.length === 2 ? (
                <>
                  {/* Mobile: single element with line breaks — prevents inter-element clipping on iOS */}
                  <p className="drop-shadow-sm sm:hidden"
                    style={{ color: secondaryTextColor, fontFamily: displayFontFamily || 'serif', fontSize: NAMES_SIZES[namesSize].main, lineHeight: 1.3, overflow: 'visible', padding: '0.4em 0' }}>
                    {parts[0].trim()}<br/>
                    <span style={{ fontSize: NAMES_SIZES[namesSize].amp, opacity: 0.75 }}>&amp;</span><br/>
                    {parts[1].trim()}
                  </p>
                  <p className="hidden sm:block drop-shadow-sm"
                    style={{ color: secondaryTextColor, fontFamily: displayFontFamily || 'serif', fontSize: NAMES_SIZES[namesSize].main, lineHeight: 1.3, overflow: 'visible', padding: '0.4em 0' }}>
                    {parts[0].trim()}&nbsp;<span style={{ opacity: 0.75 }}>&amp;</span>&nbsp;{parts[1].trim()}
                  </p>
                </>
              ) : (
                <p className="drop-shadow-sm"
                  style={{ color: secondaryTextColor, fontFamily: displayFontFamily || 'serif', fontSize: NAMES_SIZES[namesSize].main, lineHeight: 1.3, overflow: 'visible', padding: '0.4em 0' }}>
                  {coupleNames || "You're Invited"}
                </p>
              )
            })()}
          </div>
        </div>

      </div>

      {/* Layer 3: Right half flap (covers right half) - slides RIGHT */}
      <div
        className="fixed z-40"
        style={{
          top: 0,
          right: 0,
          bottom: 0,
          width: '50%',
          backgroundColor: primaryColor,
          boxShadow: envelopeFalling
            ? 'none'
            : '-6px 0 24px rgba(0, 0, 0, 0.2)',
          transform: envelopeFalling ? 'translateX(100%)' : 'translateX(0)',
          transition: 'transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: envelopeFalling ? 'default' : 'pointer',
          pointerEvents: envelopeFalling ? 'none' : 'auto',
        }}
        onClick={!envelopeFalling ? handleEnvelopeClick : undefined}
      >
        {/* Subtle inner edge shadow for depth */}
        <div
          className="absolute inset-y-0 left-0 w-4 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)',
          }}
        />
      </div>

      {/* Layer 4: Decoration image / seal — on top of everything, moves RIGHT with the flap */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          top: `${decorationVerticalPos}%`,
          right: '50%',
          transform: envelopeFalling
            ? 'translate(calc(50% + 100vw), -50%)'
            : 'translate(50%, -50%)',
          transition: 'transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {decorationImageUrl ? (
          <div className={`${SEAL_SIZES[decorationSize].image} drop-shadow-lg`}>
            <Image
              src={decorationImageUrl}
              alt="Envelope decoration"
              width={SEAL_SIZES[decorationSize].px}
              height={SEAL_SIZES[decorationSize].px}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div
            className={`${SEAL_SIZES[decorationSize].fallback} rounded-full flex items-center justify-center drop-shadow-lg`}
            style={{
              background: 'linear-gradient(135deg, #d4a54a 0%, #b8862d 50%, #d4a54a 100%)',
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <span
              className="text-xl sm:text-2xl font-bold"
              style={{
                color: '#8b6914',
                fontFamily: displayFontFamily || 'serif',
                textShadow: '0 1px 1px rgba(255,255,255,0.3)',
              }}
            >
              {coupleInitials?.replace(/<[^>]*>/g, '').replace(/\s*&\s*/, '&').split('&').map(n => n.trim()[0]).join('') || 'W'}
            </span>
          </div>
        )}
      </div>

      {/* Layer 5: Recipient overlay — initials + group name, fills space below paper, slides DOWN when opening */}
      {guestGroup?.name && (
        <div
          className="fixed z-[70] left-0 right-0 flex items-center justify-center pointer-events-none"
          style={{
            top: '70%',
            bottom: '3%',
            transform: envelopeFalling ? 'translateY(100vh)' : 'translateY(0)',
            transition: 'transform 900ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="text-center">
            {coupleInitials && coupleInitials.includes('<span') ? (
              <p
                className="text-4xl sm:text-5xl drop-shadow-sm mb-8"
                style={{ color: textColor, fontFamily: displayFontFamily || 'serif', overflow: 'visible', whiteSpace: 'nowrap' }}
                dangerouslySetInnerHTML={{ __html: coupleInitials }}
              />
            ) : (
              <p
                className="text-4xl sm:text-5xl drop-shadow-sm mb-8"
                style={{ color: textColor, fontFamily: displayFontFamily || 'serif', overflow: 'visible', whiteSpace: 'nowrap' }}
              >
                {coupleInitials}
              </p>
            )}
            <p
              className="text-[10px] uppercase mb-2"
              style={{
                color: textColor,
                opacity: 0.55,
                fontFamily: bodyFontFamily || 'sans-serif',
                letterSpacing: '0.3em',
              }}
            >
              {t('common.to')}
            </p>
            <p
              className="text-xl sm:text-2xl tracking-wide"
              style={{
                color: textColor,
                fontFamily: bodyFontFamily || 'sans-serif',
              }}
            >
              {guestGroup.name}
            </p>
          </div>
        </div>
      )}

      {/* Tap to open hint — positioned below the guest-group section (3% strip) on mobile */}
      {!envelopeFalling && !envelopeOpening && (
        <div
          className="fixed z-[75] left-0 right-0 text-center pointer-events-none"
          style={{ bottom: guestGroup?.name ? '5%' : '10%' }}
        >
          <p
            className="text-xs sm:text-sm animate-pulse font-light tracking-wide drop-shadow"
            style={{
              color: textColor,
              fontFamily: bodyFontFamily || 'sans-serif',
              opacity: 0.7,
            }}
          >
            {t('common.tapToOpen')}
          </p>
        </div>
      )}
    </>
  )
}

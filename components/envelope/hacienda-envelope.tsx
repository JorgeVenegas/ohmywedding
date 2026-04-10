"use client"

import { useTranslation } from '@/components/contexts/i18n-context'
import Image from 'next/image'

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
        {/* Layer 2: Paper card (secondary color, rounded top) - inside back, moves with it */}
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{
            top: '6%',
            left: '8%',
            right: '8%',
            bottom: '6%',
            backgroundColor: secondaryColor,
            borderRadius: '50% 50% 4px 4px / 30% 30% 0 0',
            overflow: 'visible',
          }}
        >
          <div className="text-center w-full px-6" style={{ overflow: 'visible' }}>
            {/* Couple initials — display/heading font */}
            <div className="mb-4 sm:mb-6" style={{ overflow: 'visible' }}>
              {coupleInitials && coupleInitials.includes('<span') ? (
                <h1
                  className="text-5xl sm:text-7xl md:text-8xl mb-3 drop-shadow-sm"
                  style={{
                    color: secondaryTextColor,
                    fontFamily: displayFontFamily || 'serif',
                    overflow: 'visible',
                    whiteSpace: 'nowrap',
                  }}
                  dangerouslySetInnerHTML={{ __html: coupleInitials }}
                />
              ) : (
                <h1
                  className="text-5xl sm:text-7xl md:text-8xl mb-3 drop-shadow-sm"
                  style={{
                    color: secondaryTextColor,
                    fontFamily: displayFontFamily || 'serif',
                    overflow: 'visible',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {coupleInitials || "You're Invited"}
                </h1>
              )}
            </div>

            {/* Decorative line */}
            <div
              className="mx-auto mb-4 sm:mb-6"
              style={{
                width: '40%',
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${secondaryTextColor}40, transparent)`,
              }}
            />

            {/* From / To — body font */}
            <div className="mb-3 sm:mb-4">
              <p
                className="text-xs tracking-widest uppercase mb-2"
                style={{
                  color: secondaryTextColor,
                  fontFamily: bodyFontFamily || 'sans-serif',
                  opacity: 0.6,
                }}
              >
                {t('common.from')}
              </p>
              <p
                className="text-sm sm:text-base tracking-wider mb-4"
                style={{
                  color: secondaryTextColor,
                  fontFamily: bodyFontFamily || 'sans-serif',
                }}
              >
                {coupleNames || 'The Couple'}
              </p>
              <p
                className="text-xs tracking-widest uppercase mb-2"
                style={{
                  color: secondaryTextColor,
                  fontFamily: bodyFontFamily || 'sans-serif',
                  opacity: 0.6,
                }}
              >
                {t('common.to')}
              </p>
              <p
                className="text-sm sm:text-base tracking-wider"
                style={{
                  color: secondaryTextColor,
                  fontFamily: bodyFontFamily || 'sans-serif',
                }}
              >
                {guestGroup?.name || 'Guest'}
              </p>
            </div>

            {/* Wedding date */}
            {weddingDate && (
              <p
                className="text-xs sm:text-sm mt-4 tracking-wider"
                style={{
                  color: secondaryTextColor,
                  fontFamily: bodyFontFamily || 'sans-serif',
                  opacity: 0.7,
                }}
              >
                {weddingDate}
              </p>
            )}
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
          top: '50%',
          right: '50%',
          transform: envelopeFalling
            ? 'translate(calc(50% + 100vw), -50%)'
            : 'translate(50%, -50%)',
          transition: 'transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {decorationImageUrl ? (
          <div className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-lg">
            <Image
              src={decorationImageUrl}
              alt="Envelope decoration"
              width={128}
              height={128}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center drop-shadow-lg"
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

      {/* Tap to open hint */}
      {!envelopeFalling && !envelopeOpening && (
        <div
          className="fixed z-50 bottom-12 left-0 right-0 text-center pointer-events-none"
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

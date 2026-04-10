"use client"

import { useTranslation } from '@/components/contexts/i18n-context'
import Image from 'next/image'

type DecorationSize = 'sm' | 'md' | 'lg' | 'xl'

const SEAL_SIZES: Record<DecorationSize, { image: string; fallback: string; px: number }> = {
  sm: { image: 'w-16 h-16 sm:w-20 sm:h-20', fallback: 'w-12 h-12 sm:w-16 sm:h-16', px: 80 },
  md: { image: 'w-24 h-24 sm:w-32 sm:h-32', fallback: 'w-16 h-16 sm:w-20 sm:h-20', px: 128 },
  lg: { image: 'w-32 h-32 sm:w-44 sm:h-44', fallback: 'w-20 h-20 sm:w-28 sm:h-28', px: 176 },
  xl: { image: 'w-44 h-44 sm:w-56 sm:h-56', fallback: 'w-28 h-28 sm:w-36 sm:h-36', px: 224 },
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
            bottom: '30%',
            backgroundColor: secondaryColor,
            borderRadius: '50% 50% 4px 4px / 30% 30% 0 0',
            overflow: 'visible',
          }}
        >
          <div className="text-center w-full px-6" style={{ overflow: 'visible' }}>
            {coupleInitials && coupleInitials.includes('<span') ? (
              <h1
                className="text-5xl sm:text-7xl md:text-8xl drop-shadow-sm"
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
                className="text-5xl sm:text-7xl md:text-8xl drop-shadow-sm"
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
        </div>

        {/* From/To info at bottom of envelope */}
        <div
          className="absolute left-0 right-0 text-center"
          style={{ bottom: '7%' }}
        >
          <p
            className="text-[10px] uppercase mb-1"
            style={{ color: textColor, opacity: 0.5, fontFamily: bodyFontFamily || 'sans-serif', letterSpacing: '0.25em' }}
          >
            {t('common.from')}
          </p>
          <p
            className="text-xs tracking-wider mb-3"
            style={{ color: textColor, opacity: 0.7, fontFamily: bodyFontFamily || 'sans-serif' }}
          >
            {coupleNames || 'The Couple'}
          </p>
          <p
            className="text-[10px] uppercase mb-1"
            style={{ color: textColor, opacity: 0.5, fontFamily: bodyFontFamily || 'sans-serif', letterSpacing: '0.25em' }}
          >
            {t('common.to')}
          </p>
          <p
            className="text-xs tracking-wider"
            style={{ color: textColor, opacity: 0.7, fontFamily: bodyFontFamily || 'sans-serif' }}
          >
            {guestGroup?.name || 'Guest'}
          </p>
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

      {/* Layer 5: Recipient "To:" overlay — on top of all layers, slides DOWN when opening */}
      {guestGroup?.name && (
        <div
          className="fixed z-[60] left-0 right-0 flex justify-center pointer-events-none"
          style={{
            bottom: '24%',
            transform: envelopeFalling ? 'translateY(100vh)' : 'translateY(0)',
            transition: 'transform 900ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="text-center">
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
                fontFamily: displayFontFamily || 'serif',
              }}
            >
              {guestGroup.name}
            </p>
          </div>
        </div>
      )}

      {/* Tap to open hint */}
      {!envelopeFalling && !envelopeOpening && (
        <div
          className="fixed z-[65] bottom-12 left-0 right-0 text-center pointer-events-none"
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

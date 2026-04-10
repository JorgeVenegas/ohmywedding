"use client"

import { useTranslation } from '@/components/contexts/i18n-context'
import Image from 'next/image'

interface HaciendaEnvelopeProps {
  envelopeFalling: boolean
  envelopeOpening: boolean
  handleEnvelopeClick: () => void
  primaryColor: string
  flapColor: string
  textColor: string
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
  flapColor,
  textColor,
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

      {/* Left panel — the "content" underneath, visible once right flap opens */}
      <div
        className="fixed inset-0 z-30"
        style={{
          background: flapColor,
          pointerEvents: envelopeFalling ? 'none' : 'auto',
        }}
        onClick={!envelopeFalling ? handleEnvelopeClick : undefined}
      >
        <div className="h-full w-full flex flex-col items-center justify-center p-6 sm:p-8" style={{ overflow: 'visible' }}>
          <div className="relative z-10 text-center w-full" style={{ overflow: 'visible' }}>
            {/* From/To */}
            <div className="mb-8 sm:mb-12">
              <div className="inline-block border-t border-b py-3 px-6" style={{ borderColor: `${textColor}30` }}>
                <p className="text-xs font-light tracking-widest uppercase mb-1.5" style={{ color: textColor, opacity: 0.7 }}>
                  {t('common.from')}: {coupleNames || 'The Couple'}
                </p>
                <p className="text-sm font-light tracking-wider" style={{ color: textColor }}>
                  {t('common.to')}: {guestGroup?.name || 'Guest'}
                </p>
              </div>
            </div>

            {/* Couple initials */}
            <div className="mb-4 sm:mb-6" style={{ overflow: 'visible' }}>
              {coupleInitials && coupleInitials.includes('<span') ? (
                <h1
                  className="font-serif text-5xl sm:text-7xl md:text-8xl mb-3 drop-shadow-lg"
                  style={{ color: textColor, overflow: 'visible', whiteSpace: 'nowrap' }}
                  dangerouslySetInnerHTML={{ __html: coupleInitials }}
                />
              ) : (
                <h1
                  className="font-serif text-5xl sm:text-7xl md:text-8xl mb-3 drop-shadow-lg"
                  style={{ color: textColor, overflow: 'visible', whiteSpace: 'nowrap' }}
                >
                  {coupleInitials || "You're Invited"}
                </h1>
              )}
              {weddingDate && (
                <p
                  className="text-sm sm:text-lg font-light drop-shadow-md"
                  style={{ color: textColor, opacity: 0.9 }}
                >
                  {weddingDate}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right flap — the main door that slides LEFT to reveal content */}
      <div
        className="fixed z-40"
        style={{
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          backgroundColor: primaryColor,
          boxShadow: envelopeFalling
            ? 'none'
            : '-8px 0 30px rgba(0, 0, 0, 0.25)',
          transform: envelopeFalling ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: envelopeFalling ? 'default' : 'pointer',
          pointerEvents: envelopeFalling ? 'none' : 'auto',
        }}
        onClick={!envelopeFalling ? handleEnvelopeClick : undefined}
      >
        {/* Subtle inner edge shadow for depth */}
        <div
          className="absolute inset-y-0 left-0 w-6 pointer-events-none"
          style={{
            background: `linear-gradient(to right, rgba(0,0,0,0.08), transparent)`,
          }}
        />

        {/* Center content: seal + twine + flower */}
        <div className="h-full w-full flex items-center justify-center relative">
          {/* Twine horizontal line */}
          <div
            className="absolute left-0 right-0 h-[2px]"
            style={{
              top: '50%',
              background: `linear-gradient(90deg, transparent 5%, #c4a265 15%, #b8956a 50%, #c4a265 85%, transparent 95%)`,
              opacity: 0.8,
            }}
          />
          {/* Secondary twine (slightly offset) */}
          <div
            className="absolute left-0 right-0 h-[1.5px]"
            style={{
              top: 'calc(50% + 3px)',
              background: `linear-gradient(90deg, transparent 8%, #b8956a 20%, #c4a265 50%, #b8956a 80%, transparent 92%)`,
              opacity: 0.5,
            }}
          />

          {/* Decoration image (seal, flower arrangement, etc.) */}
          {decorationImageUrl ? (
            <div className="relative z-10">
              <div className="w-24 h-24 sm:w-32 sm:h-32 relative drop-shadow-lg">
                <Image
                  src={decorationImageUrl}
                  alt="Envelope decoration"
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
            </div>
          ) : (
            /* Default wax seal fallback */
            <div className="relative z-10">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center drop-shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #d4a54a 0%, #b8862d 50%, #d4a54a 100%)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <span
                  className="font-serif text-xl sm:text-2xl font-bold"
                  style={{
                    color: '#8b6914',
                    textShadow: '0 1px 1px rgba(255,255,255,0.3)',
                  }}
                >
                  {coupleInitials?.replace(/<[^>]*>/g, '').replace(/\s*&\s*/, '&').split('&').map(n => n.trim()[0]).join('') || 'W'}
                </span>
              </div>
            </div>
          )}

          {/* Tap to open */}
          <div className="absolute bottom-12 left-0 right-0 text-center">
            {!envelopeOpening && (
              <p
                className="text-xs sm:text-sm animate-pulse font-light tracking-wide drop-shadow"
                style={{ color: textColor, opacity: 0.7 }}
              >
                {t('common.tapToOpen')}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

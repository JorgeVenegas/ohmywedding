"use client"

import { useTranslation } from '@/components/contexts/i18n-context'
import Image from 'next/image'

type DecorationSize = 'sm' | 'md' | 'lg' | 'xl'
type NamesSize     = 'sm' | 'md' | 'lg' | 'xl'

const CARD_BG       = '#F6F1EB'
const CARD_INK      = '#211D1A'
const CARD_LINE     = 'rgba(33,29,26,0.11)'
const CARD_LINE_MID = 'rgba(33,29,26,0.18)'

// min(Xvh, Yvw) — respects both vertical AND horizontal space.
// On a 375×667 phone: min(10vh=66px, 13vw=49px) = 49px → fits long names.
// On a 768×1024 tablet: min(10vh=102px, 13vw=100px) → capped at max.
const NAMES_SIZES: Record<NamesSize, string> = {
  sm: 'clamp(1.25rem, min(7vh,  10vw), 3.5rem)',
  md: 'clamp(1.5rem,  min(10vh, 13vw), 5.5rem)',
  lg: 'clamp(2rem,    min(13vh, 16vw), 7rem)',
  xl: 'clamp(2.5rem,  min(16vh, 20vw), 9rem)',
}
const AMP_SIZES: Record<NamesSize, string> = {
  sm: 'clamp(0.875rem,min(4vh,  5vw), 2rem)',
  md: 'clamp(1.125rem,min(5.5vh,7vw), 2.75rem)',
  lg: 'clamp(1.5rem,  min(7vh,  9vw), 3.5rem)',
  xl: 'clamp(2rem,    min(9vh,  12vw),4.5rem)',
}

// Seal px — larger is more impactful at the seam centrepoint
const SEAL_PX: Record<DecorationSize, number> = { sm: 76, md: 96, lg: 116, xl: 136 }

function formatDateElegant(raw: string, locale: string): string {
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return raw
  const date = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export interface OldMoneyEnvelopeProps {
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

export function OldMoneyEnvelope({
  envelopeFalling,
  envelopeOpening,
  handleEnvelopeClick,
  primaryColor,
  textColor,
  displayFontFamily,
  bodyFontFamily,
  coupleNames,
  coupleInitials,
  weddingDate,
  guestGroup,
  decorationImageUrl,
  decorationSize = 'md',
  namesSize = 'md',
}: OldMoneyEnvelopeProps) {
  const { t, locale } = useTranslation()

  const displayFont = displayFontFamily || '"Playfair Display", serif'
  const bodyFont    = bodyFontFamily    || '"Lato", sans-serif'

  const isEs = locale === 'es'

  // Names
  const isSpanish = /\sY\s/i.test(coupleNames || '')
  const sep   = isSpanish ? 'y' : '&'
  const parts = (coupleNames || "You're Invited").split(/\s+Y\s+|\s*&\s*/i)
  const name1 = parts[0]?.trim() ?? coupleNames
  const name2 = parts[1]?.trim() ?? ''

  // Initials — strip HTML
  const rawInitials = coupleInitials?.replace(/<[^>]*>/g, '').replace(/\s*&\s*/, ' ')
  const initials    = rawInitials?.split(/\s+/).map(n => n[0]).filter(Boolean).join('') || 'W'

  const sealPx    = SEAL_PX[decorationSize]
  const dateLabel = weddingDate ? formatDateElegant(weddingDate, locale) : ''

  // Frame — primary color mat around each ivory card half
  const FRAME = '28px'

  // Seal clearance — half the seal plus breathing room
  const sealClear = `${Math.round(sealPx / 2) + 28}px`

  const panelBase: React.CSSProperties = {
    position: 'fixed',
    left: 0, right: 0,
    backgroundColor: primaryColor,
    transition: 'transform 1100ms cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: envelopeFalling ? 'none' : 'auto',
    cursor:        envelopeFalling ? 'default' : 'pointer',
  }

  return (
    <>
      <style>{`
        @keyframes omEnvelopeBlink {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 0.2; }
        }
        .om-tap-blink {
          animation: omEnvelopeBlink 1.6s ease-in-out infinite;
        }
      `}</style>

      {!envelopeFalling && (
        <div className="fixed inset-0 z-[29]" style={{ pointerEvents: 'auto' }} />
      )}

      {/* ── SEAL — standalone fixed element so its shadow never gets clipped ── */}
      {/* padding expands the GPU compositing layer so drop-shadow has room from first paint */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          zIndex: 35,
          pointerEvents: 'none',
          padding: 40,
          filter: decorationImageUrl ? 'drop-shadow(0 6px 22px rgba(0,0,0,0.38))' : undefined,
          transition: 'transform 1100ms cubic-bezier(0.4, 0, 0.2, 1)',
          transform: envelopeFalling
            ? `translate(-50%, calc(-50% - 50vh - ${Math.ceil(sealPx / 2) + 8}px))`
            : 'translate(-50%, -50%)',
        }}
      >
        {decorationImageUrl ? (
          <Image
            src={decorationImageUrl}
            alt="Seal"
            width={sealPx}
            height={sealPx}
            style={{ width: sealPx, height: sealPx, objectFit: 'contain', display: 'block' }}
            unoptimized
          />
        ) : (
          <GoldSeal px={sealPx} />
        )}
      </div>

      {/* ── TOP PANEL ─ slides UP ───────────────────────────────────── */}
      <div
        className="z-[32]"
        style={{
          ...panelBase,
          top: 0, height: '50%',
          transform: envelopeFalling ? `translateY(calc(-100% - ${Math.ceil(sealPx / 2) + 8}px))` : 'translateY(0)',
        }}
        onClick={!envelopeFalling ? handleEnvelopeClick : undefined}
      >
        {/* Ivory card — top half */}
        <div className="absolute" style={{
          top: FRAME, left: FRAME, right: FRAME, bottom: 0,
          backgroundColor: CARD_BG,
          borderTop:   `1px solid ${CARD_LINE}`,
          borderLeft:  `1px solid ${CARD_LINE}`,
          borderRight: `1px solid ${CARD_LINE}`,
        }}>
          {/* Inner offset frame — top/left/right only */}
          <div style={{
            position: 'absolute',
            top: '12px', left: '12px', right: '12px', bottom: 0,
            borderTop:   `0.5px solid ${CARD_LINE}`,
            borderLeft:  `0.5px solid ${CARD_LINE}`,
            borderRight: `0.5px solid ${CARD_LINE}`,
            pointerEvents: 'none',
          }} />
        </div>

        {/* Content */}
        <div
          className="absolute flex flex-col"
          style={{
            top: FRAME, left: FRAME, right: FRAME, bottom: 0,
            padding: '40px 32px 0',
            overflow: 'hidden',
          }}
        >
          {/* ── Top ornament + label ── */}
          <div style={{ flexShrink: 0 }}>
            <OrnamentRule bodyFont={bodyFont}>
              {isEs ? 'Cordialmente invitados' : 'Cordially invited'}
            </OrnamentRule>
          </div>

          {/* Spacer — pushes names toward the seam */}
          <div style={{ flex: 1 }} />

          {/* ── Couple names — large, bottom of panel ── */}
          <div
            style={{
              textAlign: 'center',
              paddingBottom: sealClear,
              flexShrink: 0,
            }}
          >
            {name2 ? (
              <>
                <div style={{
                  fontFamily: displayFont, fontStyle: 'italic', fontWeight: 300,
                  fontSize: NAMES_SIZES[namesSize],
                  color: CARD_INK, lineHeight: 0.95,
                  wordBreak: 'break-word',
                }}>
                  {name1}
                </div>
                <div style={{
                  fontFamily: displayFont, fontStyle: 'italic', fontWeight: 300,
                  fontSize: AMP_SIZES[namesSize],
                  color: CARD_INK,
                  letterSpacing: '0.1em',
                  margin: '-0.12em 0',
                }}>
                  {sep}
                </div>
                <div style={{
                  fontFamily: displayFont, fontStyle: 'italic', fontWeight: 300,
                  fontSize: NAMES_SIZES[namesSize],
                  color: CARD_INK, lineHeight: 0.95,
                  wordBreak: 'break-word',
                }}>
                  {name2}
                </div>
              </>
            ) : (
              <div style={{
                fontFamily: displayFont, fontStyle: 'italic', fontWeight: 300,
                fontSize: NAMES_SIZES[namesSize],
                color: CARD_INK, lineHeight: 1.1,
                wordBreak: 'break-word',
              }}>
                {coupleNames}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM PANEL ─ slides DOWN ─────────────────────────────── */}
      <div
        className="z-[30]"
        style={{
          ...panelBase,
          top: '50%', bottom: 0,
          overflow: 'hidden',
          transform: envelopeFalling ? 'translateY(100%)' : 'translateY(0)',
          transitionDelay: envelopeFalling ? '40ms' : '0ms',
        }}
        onClick={!envelopeFalling ? handleEnvelopeClick : undefined}
      >
        {/* Ivory card — bottom half */}
        <div className="absolute" style={{
          top: 0, left: FRAME, right: FRAME, bottom: FRAME,
          backgroundColor: CARD_BG,
          borderBottom: `1px solid ${CARD_LINE}`,
          borderLeft:   `1px solid ${CARD_LINE}`,
          borderRight:  `1px solid ${CARD_LINE}`,
        }}>
          {/* Inner offset frame — bottom/left/right only */}
          <div style={{
            position: 'absolute',
            top: 0, left: '12px', right: '12px', bottom: '12px',
            borderBottom: `0.5px solid ${CARD_LINE}`,
            borderLeft:   `0.5px solid ${CARD_LINE}`,
            borderRight:  `0.5px solid ${CARD_LINE}`,
            pointerEvents: 'none',
          }} />
        </div>

        {/* Content */}
        <div
          className="absolute flex flex-col items-center"
          style={{
            top: 0, left: FRAME, right: FRAME, bottom: FRAME,
            paddingTop:    sealClear,
            paddingBottom: '40px',
            paddingLeft:   '32px',
            paddingRight:  '32px',
            overflow: 'hidden',
          }}
        >
          {/* Date */}
          {dateLabel && (
            <p style={{
              fontFamily: 'var(--font-heading, "Cormorant Garamond", serif)', fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(0.875rem, min(2.8vh, 3.5vw), 1.5rem)',
              color: `${CARD_INK}80`,
              letterSpacing: '0.04em',
              textAlign: 'center',
              marginBottom: 'clamp(14px, 2.5vh, 28px)',
              flexShrink: 0,
            }}>
              {dateLabel}
            </p>
          )}

          {/* Diamond rule */}
          <DiamondRule />

          {/* Guest group */}
          {guestGroup?.name ? (
            <div style={{ textAlign: 'center', flexShrink: 0, marginTop: 'clamp(14px, 2.5vh, 28px)' }}>
              <p style={{
                fontFamily: bodyFont,
                fontSize: 'clamp(7px, 1.1vw, 9px)',
                letterSpacing: '0.38em',
                textTransform: 'uppercase',
                color: `${CARD_INK}40`,
                marginBottom: '6px',
              }}>
                {t('common.to')}
              </p>
              <p style={{
                fontFamily: displayFont, fontStyle: 'italic', fontWeight: 300,
                fontSize: NAMES_SIZES[namesSize],
                color: CARD_INK,
                lineHeight: 1.05,
                wordBreak: 'break-word',
              }}>
                {guestGroup.name}
              </p>
            </div>
          ) : null}

          {/* Spacer — tap cue lives here so it's centered in the lower card area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!envelopeFalling && !envelopeOpening && (
              <p
                className="om-tap-blink"
                style={{
                  fontFamily: bodyFont,
                  fontSize: 'clamp(13px, 2.5vw, 18px)',
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  color: CARD_INK,
                  opacity: 0.85,
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                {t('common.tapToOpen')}
              </p>
            )}
          </div>

          {/* Bottom ornament rule */}
          <div style={{ width: '100%', flexShrink: 0, marginBottom: '8px' }}>
            <OrnamentRule bodyFont={bodyFont} />
          </div>
        </div>
      </div>

    </>
  )
}

/* ── Sub-components ───────────────────────────────────────────────── */

function OrnamentRule({
  bodyFont,
  children,
}: {
  bodyFont: string
  children?: React.ReactNode
}) {
  const CARD_LINE = 'rgba(33,29,26,0.13)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
      <div style={{ flex: 1, height: '1px', background: CARD_LINE }} />
      {children ? (
        <span style={{
          fontFamily: bodyFont,
          fontSize: 'clamp(11px, 2vw, 14px)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase' as const,
          color: 'rgba(33,29,26,0.38)',
          whiteSpace: 'nowrap' as const,
          flexShrink: 0,
        }}>
          {children}
        </span>
      ) : (
        <span style={{ color: 'rgba(33,29,26,0.22)', fontSize: '7px', lineHeight: 1 }}>◆</span>
      )}
      <div style={{ flex: 1, height: '1px', background: CARD_LINE }} />
    </div>
  )
}

function DiamondRule() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '180px', flexShrink: 0 }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(33,29,26,0.11)' }} />
      <span style={{ color: 'rgba(33,29,26,0.22)', fontSize: '7px' }}>◆</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(33,29,26,0.11)' }} />
    </div>
  )
}

function GoldSeal({ px }: { px: number }) {

  return (
    <div style={{ position: 'relative', width: px, height: px }}>
      {/* Outer shadow + dark-gold ring */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: '1.5px solid #8a6218',
        boxShadow: '0 6px 24px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.22)',
      }} />

      {/* Gold disc — rich directional gradient */}
      <div style={{
        position: 'absolute', inset: '3px',
        borderRadius: '50%',
        background: 'linear-gradient(148deg, #edca68 0%, #ca9025 28%, #b07818 50%, #d2a438 74%, #edca68 100%)',
        boxShadow: 'inset 0 2.5px 7px rgba(255,255,255,0.42), inset 0 -3px 8px rgba(0,0,0,0.3)',
      }} />

      {/* Engraved outer ring */}
      <div style={{
        position: 'absolute',
        inset: `${Math.round(px * 0.11)}px`,
        borderRadius: '50%',
        border: '1px solid rgba(80,42,0,0.35)',
        boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2), 0 0 0 0.5px rgba(255,220,100,0.15)',
      }} />

      {/* Second inner ring */}
      <div style={{
        position: 'absolute',
        inset: `${Math.round(px * 0.155)}px`,
        borderRadius: '50%',
        border: '0.5px solid rgba(80,42,0,0.2)',
      }} />

      {/* Center dot */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: Math.round(px * 0.07), height: Math.round(px * 0.07),
          borderRadius: '50%',
          background: 'rgba(80,42,0,0.35)',
        }} />
      </div>
    </div>
  )
}

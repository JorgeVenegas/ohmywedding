"use client"

import React from 'react'
import { BaseMusicProps, HEIGHT_PADDING, getColorScheme } from './types'
import { AnimatedSection } from '../animated-section'

function fmtTime(sec: number): string {
  if (!isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const WAVE_HEIGHTS = [
  0.3, 0.5, 0.7, 0.4, 0.9, 0.6, 0.8, 0.4, 0.7, 0.5,
  0.9, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3, 0.6, 0.9, 0.4,
  0.7, 0.5, 0.8, 0.4, 0.6, 0.9, 0.5, 0.7, 0.3, 0.8,
  0.6, 0.4, 0.7, 0.9, 0.5, 0.8, 0.4, 0.6, 0.3, 0.7,
  0.9, 0.5, 0.8, 0.4, 0.6, 0.7, 0.3, 0.9, 0.5, 0.6,
]

export function MusicOldMoneyVariant({
  theme,
  sectionTitle,
  sectionSubtitle,
  songTitle,
  artistName,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  showControls = true,
  showTimes = true,
  playerStyle = 'card',
  sectionHeight = 'normal',
  backgroundColorChoice,
  useColorBackground,
}: BaseMusicProps) {
  // Use theme colour scheme when a bg colour is chosen; else fall back to the signature dark editorial look
  const scheme = backgroundColorChoice && backgroundColorChoice !== 'none'
    ? getColorScheme(theme, backgroundColorChoice)
    : null

  const bg       = scheme ? scheme.bgColor      : '#0f0e0d'
  const ink      = scheme ? scheme.ink          : '#f5f0e8'
  const muted    = scheme ? scheme.muted        : 'rgba(245,240,232,0.45)'
  const hairline = scheme ? scheme.hairline     : 'rgba(245,240,232,0.12)'
  // Gold accent only when using the dark default; otherwise use theme primary
  const accentColor = scheme ? scheme.primary   : '#c9a96e'

  const progress  = duration > 0 ? currentTime / duration : 0
  const filledBars = Math.round(progress * WAVE_HEIGHTS.length)
  const pad = HEIGHT_PADDING[sectionHeight]
  const isStrip = playerStyle === 'strip'

  // ── Strip layout: slim horizontal strip, no title, no ornament lines ──────
  if (isStrip) {
    return (
      <section id="music" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
        <div
          className="relative max-w-2xl mx-auto px-6 sm:px-10"
          style={{ paddingTop: pad, paddingBottom: pad }}
        >
          <AnimatedSection>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {showControls && (
                <button
                  onClick={onPlayPause}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  style={{
                    flexShrink: 0,
                    width: 36, height: 36,
                    borderRadius: '50%',
                    border: `1px solid ${accentColor}66`,
                    background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 200ms',
                  }}
                >
                  {isPlaying ? (
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <div style={{ width: 2.5, height: 11, background: ink, borderRadius: 2 }} />
                      <div style={{ width: 2.5, height: 11, background: ink, borderRadius: 2 }} />
                    </div>
                  ) : (
                    <svg width="11" height="13" viewBox="0 0 11 13" fill={ink} style={{ marginLeft: 1 }}>
                      <polygon points="0,0 11,6.5 0,13" />
                    </svg>
                  )}
                </button>
              )}

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div>
                  <span
                    style={{
                      fontFamily: 'var(--font-display, serif)',
                      fontStyle: 'italic',
                      fontWeight: 300,
                      fontSize: '1.375rem',
                      color: ink,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {songTitle || 'Nuestra Canción'}
                  </span>
                  {artistName && (
                    <span data-custom-font style={{ fontSize: '13px', color: muted, letterSpacing: '0.1em', display: 'block' }}>
                      {artistName}
                    </span>
                  )}
                </div>

                {showControls && (
                  <div>
                    <div
                      style={{ height: 3, background: hairline, borderRadius: 99, cursor: duration > 0 ? 'pointer' : 'default' }}
                      onClick={(e) => {
                        if (!duration) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        onSeek((e.clientX - rect.left) / rect.width)
                      }}
                    >
                      <div style={{ height: '100%', width: `${progress * 100}%`, background: accentColor, borderRadius: 99, transition: 'width 200ms linear' }} />
                    </div>
                    {showTimes && duration > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span data-custom-font style={{ fontSize: '18px', color: muted, letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(currentTime)}</span>
                        <span data-custom-font style={{ fontSize: '18px', color: muted, letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(duration)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showControls && showTimes && duration > 0 && (
                <span data-custom-font style={{ flexShrink: 0, fontSize: '18px', color: muted, letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtTime(currentTime)}
                </span>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>
    )
  }

  // ── Card layout ───────────────────────────────────────────────────────────
  return (
    <section id="music" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
      {/* Grain texture — only for the dark default */}
      {!scheme && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            backgroundSize: '180px',
            opacity: 0.6,
          }}
        />
      )}

      <div
        className="relative max-w-2xl mx-auto px-8 sm:px-14 md:px-16"
        style={{ paddingTop: pad, paddingBottom: pad }}
      >
        {/* Section eyebrow + title */}
        <AnimatedSection>
          {sectionSubtitle && (
            <p
              data-custom-font
              style={{
                fontFamily: 'var(--font-heading, serif)',
                fontWeight: 400,
                fontSize: '18px',
                letterSpacing: '0.45em',
                textTransform: 'uppercase',
                color: muted,
                marginBottom: '1.5rem',
              }}
            >
              {sectionSubtitle}
            </p>
          )}

          {sectionTitle && (
            <div
              role="heading"
              aria-level={2}
              style={{
                fontFamily: 'var(--font-display, serif)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                color: ink,
                lineHeight: 1.15,
                marginBottom: '3rem',
              }}
            >
              {sectionTitle}
            </div>
          )}

          {/* Top ornament rule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{ flex: 1, height: '1px', background: hairline }} />
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="6.5" y="0" width="1" height="14" fill={accentColor} opacity="0.6" />
              <rect x="0" y="6.5" width="14" height="1" fill={accentColor} opacity="0.6" />
            </svg>
            <div style={{ flex: 1, height: '1px', background: hairline }} />
          </div>
        </AnimatedSection>

        {/* Song info + waveform + controls */}
        <AnimatedSection delay={100}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

            {/* Song metadata */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                  color: ink,
                  lineHeight: 1.2,
                  marginBottom: '0.75rem',
                }}
              >
                {songTitle || 'Nuestra Canción'}
              </div>
              {artistName && (
                <p
                  data-custom-font
                  style={{
                    fontFamily: 'var(--font-heading, serif)',
                    fontWeight: 400,
                    fontSize: '0.9375rem',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: accentColor,
                  }}
                >
                  {artistName}
                </p>
              )}
            </div>

            {showControls && (
              <>
                {/* Waveform */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    height: '52px',
                    justifyContent: 'center',
                    cursor: duration > 0 ? 'pointer' : 'default',
                  }}
                  onClick={(e) => {
                    if (!duration) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    onSeek((e.clientX - rect.left) / rect.width)
                  }}
                >
                  {WAVE_HEIGHTS.map((h, i) => {
                    const isPast = i < filledBars
                    const isCurrent = i === filledBars
                    return (
                      <div
                        key={i}
                        style={{
                          width: '3px',
                          height: `${h * 48}px`,
                          borderRadius: '2px',
                          background: isPast ? accentColor : isCurrent ? ink : hairline,
                          transition: 'background 200ms',
                          ...(isPlaying && isCurrent ? {
                            animation: 'omw-music-pulse 0.6s ease-in-out infinite alternate',
                          } : {}),
                        }}
                      />
                    )
                  })}
                </div>

                {/* Time labels */}
                {showTimes && duration > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-1.75rem' }}>
                    <span data-custom-font style={{ fontSize: '18px', fontFamily: 'var(--font-heading, serif)', letterSpacing: '0.1em', color: muted }}>
                      {fmtTime(currentTime)}
                    </span>
                    <span data-custom-font style={{ fontSize: '18px', fontFamily: 'var(--font-heading, serif)', letterSpacing: '0.1em', color: muted }}>
                      {fmtTime(duration)}
                    </span>
                  </div>
                )}

                {/* Play / Pause */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={onPlayPause}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    style={{
                      width: 64, height: 64,
                      borderRadius: '50%',
                      border: `1px solid ${accentColor}55`,
                      background: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'border-color 200ms, box-shadow 200ms',
                    }}
                    onMouseEnter={(e) => {
                      const b = e.currentTarget as HTMLButtonElement
                      b.style.borderColor = `${accentColor}99`
                      b.style.boxShadow = `0 0 20px ${accentColor}22`
                    }}
                    onMouseLeave={(e) => {
                      const b = e.currentTarget as HTMLButtonElement
                      b.style.borderColor = `${accentColor}55`
                      b.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px solid ${hairline}` }} />
                    {isPlaying ? (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <div style={{ width: 3, height: 16, background: ink, borderRadius: 2 }} />
                        <div style={{ width: 3, height: 16, background: ink, borderRadius: 2 }} />
                      </div>
                    ) : (
                      <svg width="16" height="18" viewBox="0 0 16 18" fill={ink} style={{ marginLeft: 3 }}>
                        <polygon points="0,0 16,9 0,18" />
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Bottom rule */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1, height: '1px', background: hairline }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: accentColor, opacity: 0.5 }} />
              <div style={{ flex: 1, height: '1px', background: hairline }} />
            </div>
          </div>
        </AnimatedSection>
      </div>

      <style>{`
        @keyframes omw-music-pulse {
          from { transform: scaleY(1) }
          to   { transform: scaleY(1.55) }
        }
      `}</style>
    </section>
  )
}

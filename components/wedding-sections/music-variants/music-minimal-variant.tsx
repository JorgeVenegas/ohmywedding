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

function ProgressRing({
  progress, size, strokeWidth, color, trackColor,
}: { progress: number; size: number; strokeWidth: number; color: string; trackColor: string }) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - progress)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 200ms linear' }}
      />
    </svg>
  )
}

export function MusicMinimalVariant({
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
  const scheme = getColorScheme(theme, backgroundColorChoice)
  const { bgColor, ink, muted, hairline, primary } = scheme
  const progress = duration > 0 ? currentTime / duration : 0
  const pad = HEIGHT_PADDING[sectionHeight]
  const isStrip = playerStyle === 'strip'

  // ── Strip layout ──────────────────────────────────────────────────────────
  if (isStrip) {
    return (
      <section
        id="music"
        style={{ backgroundColor: bgColor, borderTop: `1px solid ${hairline}`, borderBottom: `1px solid ${hairline}` }}
      >
        <div
          className="max-w-2xl mx-auto px-6 sm:px-10"
          style={{ paddingTop: pad, paddingBottom: pad }}
        >
          <AnimatedSection>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Play / Pause */}
              {showControls && (
                <button
                  onClick={onPlayPause}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  style={{
                    flexShrink: 0,
                    width: 40, height: 40,
                    borderRadius: '50%',
                    background: primary,
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: `0 2px 10px ${primary}40`,
                    transition: 'transform 120ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                >
                  {isPlaying ? (
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <div style={{ width: 3, height: 12, background: '#fff', borderRadius: 2 }} />
                      <div style={{ width: 3, height: 12, background: '#fff', borderRadius: 2 }} />
                    </div>
                  ) : (
                    <svg width="12" height="14" viewBox="0 0 12 14" fill="#fff" style={{ marginLeft: 2 }}>
                      <polygon points="0,0 12,7 0,14" />
                    </svg>
                  )}
                </button>
              )}

              {/* Song info + progress */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {/* Title + artist */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display, serif)',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      fontSize: '1.375rem',
                      color: ink,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {songTitle || 'Nuestra Canción'}
                  </span>
                  {artistName && (
                    <span data-custom-font style={{ fontSize: '13px', color: muted, flexShrink: 0 }}>
                      {artistName}
                    </span>
                  )}
                </div>

                {/* Same progress bar as full sizes */}
                {showControls && (
                  <div>
                    <div
                      style={{
                        height: 3,
                        background: `${primary}20`,
                        borderRadius: 99,
                        cursor: duration > 0 ? 'pointer' : 'default',
                      }}
                      onClick={(e) => {
                        if (!duration) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        onSeek((e.clientX - rect.left) / rect.width)
                      }}
                    >
                      <div style={{ height: '100%', width: `${progress * 100}%`, background: primary, borderRadius: 99, transition: 'width 200ms linear' }} />
                    </div>
                    {showTimes && duration > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span data-custom-font style={{ fontSize: '10px', color: muted, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(currentTime)}</span>
                        <span data-custom-font style={{ fontSize: '10px', color: muted, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(duration)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    )
  }

  // ── Card layout ───────────────────────────────────────────────────────────
  return (
    <section
      id="music"
      className="relative overflow-hidden"
      style={{
        backgroundColor: bgColor,
        borderTop: `1px solid ${hairline}`,
        borderBottom: `1px solid ${hairline}`,
      }}
    >
      <div
        className="max-w-xl mx-auto px-8 sm:px-12"
        style={{ paddingTop: pad, paddingBottom: pad }}
      >
        <AnimatedSection>
          {/* Section heading */}
          {(sectionSubtitle || sectionTitle) && (
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              {sectionSubtitle && (
                <p
                  data-custom-font
                  style={{
                    fontFamily: 'var(--font-heading, serif)',
                    fontSize: '11px',
                    fontWeight: 400,
                    letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                    color: muted,
                    marginBottom: '0.5rem',
                  }}
                >
                  {sectionSubtitle}
                </p>
              )}
              {sectionTitle && (
                <div
                  style={{
                    fontFamily: 'var(--font-display, serif)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                    color: ink,
                    lineHeight: 1.2,
                  }}
                >
                  {sectionTitle}
                </div>
              )}
            </div>
          )}

          {/* Player card */}
          <div
            style={{
              background: scheme.isColored ? `${primary}08` : '#fafafa',
              border: `1px solid ${hairline}`,
              borderRadius: 16,
              padding: 'clamp(1.5rem, 4vw, 2.5rem)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.75rem',
            }}
          >
            {/* Circular progress ring + disc */}
            {showControls && (
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ProgressRing
                  progress={progress}
                  size={120}
                  strokeWidth={2.5}
                  color={primary}
                  trackColor={`${primary}22`}
                />
                <div style={{
                  position: 'absolute',
                  width: 88, height: 88,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${primary}18 0%, ${primary}08 100%)`,
                  border: `1px solid ${primary}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `1px solid ${primary}15` }} />
                  <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', border: `1px solid ${primary}15` }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: `${primary}40`, border: `1px solid ${primary}55` }} />
                </div>
              </div>
            )}

            {/* Song info */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                  color: ink,
                  lineHeight: 1.3,
                  marginBottom: '0.4rem',
                }}
              >
                {songTitle || 'Nuestra Canción'}
              </div>
              {artistName && (
                <p
                  data-custom-font
                  style={{
                    fontFamily: 'var(--font-body, sans-serif)',
                    fontWeight: 400,
                    fontSize: '0.875rem',
                    color: muted,
                    letterSpacing: '0.04em',
                  }}
                >
                  {artistName}
                </p>
              )}
            </div>

            {showControls && (
              <>
                {/* Progress bar */}
                <div style={{ width: '100%' }}>
                  <div
                    style={{
                      height: 3,
                      background: `${primary}20`,
                      borderRadius: 99,
                      cursor: duration > 0 ? 'pointer' : 'default',
                      position: 'relative',
                    }}
                    onClick={(e) => {
                      if (!duration) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      onSeek((e.clientX - rect.left) / rect.width)
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progress * 100}%`,
                        background: primary,
                        borderRadius: 99,
                        transition: 'width 200ms linear',
                      }}
                    />
                  </div>
                  {showTimes && duration > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                      <span data-custom-font style={{ fontSize: '11px', color: muted, fontVariantNumeric: 'tabular-nums' }}>
                        {fmtTime(currentTime)}
                      </span>
                      <span data-custom-font style={{ fontSize: '11px', color: muted, fontVariantNumeric: 'tabular-nums' }}>
                        {fmtTime(duration)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Play / Pause button */}
                <button
                  onClick={onPlayPause}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  style={{
                    width: 52, height: 52,
                    borderRadius: '50%',
                    background: primary,
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: `0 4px 16px ${primary}40`,
                    transition: 'transform 120ms, box-shadow 120ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                >
                  {isPlaying ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div style={{ width: 3, height: 14, background: '#fff', borderRadius: 2 }} />
                      <div style={{ width: 3, height: 14, background: '#fff', borderRadius: 2 }} />
                    </div>
                  ) : (
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="#fff" style={{ marginLeft: 2 }}>
                      <polygon points="0,0 14,8 0,16" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

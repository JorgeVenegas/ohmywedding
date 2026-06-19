"use client"

import React from 'react'
import { useMusicPlayer } from '@/components/contexts/music-player-context'
import { useEnvelope } from '@/components/contexts/envelope-context'

const BAR_DELAYS = ['0s', '0.18s', '0.09s']
const BAR_HEIGHTS = [12, 9, 14] // staggered max heights

export function FloatingMusicButton() {
  const { isPlaying, hasMusic, toggle } = useMusicPlayer()
  const { isOpened } = useEnvelope()

  if (!hasMusic || !isOpened) return null

  return (
    <>
      <style>{`
        @keyframes omw-bar {
          0%   { transform: scaleY(0.25) }
          100% { transform: scaleY(1) }
        }
      `}</style>
      <button
        onClick={toggle}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          height: 36,
          borderRadius: 18,
          padding: '0 12px 0 10px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          cursor: 'pointer',
          transition: 'transform 120ms, box-shadow 120ms',
        }}
        onMouseEnter={(e) => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.transform = 'translateX(-50%) scale(1.05)'
          b.style.boxShadow = '0 4px 16px rgba(0,0,0,0.14)'
        }}
        onMouseLeave={(e) => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.transform = 'translateX(-50%) scale(1)'
          b.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)'
        }}
      >
        {/* Equalizer bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
          {BAR_HEIGHTS.map((maxH, i) => (
            <div
              key={i}
              style={{
                width: 2.5,
                height: maxH,
                borderRadius: 2,
                background: '#374151',
                transformOrigin: 'bottom',
                transform: isPlaying ? undefined : 'scaleY(0.25)',
                animation: isPlaying
                  ? `omw-bar 0.55s ${BAR_DELAYS[i]} ease-in-out infinite alternate`
                  : 'none',
                transition: 'transform 200ms',
              }}
            />
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

        {/* Play / Pause */}
        {isPlaying ? (
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <div style={{ width: 2.5, height: 11, background: '#374151', borderRadius: 2 }} />
            <div style={{ width: 2.5, height: 11, background: '#374151', borderRadius: 2 }} />
          </div>
        ) : (
          <svg width="10" height="12" viewBox="0 0 10 12" fill="#374151" style={{ marginLeft: 1 }}>
            <polygon points="0,0 10,6 0,12" />
          </svg>
        )}
      </button>
    </>
  )
}

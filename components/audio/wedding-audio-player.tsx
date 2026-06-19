"use client"

import React, { useEffect, useRef, useState } from 'react'

interface WeddingAudioPlayerProps {
  audioUrl: string
  startTime?: number
  endTime?: number
  showControls?: boolean
  shouldPlay: boolean
}

export function WeddingAudioPlayer({
  audioUrl,
  startTime = 0,
  endTime = 0,
  showControls = true,
  shouldPlay,
}: WeddingAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [userDismissed, setUserDismissed] = useState(false)

  // Start playback when shouldPlay fires (after envelope opens)
  useEffect(() => {
    if (!shouldPlay || hasStarted) return
    setHasStarted(true)

    const audio = audioRef.current
    if (!audio) return

    const tryPlay = () => {
      audio.currentTime = startTime
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay blocked — user must tap the button to start
        })
    }

    // Small delay so it starts as the envelope clears the screen
    const t = setTimeout(tryPlay, 600)
    return () => clearTimeout(t)
  }, [shouldPlay, startTime, hasStarted])

  // Loop: restart at startTime when track ends or when endTime is reached
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      if (endTime > 0 && audio.currentTime >= endTime) {
        audio.currentTime = startTime
        audio.play().catch(() => {})
      }
    }

    const handleEnded = () => {
      audio.currentTime = startTime
      audio.play().catch(() => {})
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [startTime, endTime])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    setHasStarted(true)

    if (isPlaying) {
      audio.pause()
    } else {
      if (endTime > 0 && audio.currentTime >= endTime) {
        audio.currentTime = startTime
      }
      audio.play().catch(() => {})
    }
  }

  if (userDismissed) return (
    <audio ref={audioRef} src={audioUrl} preload="auto"
      onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
  )

  return (
    <>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {showControls && (
        <div
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Play / Pause pill */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pausar música' : 'Reproducir música'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.9rem 0.45rem 0.75rem',
              background: 'rgba(15,15,15,0.72)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '999px',
              color: '#fff',
              fontSize: '11px',
              fontFamily: 'var(--font-heading, serif)',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'background 160ms',
            }}
          >
            {/* Animated bars icon when playing */}
            {isPlaying ? (
              <span style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '12px' }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      display: 'block',
                      width: '2.5px',
                      background: '#fff',
                      borderRadius: '2px',
                      animation: `music-bar-${i} 0.7s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </span>
            ) : (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                <polygon points="0,0 10,6 0,12" />
              </svg>
            )}
            <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
          </button>

          {/* Dismiss */}
          <button
            onClick={() => { audioRef.current?.pause(); setUserDismissed(true) }}
            aria-label="Cerrar reproductor"
            style={{
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(15,15,15,0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Keyframe animations for the bar equalizer */}
      <style>{`
        @keyframes music-bar-0 { from { height: 3px } to { height: 12px } }
        @keyframes music-bar-1 { from { height: 7px } to { height: 12px } }
        @keyframes music-bar-2 { from { height: 2px } to { height: 9px } }
      `}</style>
    </>
  )
}

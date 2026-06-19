"use client"

import React, { createContext, useContext, useState, useRef, useCallback } from 'react'

interface MusicPlayerContextType {
  isPlaying: boolean
  hasMusic: boolean
  toggle: () => void
  sync: (params: { isPlaying: boolean; onPlayPause: () => void; hasMusic: boolean }) => void
  unregister: () => void
}

const MusicPlayerContext = createContext<MusicPlayerContextType>({
  isPlaying: false,
  hasMusic: false,
  toggle: () => {},
  sync: () => {},
  unregister: () => {},
})

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasMusic, setHasMusic] = useState(false)
  const onPlayPauseRef = useRef<() => void>(() => {})

  const sync = useCallback(({ isPlaying: p, onPlayPause, hasMusic: h }: {
    isPlaying: boolean
    onPlayPause: () => void
    hasMusic: boolean
  }) => {
    setIsPlaying(p)
    setHasMusic(h)
    onPlayPauseRef.current = onPlayPause
  }, [])

  const toggle = useCallback(() => {
    onPlayPauseRef.current()
  }, [])

  const unregister = useCallback(() => {
    setIsPlaying(false)
    setHasMusic(false)
    onPlayPauseRef.current = () => {}
  }, [])

  return (
    <MusicPlayerContext.Provider value={{ isPlaying, hasMusic, toggle, sync, unregister }}>
      {children}
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayer() {
  return useContext(MusicPlayerContext)
}

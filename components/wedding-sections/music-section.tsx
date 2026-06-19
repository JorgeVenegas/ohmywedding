"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { MusicMinimalVariant, MusicOldMoneyVariant, BaseMusicProps } from './music-variants'
import { useSectionVariants, createVariantConfig, VariantOption } from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'
import { useEnvelope } from '@/components/contexts/envelope-context'
import { useI18n } from '@/components/contexts/i18n-context'
import { useMusicPlayer } from '@/components/contexts/music-player-context'

interface MusicSectionProps {
  theme?: BaseMusicProps['theme']
  alignment?: BaseMusicProps['alignment']
  variant?: 'minimal' | 'old-money'
  showVariantSwitcher?: boolean
  sectionTitle?: string
  sectionSubtitle?: string
  songTitle?: string
  artistName?: string
  audioUrl?: string
  startTime?: number
  endTime?: number
  showControls?: boolean
  showTimes?: boolean
  autoPlay?: boolean
  playerStyle?: BaseMusicProps['playerStyle']
  useColorBackground?: boolean
  backgroundColorChoice?: BaseMusicProps['backgroundColorChoice']
  sectionHeight?: BaseMusicProps['sectionHeight']
}

export function MusicSection({
  theme,
  alignment,
  variant = 'minimal',
  showVariantSwitcher = true,
  sectionTitle,
  sectionSubtitle,
  songTitle,
  artistName,
  audioUrl,
  startTime = 0,
  endTime = 0,
  showControls = true,
  showTimes = true,
  autoPlay = true,
  playerStyle = 'card',
  useColorBackground = false,
  backgroundColorChoice = 'none',
  sectionHeight = 'normal',
}: MusicSectionProps) {
  const { t } = useI18n()
  const { isOpened: envelopeOpened } = useEnvelope()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const hasAutoStarted = useRef(false)

  const {
    activeVariant,
    customConfig,
    handleEditClick,
  } = useSectionVariants('music', 'music', 'minimal', variant, showVariantSwitcher)

  const musicVariants: VariantOption[] = [
    { value: 'minimal', label: 'Minimal', description: 'Clean player card with circular progress' },
    { value: 'old-money', label: 'Old Money', description: 'Dark editorial player with waveform', deluxeOnly: true },
  ]

  const config = createVariantConfig(customConfig, {
    sectionTitle,
    sectionSubtitle,
    songTitle,
    artistName,
    audioUrl,
    startTime,
    endTime,
    showControls,
    showTimes,
    autoPlay,
    playerStyle,
    useColorBackground,
    backgroundColorChoice,
    sectionHeight,
  })

  const effectiveUrl = config.audioUrl ?? audioUrl
  const effectiveStart = config.startTime ?? startTime
  const effectiveEnd = config.endTime ?? endTime
  const effectiveControls = config.showControls ?? showControls
  const effectiveAutoPlay = config.autoPlay ?? autoPlay

  // Create / update audio element when URL changes
  useEffect(() => {
    if (!effectiveUrl) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(0)
      }
      hasAutoStarted.current = false
      return
    }

    const audio = new Audio(effectiveUrl)
    audio.preload = 'metadata'

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
      audio.currentTime = effectiveStart
    })

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime)
      if (effectiveEnd > 0 && audio.currentTime >= effectiveEnd) {
        audio.currentTime = effectiveStart
        if (isPlaying) audio.play().catch(() => {})
      }
    })

    audio.addEventListener('ended', () => {
      audio.currentTime = effectiveStart
      audio.play().catch(() => {})
    })

    audio.addEventListener('play', () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))

    audioRef.current = audio
    hasAutoStarted.current = false

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [effectiveUrl, effectiveStart, effectiveEnd])

  // Autoplay when envelope opens
  useEffect(() => {
    if (!effectiveAutoPlay || !envelopeOpened || hasAutoStarted.current) return
    const audio = audioRef.current
    if (!audio) return

    hasAutoStarted.current = true
    const t = setTimeout(() => {
      audio.currentTime = effectiveStart
      audio.play().catch(() => {})
    }, 700)
    return () => clearTimeout(t)
  }, [envelopeOpened, effectiveAutoPlay, effectiveStart])

  const onPlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [])

  const onSeek = useCallback((ratio: number) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const clamped = Math.max(0, Math.min(1, ratio))
    audio.currentTime = effectiveStart + clamped * (
      effectiveEnd > 0 ? (effectiveEnd - effectiveStart) : (duration - effectiveStart)
    )
  }, [duration, effectiveStart, effectiveEnd])

  const { sync, unregister } = useMusicPlayer()

  useEffect(() => {
    sync({ isPlaying, onPlayPause, hasMusic: !!effectiveUrl })
  }, [isPlaying, onPlayPause, effectiveUrl, sync])

  useEffect(() => {
    return () => { unregister() }
  }, [unregister])

  const commonProps: BaseMusicProps = {
    theme,
    alignment,
    sectionTitle: config.sectionTitle ?? sectionTitle,
    sectionSubtitle: config.sectionSubtitle ?? sectionSubtitle,
    songTitle: config.songTitle ?? songTitle,
    artistName: config.artistName ?? artistName,
    audioUrl: effectiveUrl,
    startTime: effectiveStart,
    endTime: effectiveEnd,
    showControls: effectiveControls,
    showTimes: config.showTimes ?? showTimes,
    autoPlay: effectiveAutoPlay,
    playerStyle: config.playerStyle ?? playerStyle,
    useColorBackground: config.useColorBackground ?? useColorBackground,
    backgroundColorChoice: config.backgroundColorChoice ?? backgroundColorChoice,
    sectionHeight: config.sectionHeight ?? sectionHeight,
    isPlaying,
    currentTime,
    duration,
    onPlayPause,
    onSeek,
  }

  const renderContent = (v: string) => {
    switch (v) {
      case 'old-money':
        return <MusicOldMoneyVariant {...commonProps} />
      case 'minimal':
      default:
        return <MusicMinimalVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
      sectionTitle: config.sectionTitle ?? sectionTitle,
      sectionSubtitle: config.sectionSubtitle ?? sectionSubtitle,
      songTitle: config.songTitle ?? songTitle,
      artistName: config.artistName ?? artistName,
      audioUrl: effectiveUrl,
      startTime: effectiveStart,
      endTime: effectiveEnd,
      showControls: effectiveControls,
      showTimes: config.showTimes ?? showTimes,
      autoPlay: effectiveAutoPlay,
      playerStyle: config.playerStyle ?? playerStyle,
      useColorBackground: config.useColorBackground ?? useColorBackground,
      backgroundColorChoice: config.backgroundColorChoice ?? backgroundColorChoice,
      sectionHeight: config.sectionHeight ?? sectionHeight,
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="music"
      sectionType="music"
      onEditClick={onEditClick}
    >
      {renderContent(activeVariant)}
    </EditableSectionWrapper>
  )
}

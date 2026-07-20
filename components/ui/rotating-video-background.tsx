'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface RotatingVideoBackgroundProps {
  videos: string[]
  className?: string
}

// Crossfades through a playlist of background videos, keeping every clip mounted
// once ready so transitions are seamless (no black flash on source swap).
export function RotatingVideoBackground({ videos, className = 'absolute inset-0' }: RotatingVideoBackgroundProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [videosReady, setVideosReady] = useState(false)

  // Lazy-load all videos after initial paint so load time is unaffected
  useEffect(() => {
    const timer = setTimeout(() => setVideosReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const video = videoRefs.current[currentVideoIndex]
    if (!video) return
    video.currentTime = 0
    video.play().catch(() => {})
  }, [currentVideoIndex, videosReady])

  const handleVideoEnd = useCallback((index: number) => {
    setCurrentVideoIndex((prev) => {
      if (prev !== index) return prev
      return (prev + 1) % videos.length
    })
  }, [videos.length])

  return (
    <div className={className}>
      {videosReady && videos.map((src, i) => (
        <video
          key={src}
          ref={(el) => { videoRefs.current[i] = el }}
          muted
          playsInline
          preload="auto"
          onEnded={() => handleVideoEnd(i)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: i === currentVideoIndex ? 1 : 0, pointerEvents: 'none' }}
        >
          <source src={src} type="video/mp4" />
        </video>
      ))}
    </div>
  )
}

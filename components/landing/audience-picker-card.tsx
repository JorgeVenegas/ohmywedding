'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface AudiencePickerCardProps {
  href: string
  label: string
  sublabel: string
  cta: string
  video: string
}

export function AudiencePickerCard({ href, label, sublabel, cta, video }: AudiencePickerCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [active, setActive] = useState(false)

  const activate = () => {
    setActive(true)
    videoRef.current?.play().catch(() => {})
  }

  const deactivate = () => {
    setActive(false)
    const v = videoRef.current
    if (v) {
      v.pause()
      v.currentTime = 0
    }
  }

  // On touch devices there's no hover, so trigger the same activate/deactivate
  // via scroll position instead. Desktop relies on onMouseEnter/onMouseLeave only —
  // gating on `(hover: none)` keeps this observer from also firing on desktop scroll.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(hover: none)').matches) return
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) activate()
        else deactivate()
      },
      { threshold: 0.6 }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Link
      ref={cardRef}
      href={href}
      onMouseEnter={activate}
      onMouseLeave={deactivate}
      className="group relative block flex-1 h-full w-full overflow-hidden"
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-700 ease-out"
        style={{ filter: active ? 'grayscale(0)' : 'grayscale(1) contrast(1.05) brightness(0.9)' }}
      >
        <source src={video} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-[#420c14]/70 via-[#420c14]/10 to-[#420c14]/85" />

      <div className="absolute inset-0 flex flex-col items-center justify-end p-6 sm:p-10 lg:p-16 text-center">
        <span className="font-serif font-light text-3xl sm:text-4xl md:text-5xl text-[#f5f2eb] mb-2 sm:mb-3 transition-colors duration-500 group-hover:text-[#DDA46F]">
          {label}
        </span>
        <span className="text-[#f5f2eb]/60 text-[10px] sm:text-xs tracking-[0.25em] uppercase mb-5 sm:mb-8">
          {sublabel}
        </span>
        <span className="inline-flex items-center gap-2 text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] uppercase opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
          {cta}
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </span>
      </div>
    </Link>
  )
}

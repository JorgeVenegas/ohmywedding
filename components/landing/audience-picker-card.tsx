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

  // On touch devices there's no hover — activate via intersection.
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
      className="group relative block flex-1 h-full w-full overflow-hidden cursor-pointer"
    >
      {/* Video */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-700 ease-out"
        style={{ filter: active ? 'grayscale(0)' : 'grayscale(1) contrast(1.05) brightness(0.85)' }}
      >
        <source src={video} type="video/mp4" />
      </video>

      {/* Base overlay — lifts slightly on hover to reveal more video */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#420c14]/70 via-[#420c14]/20 to-[#420c14]/90 transition-opacity duration-700 group-hover:opacity-70" />

      {/* Gold bottom border that scales in on hover */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#DDA46F] origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end p-6 sm:p-10 lg:p-16 text-center">
        <span className="font-serif font-light text-3xl sm:text-4xl md:text-5xl text-[#f5f2eb] mb-2 sm:mb-3 transition-all duration-500 group-hover:text-[#DDA46F] group-hover:scale-105 inline-block">
          {label}
        </span>
        <span className="text-[#f5f2eb]/60 text-[10px] sm:text-xs tracking-[0.25em] uppercase mb-6 sm:mb-10">
          {sublabel}
        </span>

        {/* CTA — always visible, brightens on hover */}
        <span className="inline-flex items-center gap-2 text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] uppercase opacity-50 group-hover:opacity-100 transition-all duration-500 border border-[#DDA46F]/30 group-hover:border-[#DDA46F]/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 group-hover:bg-[#DDA46F]/10">
          {cta}
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-500 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

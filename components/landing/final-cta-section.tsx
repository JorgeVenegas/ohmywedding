'use client'

import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/components/contexts/i18n-context'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const ctaVideos = [
  "/videos/vid2.mp4",
  "/videos/vid10.mp4",
  "/videos/vid4.mp4",
  "/videos/vid17.mp4",
  "/videos/vid6.mp4",
  "/videos/vid20.mp4",
  "/videos/vid8.mp4",
]

export function FinalCTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const { t } = useTranslation()

  const handleVideoEnd = useCallback(() => {
    setCurrentVideoIndex((prev) => (prev + 1) % ctaVideos.length)
  }, [])

  return (
    <section ref={ref} className="relative py-40 overflow-hidden">
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.video
            key={currentVideoIndex}
            autoPlay
            muted
            playsInline
            preload="none"
            onEnded={handleVideoEnd}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <source src={ctaVideos[currentVideoIndex]} type="video/mp4" />
          </motion.video>
        </AnimatePresence>
        <div className="absolute inset-0 bg-[#420c14]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#420c14]/80 via-transparent to-[#420c14]/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.5 }}
        className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <span className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2 sm:py-3 rounded-full bg-[#f5f2eb]/5 backdrop-blur-md border border-[#DDA46F]/20 text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.4em] uppercase mb-8 sm:mb-12">
          <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
          {t('landing.finalCta.label')}
        </span>
        
        <h2 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-8xl text-[#f5f2eb] mb-6 sm:mb-10 leading-[1.05] drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] px-2"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.4), 0 2px 10px rgba(0,0,0,0.3)' }}
        >
          <span className="font-serif font-light block">{t('landing.finalCta.title')}</span>
          <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] block mt-2 sm:mt-4" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>{t('landing.finalCta.subtitle')}</span>
        </h2>
        
        <p className="text-sm sm:text-lg md:text-xl text-[#f5f2eb]/70 max-w-2xl mx-auto mb-8 sm:mb-14 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] px-4">
          {t('landing.finalCta.description')}
        </p>
        
        <div>
          <Link href="/create-wedding">
            <Button 
              size="lg" 
              className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] h-12 sm:h-16 px-8 sm:px-14 text-sm sm:text-base tracking-[0.1em] sm:tracking-[0.15em] font-medium transition-all duration-700"
            >
              {t('landing.finalCta.cta')}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
            </Button>
          </Link>
        </div>
        
        <p className="text-[#f5f2eb]/40 text-xs sm:text-sm mt-6 sm:mt-10 tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          {t('landing.finalCta.note')}
        </p>
      </motion.div>
    </section>
  )
}

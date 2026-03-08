'use client'

import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight, ArrowDown, Star, Play } from 'lucide-react'
import { useTranslation } from '@/components/contexts/i18n-context'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'

const heroVideos = [
  "/videos/vid1.mp4",
  "/videos/vid5.mp4",
  "/videos/vid9.mp4",
  "/videos/vid15.mp4",
  "/videos/vid3.mp4",
  "/videos/vid12.mp4",
]

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const { t } = useTranslation()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 300])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  const handleVideoEnd = useCallback(() => {
    setCurrentVideoIndex((prev) => (prev + 1) % heroVideos.length)
  }, [])

  return (
    <section ref={containerRef} className="relative min-h-[110vh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
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
            <source src={heroVideos[currentVideoIndex]} type="video/mp4" />
          </motion.video>
        </AnimatePresence>
        <div className="absolute inset-0 bg-[#420c14]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#420c14]/30 via-transparent to-[#420c14]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#172815]/20 via-transparent to-[#172815]/20" />
      </div>

      {/* Content */}
      <motion.div 
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        style={{ y, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mb-3 sm:mb-8"
        >
          <span className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2 sm:py-3 rounded-full bg-[#f5f2eb]/5 backdrop-blur-md border border-[#DDA46F]/20 text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.4em] uppercase">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            {t('landing.hero.title')}
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 sm:mb-8 leading-tight tracking-tight"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.4), 0 2px 10px rgba(0,0,0,0.3)' }}
        >
          {/* Line 1 */}
          <span className="block leading-[1.35]">
            <span
              className="font-serif font-light text-[#f5f2eb] text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
            >
              {t('landing.hero.subtitle')}{' '}
            </span>
            <span
              className="relative inline-block font-serif font-light text-[#f5f2eb] text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl pb-1 sm:pb-2"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
            >
              {t('landing.hero.subtitle2')}
              <svg
                className="absolute -bottom-0.5 left-0 w-full overflow-visible"
                height="10"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                <path d="M1,6 Q25,2 50,6 Q75,10 99,6" stroke="#DDA46F" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
          </span>
          {/* Line 2 */}
          <span className="block leading-[1.35]">
            <span
              className="font-serif font-light text-[#f5f2eb] text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
            >
              {t('landing.hero.subtitle3')}{' '}
            </span>
            <span
              className="relative inline-block font-serif font-light text-[#f5f2eb] text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl pb-1 sm:pb-2"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
            >
              {t('landing.hero.subtitle4')}
              <svg
                className="absolute -bottom-0.5 left-0 w-full overflow-visible"
                height="10"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                <path d="M1,6 Q25,2 50,6 Q75,10 99,6" stroke="#DDA46F" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm sm:text-lg md:text-xl text-[#f5f2eb]/60 max-w-2xl mx-auto mb-5 sm:mb-10 leading-relaxed font-light tracking-wide px-2"
        >
          {t('landing.hero.description')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center items-center"
        >
          <Link href="/create-wedding">
            <Button 
              size="lg" 
              className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] h-12 sm:h-16 px-6 sm:px-12 text-sm sm:text-base tracking-[0.1em] sm:tracking-[0.15em] font-medium group transition-all duration-700 w-full sm:w-auto"
            >
              {t('landing.hero.cta')}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 transition-transform duration-500 group-hover:translate-x-2" />
            </Button>
          </Link>
          <Link href="#demos">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-[#f5f2eb]/30 text-[#f5f2eb] hover:bg-[#f5f2eb]/10 hover:border-[#f5f2eb]/50 h-12 sm:h-16 px-6 sm:px-12 text-sm sm:text-base tracking-[0.1em] sm:tracking-[0.15em] backdrop-blur-sm transition-all duration-700 w-full sm:w-auto"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
              {t('landing.hero.secondary')}
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.5 }}
          className="mt-8 sm:mt-16 flex justify-center gap-8 sm:gap-16 md:gap-24"
        >
          {[
            { value: '4.9', label: t('landing.hero.stats.rating'), icon: <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-[#DDA46F] text-[#DDA46F] inline ml-1" /> },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-xl sm:text-3xl md:text-4xl font-serif text-[#DDA46F] flex items-center justify-center">
                {stat.value}
                {stat.icon}
              </div>
              <div className="text-[10px] sm:text-xs text-[#f5f2eb]/40 tracking-[0.2em] sm:tracking-[0.3em] uppercase mt-1 sm:mt-2">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="hidden lg:flex absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-3 text-[#f5f2eb]/40"
        >
          <span className="text-xs tracking-[0.4em] uppercase">{t('landing.hero.scrollToExplore')}</span>
          <ArrowDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  )
}

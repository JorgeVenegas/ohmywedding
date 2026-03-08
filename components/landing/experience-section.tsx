'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useTranslation } from '@/components/contexts/i18n-context'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const experienceData = [
  { id: 'hero', key: 'hero' as const, video: "/videos/vid11.mp4", image: "/images/demo_images/demo-img-2.jpg", carouselImage: "/images/demo_images/demo-img-35.jpg" },
  { id: 'countdown', key: 'countdown' as const, video: "/videos/vid13.mp4", image: "/images/demo_images/demo-img-5.jpg", carouselImage: "/images/demo_images/demo-img-40.jpg" },
  { id: 'story', key: 'ourStory' as const, video: "/videos/vid16.mp4", image: "/images/demo_images/demo-img-7.jpg", carouselImage: "/images/demo_images/demo-img-42.jpg" },
  { id: 'venue', key: 'eventDetails' as const, video: "/videos/vid18.mp4", image: "/images/demo_images/demo-img-10.jpg", carouselImage: "/images/demo_images/demo-img-44.jpg" },
  { id: 'rsvp', key: 'rsvp' as const, video: "/videos/vid19.mp4", image: "/images/demo_images/demo-img-15.jpg", carouselImage: "/images/demo_images/demo-img-46.jpg" },
  { id: 'gallery', key: 'gallery' as const, video: "/videos/vid21.mp4", image: "/images/demo_images/demo-img-20.jpg", carouselImage: "/images/demo_images/demo-img-48.jpg" },
]

export function ExperienceSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [activeIndex, setActiveIndex] = useState(0)
  const { t } = useTranslation()

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % experienceData.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="experience" ref={ref} className="py-20 sm:py-32 bg-[#172815] relative overflow-hidden min-h-[700px] sm:min-h-[800px]">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              className="w-full h-full object-cover"
              poster={experienceData[activeIndex].image}
            >
              <source src={experienceData[activeIndex].video} type="video/mp4" />
            </video>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-[#172815] via-[#172815]/80 to-[#172815]/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#172815] via-transparent to-[#172815]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.5em] uppercase mb-4 sm:mb-8 block">
              {t('landing.experience.label')}
            </span>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#f5f2eb] mb-8 sm:mb-12 leading-[1.05]">
              <span className="font-serif font-light block">{t('landing.experience.title')}</span>
              <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] block mt-1 sm:mt-2">{t('landing.experience.subtitle')}</span>
            </h2>

            <div className="space-y-1 sm:space-y-1.5">
              {experienceData.map((exp, index) => (
                <button
                  key={exp.id}
                  onClick={() => setActiveIndex(index)}
                  className={`w-full text-left rounded-lg sm:rounded-xl transition-all duration-500 overflow-hidden ${
                    activeIndex === index 
                      ? 'bg-[#DDA46F]/15 border border-[#DDA46F]/30' 
                      : 'bg-[#f5f2eb]/5 border border-transparent hover:bg-[#f5f2eb]/10'
                  }`}
                >
                  <div className="p-2.5 sm:p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-sm sm:text-base text-[#f5f2eb] truncate">{t(`landing.experience.sections.${exp.key}.title`)}</h3>
                      </div>
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#DDA46F] flex-shrink-0 transition-opacity duration-400"
                        style={{ opacity: activeIndex === index ? 1 : 0.3, transform: `scale(${activeIndex === index ? 1 : 0.6})` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="hidden lg:block relative"
          >
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={experienceData[activeIndex].carouselImage}
                    alt={t(`landing.experience.sections.${experienceData[activeIndex].key}.title`)}
                    fill
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#172815]/60 to-transparent" />
                </motion.div>
              </AnimatePresence>
              
              <div className="absolute bottom-6 left-6 right-6 flex gap-2">
                {experienceData.map((_, index) => (
                  <div
                    key={index}
                    className="h-1 rounded-full flex-1 bg-[#f5f2eb]/20 overflow-hidden cursor-pointer"
                    onClick={() => setActiveIndex(index)}
                  >
                    <motion.div
                      className="h-full bg-[#DDA46F]"
                      initial={{ width: 0 }}
                      animate={{ width: activeIndex === index ? '100%' : '0%' }}
                      transition={{ duration: activeIndex === index ? 5 : 0.3 }}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="absolute -top-10 -right-10 text-[12rem] font-serif text-[#DDA46F]/10 leading-none pointer-events-none select-none">
              {String(activeIndex + 1).padStart(2, '0')}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

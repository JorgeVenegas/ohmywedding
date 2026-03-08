'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { Crown, Globe, Bell, Palette, Star } from 'lucide-react'
import { useTranslation } from '@/components/contexts/i18n-context'
import { motion, useInView } from 'framer-motion'

export function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t } = useTranslation()

  return (
    <section ref={ref} className="py-20 sm:py-40 bg-[#f5f2eb] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#DDA46F]/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[#424b1e] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
              {t('landing.about.label')}
            </span>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#420c14] mb-6 sm:mb-10 leading-[1.1]">
              <span className="font-serif font-light block">{t('landing.about.title')}</span>
              <span className="font-['Elegant',cursive] text-[#732c2c] text-[1.5em] block mt-1 sm:mt-2">{t('landing.about.subtitle')}</span>
            </h2>
            
            <div className="space-y-4 sm:space-y-6 text-[#420c14]/60 text-sm sm:text-lg leading-relaxed">
              <p>{t('landing.about.description1')}</p>
              <p>{t('landing.about.description2')}</p>
            </div>
            
            <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-4 sm:gap-6">
              {[
                { icon: <Crown className="w-4 h-4 sm:w-5 sm:h-5" />, label: t('landing.about.pills.templates') },
                { icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, label: t('landing.about.pills.domain') },
                { icon: <Bell className="w-4 h-4 sm:w-5 sm:h-5" />, label: t('landing.about.pills.notifications') },
                { icon: <Palette className="w-4 h-4 sm:w-5 sm:h-5" />, label: t('landing.about.pills.customization') },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.8 + index * 0.15 }}
                  className="flex items-center gap-2 sm:gap-4 text-[#420c14]"
                >
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#DDA46F]/10 flex items-center justify-center text-[#DDA46F] flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-xs sm:text-sm font-medium tracking-wide">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                className="w-full h-full object-cover"
                poster="/images/demo_images/demo-img-3.jpg"
              >
                <source src="/videos/vid8.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-[#420c14]/30 to-transparent" />
            </div>
            
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:bottom-[-2rem] lg:left-[-2rem] lg:translate-x-0 bg-[#420c14] p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-2xl w-[85%] sm:w-auto sm:max-w-[280px]"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 1 }}
            >
              <div className="flex gap-1 mb-2 sm:mb-3 justify-center lg:justify-start">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-[#DDA46F] text-[#DDA46F]" />
                ))}
              </div>
              <p className="text-[#f5f2eb]/80 text-xs sm:text-sm italic leading-relaxed text-center lg:text-left">
                {t('landing.about.testimonial.quote')}
              </p>
              <p className="text-[#DDA46F] text-[10px] sm:text-xs mt-2 sm:mt-3 tracking-wider text-center lg:text-left">{t('landing.about.testimonial.author')}</p>
            </motion.div>
            
            <div className="absolute -inset-4 sm:-inset-6 border border-[#DDA46F]/20 rounded-[1.5rem] sm:rounded-[2rem] pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

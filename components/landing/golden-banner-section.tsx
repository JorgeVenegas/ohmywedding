'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useTranslation } from '@/components/contexts/i18n-context'
import { motion, useInView } from 'framer-motion'

export function GoldenBannerSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t } = useTranslation()

  return (
    <section ref={ref} className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] min-h-[350px] sm:min-h-[500px] lg:min-h-[600px] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/demo_images/demo-img-13.jpg"
          alt="Wedding moment"
          fill
          className="object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#DDA46F]/85 via-[#DDA46F]/70 to-[#DDA46F]/85" />
      </div>

      <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2 }}
          className="text-center max-w-7xl"
        >
          <p
            className="text-[#420c14] leading-[1.2] text-[8em]"
            style={{ textShadow: '0 2px 20px rgba(221,164,111,0.3)' }}
          >
            <span className="font-serif text-[2.15em] md:text-[3.15em]">&ldquo;{t('landing.goldenBanner.quote')}&rdquo;</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

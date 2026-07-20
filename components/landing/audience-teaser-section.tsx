'use client'

import { useRef } from 'react'
import { useTranslation } from '@/components/contexts/i18n-context'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface AudienceTeaserSectionProps {
  ns: string
  sectionKey: 'plannerTeaser' | 'coupleTeaser'
  ctaHref: string
  icons: [ReactNode, ReactNode, ReactNode, ReactNode]
}

export function AudienceTeaserSection({ ns, sectionKey, ctaHref, icons }: AudienceTeaserSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t } = useTranslation()

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-[#420c14] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(221,164,111,1) 1px, transparent 0)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="rounded-[1.5rem] sm:rounded-[2rem] border border-[#DDA46F]/20 bg-[#f5f2eb]/5 p-6 sm:p-12 lg:p-16"
        >
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
              {t(`${ns}.${sectionKey}.label`)}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#f5f2eb] mb-4 sm:mb-6 leading-tight">
              <span className="font-serif font-light block">{t(`${ns}.${sectionKey}.title`)}</span>
              <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.4em] block mt-1 sm:mt-2">{t(`${ns}.${sectionKey}.subtitle`)}</span>
            </h2>
            <p className="text-[#f5f2eb]/60 text-sm sm:text-base leading-relaxed">
              {t(`${ns}.${sectionKey}.description`)}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-10 sm:mb-14">
            {[0, 1, 2, 3].map(index => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                className="flex items-start gap-3 sm:gap-4"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#DDA46F]/10 flex items-center justify-center text-[#DDA46F] flex-shrink-0">
                  {icons[index]}
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-[#f5f2eb] mb-1">
                    {t(`${ns}.${sectionKey}.items.${index}.title`)}
                  </p>
                  <p className="text-xs sm:text-sm text-[#f5f2eb]/50 leading-relaxed">
                    {t(`${ns}.${sectionKey}.items.${index}.description`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <a
              href={ctaHref}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] text-sm sm:text-base font-medium tracking-wide transition-colors"
            >
              {t(`${ns}.${sectionKey}.cta`)}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

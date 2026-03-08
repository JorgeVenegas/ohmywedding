'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '@/components/contexts/i18n-context'
import { motion, useInView } from 'framer-motion'

const templates = [
  { id: "classic-elegance", image: "/images/demo_images/demo-img-10.jpg", title: "Classic Elegance", style: "Timeless" },
  { id: "modern-minimal", image: "/images/demo_images/demo-img-15.jpg", title: "Modern Minimal", style: "Contemporary" },
  { id: "romantic-garden", image: "/images/demo_images/demo-img-20.jpg", title: "Romantic Garden", style: "Natural" },
  { id: "rustic-charm", image: "/images/demo_images/demo-img-25.jpg", title: "Rustic Charm", style: "Intimate" },
  { id: "luxury-noir", image: "/images/demo_images/demo-img-30.jpg", title: "Luxury Noir", style: "Serene" },
  { id: "simple-love", image: "/images/demo_images/demo-img-35.jpg", title: "Simple Love", style: "Modern" },
]

const infiniteTemplates = [...templates, ...templates, ...templates]

export function TemplatesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t } = useTranslation()

  return (
    <section id="demos" ref={ref} className="py-20 sm:py-40 bg-[#f5f2eb] relative overflow-hidden">
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2 }}
            className="text-center"
          >
            <span className="text-[#424b1e] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
              {t('landing.templates.label')}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-[#420c14] mb-6 sm:mb-8 leading-tight">
              <span className="font-serif font-light">{t('landing.templates.title')}</span>
              <span className="font-['Elegant',cursive] text-[#732c2c] text-[1.5em] block mt-1 sm:mt-2">{t('landing.templates.subtitle')}</span>
            </h2>
          </motion.div>
        </div>

        <div className="relative">
          <div 
            className="flex gap-4 sm:gap-6 lg:gap-8 pb-4 animate-scroll-left"
            style={{ width: 'max-content' }}
          >
            {infiniteTemplates.map((template, index) => (
              <Link
                key={index}
                href={`/demo/${template.id}`}
                className="flex-shrink-0 w-[200px] sm:w-[280px] md:w-[320px] lg:w-[380px] group cursor-pointer"
              >
                <div className="relative aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden mb-3 sm:mb-6">
                  <Image
                    src={template.image}
                    alt={template.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#420c14]/80 via-[#420c14]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <span className="px-8 py-4 bg-[#f5f2eb]/95 backdrop-blur-sm rounded-full text-[#420c14] text-sm font-medium tracking-wider">
                      {t('landing.templates.previewTemplate')}
                    </span>
                  </div>
                </div>
                <h3 className="font-serif text-base sm:text-lg lg:text-xl text-[#420c14]">{template.title}</h3>
                <p className="text-xs sm:text-sm text-[#420c14]/50 tracking-wider uppercase">{template.style}</p>
              </Link>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-12 sm:mt-20 text-center"
        >
          <Link href="/demo">
            <Button 
              size="lg"
              variant="outline"
              className="border-[#420c14]/20 text-[#420c14] hover:border-[#DDA46F] hover:bg-[#DDA46F]/5 h-12 sm:h-16 px-8 sm:px-12 text-sm sm:text-base tracking-wider transition-all duration-700"
            >
            {t('landing.templates.viewAll')}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

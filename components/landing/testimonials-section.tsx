'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { useTranslation } from '@/components/contexts/i18n-context'
import { motion, useInView } from 'framer-motion'

function useTestimonials() {
  const { t } = useTranslation()
  return [
    { quote: t('landing.testimonials.items.0.quote'), author: t('landing.testimonials.items.0.author'), role: t('landing.testimonials.items.0.role'), image: "/images/demo_images/demo-img-46.jpg" },
    { quote: t('landing.testimonials.items.1.quote'), author: t('landing.testimonials.items.1.author'), role: t('landing.testimonials.items.1.role'), image: "/images/demo_images/demo-img-47.jpg" },
    { quote: t('landing.testimonials.items.2.quote'), author: t('landing.testimonials.items.2.author'), role: t('landing.testimonials.items.2.role'), image: "/images/demo_images/demo-img-48.jpg" },
  ]
}

export function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t } = useTranslation()
  const testimonials = useTestimonials()

  return (
    <section ref={ref} className="py-20 sm:py-40 bg-[#172815] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#DDA46F]/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2 }}
          className="text-center mb-12 sm:mb-24"
        >
          <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
            {t('landing.testimonials.label')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-[#f5f2eb] mb-6 sm:mb-8">
            <span className="font-serif font-light">{t('landing.testimonials.title')}</span>
            <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] block mt-1 sm:mt-2">{t('landing.testimonials.subtitle')}</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-10">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="relative group"
            >
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden">
                <Image
                  src={testimonial.image}
                  alt={testimonial.author}
                  fill
                  className="object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#172815]/80 via-[#172815]/90 to-[#172815]" />
              </div>
              
              <div className="relative p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-[#f5f2eb]/5 border border-[#f5f2eb]/10 h-full">
                <div className="absolute -top-4 sm:-top-6 left-6 sm:left-10 text-5xl sm:text-8xl text-[#DDA46F]/20 font-serif">
                  &ldquo;
                </div>
                
                <div className="flex gap-1 mb-4 sm:mb-8 relative">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-[#DDA46F] text-[#DDA46F]" />
                  ))}
                </div>
                
                <blockquote className="text-[#f5f2eb]/80 mb-6 sm:mb-10 leading-relaxed text-sm sm:text-lg relative">
                  {testimonial.quote}
                </blockquote>
                
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.author}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#DDA46F]/20 to-[#732c2c]/20" />
                  </div>
                  <div>
                    <p className="font-serif text-base sm:text-lg text-[#f5f2eb]">{testimonial.author}</p>
                    <p className="text-xs sm:text-sm text-[#f5f2eb]/50">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

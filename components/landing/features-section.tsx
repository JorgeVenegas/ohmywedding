'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { Eye, CheckCircle2, Globe, Send, Bell, Crown } from 'lucide-react'
import { useTranslation } from '@/components/contexts/i18n-context'
import { motion, useInView } from 'framer-motion'

const featureItems = [
  { icon: <Eye className="w-7 h-7" />, titleKey: 'landing.features.items.invitationTracking.title' as const, descriptionKey: 'landing.features.items.invitationTracking.description' as const, color: "#DDA46F", image: "/images/demo_images/demo-img-40.jpg" },
  { icon: <CheckCircle2 className="w-7 h-7" />, titleKey: 'landing.features.items.rsvpDashboard.title' as const, descriptionKey: 'landing.features.items.rsvpDashboard.description' as const, color: "#424b1e", image: "/images/demo_images/demo-img-41.jpg" },
  { icon: <Globe className="w-7 h-7" />, titleKey: 'landing.features.items.subdomain.title' as const, descriptionKey: 'landing.features.items.subdomain.description' as const, color: "#732c2c", image: "/images/demo_images/demo-img-42.jpg" },
  { icon: <Send className="w-7 h-7" />, titleKey: 'landing.features.items.messageTemplates.title' as const, descriptionKey: 'landing.features.items.messageTemplates.description' as const, color: "#172815", image: "/images/demo_images/demo-img-43.jpg" },
  { icon: <Bell className="w-7 h-7" />, titleKey: 'landing.features.items.notifications.title' as const, descriptionKey: 'landing.features.items.notifications.description' as const, color: "#DDA46F", image: "/images/demo_images/demo-img-44.jpg" },
  { icon: <Crown className="w-7 h-7" />, titleKey: 'landing.features.items.luxuryExperience.title' as const, descriptionKey: 'landing.features.items.luxuryExperience.description' as const, color: "#420c14", image: "/images/demo_images/demo-img-45.jpg" },
]

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t } = useTranslation()

  return (
    <section id="features" ref={ref} className="py-20 sm:py-40 bg-[#420c14] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(221,164,111,1) 1px, transparent 0)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2 }}
          className="text-center mb-12 sm:mb-24"
        >
          <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
            {t('landing.features.label')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-[#f5f2eb] mb-6 sm:mb-8 leading-tight">
            <span className="font-serif font-light block">{t('landing.features.title')}</span>
            <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] block mt-1 sm:mt-2">{t('landing.features.subtitle')}</span>
          </h2>
          <p className="text-[#f5f2eb]/50 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed px-2">
            {t('landing.features.description')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureItems.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className="group"
            >
              <div className="relative p-8 rounded-3xl bg-[#f5f2eb]/5 border border-[#f5f2eb]/10 hover:border-[#DDA46F]/40 transition-all duration-700 h-full overflow-hidden">
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 bg-[#f5f2eb]/5">
                  <Image
                    src={feature.image}
                    alt={t(feature.titleKey)}
                    fill
                    className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#420c14]/80 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-700 group-hover:scale-110"
                      style={{ backgroundColor: `${feature.color}40`, color: feature.color }}
                    >
                      {feature.icon}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-serif text-[#f5f2eb] mb-3">{t(feature.titleKey)}</h3>
                <p className="text-[#f5f2eb]/50 leading-relaxed text-sm">{t(feature.descriptionKey)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

"use client"

import React, { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion, useInView } from "framer-motion"
import {
  Check,
  ArrowRight,
  Heart,
  Users,
  Gift,
  Globe,
  Send,
  Eye,
  MessageSquare,
  Shield,
  Sparkles,
  ChevronDown,
  Star,
  ArrowLeft,
  Crown,
  Calendar,
  FileText,
} from "lucide-react"
import { PRICING, PLAN_CARDS, COMPARISON_FEATURES } from "@/lib/subscription-shared"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useTranslation } from "@/components/contexts/i18n-context"
import { getTranslations } from "@/lib/i18n"

// ============================================
// HERO SECTION
// ============================================

function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#420c14] via-[#5a1a22] to-[#420c14]">
      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-[10%] w-80 h-80 rounded-full bg-[#DDA46F]/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-[10%] w-96 h-96 rounded-full bg-[#DDA46F]/3 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[10px] sm:text-xs tracking-[0.4em] text-[#DDA46F] uppercase mb-6 font-medium">
            {t('plans.premium.label')}
          </p>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif text-[#f5f2eb] leading-[1.1] mb-6">
            {t('plans.premium.heroTitle')}{" "}
            <span className="text-[#DDA46F] italic">{t('plans.premium.heroHighlight')}</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#f5f2eb]/60 max-w-2xl mx-auto leading-relaxed mb-4">
            {t('plans.premium.heroDescription')}
          </p>
          <p className="text-3xl sm:text-4xl font-serif text-[#DDA46F] mb-2">
            {PRICING.premium.priceDisplayMXN}
          </p>
          <p className="text-sm text-[#f5f2eb]/40 mb-10">{t('plans.common.oneTimePayment')} • {t('plans.common.noSubscriptions')} • {t('plans.common.yoursForever')}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/upgrade?plan=premium&source=premium_page_hero">
              <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] text-base px-10 py-6 rounded-full font-medium shadow-lg shadow-[#DDA46F]/20">
                {t('plans.common.upgradeToPremuim')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#features" className="text-[#f5f2eb]/60 hover:text-[#DDA46F] transition-colors text-sm flex items-center gap-2">
              {t('plans.common.seeAllFeatures')}
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f5f2eb] to-transparent" />
    </section>
  )
}

// ============================================
// THE PROMISE
// ============================================

function PromiseSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t } = useTranslation()

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-[#f5f2eb] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.premium.promise.label')}</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight mb-8">
            {t('plans.premium.promise.title')}<br />{t('plans.premium.promise.subtitle')}
          </h2>
          <p className="text-lg text-[#420c14]/60 max-w-2xl mx-auto leading-relaxed">
            {t('plans.premium.promise.description')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16">
          {[
            {
              icon: Sparkles,
              title: t('plans.premium.promise.tools.title'),
              description: t('plans.premium.promise.tools.description'),
            },
            {
              icon: MessageSquare,
              title: t('plans.premium.promise.guidance.title'),
              description: t('plans.premium.promise.guidance.description'),
            },
            {
              icon: Shield,
              title: t('plans.premium.promise.fromDayOne.title'),
              description: t('plans.premium.promise.fromDayOne.description'),
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="p-8 rounded-2xl bg-white border border-[#420c14]/5 shadow-sm"
            >
              <div className="w-12 h-12 rounded-full bg-[#DDA46F]/10 flex items-center justify-center mb-4 mx-auto border border-[#DDA46F]/20">
                <item.icon className="w-5 h-5 text-[#DDA46F]" />
              </div>
              <h3 className="text-lg font-serif text-[#420c14] mb-2">{item.title}</h3>
              <p className="text-sm text-[#420c14]/60 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FEATURES GRID
// ============================================

function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { t } = useTranslation()

  const premiumFeatures = [
    {
      icon: Users,
      title: t('plans.premium.features.items.guests.title'),
      description: t('plans.premium.features.items.guests.description'),
    },
    {
      icon: Send,
      title: t('plans.premium.features.items.invitations.title'),
      description: t('plans.premium.features.items.invitations.description'),
    },
    {
      icon: Gift,
      title: t('plans.premium.features.items.registry.title'),
      description: t('plans.premium.features.items.registry.description'),
    },
    {
      icon: Globe,
      title: t('plans.premium.features.items.domain.title'),
      description: t('plans.premium.features.items.domain.description'),
    },
    {
      icon: Eye,
      title: t('plans.premium.features.items.tracking.title'),
      description: t('plans.premium.features.items.tracking.description'),
    },
    {
      icon: FileText,
      title: t('plans.premium.features.items.reports.title'),
      description: t('plans.premium.features.items.reports.description'),
    },
    {
      icon: Calendar,
      title: t('plans.premium.features.items.forever.title'),
      description: t('plans.premium.features.items.forever.description'),
    },
    {
      icon: Heart,
      title: t('plans.premium.features.items.guidance.title'),
      description: t('plans.premium.features.items.guidance.description'),
    },
  ]

  return (
    <section id="features" ref={ref} className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.premium.features.label')}</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight mb-4">
            {t('plans.premium.features.title')}
          </h2>
          <p className="text-[#420c14]/60 max-w-xl mx-auto">
            {t('plans.premium.features.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {premiumFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="p-6 rounded-2xl border border-[#420c14]/5 hover:border-[#DDA46F]/30 hover:shadow-lg transition-all duration-500 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#DDA46F]/10 flex items-center justify-center mb-4 group-hover:bg-[#DDA46F]/20 transition-colors border border-[#DDA46F]/20">
                <feature.icon className="w-4 h-4 text-[#DDA46F]" />
              </div>
              <h3 className="font-medium text-[#420c14] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#420c14]/50 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// HOW IT WORKS
// ============================================

function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { t } = useTranslation()

  const steps = [
    {
      number: "01",
      title: t('plans.premium.howItWorks.steps.upgrade.title'),
      description: t('plans.premium.howItWorks.steps.upgrade.description'),
    },
    {
      number: "02",
      title: t('plans.premium.howItWorks.steps.access.title'),
      description: t('plans.premium.howItWorks.steps.access.description'),
    },
    {
      number: "03",
      title: t('plans.premium.howItWorks.steps.build.title'),
      description: t('plans.premium.howItWorks.steps.build.description'),
    },
    {
      number: "04",
      title: t('plans.premium.howItWorks.steps.celebrate.title'),
      description: t('plans.premium.howItWorks.steps.celebrate.description'),
    },
  ]

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-[#f5f2eb] relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.premium.howItWorks.label')}</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight">
            {t('plans.premium.howItWorks.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className="text-center"
            >
              <div className="text-5xl font-serif text-[#DDA46F]/20 mb-4">{step.number}</div>
              <h3 className="text-lg font-medium text-[#420c14] mb-2">{step.title}</h3>
              <p className="text-sm text-[#420c14]/50 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// COMPARISON TABLE
// ============================================

function ComparisonSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { t } = useTranslation()

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.premium.comparison.label')}</p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#420c14]">{t('plans.premium.comparison.title')}</h2>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#420c14]/10">
                <th className="text-left py-4 px-4 font-medium text-[#420c14]/60 text-xs uppercase tracking-wider">{t('plans.premium.comparison.feature')}</th>
                <th className="text-center py-4 px-4 font-medium text-[#420c14]/40 text-xs uppercase tracking-wider w-28">Free</th>
                <th className="text-center py-4 px-4 font-medium text-[#DDA46F] text-xs uppercase tracking-wider w-28 bg-[#DDA46F]/5 rounded-t-xl">Premium</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((cat) => (
                <React.Fragment key={cat.category}>
                  <tr>
                    <td colSpan={3} className="pt-6 pb-2 px-4 text-xs tracking-[0.2em] uppercase text-[#420c14]/40 font-medium">
                      {cat.category}
                    </td>
                  </tr>
                  {cat.features.map((f) => (
                    <tr key={f.name} className="border-b border-[#420c14]/5">
                      <td className="py-3 px-4 text-[#420c14]/70">{f.name}</td>
                      <td className="py-3 px-4 text-center">
                        {f.free === true ? <Check className="w-4 h-4 text-green-600 mx-auto" /> :
                         f.free === false ? <span className="text-[#420c14]/20">—</span> :
                         <span className="text-xs text-[#420c14]/50">{f.free}</span>}
                      </td>
                      <td className="py-3 px-4 text-center bg-[#DDA46F]/5">
                        {f.premium === true ? <Check className="w-4 h-4 text-[#DDA46F] mx-auto" /> :
                         f.premium === false ? <span className="text-[#420c14]/20">—</span> :
                         <span className="text-xs font-medium text-[#420c14]">{f.premium}</span>}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

// ============================================
// WHY UPGRADE
// ============================================

function WhyUpgradeSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { t } = useTranslation()

  const reasons = [
    {
      title: t('plans.premium.whyUpgrade.reasons.forever.title'),
      description: t('plans.premium.whyUpgrade.reasons.forever.description'),
    },
    {
      title: t('plans.premium.whyUpgrade.reasons.guestManagement.title'),
      description: t('plans.premium.whyUpgrade.reasons.guestManagement.description'),
    },
    {
      title: t('plans.premium.whyUpgrade.reasons.registry.title'),
      description: t('plans.premium.whyUpgrade.reasons.registry.description'),
    },
    {
      title: t('plans.premium.whyUpgrade.reasons.guidance.title'),
      description: t('plans.premium.whyUpgrade.reasons.guidance.description'),
    },
    {
      title: t('plans.premium.whyUpgrade.reasons.tracking.title'),
      description: t('plans.premium.whyUpgrade.reasons.tracking.description'),
    },
    {
      title: t('plans.premium.whyUpgrade.reasons.pricing.title'),
      description: t('plans.premium.whyUpgrade.reasons.pricing.description', { price: PRICING.premium.priceDisplayMXN }),
    },
  ]

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-[#f5f2eb] relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.premium.whyUpgrade.label')}</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight">
            {t('plans.premium.whyUpgrade.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              className="p-6 bg-white rounded-2xl border border-[#420c14]/5 shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-[#DDA46F]/10 flex items-center justify-center mb-3 border border-[#DDA46F]/20">
                <Check className="w-4 h-4 text-[#DDA46F]" />
              </div>
              <h3 className="font-medium text-[#420c14] mb-2">{reason.title}</h3>
              <p className="text-sm text-[#420c14]/50 leading-relaxed">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// TESTIMONIALS
// ============================================

function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { t } = useTranslation()

  const testimonials = [
    {
      quote: "The guidance from the OhMyWedding team made all the difference. They helped us set up everything and our guests loved the digital invitations.",
      name: "María & Carlos",
      detail: "Wedding in Guadalajara",
    },
    {
      quote: "Being able to track who opened our invitation saved us so much time. We knew exactly who to follow up with. Worth every peso.",
      name: "Ana & Diego",
      detail: "Wedding in Monterrey",
    },
    {
      quote: "The registry feature was incredible. Guests could contribute easily and we didn't have to share our bank details with anyone.",
      name: "Sofía & Andrés",
      detail: "Wedding in CDMX",
    },
  ]

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.premium.testimonials.label')}</p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#420c14]">{t('plans.premium.testimonials.title')}</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className="p-8 rounded-2xl bg-[#f5f2eb] border border-[#420c14]/5"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-[#DDA46F] fill-[#DDA46F]" />
                ))}
              </div>
              <p className="text-[#420c14]/70 leading-relaxed mb-6 italic">&ldquo;{item.quote}&rdquo;</p>
              <div>
                <p className="font-medium text-[#420c14] text-sm">{item.name}</p>
                <p className="text-xs text-[#420c14]/40">{item.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FAQ
// ============================================

function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { t, locale } = useTranslation()
  const translations = getTranslations(locale)

  const faqs = translations.plans.premium.faq.items.map((item) => ({
    q: item.q,
    a: item.a.replace('{{price}}', PRICING.premium.priceDisplayMXN),
  }))

  return (
    <section id="faq" ref={ref} className="py-20 sm:py-32 bg-[#f5f2eb] relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.premium.faq.label')}</p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#420c14]">{t('plans.premium.faq.title')}</h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              className="group bg-white rounded-xl border border-[#420c14]/5 overflow-hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer p-5 text-[#420c14] font-medium text-sm hover:bg-[#DDA46F]/5 transition-colors list-none">
                {faq.q}
                <ChevronDown className="w-4 h-4 text-[#420c14]/40 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
              </summary>
              <div className="px-5 pb-5 text-sm text-[#420c14]/60 leading-relaxed">
                {faq.a}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// DELUXE UPSELL
// ============================================

function DeluxeUpsellSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { t } = useTranslation()

  return (
    <section ref={ref} className="py-20 sm:py-24 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-br from-[#420c14] to-[#5a1a22] rounded-3xl p-10 sm:p-14 text-center border border-[#DDA46F]/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#DDA46F]/5 blur-3xl" />
          <div className="relative z-10">
            <Crown className="w-10 h-10 text-[#DDA46F] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-serif text-[#f5f2eb] mb-4">
              {t('plans.premium.deluxeUpsell.title')}
            </h2>
            <p className="text-[#f5f2eb]/60 max-w-lg mx-auto mb-6 leading-relaxed">
              {t('plans.premium.deluxeUpsell.description')}
            </p>
            <p className="text-2xl font-serif text-[#DDA46F] mb-6">{PRICING.deluxe.priceDisplayMXN}</p>
            <Link href="/deluxe">
              <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] px-8 py-5 rounded-full font-medium">
                {t('plans.common.learnAboutDeluxe')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================
// FINAL CTA
// ============================================

function FinalCTASection() {
  const { t } = useTranslation()

  return (
    <section className="py-20 sm:py-32 bg-gradient-to-b from-[#420c14] to-[#5a1a22] relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-5xl font-serif text-[#f5f2eb] mb-6">
            {t('plans.premium.finalCta.title')}{" "}
            <span className="text-[#DDA46F] italic">{t('plans.premium.finalCta.highlight')}</span>?
          </h2>
          <p className="text-lg text-[#f5f2eb]/50 mb-4">
            {PRICING.premium.priceDisplayMXN} • {t('plans.common.oneTimePayment')} • {t('plans.common.yoursForever')}
          </p>
          <p className="text-sm text-[#f5f2eb]/30 mb-10">
            {t('plans.premium.finalCta.description')}
          </p>
          <Link href="/upgrade?plan=premium&source=premium_page_cta">
            <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] text-lg px-12 py-7 rounded-full font-medium shadow-xl shadow-[#DDA46F]/20">
              {t('plans.common.upgradeToPremuim')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================
// FOOTER
// ============================================

function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-[#420c14] border-t border-[#DDA46F]/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Image src="/images/logos/OMW Logo Gold.png" alt="OhMyWedding" width={32} height={32} className="h-8 w-auto" />
          <span className="font-serif text-xl text-[#f5f2eb]">OhMyWedding</span>
        </div>
        <p className="text-[#f5f2eb]/30 text-sm">
          © {new Date().getFullYear()} OhMyWedding. {t('plans.common.madeWith')}{" "}
          <Heart className="w-3 h-3 inline text-[#DDA46F] fill-[#DDA46F] mx-0.5" />{" "}
          for couples in love.
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-[#f5f2eb]/20">
          <Link href="/privacy" className="hover:text-[#DDA46F] transition-colors">{t('plans.common.privacy')}</Link>
          <Link href="/terms" className="hover:text-[#DDA46F] transition-colors">{t('plans.common.terms')}</Link>
          <Link href="/" className="hover:text-[#DDA46F] transition-colors">{t('plans.common.home')}</Link>
        </div>
      </div>
    </footer>
  )
}

// ============================================
// HEADER
// ============================================

function SimpleHeader() {
  const { t } = useTranslation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#420c14]/90 backdrop-blur-xl border-b border-[#DDA46F]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logos/OMW Logo Gold.png" alt="OhMyWedding" width={28} height={28} className="h-7 w-auto" />
          <span className="font-serif text-lg text-[#f5f2eb]">OhMyWedding</span>
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher variant="pill" />
          <Link href="/deluxe" className="text-xs text-[#f5f2eb]/50 hover:text-[#DDA46F] transition-colors hidden sm:block">
            {t('plans.common.learnAboutDeluxe')}
          </Link>
          <Link href="/upgrade?plan=premium&source=premium_page_nav">
            <Button size="sm" className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] rounded-full text-xs px-5">
              {t('plans.common.upgradeToPremuim')}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

// ============================================
// MAIN PAGE
// ============================================

export default function PremiumPlanPage() {
  return (
    <main className="min-h-screen bg-[#f5f2eb]">
      <SimpleHeader />
      <HeroSection />
      <PromiseSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ComparisonSection />
      <WhyUpgradeSection />
      <TestimonialsSection />
      <FAQSection />
      <DeluxeUpsellSection />
      <FinalCTASection />
      <Footer />
    </main>
  )
}

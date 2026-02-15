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
  Crown,
  Palette,
  Clock,
  Headphones,
  Gem,
  Layers,
  Calendar,
  FileText,
  BarChart3,
  Infinity,
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a0a0d] via-[#420c14] to-[#1a0a0d]">
      {/* Decorative gold elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-[5%] w-[500px] h-[500px] rounded-full bg-[#DDA46F]/3 blur-[120px]" />
        <div className="absolute bottom-1/4 right-[10%] w-[400px] h-[400px] rounded-full bg-[#DDA46F]/4 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#DDA46F]/2 blur-[200px]" />
      </div>

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[url('/images/pattern-subtle.png')] opacity-5" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-[#DDA46F]" />
            <p className="text-[10px] sm:text-xs tracking-[0.5em] text-[#DDA46F] uppercase font-medium">
              {t('plans.deluxe.label')}
            </p>
            <Crown className="w-5 h-5 text-[#DDA46F]" />
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif text-[#f5f2eb] leading-[1.05] mb-8">
            {t('plans.deluxe.heroTitle')}{" "}
            <span className="block text-[#DDA46F] italic">{t('plans.deluxe.heroHighlight')}</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#f5f2eb]/50 max-w-2xl mx-auto leading-relaxed mb-4">
            {t('plans.deluxe.heroDescription')}
          </p>

          <p className="text-4xl sm:text-5xl font-serif text-[#DDA46F] mb-2">
            {PRICING.deluxe.priceDisplayMXN}
          </p>
          <p className="text-sm text-[#f5f2eb]/30 mb-12">{t('plans.common.oneTimePayment')} • {t('plans.common.completelyPersonalized')} • {t('plans.common.yoursForever')}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/upgrade?plan=deluxe&source=deluxe_page_hero">
              <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] text-base px-12 py-7 rounded-full font-medium shadow-xl shadow-[#DDA46F]/20 border border-[#DDA46F]/50">
                {t('plans.common.getDeluxe')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#experience" className="text-[#f5f2eb]/40 hover:text-[#DDA46F] transition-colors text-sm flex items-center gap-2">
              {t('plans.common.discoverExperience')}
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#f5f2eb] to-transparent" />
    </section>
  )
}

// ============================================
// THE DELUXE DIFFERENCE
// ============================================

function DifferenceSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t } = useTranslation()

  return (
    <section id="experience" ref={ref} className="py-24 sm:py-36 bg-[#f5f2eb] relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.deluxe.difference.label')}</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight mb-6">
            {t('plans.deluxe.difference.title')}<br />
            <span className="text-[#DDA46F]">{t('plans.deluxe.difference.highlight')}</span>
          </h2>
          <p className="text-lg text-[#420c14]/50 max-w-2xl mx-auto leading-relaxed">
            {t('plans.deluxe.difference.description')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: Palette,
              title: t('plans.deluxe.difference.items.design.title'),
              description: t('plans.deluxe.difference.items.design.description'),
              accent: true,
            },
            {
              icon: Layers,
              title: t('plans.deluxe.difference.items.components.title'),
              description: t('plans.deluxe.difference.items.components.description'),
              accent: false,
            },
            {
              icon: Headphones,
              title: t('plans.deluxe.difference.items.agent.title'),
              description: t('plans.deluxe.difference.items.agent.description'),
              accent: false,
            },
            {
              icon: Gem,
              title: t('plans.deluxe.difference.items.detail.title'),
              description: t('plans.deluxe.difference.items.detail.description'),
              accent: true,
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className={`p-8 sm:p-10 rounded-2xl border ${
                item.accent
                  ? "bg-[#420c14] border-[#DDA46F]/20"
                  : "bg-white border-[#420c14]/5"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 ${
                item.accent
                  ? "bg-[#DDA46F]/10 border border-[#DDA46F]/30"
                  : "bg-[#DDA46F]/10 border border-[#DDA46F]/20"
              }`}>
                <item.icon className={`w-5 h-5 ${item.accent ? "text-[#DDA46F]" : "text-[#DDA46F]"}`} />
              </div>
              <h3 className={`text-xl font-serif mb-3 ${item.accent ? "text-[#f5f2eb]" : "text-[#420c14]"}`}>
                {item.title}
              </h3>
              <p className={`text-sm leading-relaxed ${item.accent ? "text-[#f5f2eb]/60" : "text-[#420c14]/50"}`}>
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// EVERYTHING INCLUDED
// ============================================

const featureIcons = [
  { icon: Palette, key: 'personalizedDesign' as const },
  { icon: Layers, key: 'customComponents' as const },
  { icon: Headphones, key: 'dedicatedAgent' as const },
  { icon: Users, key: 'unlimitedGuests' as const },
  { icon: Send, key: 'invitations' as const },
  { icon: Gift, key: 'registry' as const },
  { icon: Globe, key: 'customDomain' as const },
  { icon: Eye, key: 'activityTracking' as const },
  { icon: BarChart3, key: 'dailyReports' as const },
  { icon: Shield, key: 'prioritySupport' as const },
  { icon: Calendar, key: 'websiteForever' as const },
  { icon: Sparkles, key: 'weBuildEverything' as const },
]

function EverythingIncludedSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { t } = useTranslation()

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.deluxe.features.label')}</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight mb-4">
            {t('plans.deluxe.features.title')}
          </h2>
          <p className="text-[#420c14]/50 max-w-xl mx-auto">
            {t('plans.deluxe.features.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureIcons.map((feature, i) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.06 }}
              className="p-6 rounded-2xl border border-[#420c14]/5 hover:border-[#DDA46F]/30 hover:shadow-lg transition-all duration-500 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#DDA46F]/10 flex items-center justify-center mb-4 group-hover:bg-[#DDA46F]/20 transition-colors border border-[#DDA46F]/20">
                <feature.icon className="w-4 h-4 text-[#DDA46F]" />
              </div>
              <h3 className="font-medium text-[#420c14] mb-2">{t(`plans.deluxe.features.items.${feature.key}.title`)}</h3>
              <p className="text-sm text-[#420c14]/50 leading-relaxed">{t(`plans.deluxe.features.items.${feature.key}.description`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// THE PROCESS
// ============================================

function ProcessSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  const steps = [
    {
      number: "01",
      title: "Discovery",
      description: "We start with a conversation. Tell us about your love story, your style, your vision. We listen to every detail.",
    },
    {
      number: "02",
      title: "Design",
      description: "Our team creates a bespoke design concept based on your vision. We iterate until every detail is exactly right.",
    },
    {
      number: "03",
      title: "Build",
      description: "We hand-build your wedding page with custom components, animations, and interactions. Every pixel is crafted with care.",
    },
    {
      number: "04",
      title: "Review",
      description: "You review the final result. We refine anything you'd like adjusted — your satisfaction is our priority.",
    },
    {
      number: "05",
      title: "Launch",
      description: "We launch your website, set up invitations, and make sure everything is perfect. Then we stay available until your big day and beyond.",
    },
  ]

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-[#f5f2eb] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">The Journey</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight mb-4">
            How We Work Together
          </h2>
          <p className="text-[#420c14]/50 max-w-xl mx-auto">
            From first conversation to the big day — here&apos;s what the Deluxe experience looks like
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-[#DDA46F]/20 hidden sm:block" />

          <div className="space-y-8 sm:space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className="flex gap-4 sm:gap-8"
              >
                <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#420c14] border-2 border-[#DDA46F]/30 flex items-center justify-center relative z-10">
                  <span className="text-sm sm:text-lg font-serif text-[#DDA46F]">{step.number}</span>
                </div>
                <div className="pt-1 sm:pt-3">
                  <h3 className="text-xl font-serif text-[#420c14] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#420c14]/50 leading-relaxed max-w-md">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// PREMIUM VS DELUXE COMPARISON
// ============================================

function PlanComparisonSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { t } = useTranslation()

  const aspectKeys = ['whoBuilds', 'designApproach', 'components', 'support', 'guestLimit', 'activityTracking', 'reports'] as const

  const differences = [
    ...aspectKeys.map(key => ({
      aspect: t(`plans.deluxe.comparison.aspects.${key}.label`),
      premium: t(`plans.deluxe.comparison.aspects.${key}.premium`),
      deluxe: t(`plans.deluxe.comparison.aspects.${key}.deluxe`),
    })),
    {
      aspect: t('plans.deluxe.comparison.aspects.price.label'),
      premium: PRICING.premium.priceDisplayMXN,
      deluxe: PRICING.deluxe.priceDisplayMXN,
    },
  ]

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.deluxe.comparison.label')}</p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#420c14] mb-4">{t('plans.deluxe.comparison.title')}</h2>
          <p className="text-[#420c14]/50 max-w-md mx-auto">
            {t('plans.deluxe.comparison.description')}
          </p>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#420c14]/10">
                <th className="text-left py-4 px-4 font-medium text-[#420c14]/60 text-xs uppercase tracking-wider" />
                <th className="text-center py-4 px-4 font-medium text-[#420c14]/50 text-xs uppercase tracking-wider w-40">Premium</th>
                <th className="text-center py-4 px-4 font-medium text-[#DDA46F] text-xs uppercase tracking-wider w-40 bg-[#DDA46F]/5 rounded-t-xl">
                  <Crown className="w-3 h-3 mx-auto mb-1" />
                  Deluxe
                </th>
              </tr>
            </thead>
            <tbody>
              {differences.map((d, i) => (
                <motion.tr
                  key={d.aspect}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                  className="border-b border-[#420c14]/5"
                >
                  <td className="py-4 px-4 text-[#420c14]/70 font-medium">{d.aspect}</td>
                  <td className="py-4 px-4 text-center text-[#420c14]/50 text-xs">{d.premium}</td>
                  <td className="py-4 px-4 text-center text-[#420c14] font-medium text-xs bg-[#DDA46F]/5">{d.deluxe}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href="/upgrade?plan=deluxe&source=deluxe_page_comparison">
            <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] px-8 py-5 rounded-full font-medium">
              {t('plans.common.getDeluxe')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/premium" className="text-sm text-[#420c14]/40 hover:text-[#DDA46F] transition-colors">
            {t('plans.common.learnAboutPremium')}
          </Link>
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
  const { t, locale } = useTranslation()
  const translations = getTranslations(locale)
  const testimonials = translations.plans.deluxe.testimonials.items

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-[#f5f2eb] relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.deluxe.testimonials.label')}</p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#420c14]">{t('plans.deluxe.testimonials.title')}</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className="p-8 rounded-2xl bg-white border border-[#420c14]/5 shadow-sm"
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
// FOR WHO
// ============================================

function ForWhoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { t } = useTranslation()

  const profileKeys = ['busy', 'designLovers', 'destination', 'large'] as const

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-white relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.deluxe.forWho.label')}</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#420c14] leading-tight">
            {t('plans.deluxe.forWho.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {profileKeys.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="flex gap-4 p-6 rounded-2xl bg-[#f5f2eb] border border-[#420c14]/5"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#DDA46F]/10 flex items-center justify-center border border-[#DDA46F]/20">
                <Check className="w-4 h-4 text-[#DDA46F]" />
              </div>
              <div>
                <h3 className="font-medium text-[#420c14] mb-1">{t(`plans.deluxe.forWho.profiles.${key}.title`)}</h3>
                <p className="text-sm text-[#420c14]/50 leading-relaxed">{t(`plans.deluxe.forWho.profiles.${key}.description`)}</p>
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
  const faqs = translations.plans.deluxe.faq.items.map(item => ({
    q: item.q,
    a: item.a.replace('{{price}}', PRICING.deluxe.priceDisplayMXN),
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
          <p className="text-[10px] tracking-[0.4em] text-[#DDA46F] uppercase mb-4">{t('plans.deluxe.faq.label')}</p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#420c14]">{t('plans.deluxe.faq.title')}</h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.04 }}
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
// FINAL CTA
// ============================================

function FinalCTASection() {
  const { t } = useTranslation()
  return (
    <section className="py-24 sm:py-36 bg-gradient-to-b from-[#1a0a0d] via-[#420c14] to-[#1a0a0d] relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#DDA46F]/5 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Crown className="w-10 h-10 text-[#DDA46F] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif text-[#f5f2eb] mb-6 leading-tight">
            {t('plans.deluxe.finalCta.title')}{" "}
            <span className="text-[#DDA46F] italic">{t('plans.deluxe.finalCta.highlight')}</span>{" "}
            {t('plans.deluxe.finalCta.subtitle')}
          </h2>
          <p className="text-lg text-[#f5f2eb]/40 mb-4 max-w-xl mx-auto">
            {t('plans.deluxe.finalCta.description')}
          </p>
          <p className="text-3xl sm:text-4xl font-serif text-[#DDA46F] mb-2">
            {PRICING.deluxe.priceDisplayMXN}
          </p>
          <p className="text-sm text-[#f5f2eb]/30 mb-12">{t('plans.common.oneTimePayment')} • {t('plans.common.completelyPersonalized')} • {t('plans.common.yoursForever')}</p>
          <Link href="/upgrade?plan=deluxe&source=deluxe_page_cta">
            <Button className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] text-lg px-14 py-7 rounded-full font-medium shadow-xl shadow-[#DDA46F]/20 border border-[#DDA46F]/50">
              {t('plans.common.getDeluxe')}
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
    <footer className="bg-[#1a0a0d] border-t border-[#DDA46F]/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Image src="/images/logos/OMW Logo Gold.png" alt="OhMyWedding" width={32} height={32} className="h-8 w-auto" />
          <span className="font-serif text-xl text-[#f5f2eb]">OhMyWedding</span>
        </div>
        <p className="text-[#f5f2eb]/30 text-sm">
          © {new Date().getFullYear()} OhMyWedding. {t('plans.common.madeWith')}{" "}
          <Heart className="w-3 h-3 inline text-[#DDA46F] fill-[#DDA46F] mx-0.5" />{" "}
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a0a0d]/90 backdrop-blur-xl border-b border-[#DDA46F]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logos/OMW Logo Gold.png" alt="OhMyWedding" width={28} height={28} className="h-7 w-auto" />
          <span className="font-serif text-lg text-[#f5f2eb]">OhMyWedding</span>
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher variant="pill" />
          <Link href="/premium" className="text-xs text-[#f5f2eb]/50 hover:text-[#DDA46F] transition-colors hidden sm:block">
            {t('plans.common.learnAboutPremium')}
          </Link>
          <Link href="/upgrade?plan=deluxe&source=deluxe_page_nav">
            <Button size="sm" className="bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] rounded-full text-xs px-5 border border-[#DDA46F]/50">
              <Crown className="w-3 h-3 mr-1" />
              {t('plans.common.getDeluxe')}
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

export default function DeluxePlanPage() {
  return (
    <main className="min-h-screen bg-[#f5f2eb]">
      <SimpleHeader />
      <HeroSection />
      <DifferenceSection />
      <EverythingIncludedSection />
      <ProcessSection />
      <ForWhoSection />
      <PlanComparisonSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </main>
  )
}

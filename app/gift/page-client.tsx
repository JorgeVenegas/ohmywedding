"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { INVITATION_PRICING, MANAGEMENT_PRICING } from "@/lib/subscription-shared"
import { motion } from "framer-motion"
import { Gift, Loader2, Copy, Heart } from "lucide-react"
import { Header } from "@/components/header"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { PricingTierCard } from "@/components/ui/pricing-tier-card"
import { useI18n } from "@/components/contexts/i18n-context"
import { resolveBackHref, withLandingSource } from "@/lib/landing-source"

type GiftPlanType = 'invitation_basic' | 'premium' | 'deluxe' | 'management_basic' | 'management_pro' | 'management_agency'

const INVITATION_GIFT_TIERS = [
  { tierKey: 'basic'        as const, planType: 'invitation_basic' as GiftPlanType                    },
  { tierKey: 'personalized' as const, planType: 'premium'          as GiftPlanType, isFeatured: true  },
  { tierKey: 'bespoke'      as const, planType: 'deluxe'           as GiftPlanType, isTop: true       },
]

const MANAGEMENT_GIFT_TIERS = [
  { tierKey: 'basic'  as const, planType: 'management_basic'  as GiftPlanType                    },
  { tierKey: 'pro'    as const, planType: 'management_pro'    as GiftPlanType, isFeatured: true  },
  { tierKey: 'agency' as const, planType: 'management_agency' as GiftPlanType, isTop: true       },
]

function GiftPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, translations } = useI18n()

  const [processingPlan, setProcessingPlan] = useState<GiftPlanType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const landingSource = searchParams.get('from')
  const weddingIdParam = searchParams.get('weddingId')
  const backHref = resolveBackHref({ weddingId: weddingIdParam, from: landingSource }, 'pricing')

  const G = translations.gift
  const invTiers = translations.landing.pricing.tiers.invitation
  const mgmtTiers = translations.landing.pricing.tiers.management

  const handleGiftCheckout = async (planType: GiftPlanType) => {
    setError(null)

    if (!user) {
      const redirectParams = new URLSearchParams(searchParams.toString())
      redirectParams.set('plan', planType)
      router.push(`/login?redirect=${encodeURIComponent(`/gift?${redirectParams.toString()}`)}`)
      return
    }

    setProcessingPlan(planType)

    try {
      const res = await fetch('/api/gift/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || G.errorGeneric)
        setProcessingPlan(null)
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      setError(G.errorGeneric)
      setProcessingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      <Header
        showBackButton
        backHref={backHref}
        rightContent={<LanguageSwitcher variant="buttons" className="text-[#420c14]" textColor="#420c14" />}
      />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-[10%] w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-[#DDA46F]/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-[10%] w-48 sm:w-80 h-48 sm:h-80 rounded-full bg-[#420c14]/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#420c14]/10 mb-6">
            <Gift className="w-7 h-7 text-[#420c14]" />
          </div>
          <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
            {G.label}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-[#420c14] mb-6 leading-tight">
            <span className="font-serif font-light">{G.title}</span>
            <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.4em] ml-2 block sm:inline">{G.titleHighlight}</span>
          </h1>
          <p className="text-[#420c14]/60 text-sm sm:text-base max-w-xl mx-auto">
            {G.description}
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Invitation Design */}
        <div className="mb-12 sm:mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center text-[10px] sm:text-xs tracking-[0.25em] uppercase text-[#420c14]/40 mb-6"
          >
            {t('upgradeModal.invitationAxis')}
          </motion.p>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {INVITATION_GIFT_TIERS.map(({ tierKey, planType, isFeatured, isTop }, index) => {
              const tier = invTiers[tierKey]
              const pricing = INVITATION_PRICING[tierKey]
              return (
                <PricingTierCard
                  key={tierKey}
                  name={tier.name}
                  tagline={tier.tagline}
                  description={tier.description}
                  priceDisplay={pricing.priceDisplayMXN}
                  period={tier.period}
                  features={tier.features}
                  isFeatured={isFeatured}
                  isTop={isTop}
                  mostPopularLabel={t('upgrade.mostPopular')}
                  luxuryLabel={t('upgrade.luxury')}
                  ctaLabel={t('gift.giftPlan', { plan: tier.name })}
                  loading={processingPlan === planType}
                  disabled={authLoading || (processingPlan !== null && processingPlan !== planType)}
                  onClick={() => handleGiftCheckout(planType)}
                  delay={index * 0.15}
                />
              )
            })}
          </div>
        </div>

        {/* Wedding Management */}
        <div className="mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center text-[10px] sm:text-xs tracking-[0.25em] uppercase text-[#420c14]/40 mb-6"
          >
            {t('upgradeModal.managementAxis')}
          </motion.p>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {MANAGEMENT_GIFT_TIERS.map(({ tierKey, planType, isFeatured, isTop }, index) => {
              const tier = mgmtTiers[tierKey]
              const pricing = MANAGEMENT_PRICING[tierKey]
              return (
                <PricingTierCard
                  key={tierKey}
                  name={tier.name}
                  tagline={tier.tagline}
                  description={tier.description}
                  priceDisplay={pricing.priceDisplayMXN}
                  period={tier.period}
                  features={tier.features}
                  isFeatured={isFeatured}
                  isTop={isTop}
                  mostPopularLabel={t('upgrade.mostPopular')}
                  luxuryLabel={t('upgrade.luxury')}
                  ctaLabel={t('gift.giftPlan', { plan: tier.name })}
                  loading={processingPlan === planType}
                  disabled={authLoading || (processingPlan !== null && processingPlan !== planType)}
                  onClick={() => handleGiftCheckout(planType)}
                  delay={0.3 + index * 0.15}
                />
              )
            })}
          </div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-3xl mx-auto bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 border border-[#420c14]/10 shadow-xl shadow-[#420c14]/5"
        >
          <h2 className="text-xl sm:text-2xl font-serif text-[#420c14] mb-8 text-center">{G.howItWorks}</h2>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: <Gift className="w-6 h-6" />,  title: G.steps.purchase.title,  desc: G.steps.purchase.desc  },
              { icon: <Copy className="w-6 h-6" />,   title: G.steps.share.title,     desc: G.steps.share.desc     },
              { icon: <Heart className="w-6 h-6" />, title: G.steps.celebrate.title, desc: G.steps.celebrate.desc },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#420c14]/8 flex items-center justify-center text-[#420c14]">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-[#420c14] text-sm">{step.title}</h3>
                <p className="text-[#420c14]/60 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center text-[#420c14]/40 text-xs mt-8"
        >
          {G.upgradingOwn}{' '}
          <Link
            href={weddingIdParam ? `/upgrade?weddingId=${encodeURIComponent(weddingIdParam)}` : withLandingSource('/upgrade', landingSource)}
            className="underline hover:text-[#420c14]/70 transition-colors"
          >
            {G.goToUpgrade}
          </Link>
        </motion.p>
      </div>
    </div>
  )
}

export default function GiftPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f2eb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#420c14]" />
      </div>
    }>
      <GiftPageContent />
    </Suspense>
  )
}

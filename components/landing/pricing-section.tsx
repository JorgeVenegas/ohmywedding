'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Gift, Sparkles, Crown, Check, Tag, CreditCard, Loader2, X, AlertCircle } from 'lucide-react'
import { useI18n } from '@/components/contexts/i18n-context'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { PLAN_CARDS, PRICING } from '@/lib/subscription-shared'
import { useGlobalDiscount } from '@/hooks/use-global-discount'
import type { DiscountPlan, PaymentMethod } from '@/hooks/use-global-discount'
import { PromoPriceDisplay, PromoPriceInline } from '@/components/ui/promo-price-display'
import { useAuth } from '@/hooks/use-auth'

export function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t, translations } = useI18n()
  const router = useRouter()
  const { user } = useAuth()
  const [giftMode, setGiftMode] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [checkoutLoading, setCheckoutLoading] = useState<DiscountPlan | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [weddingSelectModal, setWeddingSelectModal] = useState<{
    plan: DiscountPlan
    weddings: Array<{ id: string; wedding_name_id: string; partner1_first_name?: string; partner2_first_name?: string }>
  } | null>(null)
  const { discount, getDiscountedPrice, getDiscountPercent, appliesToPlan } = useGlobalDiscount()

  // Use selected payment method for discount display
  const displayMethod = paymentMethod

  const PLAN_LEVELS: Record<string, number> = { free: 0, premium: 1, deluxe: 2 }

  const handleCheckout = async (plan: DiscountPlan) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/upgrade?plan=${plan}&paymentMethod=${paymentMethod}&autoCheckout=1&source=landing_pricing`)}`)
      return
    }
    setCheckoutError(null)
    setCheckoutLoading(plan)
    try {
      const res = await fetch('/api/weddings')
      const data = await res.json()
      const weddings: Array<{ id: string; wedding_name_id: string; plan?: string; partner1_first_name?: string; partner2_first_name?: string }> = data.weddings || []
      if (weddings.length === 0) {
        // No wedding yet — send to create one, then they can upgrade
        router.push(`/create-wedding?plan=${plan}&source=landing_pricing`)
        return
      }
      const eligible = weddings.filter(w => (PLAN_LEVELS[w.plan || 'free'] || 0) < (PLAN_LEVELS[plan] || 0))
      if (eligible.length === 0) {
      setCheckoutError(t('landing.pricing.errors.alreadyOnPlan'))
        setCheckoutLoading(null)
        return
      }
      if (eligible.length === 1) {
        await proceedToCheckout(plan, eligible[0].id)
        return
      }
      setWeddingSelectModal({ plan, weddings: eligible })
      setCheckoutLoading(null)
    } catch {
      setCheckoutError(t('landing.pricing.errors.tryAgain'))
      setCheckoutLoading(null)
    }
  }

  const proceedToCheckout = async (plan: DiscountPlan, weddingId: string) => {
    setCheckoutLoading(plan)
    setWeddingSelectModal(null)
    try {
      const res = await fetch(`/api/weddings/${weddingId}/subscription/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: plan, paymentMethod, source: 'landing_pricing' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (data.url) window.location.href = data.url
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : t('landing.pricing.errors.tryAgain'))
      setCheckoutLoading(null)
    }
  }

  const P = translations.landing.pricing

  const plans = [
    {
      name: t('landing.pricing.free'), price: PLAN_CARDS.free.price, period: P.plans.free.period,
      priceCents: PRICING.free.price_mxn, plan: 'free' as const,
      description: P.plans.free.description,
      features: P.plans.free.features.map(text => ({ text, included: true })),
      cta: P.plans.free.cta, href: PLAN_CARDS.free.href, featured: false,
    },
    {
      name: t('landing.pricing.premium'), price: PLAN_CARDS.premium.price, period: P.plans.premium.period,
      priceCents: PRICING.premium.price_mxn, plan: 'premium' as const,
      tagline: PLAN_CARDS.premium.tagline, description: P.plans.premium.description,
      features: P.plans.premium.features.map(text => ({ text, included: true })),
      cta: giftMode ? P.plans.premium.giftCta : P.plans.premium.cta,
      href: giftMode ? `/gift?plan=premium&paymentMethod=${paymentMethod}&source=landing` : `/upgrade?source=landing_pricing_premium`,
      featured: true,
    },
    {
      name: t('landing.pricing.deluxe'), price: PLAN_CARDS.deluxe.price, period: P.plans.deluxe.period,
      priceCents: PRICING.deluxe.price_mxn, plan: 'deluxe' as const,
      tagline: PLAN_CARDS.deluxe.tagline, description: P.plans.deluxe.description,
      features: P.plans.deluxe.features.map(text => ({ text, included: true })),
      cta: giftMode ? P.plans.deluxe.giftCta : P.plans.deluxe.cta,
      href: giftMode ? `/gift?plan=deluxe&paymentMethod=${paymentMethod}&source=landing` : `/upgrade?plan=deluxe&source=landing_pricing_deluxe`,
      featured: false, isDeluxe: true,
    },
  ]

  const comparisonFeatures = [
    { category: P.comparison.categories.coreFeatures, features: [
      { name: P.comparison.featureNames.weddingWebsite, free: true, premium: true, deluxe: true },
      { name: P.comparison.featureNames.photoGallery, free: true, premium: true, deluxe: true },
      { name: P.comparison.featureNames.eventSchedule, free: true, premium: true, deluxe: true },
      { name: P.comparison.featureNames.giftRegistryLinks, free: true, premium: true, deluxe: true },
      { name: P.comparison.featureNames.websitePermanence, free: P.comparison.values.sixMonths, premium: P.comparison.values.forever, deluxe: P.comparison.values.forever },
    ]},
    { category: P.comparison.categories.guestManagement, features: [
      { name: P.comparison.featureNames.guestLimit, free: '100', premium: '250', deluxe: P.comparison.values.unlimited },
      { name: P.comparison.featureNames.guestGroups, free: '15', premium: P.comparison.values.unlimited, deluxe: P.comparison.values.unlimited },
      { name: P.comparison.featureNames.advancedRsvp, free: false, premium: true, deluxe: true },
      { name: P.comparison.featureNames.activityTracking, free: P.comparison.values.lastThree, premium: P.comparison.values.oneWeek, deluxe: P.comparison.values.unlimited },
    ]},
    { category: P.comparison.categories.registryPayments, features: [
      { name: P.comparison.featureNames.bespokeRegistry, free: false, premium: true, deluxe: true },
      { name: P.comparison.featureNames.noAccountSharing, free: false, premium: true, deluxe: true },
      { name: P.comparison.featureNames.registryCommission, free: '—', premium: '20 MXN', deluxe: '10 MXN' },
    ]},
    { category: P.comparison.categories.invitationsCommunication, features: [
      { name: P.comparison.featureNames.digitalInvitations, free: false, premium: true, deluxe: true },
      { name: P.comparison.featureNames.invitationTracking, free: false, premium: true, deluxe: true },
      { name: P.comparison.featureNames.whatsappAutomation, free: false, premium: false, deluxe: true },
      { name: P.comparison.featureNames.messageTemplates, free: false, premium: true, deluxe: true },
    ]},
    { category: P.comparison.categories.customizationDesign, features: [
      { name: P.comparison.featureNames.personalizedSubdomain, free: false, premium: true, deluxe: true },
      { name: P.comparison.featureNames.customDomain, free: false, premium: true, deluxe: true },
      { name: P.comparison.featureNames.activityReports, free: false, premium: P.comparison.values.weekly, deluxe: P.comparison.values.daily },
      { name: P.comparison.featureNames.bespokeSections, free: false, premium: false, deluxe: true },
      { name: P.comparison.featureNames.bespokePage, free: false, premium: false, deluxe: true },
      { name: P.comparison.featureNames.seatingChart, free: false, premium: false, deluxe: true },
    ]},
    { category: P.comparison.categories.experienceSupport, features: [
      { name: P.comparison.featureNames.emailSupport, free: true, premium: true, deluxe: true },
      { name: P.comparison.featureNames.expertGuidance, free: false, premium: true, deluxe: true },
      { name: P.comparison.featureNames.dedicatedAgent, free: false, premium: false, deluxe: true },
      { name: P.comparison.featureNames.weDesign, free: false, premium: false, deluxe: true },
    ]},
  ]

  return (
    <section id="pricing" ref={ref} className="py-20 sm:py-40 bg-[#f5f2eb] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2 }}
          className="text-center mb-12 sm:mb-24"
        >
          <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
            {t('landing.pricing.label')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-[#420c14] mb-6 sm:mb-8 leading-tight">
            <span className="font-serif font-light">{t('landing.pricing.title')}</span>
            <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] ml-2 sm:ml-4">{t('landing.pricing.subtitle')}</span>
          </h2>
          <p className="text-[#420c14]/60 text-sm sm:text-lg max-w-2xl mx-auto px-2">
            {t('landing.pricing.description')}
          </p>
        </motion.div>

        {/* Gift toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center rounded-full bg-white border border-[#420c14]/10 shadow-sm p-1">
            <button
              onClick={() => setGiftMode(false)}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                !giftMode ? 'bg-[#420c14] text-white shadow-sm' : 'text-[#420c14]/60 hover:text-[#420c14]'
              }`}
            >
              {t('landing.pricing.forMe')}
            </button>
            <button
              onClick={() => setGiftMode(true)}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                giftMode ? 'bg-[#DDA46F] text-white shadow-sm' : 'text-[#420c14]/60 hover:text-[#420c14]'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              {t('landing.pricing.asGift')}
            </button>
          </div>
        </motion.div>

        {/* Payment Method Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex justify-center mb-6 sm:mb-8"
        >
          <div>
            <p className="text-center text-[10px] text-[#420c14]/40 mb-2 tracking-wider uppercase">{t('landing.pricing.paymentMethod')}</p>
            <div className="inline-flex items-center rounded-xl bg-white border border-[#420c14]/10 shadow-sm p-1 gap-1">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  paymentMethod === 'card'
                    ? 'bg-[#420c14] text-white shadow-sm'
                    : 'text-[#420c14]/60 hover:text-[#420c14] hover:bg-[#420c14]/5'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                {t('landing.pricing.card')}
                {discount && getDiscountPercent('premium', 'card') > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    paymentMethod === 'card' ? 'bg-green-500/20 text-green-300' : 'bg-green-50 text-green-600'
                  }`}>
                    -{getDiscountPercent('premium', 'card')}%
                  </span>
                )}
              </button>
              <button
                onClick={() => setPaymentMethod('msi')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  paymentMethod === 'msi'
                    ? 'bg-[#420c14] text-white shadow-sm'
                    : 'text-[#420c14]/60 hover:text-[#420c14] hover:bg-[#420c14]/5'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                3 o 6 MSI
                {discount && getDiscountPercent('premium', 'msi') > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    paymentMethod === 'msi' ? 'bg-green-500/20 text-green-300' : 'bg-green-50 text-green-600'
                  }`}>
                    -{getDiscountPercent('premium', 'msi')}%
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error message */}
        {checkoutError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{checkoutError}</span>
            <button onClick={() => setCheckoutError(null)} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: index * 0.15 }}
              className={`relative rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 ${
                plan.featured 
                  ? 'bg-[#420c14] border-2 border-[#420c14] md:-mt-4 md:mb-4' 
                  : plan.isDeluxe
                    ? 'bg-gradient-to-br from-[#DDA46F] to-[#c99560] border-2 border-[#DDA46F]'
                    : 'bg-white border border-[#420c14]/10 shadow-xl shadow-[#420c14]/5'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#f5f2eb] text-[#420c14] text-xs sm:text-sm font-medium tracking-wider">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    {t('landing.pricing.mostPopular')}
                  </span>
                </div>
              )}

              {plan.isDeluxe && (
                <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#420c14] text-[#f5f2eb] text-xs sm:text-sm font-medium tracking-wider">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                    {t('landing.pricing.luxury')}
                  </span>
                </div>
              )}

              <div className={plan.featured || plan.isDeluxe ? 'pt-2 sm:pt-4' : ''}>
                <h3 className={`text-2xl sm:text-3xl font-serif mb-2 ${
                  plan.featured ? 'text-[#f5f2eb]' : 'text-[#420c14]'
                }`}>{plan.name}</h3>
                <p className={`mb-6 sm:mb-8 text-sm sm:text-base ${
                  plan.featured ? 'text-[#f5f2eb]/60' : plan.isDeluxe ? 'text-[#420c14]/80' : 'text-[#420c14]/60'
                }`}>{plan.description}</p>
                
                <div className="mb-8 sm:mb-10">
                  {plan.priceCents > 0 && discount && appliesToPlan(plan.plan) ? (
                    <PromoPriceDisplay
                      originalPriceCents={plan.priceCents}
                      discountedPriceCents={getDiscountedPrice(plan.priceCents, plan.plan as DiscountPlan, displayMethod)}
                      discountPercent={getDiscountPercent(plan.plan as DiscountPlan, displayMethod)}
                      discountLabel={discount.label}
                      variant={plan.featured ? 'light' : 'dark'}
                      size="lg"
                    />
                  ) : (
                    <>
                      <span className={`text-4xl sm:text-6xl font-serif ${
                        plan.featured ? 'text-[#f5f2eb]' : 'text-[#420c14]'
                      }`}>{plan.price}</span>
                      <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${
                        plan.featured ? 'text-[#f5f2eb]/60' : plan.isDeluxe ? 'text-[#420c14]/70' : 'text-[#420c14]/60'
                      }`}>{plan.period}</span>
                    </>
                  )}
                  {plan.plan === 'premium' && (() => {
                    const total = getDiscountedPrice(PRICING.premium.price_mxn, 'premium', displayMethod) / 100
                    return (
                      <p className={`text-xs mt-2 ${plan.featured ? 'text-[#f5f2eb]/50' : 'text-[#420c14]/50'}`}>
                        o 3 MSI de ${Math.round(total / 3).toLocaleString('es-MX')}
                      </p>
                    )
                  })()}
                  {plan.plan === 'deluxe' && (() => {
                    const total = getDiscountedPrice(PRICING.deluxe.price_mxn, 'deluxe', displayMethod) / 100
                    return (
                      <p className={`text-xs mt-2 ${plan.isDeluxe ? 'text-[#420c14]/60' : 'text-[#420c14]/50'}`}>
                        o 3 MSI de ${Math.round(total / 3).toLocaleString('es-MX')} | 6 MSI de ${Math.round(total / 6).toLocaleString('es-MX')}
                      </p>
                    )
                  })()}
                </div>

                <div className="space-y-3">
                  {plan.plan === 'free' || giftMode ? (
                    <Link href={plan.href}>
                      <Button className={`w-full h-12 sm:h-14 text-sm sm:text-base tracking-wider transition-all duration-700 ${
                        plan.featured
                          ? 'bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14]'
                          : 'bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]'
                      }`}>
                        {plan.cta}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => handleCheckout(plan.plan as DiscountPlan)}
                      disabled={checkoutLoading === plan.plan}
                      className={`w-full h-12 sm:h-14 text-sm sm:text-base tracking-wider transition-all duration-700 ${
                        plan.featured
                          ? 'bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14]'
                          : 'bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]'
                      }`}
                    >
                      {checkoutLoading === plan.plan && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      {plan.cta}
                    </Button>
                  )}
                  
                  <div className="text-center">
                    <Link 
                      href={plan.plan === 'premium' ? '/premium' : plan.plan === 'deluxe' ? '/deluxe' : '#'}
                      className={`text-xs sm:text-sm hover:underline transition-colors ${
                        plan.featured ? 'text-[#f5f2eb]/60 hover:text-[#f5f2eb]' : plan.isDeluxe ? 'text-[#420c14]/50 hover:text-[#420c14]' : 'text-[#420c14]/50 hover:text-[#420c14]'
                      }`}
                    >
                      {plan.plan !== 'free' && t('landing.pricing.learnMore', { plan: plan.name })}
                    </Link>
                  </div>
                </div>

                <div className="mt-8 sm:mt-10 space-y-4 sm:space-y-5">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.featured ? 'bg-[#DDA46F]/30 text-[#DDA46F]' : plan.isDeluxe ? 'bg-[#420c14]/20 text-[#420c14]' : 'bg-[#420c14]/10 text-[#420c14]'
                      }`}>
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <span className={`text-sm sm:text-base ${
                        plan.featured ? 'text-[#f5f2eb]/80' : plan.isDeluxe ? 'text-[#420c14]/90' : 'text-[#420c14]/80'
                      }`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 sm:mt-24 bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 border border-[#420c14]/10 shadow-xl shadow-[#420c14]/5 overflow-hidden"
        >
          <h3 className="text-2xl sm:text-3xl font-serif text-[#420c14] mb-8 sm:mb-12 text-center">
            {t('landing.pricing.comparePlans')}
          </h3>
          
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-6 sm:px-0">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[23.33%]" />
                  <col className="w-[23.33%]" />
                  <col className="w-[23.33%]" />
                </colgroup>
                <thead>
                  <tr className="border-b-2 border-[#420c14]/10">
                    <th className="text-left py-4 sm:py-6 pr-4 sm:pr-8 text-sm sm:text-base font-medium text-[#420c14]/60">
                      {t('landing.pricing.features')}
                    </th>
                    <th className="text-center py-4 sm:py-6 px-3 sm:px-6">
                      <div className="text-base sm:text-lg font-serif text-[#420c14]">{t('landing.pricing.free')}</div>
                      <div className="text-xs sm:text-sm text-[#420c14]/50 mt-1">{PRICING.free.priceDisplayMXN}</div>
                    </th>
                    <th className="text-center py-4 sm:py-6 px-3 sm:px-6 relative">
                      <div className="absolute inset-0 bg-[#420c14]/5 -mx-3 sm:-mx-6" />
                      <div className="relative">
                        <div className="text-base sm:text-lg font-serif text-[#420c14]">{t('landing.pricing.premium')}</div>
                        <div className="mt-1">
                          {discount && appliesToPlan('premium') ? (
                            <PromoPriceInline
                              originalPriceCents={PRICING.premium.price_mxn}
                              discountedPriceCents={getDiscountedPrice(PRICING.premium.price_mxn, 'premium', displayMethod)}
                              discountPercent={getDiscountPercent('premium', displayMethod)}
                              variant="dark"
                            />
                          ) : (
                            <div className="text-xs sm:text-sm text-[#420c14]/50">{PRICING.premium.priceDisplayMXN}</div>
                          )}
                        </div>
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#DDA46F] mx-auto mt-1" />
                      </div>
                    </th>
                    <th className="text-center py-4 sm:py-6 px-3 sm:px-6">
                      <div className="text-base sm:text-lg font-serif text-[#420c14]">{t('landing.pricing.deluxe')}</div>
                      <div className="mt-1">
                        {discount && appliesToPlan('deluxe') ? (
                          <PromoPriceInline
                            originalPriceCents={PRICING.deluxe.price_mxn}
                            discountedPriceCents={getDiscountedPrice(PRICING.deluxe.price_mxn, 'deluxe', displayMethod)}
                            discountPercent={getDiscountPercent('deluxe', displayMethod)}
                            variant="gold"
                          />
                        ) : (
                          <div className="text-xs sm:text-sm text-[#420c14]/50">{PRICING.deluxe.priceDisplayMXN}</div>
                        )}
                      </div>
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-[#DDA46F] mx-auto mt-1" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category, catIndex) => (
                    <React.Fragment key={catIndex}>
                      <tr>
                        <td colSpan={4} className="pt-6 sm:pt-8 pb-3 sm:pb-4">
                          <h4 className="text-xs sm:text-sm font-semibold text-[#420c14] tracking-wider uppercase">
                            {category.category}
                          </h4>
                        </td>
                      </tr>
                      {category.features.map((feature, featIndex) => (
                        <tr
                          key={featIndex}
                          className="border-b border-[#420c14]/5 hover:bg-[#420c14]/[0.02] transition-colors"
                        >
                          <td className="py-3 sm:py-4 pr-4 sm:pr-8 text-xs sm:text-sm text-[#420c14]/70">
                            {feature.name}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                            {typeof feature.free === 'boolean' ? (
                              feature.free ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#420c14] mx-auto" /> : <span className="text-[#420c14]/20 text-lg">&mdash;</span>
                            ) : (
                              <span className="text-xs sm:text-sm text-[#420c14]/70">{feature.free}</span>
                            )}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-center bg-[#420c14]/[0.02]">
                            {typeof feature.premium === 'boolean' ? (
                              feature.premium ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#420c14] mx-auto" /> : <span className="text-[#420c14]/20 text-lg">&mdash;</span>
                            ) : (
                              <span className="text-xs sm:text-sm text-[#420c14]/70 font-medium">{feature.premium}</span>
                            )}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                            {typeof feature.deluxe === 'boolean' ? (
                              feature.deluxe ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#DDA46F] mx-auto" /> : <span className="text-[#420c14]/20 text-lg">&mdash;</span>
                            ) : (
                              <span className="text-xs sm:text-sm text-[#DDA46F] font-medium">{feature.deluxe}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-[#420c14]/10">
            <Link href="/create-wedding" className="block">
              <Button className="w-full bg-[#420c14]/5 hover:bg-[#420c14]/10 text-[#420c14] text-xs sm:text-sm h-10 sm:h-12">
                {t('landing.nav.getStarted')}
              </Button>
            </Link>
            <Button
              onClick={() => handleCheckout('premium')}
              disabled={checkoutLoading === 'premium'}
              className="w-full bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] text-xs sm:text-sm h-10 sm:h-12"
            >
              {checkoutLoading === 'premium' && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              {t('landing.pricing.premium')}
            </Button>
            <Button
              onClick={() => handleCheckout('deluxe')}
              disabled={checkoutLoading === 'deluxe'}
              className="w-full bg-gradient-to-r from-[#DDA46F] to-[#c99560] hover:from-[#c99560] hover:to-[#b88550] text-[#420c14] text-xs sm:text-sm h-10 sm:h-12"
            >
              {checkoutLoading === 'deluxe' && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              {t('landing.pricing.deluxe')}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Wedding Select Modal */}
      <AnimatePresence>
        {weddingSelectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setWeddingSelectModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif text-[#420c14]">
                  {t('landing.pricing.selectWedding')}
                </h3>
                <button onClick={() => setWeddingSelectModal(null)} className="text-[#420c14]/40 hover:text-[#420c14]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-[#420c14]/60 mb-4">
                {t('landing.pricing.selectWeddingFor', { plan: weddingSelectModal.plan })}
              </p>
              <div className="space-y-2">
                {weddingSelectModal.weddings.map(w => (
                  <button
                    key={w.id}
                    onClick={() => proceedToCheckout(weddingSelectModal.plan, w.id)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-[#420c14]/10 hover:border-[#420c14]/30 hover:bg-[#f5f2eb] transition-all text-sm text-[#420c14]"
                  >
                    {w.partner1_first_name || w.partner2_first_name
                      ? `${w.partner1_first_name || ''} & ${w.partner2_first_name || ''}`.trim().replace(/^& |& $/g, '')
                      : w.wedding_name_id}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

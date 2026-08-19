"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { INVITATION_PRICING, MANAGEMENT_PRICING, type PricingAxis, formatMXNFromCents } from "@/lib/subscription-shared"
import { PricingTierCard } from "@/components/ui/pricing-tier-card"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  Loader2,
  X,
  Gift,
  CreditCard,
  Percent,
  Check,
} from "lucide-react"
import { Header } from "@/components/header"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useI18n } from "@/components/contexts/i18n-context"
import { resolveBackHref } from "@/lib/landing-source"

type PaymentMethod = 'card' | 'msi'
type CheckoutTarget = { axis: PricingAxis; tier: string; bundleDiscount?: boolean }

const COMPANION_TIER_MAP: Record<PricingAxis, Record<string, { axis: PricingAxis; tier: string }>> = {
  invitation: {
    basic:        { axis: 'management', tier: 'basic' },
    personalized: { axis: 'management', tier: 'pro' },
    bespoke:      { axis: 'management', tier: 'agency' },
  },
  management: {
    basic:   { axis: 'invitation', tier: 'basic' },
    pro:     { axis: 'invitation', tier: 'personalized' },
    agency:  { axis: 'invitation', tier: 'bespoke' },
  },
}

export function PricingUpgradeContent({ mode }: { mode: 'pricing' | 'upgrade' }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale, translations } = useI18n()

  const isUpgradeMode = mode === 'upgrade'

  const backHref = resolveBackHref({ weddingId: searchParams.get("weddingId"), from: searchParams.get("from") })

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWeddingSelector, setShowWeddingSelector] = useState(false)
  const [pendingTarget, setPendingTarget] = useState<CheckoutTarget | null>(null)
  const [weddings, setWeddings] = useState<Array<{ id: string; wedding_name_id: string; partner1_first_name?: string; partner2_first_name?: string }>>([])
  const [msiEnabled, setMsiEnabled] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [showCompanionDialog, setShowCompanionDialog] = useState(false)
  const [companionMainTarget, setCompanionMainTarget] = useState<CheckoutTarget | null>(null)

  useEffect(() => {
    fetch('/api/feature-flags')
      .then(r => r.json())
      .then(flags => {
        setMsiEnabled(!!flags.msiEnabled)
        if (!flags.msiEnabled) setPaymentMethod('card')
      })
      .catch(() => {})
  }, [])

  const leadSource = searchParams.get("source") || "direct"
  const preselectedWeddingId = searchParams.get("weddingId") || null
  const preselectedAxis = searchParams.get("axis") as PricingAxis | null
  const preselectedTier = searchParams.get("tier")
  const preselectedBundleDiscount = searchParams.get("bundleDiscount") === "1"
  const autoCheckout = searchParams.get("autoCheckout") === "1"
  const [autoCheckoutFired, setAutoCheckoutFired] = useState(false)

  useEffect(() => {
    if (!autoCheckout || autoCheckoutFired || authLoading || !user || isProcessing) return
    if (!preselectedAxis || !preselectedTier) return
    setAutoCheckoutFired(true)
    handleUpgrade({ axis: preselectedAxis, tier: preselectedTier, bundleDiscount: preselectedBundleDiscount })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheckout, authLoading, user])

  const basePath = isUpgradeMode ? '/upgrade' : '/pricing'

  // In upgrade mode only: redirect unauthenticated users to login immediately
  useEffect(() => {
    if (!isUpgradeMode) return
    if (!authLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(`${basePath}?${searchParams.toString()}`)}`)
    }
  }, [user, authLoading, router, searchParams, isUpgradeMode, basePath])

  const handleUpgrade = async (target: CheckoutTarget) => {
    if (!user) {
      const redirectParams = new URLSearchParams(searchParams.toString())
      redirectParams.set('axis', target.axis)
      redirectParams.set('tier', target.tier)
      if (target.bundleDiscount) redirectParams.set('bundleDiscount', '1')
      router.push(`/login?redirect=${basePath}?${redirectParams.toString()}`)
      return
    }

    setPendingTarget(target)
    setIsProcessing(true)
    setError(null)

    try {
      if (preselectedWeddingId) {
        await proceedToCheckout(target, preselectedWeddingId)
        return
      }

      const weddingsResponse = await fetch('/api/weddings')
      const weddingsData = await weddingsResponse.json()
      if (!weddingsResponse.ok) throw new Error(weddingsData.error || 'Failed to fetch weddings')

      const userWeddings = weddingsData.weddings || []
      if (userWeddings.length === 0) {
        setError(t('upgrade.errors.noWedding'))
        setIsProcessing(false)
        return
      }

      if (userWeddings.length === 1) {
        await proceedToCheckout(target, userWeddings[0].id)
        return
      }

      setWeddings(userWeddings)
      setShowWeddingSelector(true)
      setIsProcessing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsProcessing(false)
    }
  }

  const proceedToCheckout = async (target: CheckoutTarget, weddingId: string) => {
    try {
      setIsProcessing(true)
      const checkoutResponse = await fetch(`/api/weddings/${weddingId}/subscription/checkout-tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axis: target.axis, tier: target.tier, source: leadSource, paymentMethod, bundleDiscount: target.bundleDiscount, locale }),
      })
      const checkoutData = await checkoutResponse.json()
      if (!checkoutResponse.ok) throw new Error(checkoutData.error || 'Failed to create checkout session')
      if (checkoutData.url) {
        window.location.href = checkoutData.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsProcessing(false)
      setShowWeddingSelector(false)
    }
  }

  const handleWeddingSelect = async (weddingId: string) => {
    if (!pendingTarget) return
    await proceedToCheckout(pendingTarget, weddingId)
  }

  const selectPlan = (target: CheckoutTarget) => {
    const companion = COMPANION_TIER_MAP[target.axis]?.[target.tier]
    if (companion) {
      setCompanionMainTarget(target)
      setShowCompanionDialog(true)
    } else {
      handleUpgrade(target)
    }
  }

  const renderCardGroup = (axis: PricingAxis, groupLabel: string) => {
    const tierKeys = axis === 'invitation'
      ? (['basic', 'personalized', 'bespoke'] as const)
      : (['basic', 'pro', 'agency'] as const)
    const pricingMap = axis === 'invitation' ? INVITATION_PRICING : MANAGEMENT_PRICING
    const localeTiers = translations.landing.pricing.tiers[axis]

    return (
      <div className="mb-16 sm:mb-24 last:mb-0">
        <h2 className="text-xl sm:text-2xl font-serif text-[#420c14] text-center mb-8 sm:mb-12">{groupLabel}</h2>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
          {tierKeys.map((tierKey, index) => {
            const pricing = pricingMap[tierKey as keyof typeof pricingMap]
            const tier = localeTiers[tierKey as keyof typeof localeTiers]
            const isFeatured = tierKey === 'personalized' || tierKey === 'pro'
            const isTop = tierKey === 'bespoke' || tierKey === 'agency'
            const target: CheckoutTarget = { axis, tier: tierKey }
            const loading = isProcessing && pendingTarget?.axis === axis && pendingTarget?.tier === tierKey
            const cta = isUpgradeMode ? tier.ctaUpgrade : tier.ctaPricing

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
                ctaLabel={cta}
                loading={loading}
                onClick={() => selectPlan(target)}
                delay={index * 0.15}
              />
            )
          })}
        </div>
      </div>
    )
  }

  const pageLabel = isUpgradeMode ? t('upgrade.pageLabel') : t('pricing.pageLabel')
  const pageTitle = isUpgradeMode ? t('upgrade.title') : t('pricing.title')
  const pageSubtitle = isUpgradeMode ? t('upgrade.subtitle') : t('pricing.subtitle')
  const pageDescription = isUpgradeMode ? t('upgrade.description') : t('pricing.description')

  return (
    <main className="min-h-screen bg-[#f5f2eb] relative overflow-hidden">
      <Header showBackButton backHref={backHref} rightContent={<LanguageSwitcher variant="buttons" className="text-[#420c14]" textColor="#420c14" />} />

      <motion.div
        className="absolute top-1/4 left-[10%] w-40 sm:w-80 h-40 sm:h-80 rounded-full bg-[#DDA46F]/10 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-[10%] w-48 sm:w-96 h-48 sm:h-96 rounded-full bg-[#172815]/10 blur-3xl pointer-events-none"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
            {pageLabel}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#420c14] mb-6 leading-tight">
            <span className="font-serif font-light">{pageTitle}</span>
            <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] ml-2 sm:ml-4">{pageSubtitle}</span>
          </h1>
          <p className="text-[#420c14]/60 text-sm sm:text-lg max-w-2xl mx-auto">
            {pageDescription}
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-[#420c14]/50"
        >
          <Link href="/gift" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#420c14]/15 text-[#420c14]/60 hover:text-[#420c14] hover:border-[#420c14]/30 text-sm transition-colors">
            <Gift className="w-3.5 h-3.5 text-[#DDA46F]" />
            {t('upgrade.giftCallout.giftSubscription')}
          </Link>
          <Link href="/gift/redeem" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#420c14]/15 text-[#420c14]/60 hover:text-[#420c14] hover:border-[#420c14]/30 text-sm transition-colors">
            {t('upgrade.giftCallout.redeemHere')}
          </Link>
        </motion.div>

        {msiEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto mb-12 sm:mb-16"
          >
            <p className="text-center text-xs text-[#420c14]/50 mb-3 tracking-wider uppercase">{t('upgrade.paymentMethod')}</p>
            <div className="flex justify-center">
              <div className="inline-flex items-center rounded-xl bg-white border border-[#420c14]/10 shadow-sm p-1 gap-1">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                    paymentMethod === 'card' ? 'bg-[#420c14] text-white shadow-sm' : 'text-[#420c14]/60 hover:text-[#420c14] hover:bg-[#420c14]/5'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {t('upgrade.card')}
                </button>
                <button
                  onClick={() => setPaymentMethod('msi')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                    paymentMethod === 'msi' ? 'bg-[#420c14] text-white shadow-sm' : 'text-[#420c14]/60 hover:text-[#420c14] hover:bg-[#420c14]/5'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  3 o 6 MSI
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {renderCardGroup('invitation', t('landing.pricing.invitationGroup'))}
        {renderCardGroup('management', t('landing.pricing.managementGroup'))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-6 text-sm text-[#420c14]/50 flex-wrap justify-center">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              {t('upgrade.guarantee.encrypted')}
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              {t('upgrade.guarantee.instantAccess')}
            </span>
          </div>
          <p className="text-[#420c14]/40 text-sm tracking-wide">
            <CreditCard className="w-4 h-4 inline mr-1" />{t('upgrade.guarantee.securePayment')}
          </p>
        </motion.div>

        {/* Companion Bundle Dialog */}
        <AnimatePresence>
          {showCompanionDialog && companionMainTarget && (() => {
            const companionRef = COMPANION_TIER_MAP[companionMainTarget.axis]?.[companionMainTarget.tier]
            if (!companionRef) return null
            const mainPricing = companionMainTarget.axis === 'invitation' ? INVITATION_PRICING : MANAGEMENT_PRICING
            const companionPricing = companionRef.axis === 'invitation' ? INVITATION_PRICING : MANAGEMENT_PRICING
            const mainTierCopy = translations.landing.pricing.tiers[companionMainTarget.axis][companionMainTarget.tier as keyof typeof translations.landing.pricing.tiers[typeof companionMainTarget.axis]]
            const companionTierCopy = translations.landing.pricing.tiers[companionRef.axis][companionRef.tier as keyof typeof translations.landing.pricing.tiers[typeof companionRef.axis]]
            const mainPricingData = mainPricing[companionMainTarget.tier as keyof typeof mainPricing]
            const companionPricingData = companionPricing[companionRef.tier as keyof typeof companionPricing]
            if (!mainTierCopy || !companionTierCopy || !mainPricingData || !companionPricingData) return null

            const halfPriceCents = Math.round(companionPricingData.price_mxn / 2)
            const halfPriceDisplay = formatMXNFromCents(halfPriceCents)
            const mainAxisLabel = companionMainTarget.axis === 'invitation' ? t('landing.pricing.invitationGroup') : t('landing.pricing.managementGroup')
            const companionAxisLabel = companionRef.axis === 'invitation' ? t('landing.pricing.invitationGroup') : t('landing.pricing.managementGroup')

            return (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-[#f5f2eb] rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
                >
                  <div className="h-1 bg-gradient-to-r from-[#DDA46F] via-[#f0c990] to-[#DDA46F]" />

                  <div className="p-8">
                    <div className="flex justify-center mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-[#DDA46F]/15 flex items-center justify-center">
                        <Percent className="w-7 h-7 text-[#DDA46F]" />
                      </div>
                    </div>

                    <h2 className="text-2xl font-serif text-[#420c14] text-center mb-2">Bundle & Save 50%</h2>
                    <p className="text-xs tracking-[0.25em] uppercase text-[#DDA46F] text-center mb-6">Exclusive offer</p>

                    <div className="bg-[#420c14]/5 border border-[#420c14]/10 rounded-xl px-4 py-3 mb-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#420c14]/40 mb-1">You selected</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#420c14]">
                          {mainAxisLabel} · {mainTierCopy.name}
                        </span>
                        <span className="text-sm font-semibold text-[#420c14]">{mainPricingData.priceDisplayMXN}</span>
                      </div>
                    </div>

                    <div className="bg-[#DDA46F]/10 border border-[#DDA46F]/25 rounded-xl px-4 py-4 mb-6 relative overflow-hidden">
                      <div className="absolute top-2 right-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-[#DDA46F] text-[#420c14] px-2 py-0.5 rounded-full">
                          50% off
                        </span>
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#420c14]/40 mb-1">Add for just</p>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-serif text-[#420c14]">{halfPriceDisplay}</span>
                        <span className="text-sm text-[#420c14]/40 line-through">{companionPricingData.priceDisplayMXN}</span>
                      </div>
                      <p className="text-sm text-[#420c14]/70 font-medium">
                        {companionAxisLabel} · {companionTierCopy.name}
                      </p>
                      <p className="text-xs text-[#420c14]/45 mt-1">{companionTierCopy.tagline}</p>
                    </div>

                    <div className="space-y-2.5">
                      <Button
                        onClick={() => {
                          setShowCompanionDialog(false)
                          handleUpgrade({ axis: companionRef.axis, tier: companionRef.tier, bundleDiscount: true })
                        }}
                        className="w-full h-12 bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-semibold text-sm tracking-wide gap-2"
                      >
                        <Percent className="w-4 h-4" />
                        Add {companionTierCopy.name} bundle for {halfPriceDisplay}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowCompanionDialog(false)
                          handleUpgrade(companionMainTarget)
                        }}
                        variant="ghost"
                        className="w-full h-10 text-[#420c14]/50 hover:text-[#420c14] hover:bg-[#420c14]/5 text-sm"
                      >
                        Continue with {mainTierCopy.name} only
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )
          })()}
        </AnimatePresence>

        {showWeddingSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif text-[#420c14]">{t('upgrade.weddingSelector.title')}</h2>
                <button onClick={() => setShowWeddingSelector(false)} className="text-[#420c14]/50 hover:text-[#420c14]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {weddings.map((wedding) => (
                  <button
                    key={wedding.id}
                    onClick={() => handleWeddingSelect(wedding.id)}
                    disabled={isProcessing}
                    className="w-full text-left p-3 rounded-lg border border-[#420c14]/10 hover:border-[#420c14]/30 hover:bg-[#f5f2eb]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-[#420c14]">
                      {wedding.partner1_first_name && wedding.partner2_first_name
                        ? `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`
                        : wedding.wedding_name_id}
                    </div>
                    <div className="text-xs text-[#420c14]/50 mt-1">{wedding.wedding_name_id}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#420c14]/10">
                <Button onClick={() => setShowWeddingSelector(false)} variant="outline" className="flex-1" disabled={isProcessing}>
                  {t('common.cancel')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#f5f2eb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
      </main>
    }>
      <PricingUpgradeContent mode="pricing" />
    </Suspense>
  )
}

"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { INVITATION_CARDS, MANAGEMENT_CARDS, type PricingAxis } from "@/lib/subscription-shared"
import { motion } from "framer-motion"
import {
  Crown,
  Check,
  Sparkles,
  Shield,
  Loader2,
  X,
  Gift,
  CreditCard,
} from "lucide-react"
import { Header } from "@/components/header"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useTranslation } from "@/components/contexts/i18n-context"
import { resolveBackHref } from "@/lib/landing-source"

type PaymentMethod = 'card' | 'msi'
type CheckoutTarget = { axis: PricingAxis; tier: string; bundleDiscount?: boolean }

function UpgradePageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const backHref = resolveBackHref({ weddingId: searchParams.get("weddingId"), from: searchParams.get("from") })

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWeddingSelector, setShowWeddingSelector] = useState(false)
  const [pendingTarget, setPendingTarget] = useState<CheckoutTarget | null>(null)
  const [weddings, setWeddings] = useState<Array<{ id: string; wedding_name_id: string; partner1_first_name?: string; partner2_first_name?: string }>>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (searchParams.get('paymentMethod') as PaymentMethod) === 'msi' ? 'msi' : 'card'
  )

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(`/upgrade?${searchParams.toString()}`)}`)
    }
  }, [user, authLoading, router, searchParams])

  const handleUpgrade = async (target: CheckoutTarget) => {
    if (!user) {
      const redirectParams = new URLSearchParams(searchParams.toString())
      redirectParams.set('axis', target.axis)
      redirectParams.set('tier', target.tier)
      if (target.bundleDiscount) redirectParams.set('bundleDiscount', '1')
      router.push(`/login?redirect=/upgrade?${redirectParams.toString()}`)
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
        body: JSON.stringify({ axis: target.axis, tier: target.tier, source: leadSource, paymentMethod, bundleDiscount: target.bundleDiscount }),
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

  const renderCardGroup = (axis: PricingAxis, cards: typeof INVITATION_CARDS | typeof MANAGEMENT_CARDS, groupLabel: string) => (
    <div className="mb-16 sm:mb-24 last:mb-0">
      <h2 className="text-xl sm:text-2xl font-serif text-[#420c14] text-center mb-8 sm:mb-12">{groupLabel}</h2>
      <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
        {Object.entries(cards).map(([tierKey, card], index) => {
          const isFeatured = tierKey === 'personalized' || tierKey === 'pro'
          const isTop = tierKey === 'bespoke' || tierKey === 'agency'
          const target: CheckoutTarget = { axis, tier: tierKey }
          const loading = isProcessing && pendingTarget?.axis === axis && pendingTarget?.tier === tierKey

          return (
            <motion.div
              key={tierKey}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className={`relative rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 ${
                isFeatured ? 'bg-[#420c14] border-2 border-[#420c14]' : isTop
                  ? 'bg-gradient-to-br from-[#DDA46F] to-[#c99560] border-2 border-[#DDA46F]'
                  : 'bg-white border border-[#420c14]/10 shadow-xl shadow-[#420c14]/5'
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#f5f2eb] text-[#420c14] text-xs sm:text-sm font-medium tracking-wider">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    {t('upgrade.mostPopular')}
                  </span>
                </div>
              )}
              {isTop && (
                <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#420c14] text-[#f5f2eb] text-xs sm:text-sm font-medium tracking-wider">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                    {t('upgrade.luxury')}
                  </span>
                </div>
              )}

              <div className={isFeatured || isTop ? 'pt-2 sm:pt-4' : ''}>
                <h3 className={`text-2xl sm:text-3xl font-serif mb-1 ${isFeatured ? 'text-[#f5f2eb]' : 'text-[#420c14]'}`}>{card.name}</h3>
                <p className={`text-xs sm:text-sm mb-4 sm:mb-6 ${isFeatured ? 'text-[#DDA46F]' : isTop ? 'text-[#420c14]/70' : 'text-[#DDA46F]'}`}>{card.tagline}</p>
                <p className={`mb-6 sm:mb-8 text-sm sm:text-base ${isFeatured ? 'text-[#f5f2eb]/60' : 'text-[#420c14]/80'}`}>{card.description}</p>

                <div className="mb-8 sm:mb-10">
                  <span className={`text-4xl sm:text-6xl font-serif ${isFeatured ? 'text-[#f5f2eb]' : 'text-[#420c14]'}`}>{card.priceDisplayMXN}</span>
                  <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${isFeatured ? 'text-[#f5f2eb]/60' : 'text-[#420c14]/70'}`}>{card.period}</span>
                </div>

                <Button
                  onClick={() => handleUpgrade(target)}
                  disabled={loading}
                  className={`w-full h-12 sm:h-14 text-sm sm:text-base tracking-wider transition-all duration-700 ${
                    isFeatured ? 'bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14]' : 'bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]'
                  }`}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {card.cta}
                </Button>

                <div className="mt-8 sm:mt-10 space-y-4 sm:space-y-5">
                  {card.features.map((feature: string, featureIndex: number) => (
                    <div key={featureIndex} className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isFeatured ? 'bg-[#DDA46F]/30 text-[#DDA46F]' : 'bg-[#420c14]/20 text-[#420c14]'
                      }`}>
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <span className={`text-sm sm:text-base ${isFeatured ? 'text-[#f5f2eb]/80' : 'text-[#420c14]/90'}`}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )

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
            {t('upgrade.pageLabel')}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#420c14] mb-6 leading-tight">
            <span className="font-serif font-light">{t('upgrade.title')}</span>
            <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] ml-2 sm:ml-4">{t('upgrade.subtitle')}</span>
          </h1>
          <p className="text-[#420c14]/60 text-sm sm:text-lg max-w-2xl mx-auto">
            {t('upgrade.description')}
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
          <span className="inline-flex items-center gap-1.5">
            {t('upgrade.giftCallout.buyingAsGift')}{' '}
            <Link href="/gift" className="text-[#DDA46F] hover:text-[#c99560] hover:underline font-medium inline-flex items-center gap-1 transition-colors">
              <Gift className="w-3.5 h-3.5" />
              {t('upgrade.giftCallout.giftSubscription')}
            </Link>
          </span>
          <span className="hidden sm:block text-[#420c14]/20">·</span>
          <span className="inline-flex items-center gap-1.5">
            {t('upgrade.giftCallout.haveGiftCode')}{' '}
            <Link href="/gift/redeem" className="text-[#DDA46F] hover:text-[#c99560] hover:underline font-medium transition-colors">
              {t('upgrade.giftCallout.redeemHere')}
            </Link>
          </span>
        </motion.div>

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

        {renderCardGroup('invitation', INVITATION_CARDS, t('landing.pricing.invitationGroup'))}
        {renderCardGroup('management', MANAGEMENT_CARDS, t('landing.pricing.managementGroup'))}

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

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#f5f2eb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
      </main>
    }>
      <UpgradePageContent />
    </Suspense>
  )
}

"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import { PRICING, PLAN_CARDS, COMPARISON_FEATURES } from "@/lib/subscription-shared"
import { motion } from "framer-motion"
import {
  Crown,
  Check,
  Sparkles,
  ArrowLeft,
  Shield,
  Loader2,
  X
} from "lucide-react"

const plans = [
  {
    id: "premium" as const,
    name: PLAN_CARDS.premium.name,
    price: PLAN_CARDS.premium.price,
    period: PLAN_CARDS.premium.period,
    tagline: PLAN_CARDS.premium.tagline,
    description: PLAN_CARDS.premium.description,
    features: PLAN_CARDS.premium.features.map(text => ({ text, included: true })),
    featured: true,
  },
  {
    id: "deluxe" as const,
    name: PLAN_CARDS.deluxe.name,
    price: PLAN_CARDS.deluxe.price,
    period: PLAN_CARDS.deluxe.period,
    tagline: PLAN_CARDS.deluxe.tagline,
    description: PLAN_CARDS.deluxe.description,
    features: PLAN_CARDS.deluxe.features.map(text => ({ text, included: true })),
    isDeluxe: true,
  },
]

const comparisonFeatures = COMPARISON_FEATURES.map(cat => ({
  ...cat,
  features: cat.features.map(f => ({ ...f })),
}))

function UpgradePageContent() {
  const { user, loading: authLoading } = useAuth()
  const { isPremium, loading: subscriptionLoading } = useSubscription()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<"premium" | "deluxe">(
    searchParams.get("plan") === "deluxe" ? "deluxe" : "premium"
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWeddingSelector, setShowWeddingSelector] = useState(false)
  const [weddings, setWeddings] = useState<Array<{ id: string; wedding_name_id: string; partner1_first_name?: string; partner2_first_name?: string; plan?: string }>>([])
  const [selectedWeddingId, setSelectedWeddingId] = useState<string | null>(null)
  const [loadingWeddings, setLoadingWeddings] = useState(false)

  // Lead attribution: source tells us where the user came from
  const leadSource = searchParams.get("source") || "direct"
  // If weddingId is provided, auto-select that wedding (skip selector)
  const preselectedWeddingId = searchParams.get("weddingId") || null
  // Lead tracking: store the lead ID for this session
  const [leadId, setLeadId] = useState<string | null>(null)

  // Create/reuse a lead as soon as the user visits the upgrade page
  useEffect(() => {
    if (authLoading || !user) return
    // Don't create leads if already premium
    if (!subscriptionLoading && isPremium) return

    const createLead = async () => {
      try {
        const res = await fetch('/api/subscription-leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: leadSource,
            plan: searchParams.get("plan") || undefined,
            weddingId: preselectedWeddingId || undefined,
          }),
        })
        const data = await res.json()
        if (data.leadId) {
          setLeadId(data.leadId)
        }
      } catch {
        // Non-blocking - don't interrupt user flow for analytics
      }
    }
    createLead()
  }, [user, authLoading, subscriptionLoading, isPremium, leadSource, preselectedWeddingId, searchParams])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/upgrade')
    }
  }, [user, authLoading, router])

  if (!authLoading && !subscriptionLoading && isPremium) {
    return (
      <main className="min-h-screen bg-[#f5f2eb]">
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-12"
          >
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="text-[#420c14]">
                <h2 className="text-lg sm:text-2xl font-serif font-light">
                  Oh<span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.3em]">My</span>Wedding
                </h2>
                <p className="text-[7px] sm:text-[10px] text-[#420c14]/40 tracking-widest mt-0.5">WEDDING WEBSITES</p>
              </div>
            </Link>
            <Link href="/" className="text-[#420c14]/60 hover:text-[#420c14] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#DDA46F] to-[#c99560] flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-serif text-[#420c14] mb-4">You&apos;re Already Premium!</h1>
          <p className="text-[#420c14]/60 mb-8">
            You have full access to all premium features. Enjoy creating your perfect wedding website!
          </p>
          <Link href="/">
            <Button className="bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  const handleUpgrade = async (planType: "premium" | "deluxe") => {
    if (!user) {
      const redirectParams = new URLSearchParams(searchParams.toString())
      redirectParams.set('plan', planType)
      router.push(`/login?redirect=/upgrade?${redirectParams.toString()}`)
      return
    }

    setSelectedPlan(planType)
    setIsProcessing(true)
    setError(null)
    setLoadingWeddings(true)

    try {
      // If a wedding was pre-selected via URL, go straight to checkout
      if (preselectedWeddingId) {
        await proceedToCheckout(planType, preselectedWeddingId)
        return
      }

      // Get user's weddings
      const weddingsResponse = await fetch('/api/weddings')
      const weddingsData = await weddingsResponse.json()

      if (!weddingsResponse.ok) {
        throw new Error(weddingsData.error || 'Failed to fetch weddings')
      }

      const userWeddings = weddingsData.weddings || []

      if (userWeddings.length === 0) {
        setError('You need to create a wedding first')
        setIsProcessing(false)
        setLoadingWeddings(false)
        return
      }

      // Filter weddings eligible for the selected plan
      const PLAN_LEVELS: Record<string, number> = { free: 0, premium: 1, deluxe: 2 }
      const targetLevel = PLAN_LEVELS[planType] || 0
      const eligibleWeddings = userWeddings.filter((w: { plan?: string }) => {
        const currentLevel = PLAN_LEVELS[w.plan || 'free'] || 0
        return currentLevel < targetLevel
      })

      if (eligibleWeddings.length === 0) {
        const planName = planType.charAt(0).toUpperCase() + planType.slice(1)
        setError(`All your weddings are already on ${planName} or higher. No upgrades needed!`)
        setIsProcessing(false)
        setLoadingWeddings(false)
        return
      }

      // If only one eligible wedding, proceed directly
      if (eligibleWeddings.length === 1) {
        await proceedToCheckout(planType, eligibleWeddings[0].id)
        return
      }

      // Multiple eligible weddings - show selection dialog
      setWeddings(eligibleWeddings)
      setShowWeddingSelector(true)
      setIsProcessing(false)
      setLoadingWeddings(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsProcessing(false)
      setLoadingWeddings(false)
    }
  }

  const proceedToCheckout = async (planType: "premium" | "deluxe", weddingId: string) => {
    try {
      setIsProcessing(true)

      // Track wedding selection on the lead
      if (leadId) {
        try {
          await fetch('/api/subscription-leads', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, weddingId }),
          })
        } catch {
          // Non-blocking
        }
      }

      const checkoutResponse = await fetch(`/api/weddings/${weddingId}/subscription/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, source: leadSource, leadId }),
      })

      const checkoutData = await checkoutResponse.json()

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || 'Failed to create checkout session')
      }

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
    setSelectedWeddingId(weddingId)
    await proceedToCheckout(selectedPlan, weddingId)
  }

  const loading = authLoading || subscriptionLoading

  return (
    <main className="min-h-screen bg-[#f5f2eb] relative overflow-hidden">
      {/* Decorative blurs */}
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
        {/* OhMyWedding Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-12 sm:mb-16"
        >
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="text-[#420c14]">
              <h2 className="text-lg sm:text-2xl font-serif font-light">
                Oh<span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.3em]">My</span>Wedding
              </h2>
              <p className="text-[7px] sm:text-[10px] text-[#420c14]/40 tracking-widest mt-0.5">WEDDING WEBSITES</p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#420c14]/60 hover:text-[#420c14] transition-colors text-sm tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-4 sm:mb-6 block">
            Upgrade
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#420c14] mb-6 leading-tight">
            <span className="font-serif font-light">Choose Your</span>
            <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.5em] ml-2 sm:ml-4">Plan</span>
          </h1>
          <p className="text-[#420c14]/60 text-sm sm:text-lg max-w-2xl mx-auto">
            One-time payment, lifetime access. No subscriptions, no hidden fees.
          </p>
        </motion.div>

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto mb-16 sm:mb-24">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 cursor-pointer transition-all duration-300 ${
                plan.featured
                  ? 'bg-[#420c14] border-2 border-[#420c14]'
                  : 'bg-gradient-to-br from-[#DDA46F] to-[#c99560] border-2 border-[#DDA46F]'
              } ${
                selectedPlan === plan.id
                  ? 'ring-4 ring-[#DDA46F]/40 scale-[1.02]'
                  : 'hover:scale-[1.01]'
              }`}
            >
              {plan.featured && (
                <motion.div
                  className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#f5f2eb] text-[#420c14] text-xs sm:text-sm font-medium tracking-wider">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    Most Popular
                  </span>
                </motion.div>
              )}

              {plan.isDeluxe && (
                <motion.div
                  className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#420c14] text-[#f5f2eb] text-xs sm:text-sm font-medium tracking-wider">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                    Luxury
                  </span>
                </motion.div>
              )}

              <div className={plan.featured || plan.isDeluxe ? 'pt-2 sm:pt-4' : ''}>
                <h3 className={`text-2xl sm:text-3xl font-serif mb-2 ${
                  plan.featured ? 'text-[#f5f2eb]' : 'text-[#420c14]'
                }`}>{plan.name}</h3>
                <p className={`mb-6 sm:mb-8 text-sm sm:text-base ${
                  plan.featured ? 'text-[#f5f2eb]/60' : 'text-[#420c14]/80'
                }`}>{plan.description}</p>

                <div className="mb-8 sm:mb-10">
                  <span className={`text-4xl sm:text-6xl font-serif ${
                    plan.featured ? 'text-[#f5f2eb]' : 'text-[#420c14]'
                  }`}>{plan.price}</span>
                  <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${
                    plan.featured ? 'text-[#f5f2eb]/60' : 'text-[#420c14]/70'
                  }`}>{plan.period}</span>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUpgrade(plan.id)
                  }}
                  disabled={loading || isProcessing}
                  className={`w-full h-12 sm:h-14 text-sm sm:text-base tracking-wider transition-all duration-700 ${
                    plan.featured
                      ? 'bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14]'
                      : 'bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]'
                  }`}
                >
                  {isProcessing && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting to checkout...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {plan.featured ? 'Upgrade Now' : 'Go Deluxe'}
                    </>
                  )}
                </Button>

                <div className="mt-4 text-center">
                  <Link 
                    href={plan.id === 'premium' ? '/premium' : '/deluxe'}
                    className={`text-xs sm:text-sm hover:underline transition-colors ${
                      plan.featured
                        ? 'text-[#f5f2eb]/60 hover:text-[#f5f2eb]'
                        : 'text-[#420c14]/50 hover:text-[#420c14]'
                    }`}
                  >
                    Learn more about {plan.id === 'premium' ? 'Premium' : 'Deluxe'}
                  </Link>
                </div>

                <div className="mt-8 sm:mt-10 space-y-4 sm:space-y-5">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      className="flex items-center gap-3 sm:gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + featureIndex * 0.08 }}
                    >
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.featured ? 'bg-[#DDA46F]/30 text-[#DDA46F]' : 'bg-[#420c14]/20 text-[#420c14]'
                      }`}>
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <span className={`text-sm sm:text-base ${
                        plan.featured ? 'text-[#f5f2eb]/80' : 'text-[#420c14]/90'
                      }`}>
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 border border-[#420c14]/10 shadow-xl shadow-[#420c14]/5 overflow-hidden mb-12"
        >
          <h3 className="text-2xl sm:text-3xl font-serif text-[#420c14] mb-8 sm:mb-12 text-center">
            Compare Plans
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
                      Features
                    </th>
                    <th className="text-center py-4 sm:py-6 px-3 sm:px-6">
                      <div className="text-base sm:text-lg font-serif text-[#420c14]">Free</div>
                      <div className="text-xs sm:text-sm text-[#420c14]/50 mt-1">$0</div>
                    </th>
                    <th className="text-center py-4 sm:py-6 px-3 sm:px-6 relative">
                      <div className="absolute inset-0 bg-[#420c14]/5 -mx-3 sm:-mx-6" />
                      <div className="relative">
                        <div className="text-base sm:text-lg font-serif text-[#420c14]">Premium</div>
                        <div className="text-xs sm:text-sm text-[#420c14]/50 mt-1">{PRICING.premium.priceDisplayMXN}</div>
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#DDA46F] mx-auto mt-1" />
                      </div>
                    </th>
                    <th className="text-center py-4 sm:py-6 px-3 sm:px-6">
                      <div className="text-base sm:text-lg font-serif text-[#420c14]">Deluxe</div>
                      <div className="text-xs sm:text-sm text-[#420c14]/50 mt-1">{PRICING.deluxe.priceDisplayMXN}</div>
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
                              feature.free ? (
                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#420c14] mx-auto" />
                              ) : (
                                <span className="text-[#420c14]/20 text-lg">—</span>
                              )
                            ) : (
                              <span className="text-xs sm:text-sm text-[#420c14]/70">{feature.free}</span>
                            )}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-center bg-[#420c14]/[0.02]">
                            {typeof feature.premium === 'boolean' ? (
                              feature.premium ? (
                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#420c14] mx-auto" />
                              ) : (
                                <span className="text-[#420c14]/20 text-lg">—</span>
                              )
                            ) : (
                              <span className="text-xs sm:text-sm text-[#420c14]/70 font-medium">{feature.premium}</span>
                            )}
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                            {typeof feature.deluxe === 'boolean' ? (
                              feature.deluxe ? (
                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#DDA46F] mx-auto" />
                              ) : (
                                <span className="text-[#420c14]/20 text-lg">—</span>
                              )
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

          {/* CTA buttons in table */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-[#420c14]/10">
            <Button
              onClick={() => handleUpgrade('premium')}
              disabled={loading || isProcessing}
              className="w-full bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] text-xs sm:text-sm h-10 sm:h-12"
            >
              {isProcessing && selectedPlan === 'premium' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Upgrade to Premium'
              )}
            </Button>
            <Button
              onClick={() => handleUpgrade('deluxe')}
              disabled={loading || isProcessing}
              className="w-full bg-gradient-to-r from-[#DDA46F] to-[#c99560] hover:from-[#c99560] hover:to-[#b88550] text-[#420c14] text-xs sm:text-sm h-10 sm:h-12"
            >
              {isProcessing && selectedPlan === 'deluxe' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Go Deluxe'
              )}
            </Button>
          </div>
        </motion.div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-6 text-sm text-[#420c14]/50 flex-wrap justify-center">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              SSL Encrypted
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Instant Access
            </span>
          </div>
          <p className="text-[#420c14]/40 text-sm tracking-wide">
            💳 Secure payment via Stripe • 🔒 30-day money-back guarantee
          </p>
        </motion.div>

        {/* Wedding Selection Modal */}
        {showWeddingSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif text-[#420c14]">Select Wedding</h2>
                <button
                  onClick={() => setShowWeddingSelector(false)}
                  className="text-[#420c14]/50 hover:text-[#420c14]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-[#420c14]/60">
                Which wedding would you like to upgrade to <span className="font-semibold capitalize">{selectedPlan}</span>?
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {weddings.map((wedding) => (
                  <button
                    key={wedding.id}
                    onClick={() => handleWeddingSelect(wedding.id)}
                    disabled={isProcessing}
                    className="w-full text-left p-3 rounded-lg border border-[#420c14]/10 hover:border-[#420c14]/30 hover:bg-[#f5f2eb]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-[#420c14]">
                        {wedding.partner1_first_name && wedding.partner2_first_name
                          ? `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`
                          : wedding.wedding_name_id}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        wedding.plan === 'premium'
                          ? 'bg-[#DDA46F]/10 text-[#DDA46F] border border-[#DDA46F]/30'
                          : wedding.plan === 'deluxe'
                          ? 'bg-[#420c14] text-[#f5f2eb]'
                          : 'bg-[#420c14]/5 text-[#420c14]/50'
                      }`}>
                        {wedding.plan === 'premium' ? 'Premium' : wedding.plan === 'deluxe' ? 'Deluxe' : 'Free'}
                      </span>
                    </div>
                    <div className="text-xs text-[#420c14]/50 mt-1">
                      {wedding.wedding_name_id}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#420c14]/10">
                <Button
                  onClick={() => setShowWeddingSelector(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
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

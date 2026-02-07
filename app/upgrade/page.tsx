"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import { PRICING } from "@/lib/subscription-shared"
import { motion } from "framer-motion"
import {
  Crown,
  Check,
  Sparkles,
  ArrowLeft,
  Shield,
  Loader2
} from "lucide-react"

const plans = [
  {
    id: "premium" as const,
    name: "Premium",
    price: PRICING.premium.priceDisplayMXN || `$${(PRICING.premium.price_mxn / 100).toLocaleString()} MXN`,
    period: "one-time",
    description: "Refined essentials for an elegant celebration",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Up to 250 guests", included: true },
      { text: "Unlimited guest groups", included: true },
      { text: "1 week activity retention", included: true },
      { text: "Personalized invitations", included: true },
      { text: "Bespoke registry with secure payouts", included: true },
      { text: "Bespoke domain option", included: true },
      { text: "Website stays forever", included: true },
    ],
    featured: true,
  },
  {
    id: "deluxe" as const,
    name: "Deluxe",
    price: PRICING.deluxe.priceDisplayMXN || `$${(PRICING.deluxe.price_mxn / 100).toLocaleString()} MXN`,
    period: "one-time",
    description: "The most exquisite, white-glove experience",
    features: [
      { text: "Everything in Premium", included: true },
      { text: "Unlimited guests & groups", included: true },
      { text: "Unlimited activity retention", included: true },
      { text: "Bespoke domain setup", included: true },
      { text: "Daily activity reports", included: true },
      { text: "WhatsApp automation (extra cost)", included: true },
      { text: "Bespoke section components", included: true },
      { text: "Lower registry commission", included: true },
    ],
    isDeluxe: true,
  },
]

const comparisonFeatures = [
  { category: "Core Features", features: [
    { name: "Beautiful wedding website", free: true, premium: true, deluxe: true },
    { name: "Photo gallery", free: true, premium: true, deluxe: true },
    { name: "Event schedule", free: true, premium: true, deluxe: true },
    { name: "Gift registry links", free: true, premium: true, deluxe: true },
    { name: "Website permanence", free: "6 months", premium: "Forever", deluxe: "Forever" },
  ]},
  { category: "Guest Management", features: [
    { name: "Guest limit", free: "50", premium: "250", deluxe: "Unlimited" },
    { name: "Guest groups", free: "15", premium: "Unlimited", deluxe: "Unlimited" },
    { name: "Advanced RSVP system", free: false, premium: true, deluxe: true },
    { name: "Activity tracking", free: "Last 10", premium: "1 week", deluxe: "Unlimited" },
  ]},
  { category: "Registry & Payments", features: [
    { name: "Bespoke registry with secure payouts", free: false, premium: true, deluxe: true },
    { name: "No personal account sharing", free: false, premium: true, deluxe: true },
    { name: "Registry commission", free: "—", premium: "20 MXN", deluxe: "10 MXN" },
  ]},
  { category: "Invitations & Communication", features: [
    { name: "Personalized digital invitations", free: false, premium: true, deluxe: true },
    { name: "Invitation activity tracking", free: false, premium: true, deluxe: true },
    { name: "WhatsApp automation (extra cost)", free: false, premium: false, deluxe: true },
    { name: "Curated message templates", free: false, premium: true, deluxe: true },
  ]},
  { category: "Customization & Reports", features: [
    { name: "Personalized subdomain", free: false, premium: true, deluxe: true },
    { name: "Bespoke domain support", free: false, premium: true, deluxe: true },
    { name: "Activity reports", free: false, premium: "Weekly", deluxe: "Daily" },
    { name: "Bespoke section components", free: false, premium: false, deluxe: true },
  ]},
  { category: "Support", features: [
    { name: "Email support", free: true, premium: true, deluxe: true },
    { name: "Priority support", free: false, premium: true, deluxe: true },
    { name: "Dedicated support agent", free: false, premium: false, deluxe: true },
  ]},
]

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/upgrade')
    }
  }, [user, authLoading, router])

  if (!authLoading && !subscriptionLoading && isPremium) {
    return (
      <main className="min-h-screen bg-[#f5f2eb]">
        <Header />
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
      router.push('/login?redirect=/upgrade')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsProcessing(false)
    }
  }

  const loading = authLoading || subscriptionLoading

  return (
    <main className="min-h-screen bg-[#f5f2eb] relative overflow-hidden">
      <Header />

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#420c14]/60 hover:text-[#420c14] mb-8 transition-colors text-sm tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

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
      </div>
    </main>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#f5f2eb]">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
        </div>
      </main>
    }>
      <UpgradePageContent />
    </Suspense>
  )
}

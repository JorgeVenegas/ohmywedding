"use client"

import React, { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { PLAN_CARDS } from "@/lib/subscription-shared"
import { motion } from "framer-motion"
import {
  Crown,
  Check,
  Sparkles,
  ArrowLeft,
  Gift,
  Loader2,
  Copy,
  Heart,
} from "lucide-react"
import { LanguageSwitcher } from "@/components/ui/language-switcher"

const plans = [
  {
    id: "premium" as const,
    name: PLAN_CARDS.premium.name,
    price: PLAN_CARDS.premium.price,
    period: PLAN_CARDS.premium.period,
    description: PLAN_CARDS.premium.description,
    features: PLAN_CARDS.premium.features.map(text => ({ text })),
    featured: true,
  },
  {
    id: "deluxe" as const,
    name: PLAN_CARDS.deluxe.name,
    price: PLAN_CARDS.deluxe.price,
    period: PLAN_CARDS.deluxe.period,
    description: PLAN_CARDS.deluxe.description,
    features: PLAN_CARDS.deluxe.features.map(text => ({ text })),
    isDeluxe: true,
  },
]

function GiftPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<"premium" | "deluxe">(
    searchParams.get("plan") === "deluxe" ? "deluxe" : "premium"
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGiftCheckout = async (planId: "premium" | "deluxe") => {
    setError(null)

    if (!user) {
      router.push(`/login?redirect=/gift?plan=${planId}`)
      return
    }

    setIsProcessing(true)
    setSelectedPlan(planId)

    try {
      const res = await fetch("/api/gift/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: planId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create gift checkout")
        setIsProcessing(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setIsProcessing(false)
    }
  }

  const loading = authLoading

  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      {/* Background decorations */}
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
        {/* Nav */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-12"
        >
          <Link href="/" className="flex items-center gap-3">
            <span className="text-[#420c14] font-['Elegant',cursive] text-3xl leading-none">Oh</span>
            <div>
              <p className="text-[10px] font-bold text-[#420c14] tracking-[0.2em] uppercase leading-tight">My Wedding</p>
              <p className="text-[7px] sm:text-[10px] text-[#420c14]/40 tracking-widest mt-0.5">WEDDING WEBSITES</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="buttons" className="text-[#420c14]" textColor="#420c14" />
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 text-[#420c14]/60 hover:text-[#420c14] transition-colors text-sm tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </motion.div>

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
            Gift a Subscription
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-[#420c14] mb-6 leading-tight">
            <span className="font-serif font-light">Give the gift of a</span>
            <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.4em] ml-2 block sm:inline">perfect wedding</span>
          </h1>
          <p className="text-[#420c14]/60 text-sm sm:text-base max-w-xl mx-auto">
            Purchase a gift subscription for newly engaged friends or family. They'll receive a unique code to unlock their plan — no account needed to redeem.
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-3xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 cursor-pointer transition-all duration-300 ${
                plan.featured
                  ? "bg-[#420c14] border-2 border-[#420c14]"
                  : "bg-gradient-to-br from-[#DDA46F] to-[#c99560] border-2 border-[#DDA46F]"
              } ${
                selectedPlan === plan.id
                  ? "ring-4 ring-[#DDA46F]/40 scale-[1.02]"
                  : "hover:scale-[1.01]"
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

              <div className={plan.featured || plan.isDeluxe ? "pt-2 sm:pt-4" : ""}>
                <h3 className={`text-2xl sm:text-3xl font-serif mb-2 ${plan.featured ? "text-[#f5f2eb]" : "text-[#420c14]"}`}>
                  {plan.name}
                </h3>
                <p className={`mb-6 sm:mb-8 text-sm sm:text-base ${plan.featured ? "text-[#f5f2eb]/60" : "text-[#420c14]/80"}`}>
                  {plan.description}
                </p>

                <div className="mb-8 sm:mb-10">
                  <span className={`text-4xl sm:text-6xl font-serif ${plan.featured ? "text-[#f5f2eb]" : "text-[#420c14]"}`}>
                    {plan.price}
                  </span>
                  <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${plan.featured ? "text-[#f5f2eb]/60" : "text-[#420c14]/70"}`}>
                    {plan.period}
                  </span>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleGiftCheckout(plan.id)
                  }}
                  disabled={loading || isProcessing}
                  className={`w-full h-12 sm:h-14 text-sm sm:text-base tracking-wider transition-all duration-700 ${
                    plan.featured
                      ? "bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14]"
                      : "bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
                  }`}
                >
                  {isProcessing && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Gift {plan.name}
                    </>
                  )}
                </Button>

                <ul className="mt-6 sm:mt-8 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.featured ? "bg-[#DDA46F]/30 text-[#DDA46F]" : "bg-[#420c14]/20 text-[#420c14]"
                      }`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={`text-sm ${plan.featured ? "text-[#f5f2eb]/80" : "text-[#420c14]/90"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-3xl mx-auto bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 border border-[#420c14]/10 shadow-xl shadow-[#420c14]/5"
        >
          <h2 className="text-xl sm:text-2xl font-serif text-[#420c14] mb-8 text-center">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: <Gift className="w-6 h-6" />, title: "1. Purchase", desc: "Choose a plan and complete checkout. A unique gift code will be generated." },
              { icon: <Copy className="w-6 h-6" />, title: "2. Share the code", desc: "Send the gift code to the couple. They can redeem it when setting up their wedding." },
              { icon: <Heart className="w-6 h-6" />, title: "3. They celebrate", desc: "The couple redeems the code in their settings to activate the plan immediately." },
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

        {/* Upgrade redirect note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center text-[#420c14]/40 text-xs mt-8"
        >
          Upgrading your own wedding?{" "}
          <Link href="/upgrade" className="underline hover:text-[#420c14]/70 transition-colors">
            Go to the upgrade page instead →
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

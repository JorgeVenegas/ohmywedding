"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gift,
  Crown,
  Sparkles,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ArrowLeft,
  MessageCircle,
  Mail,
  Share2,
} from "lucide-react"

function formatDisplayCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, '$1 · ')
}

function buildShareText(plan: string, code: string, formatted: string): string {
  return `🎁 Te regalo algo especial para vuestra boda!\n\nUn plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} en OhMyWedding — para crear el sitio web perfecto para su boda.\n\nCódigo de regalo:\n${formatted}\n\n💍 Para canjearlo, visiten: https://ohmy.wedding/gift/redeem`
}

function GiftSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [giftCode, setGiftCode] = useState<string | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setError("Invalid session. Please contact support.")
      setLoading(false)
      return
    }
    const verify = async () => {
      try {
        const res = await fetch("/api/gift/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Failed to retrieve gift code.")
        } else {
          setGiftCode(data.code)
          setPlan(data.plan)
        }
      } catch {
        setError("Something went wrong. Please contact support.")
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [sessionId])

  const formatted = giftCode ? formatDisplayCode(giftCode) : ''
  const shareText = plan && giftCode ? buildShareText(plan, giftCode, formatted) : ''

  const handleCopy = async () => {
    if (!shareText) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText)
      } else {
        const ta = document.createElement('textarea')
        ta.value = shareText
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = giftCode || ''
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch { /* nothing */ }
    }
  }

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer')
  }

  const handleEmail = () => {
    const subject = encodeURIComponent('🎁 Un regalo para vuestra boda')
    const body = encodeURIComponent(shareText)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ''

  return (
    <div className="min-h-screen bg-[#f5f2eb] relative overflow-hidden flex items-start justify-center p-4 pt-8 sm:pt-16">
      {/* Background blobs */}
      <motion.div
        className="absolute top-1/4 left-[5%] w-80 h-80 rounded-full bg-[#DDA46F]/10 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-[5%] w-72 h-72 rounded-full bg-[#420c14]/5 blur-3xl pointer-events-none"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <div className="relative w-full max-w-md space-y-5">
        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/" className="inline-flex items-center gap-2 text-[#420c14]/50 hover:text-[#420c14] text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </motion.div>

        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#420c14]/40" />
            <p className="text-[#420c14]/50 text-sm">Generating your gift…</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl shadow-xl p-8 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <h1 className="text-xl font-serif text-[#420c14] mb-3">Something went wrong</h1>
            <p className="text-[#420c14]/60 text-sm mb-8">{error}</p>
            <Link href="/gift">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Gift Page
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <p className="text-[#420c14]/50 text-xs tracking-[0.3em] uppercase mb-2">Payment confirmed</p>
              <h1 className="text-3xl sm:text-4xl font-serif text-[#420c14]">
                Your gift is{' '}
                <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.3em]">ready</span>
              </h1>
            </motion.div>

            {/* ── THE GIFT CARD ─────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative pt-2"
            >
              <div className="relative bg-gradient-to-br from-[#1f0508] via-[#3d0c12] to-[#2a1206] rounded-[1.75rem] border border-[#DDA46F]/20 overflow-hidden shadow-2xl shadow-black/40 p-7 sm:p-9">
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 pointer-events-none"
                  animate={{ x: ['-150%', '250%'] }}
                  transition={{ duration: 3.5, delay: 1, repeat: Infinity, repeatDelay: 5 }}
                />
                {/* Glow orbs */}
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#DDA46F]/8 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-[#DDA46F]/6 blur-2xl pointer-events-none" />
                {/* Corner brackets */}
                <div className="absolute top-5 left-5 w-6 h-6 border-l-[1.5px] border-t-[1.5px] border-[#DDA46F]/40 rounded-tl-lg pointer-events-none" />
                <div className="absolute top-5 right-5 w-6 h-6 border-r-[1.5px] border-t-[1.5px] border-[#DDA46F]/40 rounded-tr-lg pointer-events-none" />
                <div className="absolute bottom-5 left-5 w-6 h-6 border-l-[1.5px] border-b-[1.5px] border-[#DDA46F]/40 rounded-bl-lg pointer-events-none" />
                <div className="absolute bottom-5 right-5 w-6 h-6 border-r-[1.5px] border-b-[1.5px] border-[#DDA46F]/40 rounded-br-lg pointer-events-none" />

                <div className="relative">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-6">
                    <p className="text-[#DDA46F]/50 text-[10px] tracking-[0.4em] uppercase font-light">OhMyWedding</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDA46F]/15 border border-[#DDA46F]/25">
                      <Crown className="w-3 h-3 text-[#DDA46F]" />
                      <span className="text-[#DDA46F] text-[10px] font-semibold tracking-widest uppercase">{planLabel}</span>
                    </div>
                  </div>

                  {/* Main */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-4 h-4 text-[#DDA46F]" />
                      <p className="text-[#DDA46F] text-[10px] tracking-[0.25em] uppercase font-medium">Wedding Gift</p>
                    </div>
                    <h2 className="text-white/90 font-serif text-xl sm:text-2xl leading-snug">
                      A year of memories,<br />beautifully told.
                    </h2>
                  </div>

                  {/* Code block */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 mb-5">
                    <p className="text-[#DDA46F]/50 text-[9px] tracking-[0.4em] uppercase mb-3">Gift Code</p>
                    <p className="text-white font-mono text-lg sm:text-xl tracking-[0.15em] font-bold select-all break-all">
                      {formatted}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#DDA46F]/40" />
                      <p className="text-white/25 text-[10px] tracking-wider">One-time use</p>
                    </div>
                    <p className="text-white/25 text-[10px] tracking-wider">Valid 12 months</p>
                  </div>
                </div>
              </div>

              {/* Ribbon tab */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="absolute -top-0 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-[#DDA46F] rounded-b-lg shadow-lg shadow-[#DDA46F]/30"
              />
            </motion.div>

            {/* ── SHARING ───────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-3xl shadow-xl shadow-[#420c14]/8 p-6 sm:p-7 space-y-3"
            >
              <div className="text-center mb-4">
                <Share2 className="w-4 h-4 text-[#420c14]/40 mx-auto mb-1.5" />
                <h3 className="text-[#420c14] font-medium text-sm">Share with the couple</h3>
                <p className="text-[#420c14]/40 text-xs mt-0.5">Send them the code with a personal message</p>
              </div>

              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#25D366]/8 border border-[#25D366]/20 hover:bg-[#25D366]/15 hover:border-[#25D366]/40 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[#420c14] text-sm font-medium leading-tight">WhatsApp</p>
                  <p className="text-[#420c14]/40 text-xs">Message with code included</p>
                </div>
              </button>

              {/* Email */}
              <button
                onClick={handleEmail}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#420c14]/5 border border-[#420c14]/10 hover:bg-[#420c14]/10 hover:border-[#420c14]/20 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-[#420c14]/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#420c14]/70" />
                </div>
                <div className="text-left">
                  <p className="text-[#420c14] text-sm font-medium leading-tight">Email</p>
                  <p className="text-[#420c14]/40 text-xs">Opens in your mail app</p>
                </div>
              </button>

              {/* Copy message */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#DDA46F]/8 border border-[#DDA46F]/20 hover:bg-[#DDA46F]/15 hover:border-[#DDA46F]/40 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-[#DDA46F]/20 flex items-center justify-center flex-shrink-0">
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check className="w-5 h-5 text-[#DDA46F]" />
                      </motion.div>
                    ) : (
                      <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Copy className="w-5 h-5 text-[#DDA46F]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="text-left">
                  <p className="text-[#420c14] text-sm font-medium leading-tight">
                    {copied ? 'Copied to clipboard!' : 'Copy message & code'}
                  </p>
                  <p className="text-[#420c14]/40 text-xs">Paste into any app</p>
                </div>
              </button>
            </motion.div>

            {/* ── HOW TO REDEEM ─────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="bg-white rounded-3xl shadow-xl shadow-[#420c14]/8 p-6 sm:p-7"
            >
              <h3 className="text-[#420c14] font-medium text-sm mb-4">How the couple redeems it</h3>
              <ol className="space-y-3">
                {[
                  'They create (or log into) their OhMyWedding account',
                  'Visit ohmy.wedding/gift/redeem',
                  'Enter the gift code and select their wedding',
                  `Their ${planLabel} plan activates instantly ✨`,
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#420c14]/10 text-[#420c14] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[#420c14]/60 text-sm">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 pt-4 border-t border-[#420c14]/8 flex items-center justify-between">
                <p className="text-[#420c14]/35 text-xs">Code also sent to your email</p>
                <Link href="/" className="text-[#DDA46F] text-xs hover:underline">Back to home</Link>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

export default function GiftSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f2eb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#420c14]" />
      </div>
    }>
      <GiftSuccessContent />
    </Suspense>
  )
}

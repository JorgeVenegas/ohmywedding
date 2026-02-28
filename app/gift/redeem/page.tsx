"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gift,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Crown,
  Sparkles,
  ChevronDown,
} from "lucide-react"

type Wedding = {
  id: string
  wedding_name_id: string
  partner1_first_name?: string
  partner2_first_name?: string
  plan: string
}

function formatCodeInput(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16)
  return clean.replace(/(.{4})(?=.)/g, '$1-')
}

function GiftRedeemContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [code, setCode] = useState(() => {
    const param = searchParams.get('code') || ''
    return formatCodeInput(param)
  })
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>('')
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [loadingWeddings, setLoadingWeddings] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ plan: string; weddingName: string } | null>(null)

  useEffect(() => {
    if (!user) return
    setLoadingWeddings(true)
    fetch('/api/weddings')
      .then(r => r.json())
      .then(data => {
        const eligible = (data.weddings || []).filter((w: Wedding) => w.plan === 'free')
        setWeddings(eligible)
        if (eligible.length === 1) setSelectedWeddingId(eligible[0].id)
      })
      .catch(() => {})
      .finally(() => setLoadingWeddings(false))
  }, [user])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(formatCodeInput(e.target.value))
    setError(null)
  }

  const handleRedeem = async () => {
    if (!user) {
      router.push(`/login?redirect=/gift/redeem${code ? `?code=${code.replace(/-/g, '')}` : ''}`)
      return
    }
    if (!selectedWeddingId) {
      setError('Please select the wedding to apply this gift to.')
      return
    }
    const rawCode = code.replace(/-/g, '').trim()
    if (rawCode.length < 8) {
      setError('Please enter a valid gift code.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/gift/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: rawCode, weddingId: selectedWeddingId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to redeem gift code.')
      } else {
        const wedding = weddings.find(w => w.id === selectedWeddingId)
        const weddingName = wedding
          ? [wedding.partner1_first_name, wedding.partner2_first_name].filter(Boolean).join(' & ') || wedding.wedding_name_id
          : 'your wedding'
        setSuccess({ plan: data.plan, weddingName })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f2eb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#420c14]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f2eb] relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <motion.div
        className="absolute top-1/4 left-[5%] w-72 h-72 rounded-full bg-[#DDA46F]/10 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-[5%] w-64 h-64 rounded-full bg-[#420c14]/10 blur-3xl pointer-events-none"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#420c14]/50 hover:text-[#420c14] text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-3xl shadow-2xl shadow-[#420c14]/10 p-8 sm:p-10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200, damping: 14 }}
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-serif text-[#420c14] mb-3">Gift Redeemed! 🎉</h1>
              <p className="text-[#420c14]/60 text-sm mb-6">
                Your{' '}
                <span className="font-semibold capitalize text-[#420c14]">{success.plan}</span>{' '}
                plan has been activated for{' '}
                <span className="font-semibold text-[#420c14]">{success.weddingName}</span>.
              </p>
              <Button
                onClick={() => router.push(`/admin/${selectedWeddingId}/dashboard`)}
                className="w-full h-12 bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
              >
                Go to my wedding dashboard
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-3xl shadow-2xl shadow-[#420c14]/10 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-[#1f0508] via-[#420c14] to-[#2a1205] p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200, damping: 14 }}
                  className="w-14 h-14 rounded-2xl bg-[#DDA46F]/20 border border-[#DDA46F]/30 flex items-center justify-center mx-auto mb-4"
                >
                  <Gift className="w-7 h-7 text-[#DDA46F]" />
                </motion.div>
                <h1 className="text-2xl font-serif text-white mb-1">Redeem a Gift</h1>
                <p className="text-white/50 text-sm">Enter your gift code to activate your wedding plan</p>
              </div>

              <div className="p-8 sm:p-10 space-y-6">
                {/* Code input */}
                <div>
                  <label className="block text-xs font-medium text-[#420c14]/60 uppercase tracking-wider mb-2">
                    Gift Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    maxLength={19}
                    className="w-full h-12 px-4 rounded-xl border border-[#420c14]/15 bg-[#f5f2eb]/50 text-[#420c14] font-mono text-base tracking-widest placeholder:text-[#420c14]/20 focus:outline-none focus:ring-2 focus:ring-[#DDA46F]/40 focus:border-[#DDA46F] transition-all text-center"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                {/* Wedding selector */}
                {!user ? (
                  <div className="rounded-2xl bg-[#f5f2eb] border border-[#420c14]/10 p-5 text-center">
                    <p className="text-[#420c14]/60 text-sm mb-4">Sign in to apply this gift to your wedding</p>
                    <Button
                      onClick={() => router.push(`/login?redirect=/gift/redeem${code ? `?code=${code.replace(/-/g, '')}` : ''}`)}
                      className="bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] w-full"
                    >
                      Sign in
                    </Button>
                  </div>
                ) : loadingWeddings ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#420c14]/40" />
                  </div>
                ) : weddings.length === 0 ? (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-center">
                    <p className="text-amber-800 text-sm mb-3">
                      No eligible weddings found. Gifts can only be applied to weddings on the free plan.
                    </p>
                    <Link href="/create-wedding" className="text-[#DDA46F] text-sm font-medium hover:underline">
                      Create a wedding first →
                    </Link>
                  </div>
                ) : weddings.length === 1 ? (
                  <div className="rounded-2xl bg-[#f5f2eb]/70 border border-[#420c14]/10 p-4">
                    <p className="text-xs text-[#420c14]/50 uppercase tracking-wider mb-1">Apply to</p>
                    <p className="text-[#420c14] font-medium">
                      {[weddings[0].partner1_first_name, weddings[0].partner2_first_name].filter(Boolean).join(' & ') || weddings[0].wedding_name_id}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-[#420c14]/60 uppercase tracking-wider mb-2">
                      Apply to
                    </label>
                    <div className="relative">
                      <select
                        value={selectedWeddingId}
                        onChange={e => setSelectedWeddingId(e.target.value)}
                        className="w-full h-12 px-4 pr-10 rounded-xl border border-[#420c14]/15 bg-[#f5f2eb]/50 text-[#420c14] text-sm focus:outline-none focus:ring-2 focus:ring-[#DDA46F]/40 transition-all appearance-none"
                      >
                        <option value="">Select a wedding…</option>
                        {weddings.map(w => (
                          <option key={w.id} value={w.id}>
                            {[w.partner1_first_name, w.partner2_first_name].filter(Boolean).join(' & ') || w.wedding_name_id}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#420c14]/40 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                {user && (
                  <Button
                    onClick={handleRedeem}
                    disabled={isSubmitting || !selectedWeddingId || code.replace(/-/g, '').length < 8}
                    className="w-full h-12 bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] tracking-wide disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Activating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Activate Gift
                      </>
                    )}
                  </Button>
                )}

                <p className="text-center text-[#420c14]/30 text-xs">
                  Want to gift a subscription instead?{' '}
                  <Link href="/gift" className="text-[#DDA46F] hover:underline">
                    Buy a gift →
                  </Link>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function GiftRedeemPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f2eb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#420c14]" />
      </div>
    }>
      <GiftRedeemContent />
    </Suspense>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, ExternalLink, Loader2, ArrowRight } from "lucide-react"

interface StripeConnectCardProps {
  weddingId: string
  stripeAccountId: string | null
  stripeOnboardingCompleted: boolean
  payoutsEnabled: boolean
  onStatusChange?: () => void
}

export function StripeConnectCard({
  weddingId,
  stripeAccountId,
  stripeOnboardingCompleted,
  payoutsEnabled,
  onStatusChange,
}: StripeConnectCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnectStripe = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!stripeAccountId) {
        const createResponse = await fetch("/api/connect/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weddingId }),
        })
        if (!createResponse.ok) {
          const data = await createResponse.json()
          throw new Error(data.error || "Failed to create Stripe account")
        }
      }
      const linkResponse = await fetch("/api/connect/account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId, type: "onboarding" }),
      })
      if (!linkResponse.ok) {
        const data = await linkResponse.json()
        throw new Error(data.error || "Failed to get onboarding link")
      }
      const { url } = await linkResponse.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsLoading(false)
    }
  }

  const handleAccessDashboard = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/connect/account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId, type: "login" }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to get dashboard link")
      }
      const { url } = await response.json()
      window.open(url, "_blank")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  if (payoutsEnabled) return null

  // ── Pending verification ──────────────────────────────────────────────────
  if (stripeAccountId && stripeOnboardingCompleted) {
    return (
      <div className="mb-8 rounded-2xl border border-amber-200/70 bg-amber-50/60 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="relative flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40" />
            <span className="relative w-2.5 h-2.5 rounded-full bg-amber-500 inline-flex" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">Pending Stripe Verification</p>
            <p className="text-xs text-amber-700/70 mt-0.5">Your account is being verified — this usually takes a few minutes.</p>
          </div>
          <button
            onClick={handleConnectStripe}
            disabled={isLoading}
            className="flex-shrink-0 text-xs font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2 disabled:opacity-50"
          >
            {isLoading ? "Loading…" : "Check again"}
          </button>
        </div>
      </div>
    )
  }

  // ── Incomplete onboarding ─────────────────────────────────────────────────
  if (stripeAccountId) {
    return (
      <div className="mb-8 rounded-2xl border border-[#420c14]/15 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-full bg-[#420c14]/6 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4.5 h-4.5 text-[#420c14]/50" style={{ width: 18, height: 18 }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#420c14]">Finish setting up payments</p>
            <p className="text-xs text-[#420c14]/50 mt-0.5">Complete your Stripe account to start receiving gifts from guests.</p>
          </div>
          <Button
            size="sm"
            onClick={handleConnectStripe}
            disabled={isLoading}
            className="flex-shrink-0 bg-[#420c14] hover:bg-[#5a1220] text-white text-xs h-8"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <>Continue Setup <ArrowRight className="w-3 h-3 ml-1" /></>
            )}
          </Button>
        </div>
        {error && (
          <div className="px-5 pb-4 -mt-1">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </div>
    )
  }

  // ── Disconnected — main CTA card ──────────────────────────────────────────
  return (
    <div className="mb-8 rounded-2xl overflow-hidden border border-[#420c14]/12 shadow-sm">
      <div className="flex flex-col sm:flex-row">
        {/* Left panel — dark with card motif */}
        <div
          className="relative sm:w-52 flex-shrink-0 flex items-center justify-center py-8 sm:py-10 px-6 overflow-hidden"
          style={{ background: '#420c14' }}
        >
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(245,242,235,0.8) 24px, rgba(245,242,235,0.8) 25px),
                                repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(245,242,235,0.8) 24px, rgba(245,242,235,0.8) 25px)`,
            }}
          />
          {/* Decorative card shape */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div
              className="w-28 h-[70px] rounded-xl flex flex-col justify-between p-3"
              style={{
                background: 'linear-gradient(135deg, rgba(221,164,111,0.25) 0%, rgba(221,164,111,0.08) 100%)',
                border: '1px solid rgba(221,164,111,0.3)',
              }}
            >
              <div className="flex justify-between items-start">
                <div className="w-6 h-4 rounded-sm" style={{ background: 'rgba(221,164,111,0.5)' }} />
                <div className="flex gap-0.5">
                  <div className="w-4 h-4 rounded-full" style={{ background: 'rgba(221,164,111,0.3)' }} />
                  <div className="w-4 h-4 rounded-full -ml-2" style={{ background: 'rgba(221,164,111,0.5)' }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-16 rounded-full" style={{ background: 'rgba(221,164,111,0.3)' }} />
                <div className="h-1 w-10 rounded-full" style={{ background: 'rgba(221,164,111,0.2)' }} />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-px w-5" style={{ background: 'rgba(221,164,111,0.4)' }} />
              <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'rgba(221,164,111,0.5)' }}>secure</span>
              <div className="h-px w-5" style={{ background: 'rgba(221,164,111,0.4)' }} />
            </div>
          </div>
        </div>

        {/* Right panel — content */}
        <div className="flex-1 bg-white px-6 py-6 flex flex-col justify-center gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#DDA46F] mb-1.5">Payments</p>
            <h3 className="text-lg font-serif text-[#420c14] leading-tight mb-2">
              Receive gifts directly from your guests
            </h3>
            <p className="text-sm text-[#420c14]/55 leading-relaxed">
              Connect your Stripe account to let guests contribute to your registry items. Payouts go straight to your bank — no middlemen.
            </p>
          </div>

          {/* Fee note */}
          <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-[#420c14]/4 w-fit">
            <div className="w-1 h-1 rounded-full bg-[#DDA46F]" />
            <span className="text-xs text-[#420c14]/60">20 MXN platform fee per contribution</span>
          </div>

          {error && (
            <p className="text-xs text-red-600 -mt-1">{error}</p>
          )}

          <Button
            onClick={handleConnectStripe}
            disabled={isLoading}
            className="w-fit bg-[#420c14] hover:bg-[#5a1220] text-white text-sm px-5 h-9"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting…</>
            ) : (
              <>Connect Stripe <ArrowRight className="w-3.5 h-3.5 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

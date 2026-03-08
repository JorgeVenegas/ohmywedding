"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, AlertTriangle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSubscriptionContext } from "@/components/contexts/subscription-context"
import { useTranslation } from "@/components/contexts/i18n-context"

const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "00:00:00"
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds]
    .map(n => String(n).padStart(2, "0"))
    .join(":")
}

export function FreeTrialBanner() {
  const { planType, freeTrialStartedAt, weddingId, loading } = useSubscriptionContext()
  const { t } = useTranslation()
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (planType !== "free" || !freeTrialStartedAt) {
      setTimeLeft(null)
      return
    }

    const trialEnd = new Date(freeTrialStartedAt).getTime() + TRIAL_DURATION_MS

    const tick = () => {
      const remaining = trialEnd - Date.now()
      setTimeLeft(remaining)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [planType, freeTrialStartedAt])

  // Don't render while loading or if on a paid plan
  if (loading || planType !== "free" || timeLeft === null) return null

  const isExpired = timeLeft <= 0
  const isUrgent = timeLeft > 0 && timeLeft < 6 * 60 * 60 * 1000 // < 6 hours

  const upgradeHref = weddingId
    ? `/upgrade?weddingId=${weddingId}&source=free_trial_banner&autoCheckout=1`
    : `/upgrade?source=free_trial_banner`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`w-full px-4 py-3 ${
          isExpired
            ? "bg-red-700"
            : isUrgent
            ? "bg-amber-600"
            : "bg-[#420c14]"
        }`}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: icon + text */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0">
              {isExpired ? (
                <AlertTriangle className="w-5 h-5 text-[#DDA46F]" />
              ) : (
                <Clock className="w-5 h-5 text-[#DDA46F]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#f5f2eb] leading-tight">
                {isExpired
                  ? t("admin.layout.freeTrialBanner.expiredTitle")
                  : `${t("admin.layout.freeTrialBanner.title")} `}
                {!isExpired && (
                  <span className="font-mono text-[#DDA46F] tabular-nums">
                    {formatTimeLeft(timeLeft)}
                  </span>
                )}
              </p>
              <p className="text-xs text-[#f5f2eb]/70 mt-0.5 hidden sm:block">
                {t("admin.layout.freeTrialBanner.description")}
              </p>
            </div>
          </div>

          {/* Right: CTA */}
          <Button
            size="sm"
            className="flex-shrink-0 bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] font-semibold text-xs gap-1.5 px-4 h-8"
            onClick={() => router.push(upgradeHref)}
          >
            {t("admin.layout.freeTrialBanner.upgradeButton")}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

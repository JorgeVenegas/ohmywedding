'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertCircle } from 'lucide-react'
import { useI18n } from '@/components/contexts/i18n-context'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { withLandingSource, type LandingSource } from '@/lib/landing-source'
import { CouplePricingQuiz } from './pricing/couple-pricing-quiz'
import { PlannerPricingQuiz } from './pricing/planner-pricing-quiz'
import type { PaymentMethod } from './pricing/payment-method-selector'
import type { CheckoutTarget } from './pricing/types'

export function PricingSection({ source }: { source?: LandingSource } = {}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { t } = useI18n()
  const router = useRouter()
  const { user } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [msiEnabled, setMsiEnabled] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [weddingSelectModal, setWeddingSelectModal] = useState<{
    target: CheckoutTarget
    weddings: Array<{ id: string; wedding_name_id: string; partner1_first_name?: string; partner2_first_name?: string }>
  } | null>(null)

  useEffect(() => {
    fetch('/api/feature-flags')
      .then(r => r.json())
      .then(flags => {
        if (typeof flags.msiEnabled === 'boolean') setMsiEnabled(flags.msiEnabled)
      })
      .catch(() => {}) // silently fall back to false
  }, [])

  const checkoutKey = ({ axis, tier }: CheckoutTarget) => `${axis}:${tier}`
  const isLoading = (target: CheckoutTarget) => checkoutLoading === checkoutKey(target)

  const handleCheckout = async (target: CheckoutTarget) => {
    const bundleParam = target.bundleDiscount ? '&bundleDiscount=1' : ''
    if (!user) {
      const upgradeTarget = withLandingSource(`/upgrade?axis=${target.axis}&tier=${target.tier}&paymentMethod=${paymentMethod}&autoCheckout=1&source=landing_pricing${bundleParam}`, source)
      router.push(withLandingSource(`/login?redirect=${encodeURIComponent(upgradeTarget)}`, source))
      return
    }
    setCheckoutError(null)
    setCheckoutLoading(checkoutKey(target))
    try {
      const res = await fetch('/api/weddings')
      const data = await res.json()
      const weddings: Array<{ id: string; wedding_name_id: string; partner1_first_name?: string; partner2_first_name?: string }> = data.weddings || []
      if (weddings.length === 0) {
        router.push(withLandingSource(`/create-wedding?axis=${target.axis}&tier=${target.tier}&source=landing_pricing${bundleParam}`, source))
        return
      }
      if (weddings.length === 1) {
        await proceedToCheckout(target, weddings[0].id)
        return
      }
      setWeddingSelectModal({ target, weddings })
      setCheckoutLoading(null)
    } catch {
      setCheckoutError(t('landing.pricing.errors.tryAgain'))
      setCheckoutLoading(null)
    }
  }

  const proceedToCheckout = async (target: CheckoutTarget, weddingId: string) => {
    setCheckoutLoading(checkoutKey(target))
    setWeddingSelectModal(null)
    try {
      const res = await fetch(`/api/weddings/${weddingId}/subscription/checkout-tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axis: target.axis, tier: target.tier, paymentMethod, source: 'landing_pricing', bundleDiscount: target.bundleDiscount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (data.url) window.location.href = data.url
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : t('landing.pricing.errors.tryAgain'))
      setCheckoutLoading(null)
    }
  }

  return (
    <section id="pricing" ref={ref} className="py-20 sm:py-40 bg-[#f5f2eb] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
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

        {source === 'planners' ? (
          <PlannerPricingQuiz
            onCheckout={handleCheckout}
            isLoading={isLoading}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            msiEnabled={msiEnabled}
          />
        ) : (
          <CouplePricingQuiz
            onCheckout={handleCheckout}
            isLoading={isLoading}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            msiEnabled={msiEnabled}
          />
        )}
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
              <div className="space-y-2">
                {weddingSelectModal.weddings.map(w => (
                  <button
                    key={w.id}
                    onClick={() => proceedToCheckout(weddingSelectModal.target, w.id)}
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

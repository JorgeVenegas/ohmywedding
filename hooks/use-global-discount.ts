'use client'

import { useState, useEffect } from 'react'

export type PaymentMethod = 'card' | 'msi'
export type DiscountPlan = 'premium' | 'deluxe'

export interface GlobalDiscount {
  id: string
  name: string
  label: string
  premium_card_discount_percent: number
  premium_msi_discount_percent: number
  deluxe_card_discount_percent: number
  deluxe_msi_discount_percent: number
  applies_to_plans: string[]
  starts_at: string
  ends_at: string | null
}

/**
 * Provides info about the currently active global promotion.
 * Shows promo badges and discounted prices on pricing cards.
 * Actual discount is applied via Stripe coupon at checkout (unit_amount stays full price).
 */
export function useGlobalDiscount() {
  const [discount, setDiscount] = useState<GlobalDiscount | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchDiscount() {
      try {
        const res = await fetch('/api/global-discounts')
        const data = await res.json()
        if (!cancelled) {
          setDiscount(data.discount || null)
        }
      } catch {
        // Silent fail — no discount shown
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDiscount()
    return () => { cancelled = true }
  }, [])

  function getDiscountPercent(plan: DiscountPlan, paymentMethod: PaymentMethod): number {
    if (!discount) return 0
    if (!discount.applies_to_plans.includes(plan)) return 0
    if (plan === 'premium') {
      return paymentMethod === 'card'
        ? discount.premium_card_discount_percent
        : discount.premium_msi_discount_percent
    }
    return paymentMethod === 'card'
      ? discount.deluxe_card_discount_percent
      : discount.deluxe_msi_discount_percent
  }

  function getDiscountedPrice(originalPriceCents: number, plan: DiscountPlan, paymentMethod: PaymentMethod): number {
    const percent = getDiscountPercent(plan, paymentMethod)
    if (percent <= 0) return originalPriceCents
    return Math.round(originalPriceCents * (1 - percent / 100))
  }

  function appliesToPlan(plan: string): boolean {
    if (!discount) return false
    if (!discount.applies_to_plans.includes(plan)) return false
    if (plan === 'premium') {
      return discount.premium_card_discount_percent > 0 || discount.premium_msi_discount_percent > 0
    }
    if (plan === 'deluxe') {
      return discount.deluxe_card_discount_percent > 0 || discount.deluxe_msi_discount_percent > 0
    }
    return false
  }

  return {
    discount,
    loading,
    getDiscountPercent,
    getDiscountedPrice,
    appliesToPlan,
  }
}

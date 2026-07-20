import type { Locale } from '@/lib/i18n/types'
import {
  INVITATION_PRICING,
  MANAGEMENT_PRICING,
  MANAGEMENT_SUBSCRIPTION_PRICING,
  type InvitationTier,
  type ManagementTier,
} from '@/lib/subscription-shared'
import { PRICING_CARD_CONTENT } from '@/lib/pricing-card-content'
import type { PlanCardData } from './plan-card'
import type { PlannerBillingCycle } from '@/lib/pricing-quiz'

export function getLocalizedInvitationCard(locale: Locale, tier: InvitationTier): PlanCardData {
  const pricing = INVITATION_PRICING[tier]
  const copy = PRICING_CARD_CONTENT[locale].invitation[tier]
  return { ...copy, priceDisplayMXN: pricing.priceDisplayMXN, period: pricing.period }
}

export function getLocalizedManagementCard(locale: Locale, tier: ManagementTier): PlanCardData {
  const pricing = MANAGEMENT_PRICING[tier]
  const copy = PRICING_CARD_CONTENT[locale].management[tier]
  return { ...copy, priceDisplayMXN: pricing.priceDisplayMXN, period: pricing.period }
}

// Returns a management card with pricing adjusted for the given billing cycle.
// Monthly/annual prices use the MANAGEMENT_SUBSCRIPTION_PRICING table.
export function getLocalizedManagementCardWithCycle(
  locale: Locale,
  tier: ManagementTier,
  cycle: PlannerBillingCycle,
): PlanCardData {
  const copy = PRICING_CARD_CONTENT[locale].management[tier]

  if (cycle === 'once') {
    const pricing = MANAGEMENT_PRICING[tier]
    return { ...copy, priceDisplayMXN: pricing.priceDisplayMXN, period: pricing.period }
  }

  const isAnnual = cycle === 'annual'
  const sub = isAnnual
    ? MANAGEMENT_SUBSCRIPTION_PRICING[tier].annual
    : MANAGEMENT_SUBSCRIPTION_PRICING[tier].monthly
  const periodLabel = locale === 'es' ? sub.periodES : sub.period

  // For annual, append the per-month breakdown so the card is self-explanatory.
  const period = isAnnual
    ? `${periodLabel} · ${MANAGEMENT_SUBSCRIPTION_PRICING[tier].annual.perMonthDisplayMXN}/${locale === 'es' ? 'mes' : 'mo'}`
    : periodLabel

  return { ...copy, priceDisplayMXN: sub.priceDisplayMXN, period }
}

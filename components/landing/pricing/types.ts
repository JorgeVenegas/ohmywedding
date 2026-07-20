import type { PricingAxis } from '@/lib/subscription-shared'

export type CheckoutTarget = { axis: PricingAxis; tier: string; bundleDiscount?: boolean }

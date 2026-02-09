/**
 * Centralized Stripe configuration
 * Update STRIPE_API_VERSION here and it will be used everywhere
 */

export const STRIPE_API_VERSION = '2026-01-28.clover'

/**
 * Creates a Stripe instance with the centralized API version
 * Bypasses TypeScript version lock with 'as any'
 */
export function createStripeInstance(secretKey: string) {
  const Stripe = require('stripe')
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION as any,
  })
}

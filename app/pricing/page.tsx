import type { Metadata } from 'next'
import PricingPage from './page-client'

export const metadata: Metadata = {
  title: 'Plans & Pricing',
  description: 'One-time payment, lifetime access. No subscriptions, no hidden fees. Find the perfect plan for your wedding website.',
  openGraph: {
    title: 'OhMyWedding — Plans & Pricing',
    description: 'One-time payment, lifetime access. No subscriptions, no hidden fees.',
    images: [{ url: '/images/demo_images/demo-img-40.jpg', width: 1200, height: 800, alt: 'OhMyWedding Plans & Pricing' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/demo_images/demo-img-40.jpg'] },
}

export default PricingPage

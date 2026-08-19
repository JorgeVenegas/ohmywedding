import type { Metadata } from 'next'
import PremiumPage from './page-client'

export const metadata: Metadata = {
  title: 'Premium Plan',
  description: 'Unlock the full OhMyWedding experience. Premium tools, guided design, and everything you need for a perfect wedding website.',
  openGraph: {
    title: 'OhMyWedding Premium Plan',
    description: 'Unlock the full OhMyWedding experience. Premium tools, guided design, and everything you need for a perfect wedding website.',
    images: [{ url: '/images/demo_images/demo-img-40.jpg', width: 1200, height: 800, alt: 'OhMyWedding Premium' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/demo_images/demo-img-40.jpg'] },
}

export default PremiumPage

import type { Metadata } from 'next'
import UpgradePage from './page-client'

export const metadata: Metadata = {
  title: 'Upgrade Your Plan',
  description: 'Unlock more features for your wedding website.',
  openGraph: {
    title: 'Upgrade Your Plan — OhMyWedding',
    description: 'Unlock more features for your wedding website.',
    images: [{ url: '/images/demo_images/demo-img-40.jpg', width: 1200, height: 800, alt: 'OhMyWedding Upgrade' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/demo_images/demo-img-40.jpg'] },
}

export default UpgradePage

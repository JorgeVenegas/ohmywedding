import type { Metadata } from 'next'
import GiftPage from './page-client'

export const metadata: Metadata = {
  title: 'Gift a Wedding Website',
  description: 'Give the perfect wedding gift — a beautiful, professional wedding website.',
  openGraph: {
    title: 'Gift a Wedding Website — OhMyWedding',
    description: 'Give the perfect wedding gift — a beautiful, professional wedding website.',
    images: [{ url: '/images/demo_images/demo-img-3.jpg', width: 1200, height: 800, alt: 'Gift a Wedding Website' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/demo_images/demo-img-3.jpg'] },
}

export default GiftPage

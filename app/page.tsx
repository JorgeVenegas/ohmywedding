import type { Metadata } from 'next'
import ChooserPage from './page-client'

export const metadata: Metadata = {
  title: { absolute: 'Welcome to OhMyWedding' },
  description: 'Create a beautiful wedding website for your special day. OhMyWedding — luxury wedding websites for couples and planners.',
  openGraph: {
    title: 'OhMyWedding — Luxury Wedding Websites',
    description: 'Create a beautiful wedding website for your special day.',
    images: [{ url: '/images/demo_images/demo-img-2.jpg', width: 1200, height: 800, alt: 'OhMyWedding' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/demo_images/demo-img-2.jpg'] },
}

export default ChooserPage

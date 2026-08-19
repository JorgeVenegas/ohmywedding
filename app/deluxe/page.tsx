import type { Metadata } from 'next'
import DeluxePage from './page-client'

export const metadata: Metadata = {
  title: 'Deluxe Plan',
  description: 'The ultimate wedding website experience. Bespoke design, dedicated support, and a fully custom digital invitation.',
  openGraph: {
    title: 'OhMyWedding Deluxe — Bespoke Wedding Websites',
    description: 'The ultimate wedding website experience. Bespoke design, dedicated support, and a fully custom digital invitation.',
    images: [{ url: '/images/demo_images/demo-img-42.jpg', width: 1200, height: 800, alt: 'OhMyWedding Deluxe' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/demo_images/demo-img-42.jpg'] },
}

export default DeluxePage

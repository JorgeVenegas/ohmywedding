import type { Metadata } from 'next'
import PlannersPage from './page-client'

export const metadata: Metadata = {
  title: { absolute: 'OhMyWedding for Wedding Planners' },
  description: 'Manage multiple weddings, delight your clients, and deliver luxury digital experiences with OhMyWedding.',
  openGraph: {
    title: 'OhMyWedding for Wedding Planners',
    description: 'Manage multiple weddings, delight your clients, and deliver luxury digital experiences.',
    images: [{ url: '/images/demo_images/demo-img-25.jpg', width: 1200, height: 800, alt: 'OhMyWedding for Wedding Planners' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/demo_images/demo-img-25.jpg'] },
}

export default PlannersPage

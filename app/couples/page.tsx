import type { Metadata } from 'next'
import CouplesPage from './page-client'

export const metadata: Metadata = {
  title: { absolute: 'OhMyWedding for Couples' },
  description: 'Build a stunning wedding website in minutes. Manage RSVPs, share your story, and celebrate your love with OhMyWedding.',
  openGraph: {
    title: 'OhMyWedding for Couples',
    description: 'Build a stunning wedding website in minutes. Manage RSVPs, share your story, and celebrate your love.',
    images: [{ url: '/images/demo_images/demo-img-3.jpg', width: 1200, height: 800, alt: 'OhMyWedding for Couples' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/demo_images/demo-img-3.jpg'] },
}

export default CouplesPage

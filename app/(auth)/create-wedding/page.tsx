import type { Metadata } from 'next'
import CreateWeddingPage from './page-client'

export const metadata: Metadata = {
  title: 'Create Your Wedding Website',
  description: 'Start building your wedding website today. Tell us about yourselves and we\'ll create a beautiful site in seconds.',
  openGraph: {
    title: 'Create Your Wedding Website — OhMyWedding',
    description: 'Start building your wedding website today. Tell us about yourselves and we\'ll create a beautiful site in seconds.',
    images: [{ url: '/images/demo_images/demo-img-2.jpg', width: 1200, height: 800, alt: 'Create Your Wedding Website' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/demo_images/demo-img-2.jpg'] },
}

export default CreateWeddingPage

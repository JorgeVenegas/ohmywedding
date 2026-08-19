import type { Metadata } from 'next'
import LoginPage from './page-client'

export const metadata: Metadata = {
  title: { absolute: 'Sign in to OhMyWedding' },
  description: 'Sign in to your OhMyWedding account to manage your wedding website.',
  openGraph: {
    title: 'Sign in to OhMyWedding',
    description: 'Sign in to your OhMyWedding account to manage your wedding website.',
    images: [{ url: '/images/demo_images/demo-img-2.jpg', width: 1200, height: 800, alt: 'OhMyWedding' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/demo_images/demo-img-2.jpg'] },
}

export default LoginPage

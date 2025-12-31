import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWeddingByNameId } from '@/lib/wedding-data'
import WeddingPageClient from './page-client'

interface Props {
  params: Promise<{ weddingNameId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Helper to ensure URL is absolute
function ensureAbsoluteUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // If it's a relative Supabase storage path, make it absolute
  if (url.includes('storage/v1/object/public')) {
    return url.startsWith('/') 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}${url}`
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/${url}`
  }
  return url
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  try {
    const { weddingNameId } = await params
    const decodedWeddingNameId = decodeURIComponent(weddingNameId)
    const searchParamsData = await searchParams
    const groupId = searchParamsData.groupId as string | undefined
    
    // Fetch wedding data
    const wedding = await getWeddingByNameId(decodedWeddingNameId)
    
    if (!wedding) {
      return {
        title: 'Wedding Not Found',
        description: 'The wedding page you are looking for does not exist.'
      }
    }

    // Build couple names
    const partner1Names = [wedding.partner1_first_name, wedding.partner1_last_name].filter(Boolean)
    const partner2Names = [wedding.partner2_first_name, wedding.partner2_last_name].filter(Boolean)
    const partner1 = partner1Names.join(' ')
    const partner2 = partner2Names.join(' ')
    const coupleNames = [partner1, partner2].filter(Boolean).join(' & ')

    // Build wedding date string
    let dateString = ''
    if (wedding.wedding_date) {
      const date = new Date(wedding.wedding_date)
      dateString = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }

    // Use custom OG title or build from data
    let title = wedding.og_title || ''
    if (!title) {
      const titleParts = []
      if (coupleNames) titleParts.push(coupleNames)
      if (dateString) titleParts.push(dateString)
      title = titleParts.length > 0 
        ? titleParts.join(' - ')
        : 'You\'re Invited to Our Wedding!'
    }

    // Use custom OG description or build from data
    let description = wedding.og_description || ''
    if (!description) {
      if (groupId && coupleNames) {
        description = `You are invited to celebrate the wedding of ${coupleNames}${dateString ? ` on ${dateString}` : ''}!`
      } else if (coupleNames) {
        description = `Join us in celebrating the wedding of ${coupleNames}${dateString ? ` on ${dateString}` : ''}.`
      } else {
        description = `You're invited to celebrate our special day${dateString ? ` on ${dateString}` : ''}!`
      }
    }

    // Use custom OG image or extract from hero section
    let imageUrl = wedding.og_image_url || ''
    if (!imageUrl) {
      if (wedding.page_config?.sections) {
        const heroSection = wedding.page_config.sections.find(
          (section: any) => section.type === 'hero' && section.config?.backgroundImage
        )
        if (heroSection?.config?.backgroundImage) {
          imageUrl = heroSection.config.backgroundImage
        }
      }
      if (!imageUrl) {
        imageUrl = 'https://www.ohmy.wedding/og-image.jpg' // Final fallback
      }
    }

    console.log('[generateMetadata] OG Image URL:', imageUrl)

    // Ensure image URL is absolute
    imageUrl = ensureAbsoluteUrl(imageUrl)
    console.log('[generateMetadata] Final OG Image URL:', imageUrl)

    // Build canonical URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ohmy.wedding'
    const url = `${baseUrl}/${weddingNameId}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: 'OhMyWedding',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${title} - Wedding Invitation`,
            type: 'image/jpeg',
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'OhMyWedding',
      description: 'Create your perfect wedding website',
    }
  }
}

export default async function WeddingPage({ params }: Props) {
  const { weddingNameId } = await params
  const decodedWeddingNameId = decodeURIComponent(weddingNameId)
  
  // Verify wedding exists (for 404 handling)
  const wedding = await getWeddingByNameId(decodedWeddingNameId)
  if (!wedding) {
    notFound()
  }

  return <WeddingPageClient weddingNameId={decodedWeddingNameId} />
}

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWeddingByNameId } from '@/lib/wedding-data'
import WeddingPageClient from './page-client'

interface Props {
  params: Promise<{ weddingNameId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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

    // Build title
    const titleParts = []
    if (coupleNames) titleParts.push(coupleNames)
    if (dateString) titleParts.push(dateString)
    const title = titleParts.length > 0 
      ? titleParts.join(' - ')
      : 'You\'re Invited to Our Wedding!'

    // Build description
    let description = ''
    if (groupId && coupleNames) {
      description = `You are invited to celebrate the wedding of ${coupleNames}${dateString ? ` on ${dateString}` : ''}!`
    } else if (coupleNames) {
      description = `Join us in celebrating the wedding of ${coupleNames}${dateString ? ` on ${dateString}` : ''}.`
    } else {
      description = `You're invited to celebrate our special day${dateString ? ` on ${dateString}` : ''}!`
    }

    // Extract hero image for Open Graph
    let imageUrl = 'https://www.ohmy.wedding/og-image.jpg' // Default fallback
    if (wedding.page_config?.sections) {
      const heroSection = wedding.page_config.sections.find(
        (section: any) => section.type === 'hero' && section.config?.backgroundImage
      )
      if (heroSection?.config?.backgroundImage) {
        imageUrl = heroSection.config.backgroundImage
      }
    }

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

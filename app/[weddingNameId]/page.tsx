import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWeddingByNameId } from '@/lib/wedding-data'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import { isPreviewable } from '@/lib/invitation-workflow'
import { WorkInProgressPage } from '@/components/wedding/work-in-progress-page'
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

    // Ensure image URL is absolute
    imageUrl = ensureAbsoluteUrl(imageUrl)

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
    return {
      title: 'OhMyWedding',
      description: 'Create your perfect wedding website',
    }
  }
}

export default async function WeddingPage({ params }: Props) {
  const { weddingNameId } = await params
  const decodedWeddingNameId = decodeURIComponent(weddingNameId)

  const wedding = await getWeddingByNameId(decodedWeddingNameId)
  if (!wedding) {
    notFound()
  }

  const status = wedding.invitation_design_status ?? 'not_started'

  // If the invitation is live, render normally for everyone
  if (status === 'live') {
    return <WeddingPageClient weddingNameId={decodedWeddingNameId} />
  }

  // For non-live weddings, check if the viewer has preview access
  // (superadmin, owner, or an assigned reviewer when status is previewable)
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const adminClient = createAdminSupabaseClient()
      const superuser = await isSuperUser(adminClient, { email: user.email })
      if (superuser) {
        return <WeddingPageClient weddingNameId={decodedWeddingNameId} />
      }

      const isOwner = wedding.owner_id === user.id
      if (isOwner && isPreviewable(status)) {
        return <WeddingPageClient weddingNameId={decodedWeddingNameId} />
      }

      if (isPreviewable(status) && user.email) {
        const { data: reviewRow } = await adminClient
          .from('design_review_requests')
          .select('id')
          .eq('wedding_id', wedding.id)
          .eq('reviewer_email', user.email.toLowerCase())
          .neq('status', 'dismissed')
          .maybeSingle()

        if (reviewRow) {
          return <WeddingPageClient weddingNameId={decodedWeddingNameId} />
        }
      }
    }
  } catch {
    // Auth failure — fall through to WIP page
  }

  // Not live and no preview access — show work in progress
  const p1 = [wedding.partner1_first_name, wedding.partner1_last_name].filter(Boolean).join(' ')
  const p2 = [wedding.partner2_first_name, wedding.partner2_last_name].filter(Boolean).join(' ')
  const coupleNames = [p1, p2].filter(Boolean).join(' & ') || 'Coming Soon'

  return (
    <WorkInProgressPage
      coupleNames={coupleNames}
      weddingDate={wedding.wedding_date}
    />
  )
}

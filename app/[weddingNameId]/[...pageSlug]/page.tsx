import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createAdminSupabaseClient } from "@/lib/supabase-server"
import { I18nProvider } from "@/components/contexts/i18n-context"
import type { Locale } from "@/lib/i18n"
import RegistryPageContent from "./registry-page-content"
import { SubPageClient } from "./subpage-client"
import { SubPageNotFound } from "./subpage-not-found"

interface PageSlugProps {
  params: Promise<{ weddingNameId: string; pageSlug: string[] }>
}

interface WeddingLookup {
  weddingExists: boolean
  config: Record<string, any> | null
  wedding: Record<string, any> | null
}

interface GuestPhotoSettings {
  uploadsEnabled: boolean
  moderationEnabled: boolean
}

async function lookupWedding(weddingNameId: string): Promise<WeddingLookup> {
  try {
    const admin = createAdminSupabaseClient()
    const { data: wedding } = await admin
      .from("weddings")
      .select("id, page_config, partner1_first_name, partner2_first_name, wedding_date, og_title, og_image_url")
      .eq("wedding_name_id", weddingNameId)
      .single()

    if (!wedding) return { weddingExists: false, config: null, wedding: null }

    const { data: website } = await admin
      .from("wedding_websites")
      .select("page_config")
      .eq("wedding_id", wedding.id)
      .single()

    const config = website?.page_config ?? wedding.page_config
    return { weddingExists: true, config: (config as Record<string, any>) ?? null, wedding }
  } catch {
    return { weddingExists: false, config: null, wedding: null }
  }
}

async function lookupGuestPhotoSettings(weddingId: string): Promise<GuestPhotoSettings> {
  try {
    const admin = createAdminSupabaseClient()
    const { data } = await admin
      .from("wedding_settings")
      .select("gallery_allow_guest_uploads, gallery_moderation_enabled")
      .eq("wedding_id", weddingId)
      .single()
    return {
      uploadsEnabled: !!data?.gallery_allow_guest_uploads,
      moderationEnabled: data?.gallery_moderation_enabled !== false,
    }
  } catch {
    return { uploadsEnabled: false, moderationEnabled: true }
  }
}

function getLocale(config: Record<string, any> | null): Locale {
  const siteLocale = config?.siteSettings?.locale
  if (siteLocale === "en" || siteLocale === "es") return siteLocale
  return "en"
}

function buildCoupleNames(wedding: Record<string, any> | null): string {
  if (!wedding) return ""
  const p1 = wedding.partner1_first_name || ""
  const p2 = wedding.partner2_first_name || ""
  return [p1, p2].filter(Boolean).join(" & ")
}

export async function generateMetadata({ params }: PageSlugProps): Promise<Metadata> {
  try {
    const { weddingNameId: rawId, pageSlug } = await params
    const weddingNameId = decodeURIComponent(rawId)
    const slug = pageSlug[0]

    const { weddingExists, config, wedding } = await lookupWedding(weddingNameId)
    if (!weddingExists) return { title: "Page Not Found" }

    const coupleNames = buildCoupleNames(wedding)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ohmy.wedding"

    // OG image: use wedding's og_image_url, then look for hero background, then fallback
    let imageUrl = wedding?.og_image_url || ""
    if (!imageUrl && config?.sections) {
      const hero = config.sections.find(
        (s: any) => s.type === "hero" && s.config?.backgroundImage
      )
      if (hero?.config?.backgroundImage) imageUrl = hero.config.backgroundImage
    }
    if (!imageUrl) imageUrl = `${baseUrl}/og-image.jpg`
    if (imageUrl && !imageUrl.startsWith("http")) imageUrl = `${baseUrl}${imageUrl}`

    // Find the matched page entry in config to get its label and optional ogTitle
    const matchedPage = (config?.pages ?? []).find(
      (p: any) => p.path === slug && p.enabled
    )

    // Custom OG title: page-level override → couple names + page label → base wedding title
    let title = matchedPage?.ogTitle || ""
    if (!title) {
      const pageLabel = matchedPage?.label || slug
      title = coupleNames
        ? `${coupleNames} — ${pageLabel}`
        : pageLabel
    }

    const description = coupleNames
      ? `${coupleNames}'s wedding — ${matchedPage?.label || slug}`
      : `Wedding — ${matchedPage?.label || slug}`

    const url = `${baseUrl}/${weddingNameId}/${slug}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: "OhMyWedding",
        images: [{ url: imageUrl, width: 1200, height: 630 }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    }
  } catch {
    return { title: "OhMyWedding" }
  }
}

export default async function WeddingSubPage({ params }: PageSlugProps) {
  const { weddingNameId: rawId, pageSlug } = await params
  const weddingNameId = decodeURIComponent(rawId)
  const slug = pageSlug[0]

  const { weddingExists, config, wedding } = await lookupWedding(weddingNameId)
  // Note: Next.js deduplicates fetch/DB calls between generateMetadata and the page function

  if (!weddingExists) notFound()

  const locale = getLocale(config)

  // Config-driven sub-pages
  const matchedPage = (config?.pages ?? []).find(
    (p: any) => p.path === slug && p.enabled
  )
  if (matchedPage) {
    const guestPhotoSettings = wedding?.id
      ? await lookupGuestPhotoSettings(wedding.id)
      : undefined
    return <SubPageClient weddingNameId={weddingNameId} pageSlug={slug} guestPhotoSettings={guestPhotoSettings} />
  }

  // Hardcoded: registry (Stripe-backed; not yet a config component)
  if (slug === "registry") {
    return (
      <I18nProvider initialLocale={locale}>
        <RegistryPageContent weddingNameId={weddingNameId} />
      </I18nProvider>
    )
  }

  // Wedding exists but sub-page not configured
  return (
    <I18nProvider initialLocale={locale}>
      <SubPageNotFound weddingNameId={weddingNameId} />
    </I18nProvider>
  )
}

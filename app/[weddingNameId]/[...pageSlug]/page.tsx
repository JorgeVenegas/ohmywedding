import { notFound } from "next/navigation"
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
}

async function lookupWedding(weddingNameId: string): Promise<WeddingLookup> {
  try {
    const admin = createAdminSupabaseClient()
    const { data: wedding } = await admin
      .from("weddings")
      .select("id, page_config")
      .eq("wedding_name_id", weddingNameId)
      .single()

    if (!wedding) return { weddingExists: false, config: null }

    const { data: website } = await admin
      .from("wedding_websites")
      .select("page_config")
      .eq("wedding_id", wedding.id)
      .single()

    const config = website?.page_config ?? wedding.page_config
    return { weddingExists: true, config: (config as Record<string, any>) ?? null }
  } catch {
    return { weddingExists: false, config: null }
  }
}

function getLocale(config: Record<string, any> | null): Locale {
  const siteLocale = config?.siteSettings?.locale
  if (siteLocale === "en" || siteLocale === "es") return siteLocale
  return "en"
}

export default async function WeddingSubPage({ params }: PageSlugProps) {
  const { weddingNameId: rawId, pageSlug } = await params
  const weddingNameId = decodeURIComponent(rawId)
  const slug = pageSlug[0]

  const { weddingExists, config } = await lookupWedding(weddingNameId)

  if (!weddingExists) notFound()

  const locale = getLocale(config)

  // Config-driven sub-pages
  const matchedPage = (config?.pages ?? []).find(
    (p: any) => p.path === slug && p.enabled
  )
  if (matchedPage) {
    return <SubPageClient weddingNameId={weddingNameId} pageSlug={slug} />
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

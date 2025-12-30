import { createServerSupabaseClient } from "@/lib/supabase-server"
import { I18nProvider } from "@/components/contexts/i18n-context"
import { Locale } from "@/lib/i18n"
import RegistryPageContent from "./registry-page-content"

interface RegistryPageProps {
  params: Promise<{ weddingNameId: string }>
}

export default async function GuestRegistryPage({ params }: RegistryPageProps) {
  const resolvedParams = await params
  const weddingNameId = resolvedParams?.weddingNameId ? decodeURIComponent(resolvedParams.weddingNameId) : ''
  
  // Fetch wedding locale server-side
  const supabase = await createServerSupabaseClient()
  let locale: Locale = 'en'
  
  try {
    const { data, error } = await supabase
      .from("weddings")
      .select("id, wedding_name_id, page_config")
      .eq("wedding_name_id", weddingNameId)
      .single()
    
    if (error) {
      console.error("Error fetching wedding locale:", error)
    }
    
    // Extract locale from page_config.siteSettings.locale
    if (data?.page_config && typeof data.page_config === 'object') {
      const pageConfig = data.page_config as any
      const siteLocale = pageConfig?.siteSettings?.locale
      if (siteLocale === 'en' || siteLocale === 'es') {
        locale = siteLocale
      }
    }
  } catch (error) {
    console.error("Error fetching wedding locale:", error)
  }

  return (
    <I18nProvider initialLocale={locale}>
      <RegistryPageContent weddingNameId={weddingNameId} />
    </I18nProvider>
  )
}

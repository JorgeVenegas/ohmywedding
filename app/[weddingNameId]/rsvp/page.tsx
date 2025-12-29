"use client"

import { use } from "react"
import { useSearchParams } from "next/navigation"
import { RSVPSection } from "@/components/wedding-sections/rsvp-section"
import { WeddingFooter } from "@/components/wedding-footer"
import { I18nProvider } from "@/components/contexts/i18n-context"

interface RSVPPageProps {
  params: Promise<{ weddingNameId: string }>
}

export default function RSVPPage({ params }: RSVPPageProps) {
  const { weddingNameId } = use(params)
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId') ?? undefined
  
  return (
    <I18nProvider initialLocale="en">
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <RSVPSection
            weddingNameId={weddingNameId}
            groupId={groupId}
            theme={{
              primaryColor: '#000000',
              secondaryColor: '#ffffff'
            }}
            alignment={{
              horizontal: 'center' as const,
              vertical: 'center' as const
            }}
            sectionTitle="RSVP"
            sectionSubtitle="Please confirm your attendance"
            variant="elegant"
            showVariantSwitcher={false}
          />
        </main>
        <WeddingFooter />
      </div>
    </I18nProvider>
  )
}
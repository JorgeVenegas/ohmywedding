"use client"
import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useTranslation } from '@/components/contexts/i18n-context'

interface GuestsPageProps {
  params: Promise<{ weddingId: string }>
}

export default function GuestsPage({ params }: GuestsPageProps) {
  const { weddingId } = use(params)
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    // Redirect to invitations page where guests are managed
    router.replace(getCleanAdminUrl(weddingId, 'invitations'))
  }, [weddingId, router])

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(weddingId, 'dashboard')}
        title={t('admin.guests.title')}
      />
      <div className="page-container">
        <div className="text-center">
          <p className="text-muted-foreground">{t('admin.guests.redirecting')}</p>
        </div>
      </div>
    </main>
  )
}

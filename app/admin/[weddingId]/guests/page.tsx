"use client"
import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"

interface GuestsPageProps {
  params: Promise<{ weddingId: string }>
}

export default function GuestsPage({ params }: GuestsPageProps) {
  const { weddingId } = use(params)
  const router = useRouter()

  useEffect(() => {
    // Redirect to invitations page where guests are managed
    router.replace(getCleanAdminUrl(weddingId, 'invitations'))
  }, [weddingId, router])

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(weddingId, 'dashboard')}
        title="Guest List"
      />
      <div className="page-container">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to guest management...</p>
        </div>
      </div>
    </main>
  )
}

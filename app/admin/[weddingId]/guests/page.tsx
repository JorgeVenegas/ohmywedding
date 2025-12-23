"use client"
import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"

interface GuestsPageProps {
  params: Promise<{ weddingId: string }>
}

export default function GuestsPage({ params }: GuestsPageProps) {
  const { weddingId } = use(params)
  const router = useRouter()

  useEffect(() => {
    // Redirect to invitations page where guests are managed
    router.replace(`/admin/${weddingId}/invitations`)
  }, [weddingId, router])

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={`/admin/${weddingId}/dashboard`}
        title="Guest List"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to guest management...</p>
        </div>
      </div>
    </main>
  )
}

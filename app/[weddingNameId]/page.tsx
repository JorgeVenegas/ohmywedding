"use client"

import { getWeddingByNameIdClient } from "@/lib/wedding-data-client"
import { createConfigFromWedding } from "@/lib/wedding-configs"
import { ConfigBasedWeddingRenderer } from "@/components/config-based-wedding-renderer"
import { PageConfigProvider } from "@/components/contexts/page-config-context"
import { notFound, useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Wedding } from "@/lib/wedding-data"

export default function WeddingPage() {
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Extract params using Next.js hooks
  const routeParams = useParams()
  const urlSearchParams = useSearchParams()
  const { weddingNameId } = routeParams as { weddingNameId: string }
  
  // Check for demo mode in search params
  const isDemoMode = urlSearchParams.get('demo') === 'true'

  useEffect(() => {
    async function loadWedding() {
      try {
        const weddingData = await getWeddingByNameIdClient(weddingNameId)
        setWedding(weddingData)
      } catch (error) {
        console.error('Error loading wedding:', error)
      } finally {
        setLoading(false)
      }
    }
    loadWedding()
  }, [weddingNameId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wedding...</p>
        </div>
      </div>
    )
  }

  if (!wedding) {
    notFound()
    return null
  }

  // Create the wedding page configuration
  // You can customize the style here: 'classic', 'modern', or 'rustic'
  const config = createConfigFromWedding(wedding, 'modern')
  
  // Enable variant switchers based on demo mode or default to editing enabled
  const showVariantSwitchers = isDemoMode || true

  return (
    <PageConfigProvider weddingNameId={weddingNameId}>
      <ConfigBasedWeddingRenderer 
        wedding={wedding}
        weddingNameId={weddingNameId}
      />
    </PageConfigProvider>
  )
}
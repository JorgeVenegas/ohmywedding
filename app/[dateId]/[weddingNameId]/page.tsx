"use client"

import { getWeddingByDateAndNameIdClient } from "@/lib/wedding-data-client"
import { createConfigFromWedding } from "@/lib/wedding-configs"
import { WeddingPageRenderer } from "@/components/wedding-page-renderer"
import { Header } from "@/components/header"
import { notFound } from "next/navigation"
import { useEffect, useState, use } from "react"
import { Wedding } from "@/lib/wedding-data"

interface WeddingPageProps {
  params: Promise<{ dateId: string; weddingNameId: string }>
}

export default function WeddingPage({ params }: WeddingPageProps) {
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const { dateId, weddingNameId } = use(params)

  useEffect(() => {
    async function loadWedding() {
      try {
        const weddingData = await getWeddingByDateAndNameIdClient(dateId, weddingNameId)
        setWedding(weddingData)
      } catch (error) {
        console.error('Error loading wedding:', error)
      } finally {
        setLoading(false)
      }
    }
    loadWedding()
  }, [dateId, weddingNameId])

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
  
  // Enable variant switchers by default on wedding pages
  const showVariantSwitchers = true

  return (
    <>
      <Header />
      <WeddingPageRenderer 
        wedding={wedding}
        dateId={dateId}
        weddingNameId={weddingNameId}
        config={config}
        showVariantSwitchers={showVariantSwitchers}
      />
    </>
  )
}
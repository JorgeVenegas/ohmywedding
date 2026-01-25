"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { SubscriptionProvider } from "@/components/contexts/subscription-context"

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ weddingId: string }>
}

export default function AdminLayout({ children, params }: AdminLayoutProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [weddingId, setWeddingId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    async function checkAuthorization() {
      try {
        const resolvedParams = await params
        // Decode the weddingId in case it's URL encoded
        const decodedWeddingId = decodeURIComponent(resolvedParams.weddingId)
        setWeddingId(decodedWeddingId)
        
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          // Not logged in - redirect to login
          router.push(`/login?redirect=/admin/${encodeURIComponent(decodedWeddingId)}/dashboard`)
          return
        }

        // Check if user is owner or collaborator of this wedding
        const { data: wedding, error: weddingError } = await supabase
          .from('weddings')
          .select('owner_id, collaborator_emails')
          .eq('wedding_name_id', decodedWeddingId)
          .single()

        if (weddingError || !wedding) {
          // Wedding not found
          setIsAuthorized(false)
          setIsLoading(false)
          return
        }

        const isOwner = wedding.owner_id === user.id
        const isCollaborator = wedding.collaborator_emails?.includes(user.email || '')
        const isUnowned = wedding.owner_id === null // Allow access to unowned weddings for claiming

        if (isOwner || isCollaborator || isUnowned) {
          setIsAuthorized(true)
        } else {
          setIsAuthorized(false)
        }
      } catch (error) {
        console.error('Authorization check failed:', error)
        setIsAuthorized(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthorization()
  }, [params, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don&apos;t have permission to access this wedding&apos;s admin panel. 
            Only the wedding owner and invited collaborators can manage this wedding.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <SubscriptionProvider weddingId={weddingId}>
      {children}
    </SubscriptionProvider>
  )
}

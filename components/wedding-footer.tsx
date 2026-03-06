"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"
import { createClient } from "@/lib/supabase-client"
import { useEffect, useState } from "react"
import { getCleanAdminUrl } from "@/lib/admin-url"

interface WeddingFooterProps {
  weddingNameId?: string
  ownerId?: string | null
  collaboratorEmails?: string[]
}

export function WeddingFooter({ weddingNameId, ownerId, collaboratorEmails }: WeddingFooterProps) {
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(function checkAuth() {
    async function checkAuthorization() {
      if (!weddingNameId) return

      try {
        const supabase = createClient()

        console.log('[wedding-footer] checkAuthorization: calling getSession()')
        // Use getSession() instead of getUser() — cached, no network request,
        // avoids triggering token refresh that causes 429 loops.
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null
        console.log('[wedding-footer] getSession result:', user ? `user=${user.email}` : 'no session')
        if (!user) {
          setIsAuthorized(false)
          return
        }

        const isOwner = ownerId === user.id
        const isCollaborator = collaboratorEmails?.includes(user.email || '')
        const isUnowned = ownerId === null

        setIsAuthorized(isOwner || isCollaborator || isUnowned)
      } catch (error) {
        setIsAuthorized(false)
      }
    }

    checkAuthorization()
  }, [weddingNameId, ownerId, collaboratorEmails])

  return (
    <footer className="border-t border-border/30 bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Created with text */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Created with</span>
            <Link
              href="https://ohmy.wedding"
              className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/images/logos/OMW Logo Gold.png"
                alt="OhMyWedding Logo"
                width={14}
                height={14}
                className="h-3.5 w-auto"
              />
              <span>OhMyWedding</span>
            </Link>
          </div>

          {/* Right: Additional links or content */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {isAuthorized && weddingNameId && (
              <Link
                href={getCleanAdminUrl(weddingNameId, 'dashboard')}
                className="hover:text-primary transition-colors font-medium"
              >
                Manage Wedding
              </Link>
            )}
            <Link
              href="https://ohmy.wedding/create"
              className="hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Create your wedding site
            </Link>
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

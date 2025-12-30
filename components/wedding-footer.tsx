"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useEffect, useState } from "react"

interface WeddingFooterProps {
  weddingNameId?: string
  ownerId?: string | null
  collaboratorEmails?: string[]
}

export function WeddingFooter({ weddingNameId, ownerId, collaboratorEmails }: WeddingFooterProps) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  useEffect(() => {
    async function checkAuthorization() {
      if (!weddingNameId) return
      
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { user } } = await supabase.auth.getUser()
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
    <footer className="border-t border-border/30 bg-background/80 backdrop-blur-sm mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Created with text */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Created with</span>
            <Link 
              href="https://ohmywedding.com" 
              className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
              <span>OhMyWedding</span>
            </Link>
          </div>

          {/* Right: Additional links or content */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {isAuthorized && weddingNameId && (
              <Link 
                href={`/admin/${weddingNameId}/dashboard`}
                className="hover:text-primary transition-colors font-medium"
              >
                Manage Wedding
              </Link>
            )}
            <Link 
              href="https://ohmywedding.com/create" 
              className="hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Create your wedding site
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
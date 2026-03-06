"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase-client"

/**
 * Client-side auth callback handler.
 *
 * @supabase/ssr's createBrowserClient forces `detectSessionInUrl: true` internally
 * (overriding any value we pass). This means the Supabase client's _initialize()
 * method automatically detects the ?code= param in the URL, reads the PKCE code
 * verifier from cookies, and exchanges the code for a session.
 *
 * We must NOT manually call exchangeCodeForSession() because:
 * 1. _initialize() already consumes the code verifier and removes it from storage
 * 2. The public exchangeCodeForSession() awaits initializePromise first, so it
 *    always runs AFTER _initialize has already consumed the verifier
 * 3. Result: "PKCE code verifier not found in storage"
 *
 * Instead, we listen for onAuthStateChange to detect when the auto-exchange
 * completes, then redirect to the target page.
 */
function CallbackHandler() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const hasRedirected = useRef(false)

  const redirectTo = searchParams.get("redirect") || "/"

  useEffect(() => {
    const supabase = createClient()

    // Set a timeout in case the auth exchange silently fails
    const timeout = setTimeout(() => {
      if (!hasRedirected.current) {
        console.error("[AuthCallback] Timed out waiting for auth")
        setStatus("error")
        setErrorMessage("Authentication timed out. Please try again.")
        setTimeout(() => {
          window.location.href = "/login?error=callback_timeout"
        }, 2000)
      }
    }, 15000)

    // Listen for auth state changes from the auto-initialization.
    // _initialize() detects ?code= in the URL and exchanges it automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AuthCallback] auth event:", event, session?.user?.email ?? "no user")

        if (hasRedirected.current) return

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          // Auth succeeded — redirect using full-page navigation to ensure:
          // 1. Cookies are sent with the next request
          // 2. Server middleware picks up the fresh session
          // 3. Works for cross-subdomain redirects
          hasRedirected.current = true
          clearTimeout(timeout)
          console.log("[AuthCallback] Auth succeeded, redirecting to:", redirectTo)
          window.location.href = redirectTo
        } else if (event === 'INITIAL_SESSION' && !session) {
          // _initialize completed but no session — exchange likely failed
          hasRedirected.current = true
          clearTimeout(timeout)
          console.error("[AuthCallback] No session after initialization")
          setStatus("error")
          setErrorMessage("Authentication failed. Please try again.")
          setTimeout(() => {
            window.location.href = "/login?error=callback_failed"
          }, 2000)
        }
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [redirectTo])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Completing sign in...</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-destructive font-medium mb-2">Sign in failed</p>
            <p className="text-muted-foreground text-sm">{errorMessage}</p>
            <p className="text-muted-foreground text-sm mt-2">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Completing sign in...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  )
}

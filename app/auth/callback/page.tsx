"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient, resetCircuitBreaker } from "@/lib/supabase-client"

/**
 * Client-side auth callback handler.
 *
 * Why client-side instead of a server-side route handler?
 * - The PKCE code verifier is stored by `createBrowserClient` in `document.cookie`.
 * - A server-side `route.ts` using `createServerClient` reads cookies from the
 *   request headers. In some browsers (especially incognito), the verifier cookie
 *   may not survive the cross-site redirect chain (app -> Supabase -> Google ->
 *   Supabase -> app) and is missing when the server reads cookies.
 * - By exchanging the code client-side with `createBrowserClient`, the SAME storage
 *   adapter that wrote the verifier reads it back, guaranteeing it's found.
 */
function CallbackHandler() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code")
      const redirectTo = searchParams.get("redirect") || "/"

      if (!code) {
        console.warn("[AuthCallback] No code in callback URL, redirecting to /")
        window.location.href = "/"
        return
      }

      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error("[AuthCallback] Code exchange failed:", error.message)
          setStatus("error")
          setErrorMessage(error.message)
          // Redirect to login with error after a short delay so user can see
          setTimeout(() => {
            window.location.href = `/login?error=${encodeURIComponent(error.message)}`
          }, 2000)
          return
        }

        console.log("[AuthCallback] Code exchange succeeded, user:", data.user?.email)
        
        // Reset the circuit breaker since we just successfully authenticated
        resetCircuitBreaker()

        // Use full-page navigation (not router.push) to ensure:
        // 1. Cookies are sent with the next request
        // 2. Server middleware picks up the fresh session
        // 3. Works for cross-subdomain redirects (e.g., ohmy.wedding -> jorgeyyuli.ohmy.wedding)
        window.location.href = redirectTo
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err)
        setStatus("error")
        setErrorMessage(err instanceof Error ? err.message : "Unknown error")
        setTimeout(() => {
          window.location.href = "/login?error=callback_failed"
        }, 2000)
      }
    }

    handleCallback()
  }, [searchParams])

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

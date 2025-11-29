import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * OAuth/PKCE callback handler
 * 
 * This route handles the callback from Supabase auth after a user signs in.
 * It exchanges the authorization code for a session and sets the session cookies.
 * 
 * The key challenge is that cookies must be set on the response before redirecting.
 * We use NextResponse.redirect() with cookies attached, which works correctly
 * when the response is returned from a Route Handler (not middleware).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirectTo = requestUrl.searchParams.get("redirect") || "/"
  const origin = requestUrl.origin

  if (!code) {
    // No code provided, redirect to home
    return NextResponse.redirect(new URL("/", origin))
  }

  const cookieStore = await cookies()
  
  // Create a Supabase client that can read and write cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method is called from Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )

  // Exchange the code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Auth callback error:", error.message)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
    )
  }

  // Redirect to the requested page
  // The cookies have been set via cookieStore.set() above
  return NextResponse.redirect(new URL(redirectTo, origin))
}

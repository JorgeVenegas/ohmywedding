import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const redirect = searchParams.get("redirect") || "/"

  if (code) {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    // Check for code verifier
    const codeVerifierCookie = allCookies.find(c => c.name.includes('code-verifier'))
    
    // Track cookies that need to be set on the response
    const cookiesToSetOnResponse: { name: string; value: string; options: any }[] = []
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookiesToSetOnResponse.push({ name, value, options })
            })
          },
        },
      }
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, origin))
    }

    // Instead of redirecting, return an HTML page that sets cookies via JavaScript and then redirects
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
</head>
<body>
  <p>Signing you in...</p>
  <script>
    setTimeout(function() {
      window.location.href = '${redirect.replace(/'/g, "\\'")}';
    }, 100);
  </script>
</body>
</html>
`
    
    const response = new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })
    
    // Set all the auth cookies on the response
    cookiesToSetOnResponse.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, {
        ...options,
        path: '/',
        sameSite: 'lax',
        secure: false,
        httpOnly: false,
      })
    })
    
    return response
  }

  // Redirect to the original page or home
  return NextResponse.redirect(new URL(redirect, origin))
}

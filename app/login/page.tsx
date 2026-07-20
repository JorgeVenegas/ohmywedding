"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useTranslation } from "@/components/contexts/i18n-context"
import { resolveLandingBackHref } from "@/lib/landing-source"
import { RotatingVideoBackground } from "@/components/ui/rotating-video-background"

const sideVideos = [
  "/videos/vid2.mp4",
  "/videos/vid6.mp4",
  "/videos/vid11.mp4",
]

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const { t } = useTranslation()

  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get("redirect") || "/"
  const redirectTo = decodeURIComponent(rawRedirect)
  const errorParam = searchParams.get("error")
  const backHref = resolveLandingBackHref(searchParams.get("from"))

  const isFullUrl = redirectTo.startsWith('http://') || redirectTo.startsWith('https://')
  const finalRedirectUrl = isFullUrl ? redirectTo : redirectTo

  useEffect(() => {
    const hostname = window.location.hostname
    const isSubdomain =
      (hostname.endsWith('.ohmy.wedding') && hostname !== 'ohmy.wedding' && hostname !== 'www.ohmy.wedding') ||
      (hostname.endsWith('.ohmy.local') && hostname !== 'ohmy.local' && hostname !== 'www.ohmy.local')

    if (isSubdomain) {
      let mainDomain: string
      if (hostname.endsWith('.ohmy.wedding')) {
        mainDomain = 'https://ohmy.wedding'
      } else {
        const port = window.location.port ? `:${window.location.port}` : ''
        mainDomain = `${window.location.protocol}//ohmy.local${port}`
      }
      const params = window.location.search
      window.location.href = `${mainDomain}/login${params}`
      return
    }
  }, [])

  useEffect(() => {
    if (errorParam) {
      setError(errorParam)
    }
  }, [errorParam])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(finalRedirectUrl)}`,
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(finalRedirectUrl)}`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage("Check your email to confirm your account!")
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else if (data.session) {
        window.location.href = finalRedirectUrl
        return
      }
    }

    setIsLoading(false)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#420c14] lg:bg-background">
        {/* Form column — LEFT */}
        <div className="flex-1 lg:w-1/2 px-4 sm:px-6 py-8 sm:py-12 flex flex-col">
          <div className="w-full max-w-lg mx-auto mb-6 sm:mb-8 flex items-center justify-between">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-[#f5f2eb]/70 hover:text-[#f5f2eb] lg:text-muted-foreground lg:hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-light">{t('common.back')}</span>
            </Link>
            <LanguageSwitcher variant="buttons" />
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md">
              <Card className="p-8 border border-border">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity mb-6">
                  <Image
                    src="/images/logos/OMW Logo Gold.png"
                    alt="OhMyWedding"
                    width={40}
                    height={40}
                    className="h-9 sm:h-10 w-auto"
                    priority
                  />
                  <span className="font-serif text-xl sm:text-2xl font-light text-foreground tracking-[0.08em]">OhMyWedding</span>
                </Link>

                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {isSignUp ? t('auth.login.createAccount') : t('auth.login.welcomeBack')}
                </h1>
                <p className="text-muted-foreground mb-6">
                  {isSignUp
                    ? t('auth.login.signUpSubtitle')
                    : t('auth.login.signInSubtitle')}
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {message}
                  </div>
                )}

                {/* Google Login Button */}
                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full mb-4 border-border hover:bg-muted flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('auth.login.continueWithGoogle')}
                </Button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t('auth.login.orContinueWithEmail')}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('auth.login.email')}</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="border-border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('auth.login.password')}</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-border"
                      minLength={6}
                      required
                    />
                    {isSignUp && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('auth.login.minPassword')}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading
                      ? (isSignUp ? t('auth.login.creatingAccount') : t('auth.login.signingIn'))
                      : (isSignUp ? t('auth.login.createAccountBtn') : t('auth.login.signInBtn'))}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setError(null)
                      setMessage(null)
                    }}
                    className="text-primary hover:underline font-medium text-sm"
                  >
                    {isSignUp
                      ? `${t('auth.login.alreadyHaveAccount')} ${t('auth.login.signIn')}`
                      : `${t('auth.login.dontHaveAccount')} ${t('auth.login.signUp')}`}
                  </button>

                  {!isSignUp && (
                    <p className="text-muted-foreground text-sm">
                      Or{" "}
                      <Link href="/create-wedding" className="text-primary hover:underline font-medium">
                        {t('auth.login.andCreateWedding')}
                      </Link>
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Video panel — RIGHT, desktop only */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <RotatingVideoBackground videos={sideVideos} />
          <div className="absolute inset-0 bg-[#420c14]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#420c14]/80 via-[#420c14]/10 to-[#420c14]/40" />
          <div className="relative h-full flex flex-col items-start justify-end p-12 xl:p-16">
            <span className="text-[#DDA46F] text-xs tracking-[0.3em] uppercase mb-4">
              {t('auth.login.sidePanel.kicker')}
            </span>
            <h2 className="font-serif font-light text-3xl xl:text-4xl text-[#f5f2eb] leading-tight mb-4 max-w-md">
              {t('auth.login.sidePanel.title')}
            </h2>
            <p className="text-[#f5f2eb]/70 text-sm xl:text-base leading-relaxed max-w-sm">
              {t('auth.login.sidePanel.subtitle')}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#420c14] lg:bg-background" />
    }>
      <LoginForm />
    </Suspense>
  )
}

"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Header } from "@/components/header"
import { Heart, Calendar, Mail, CheckCircle } from "lucide-react"
import { useTranslation } from "@/components/contexts/i18n-context"
import { createClient } from "@/lib/supabase-client"

function CreateWeddingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [formData, setFormData] = useState({
    partner1FirstName: '',
    partner1LastName: '',
    partner2FirstName: '',
    partner2LastName: '',
    weddingDate: '',
    hasWeddingDate: false,
    ownerEmail: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
      setIsCheckingAuth(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/weddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner1FirstName: formData.partner1FirstName.trim(),
          partner1LastName: formData.partner1LastName.trim() || undefined,
          partner2FirstName: formData.partner2FirstName.trim(),
          partner2LastName: formData.partner2LastName.trim() || undefined,
          weddingDate: formData.hasWeddingDate && formData.weddingDate ? formData.weddingDate : undefined,
          ownerEmail: !isLoggedIn ? formData.ownerEmail.trim() : undefined,
          redirectOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create wedding')
      }

      const result = await response.json()

      if (result.emailSent) {
        // Unauthenticated user — show "check your email" screen
        setEmailSentTo(formData.ownerEmail.trim())
        return
      }

      const plan = searchParams.get('plan')
      const paymentMethod = searchParams.get('paymentMethod') || 'card'
      const source = searchParams.get('source') || 'create_wedding'

      if (plan === 'premium' || plan === 'deluxe') {
        const upgradeParams = new URLSearchParams({
          plan,
          paymentMethod,
          weddingId: result.weddingId,
          autoCheckout: '1',
          source,
        })
        router.push(`/upgrade?${upgradeParams.toString()}`)
      } else {
        router.push(`/admin/${result.weddingNameId}/dashboard`)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  const isValid = formData.partner1FirstName.trim() &&
    formData.partner2FirstName.trim() &&
    (isLoggedIn || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim()))

  // Success screen — email was sent
  if (emailSentTo) {
    return (
      <main className="min-h-screen bg-background">
        <Header showBackButton backHref="/" title={t('auth.createWedding.essentialDetails')} />
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
          <Card className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="font-serif text-2xl text-foreground">{t('auth.createWedding.checkEmailTitle')}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('auth.createWedding.checkEmailDesc').replace('{email}', emailSentTo)}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary bg-primary/5 py-2 px-4 rounded-lg">
              <Mail className="w-4 h-4 flex-shrink-0" />
              {emailSentTo}
            </div>
            <p className="text-xs text-muted-foreground">{t('auth.createWedding.checkSpam')}</p>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref="/"
        title={t('auth.createWedding.essentialDetails')}
      />

      {isSubmitting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="p-8 max-w-sm w-full mx-4">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Heart className="w-12 h-12 text-primary animate-pulse" />
              </div>
              <h3 className="font-serif text-xl text-foreground">{t('auth.createWedding.creatingWebsite')}</h3>
              <p className="text-muted-foreground">{t('auth.createWedding.pleaseWait')}</p>
            </div>
          </Card>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="font-serif text-2xl text-foreground mb-1">{t('auth.createWedding.yourNames')}</h2>
              <p className="text-sm text-muted-foreground">{t('auth.createWedding.essentialDetailsDesc')}</p>
            </div>

            {/* Partner 1 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">{t('auth.createWedding.firstName')} *</label>
                <Input
                  value={formData.partner1FirstName}
                  onChange={(e) => handleChange('partner1FirstName', e.target.value)}
                  placeholder="Emma"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t('auth.createWedding.lastName')}{' '}
                  <span className="text-muted-foreground font-normal">{t('auth.createWedding.optional')}</span>
                </label>
                <Input
                  value={formData.partner1LastName}
                  onChange={(e) => handleChange('partner1LastName', e.target.value)}
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-border" />
              <Heart className="w-4 h-4 text-primary opacity-50 flex-shrink-0" />
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Partner 2 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">{t('auth.createWedding.firstName')} *</label>
                <Input
                  value={formData.partner2FirstName}
                  onChange={(e) => handleChange('partner2FirstName', e.target.value)}
                  placeholder="James"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t('auth.createWedding.lastName')}{' '}
                  <span className="text-muted-foreground font-normal">{t('auth.createWedding.optional')}</span>
                </label>
                <Input
                  value={formData.partner2LastName}
                  onChange={(e) => handleChange('partner2LastName', e.target.value)}
                  placeholder="Johnson"
                />
              </div>
            </div>

            {/* Wedding Date */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t('auth.createWedding.iHaveDate')}</span>
                </div>
                <Switch
                  checked={formData.hasWeddingDate}
                  onCheckedChange={(v) => handleChange('hasWeddingDate', v)}
                />
              </div>
              {formData.hasWeddingDate && (
                <Input
                  type="date"
                  value={formData.weddingDate}
                  onChange={(e) => handleChange('weddingDate', e.target.value)}
                  className="w-full"
                />
              )}
            </div>

            {/* Email — only for unauthenticated users */}
            {!isCheckingAuth && !isLoggedIn && (
              <div className="border-t border-border pt-4 space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t('auth.createWedding.yourEmail')} *
                </label>
                <Input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => handleChange('ownerEmail', e.target.value)}
                  placeholder="emma@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground">{t('auth.createWedding.emailHint')}</p>
              </div>
            )}

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <Button
              type="submit"
              disabled={!isValid || isSubmitting || isCheckingAuth}
              className="w-full"
              size="lg"
            >
              <Heart className="w-4 h-4 mr-2" />
              {t('auth.createWedding.createBtn')}
            </Button>
          </Card>
        </form>
      </div>
    </main>
  )
}

export default function CreateWeddingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CreateWeddingPageContent />
    </Suspense>
  )
}

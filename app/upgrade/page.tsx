"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import {
  Heart,
  Crown,
  Check,
  Sparkles,
  ArrowLeft,
  Shield,
  Zap,
  Users,
  Send,
  Calendar,
  Gift,
  ImageIcon,
  Loader2
} from "lucide-react"

export default function UpgradePage() {
  const { user, loading: authLoading } = useAuth()
  const { isPremium, loading: subscriptionLoading } = useSubscription()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/upgrade')
    }
  }, [user, authLoading, router])

  // Show message if already premium
  if (!authLoading && !subscriptionLoading && isPremium) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">You&apos;re Already Premium!</h1>
          <p className="text-muted-foreground mb-8">
            You have full access to all premium features. Enjoy creating your perfect wedding website!
          </p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-[#B8860B] to-[#D4AF37] hover:from-[#A67807] hover:to-[#C9A226] text-white shadow-lg shadow-[#B8860B]/20">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  const handleUpgrade = async () => {
    if (!user) {
      router.push('/login?redirect=/upgrade')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: 'premium',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsProcessing(false)
    }
  }

  const premiumFeatures = [
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Unlimited Guest Management',
      description: 'Add and manage as many guests as you need',
    },
    {
      icon: <Send className="w-5 h-5" />,
      title: 'Digital Invitations',
      description: 'Send beautiful invitations via WhatsApp or email',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Advanced RSVP System',
      description: 'Phone verification, group RSVPs, real-time tracking',
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: 'Guest Travel Tracking',
      description: 'Track travel arrangements and transportation needs',
    },
    {
      icon: <Gift className="w-5 h-5" />,
      title: 'Dietary Preferences',
      description: 'Collect and manage dietary restrictions easily',
    },
    {
      icon: <ImageIcon className="w-5 h-5" />,
      title: 'CSV Import/Export',
      description: 'Easily import your guest list from spreadsheets',
    },
  ]

  const loading = authLoading || subscriptionLoading

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FAF7F0]/50 to-background dark:from-[#2A2520]/20 dark:to-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#B8860B] dark:text-[#D4AF37] text-sm font-medium mb-6 border border-[#D4AF37]/20">
            <Crown className="w-4 h-4" />
            Upgrade to Premium
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Get the Most Out of
            <span className="block mt-2 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C9A87C] bg-clip-text text-transparent">
              Your Wedding Website
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock powerful guest management, RSVP tracking, and digital invitations with a one-time payment.
          </p>
        </div>

        {/* Pricing Card */}
        <Card className="relative overflow-hidden border-2 border-[#D4AF37] shadow-xl shadow-[#B8860B]/15 max-w-xl mx-auto mb-12">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C9A87C]" />
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Premium</h2>
                <p className="text-muted-foreground">Everything for your big day</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-foreground">$29</div>
                <p className="text-sm text-muted-foreground">one-time payment</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleUpgrade}
              disabled={loading || isProcessing}
              className="w-full h-14 text-lg bg-gradient-to-r from-[#B8860B] to-[#D4AF37] hover:from-[#A67807] hover:to-[#C9A226] text-white shadow-lg shadow-[#B8860B]/20"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Upgrade Now
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Secure payment
              </span>
              <span>•</span>
              <span>30-day money-back guarantee</span>
            </div>
          </div>
        </Card>

        {/* Features Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            What You&apos;ll Get
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, index) => (
              <Card key={index} className="p-6 border border-[#D4AF37]/10 dark:border-[#D4AF37]/20 bg-white dark:bg-gray-900">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5EFE6] to-[#FAF7F0] dark:from-[#2A2520]/50 dark:to-[#252018]/50 flex items-center justify-center mb-4 border border-[#D4AF37]/10">
                  <div className="text-[#B8860B]">{feature.icon}</div>
                </div>
                <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="text-center">
          <div className="inline-flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              SSL Encrypted
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Instant Access
            </span>
            <span className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#D4AF37]" />
              10,000+ Happy Couples
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}

"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { getMainDomainUrl } from "@/lib/admin-url"
import {
  CheckCircle,
  Sparkles,
  ArrowRight,
  Heart,
  Users,
  Send,
  Calendar,
  Loader2
} from "lucide-react"

function UpgradeSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId) {
        setStatus('error')
        return
      }

      try {
        const response = await fetch('/api/subscriptions/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })

        if (response.ok) {
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.error('Verification error:', error)
        // Still show success since webhook might have processed it
        setStatus('success')
      }
    }

    verifyPayment()
  }, [sessionId])

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37] mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Confirming your payment...</h2>
        <p className="text-muted-foreground mt-2">This will only take a moment</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Something Went Wrong</h1>
        <p className="text-muted-foreground mb-8">
          We couldn&apos;t verify your payment. If you were charged, please contact support.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href={getMainDomainUrl('/upgrade')}>
            <Button variant="outline">Try Again</Button>
          </Link>
          <Link href="mailto:support@ohmywedding.app">
            <Button className="bg-gradient-to-r from-[#B8860B] to-[#D4AF37] hover:from-[#A67807] hover:to-[#C9A226] text-white shadow-lg shadow-[#B8860B]/20">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const nextSteps = [
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Add Your Guests',
      description: 'Import your guest list or add guests manually',
    },
    {
      icon: <Send className="w-5 h-5" />,
      title: 'Send Invitations',
      description: 'Share beautiful digital invitations via WhatsApp or email',
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: 'Track RSVPs',
      description: 'Monitor responses in real-time with our advanced RSVP system',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center animate-pulse">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to Premium! 🎉
        </h1>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto">
          Your payment was successful. You now have full access to all premium features.
        </p>
      </div>

      {/* Premium Badge */}
      <Card className="relative overflow-hidden border-[#D4AF37]/30 dark:border-[#D4AF37]/40 bg-gradient-to-r from-[#FAF7F0] to-[#F5EFE6] dark:from-[#2A2520]/50 dark:to-[#252018]/50 p-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Premium Activated</h2>
            <p className="text-muted-foreground">All premium features are now unlocked</p>
          </div>
        </div>
        <div className="absolute top-2 right-4">
          <Heart className="w-6 h-6 text-[#D4AF37] animate-bounce" />
        </div>
      </Card>

      {/* Next Steps */}
      <div className="mb-10">
        <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
          What&apos;s Next?
        </h3>
        <div className="space-y-4">
          {nextSteps.map((step, index) => (
            <Card key={index} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5EFE6] to-[#FAF7F0] dark:from-[#2A2520]/50 dark:to-[#252018]/50 flex items-center justify-center shrink-0 border border-[#D4AF37]/10">
                <span className="text-[#B8860B]">{step.icon}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/">
          <Button 
            className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-[#B8860B] to-[#D4AF37] hover:from-[#A67807] hover:to-[#C9A226] text-white shadow-lg shadow-[#B8860B]/20"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function UpgradeSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50/50 to-background dark:from-green-950/20 dark:to-background">
      <Header />
      <Suspense fallback={
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Loading...</h2>
        </div>
      }>
        <UpgradeSuccessContent />
      </Suspense>
    </main>
  )
}

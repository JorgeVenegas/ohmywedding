"use client"

import React from 'react'
import Link from 'next/link'
import { Lock, Sparkles, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSubscription, useWeddingFeatures, type WeddingFeatures } from '@/hooks/use-subscription'

interface PremiumGateProps {
  children: React.ReactNode
  feature: keyof WeddingFeatures
  weddingId?: string
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
  title?: string
  description?: string
}

// Wrapper component that gates content behind premium subscription
export function PremiumGate({
  children,
  feature,
  weddingId,
  fallback,
  showUpgradePrompt = true,
  title,
  description,
}: PremiumGateProps) {
  const { isPremium, loading: subscriptionLoading } = useSubscription()
  const { canAccessFeature, loading: featuresLoading } = useWeddingFeatures(weddingId || null)

  const loading = subscriptionLoading || featuresLoading

  if (loading) {
    return (
      <div className="animate-pulse bg-muted/50 rounded-lg p-8 min-h-[200px]" />
    )
  }

  // Check feature access
  const hasAccess = isPremium || canAccessFeature(feature)

  if (hasAccess) {
    return <>{children}</>
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>
  }

  // Default upgrade prompt
  if (!showUpgradePrompt) {
    return null
  }

  return <PremiumUpgradePrompt title={title} description={description} feature={feature} />
}

interface PremiumUpgradePromptProps {
  title?: string
  description?: string
  feature?: keyof WeddingFeatures
  variant?: 'card' | 'inline' | 'banner'
}

export function PremiumUpgradePrompt({
  title,
  description,
  feature,
  variant = 'card',
}: PremiumUpgradePromptProps) {
  const featureNames: Partial<Record<keyof WeddingFeatures, string>> = {
    rsvp_enabled: 'RSVP Management',
    invitations_panel_enabled: 'Invitations & Guest Management',
    gallery_enabled: 'Photo Gallery',
    registry_enabled: 'Gift Registry',
    schedule_enabled: 'Event Schedule',
  }

  const defaultTitle = feature 
    ? `${featureNames[feature] || 'This feature'} is a Premium Feature`
    : 'Premium Feature'

  const defaultDescription = 'Upgrade to Premium to unlock this feature and get access to all premium benefits for your wedding.'

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#FAF7F0] to-[#F5EFE6] dark:from-[#2A2520]/30 dark:to-[#252018]/30 border border-[#DDA46F]/30 dark:border-[#DDA46F]/40 rounded-lg">
        <Lock className="w-5 h-5 text-[#DDA46F]" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[#8B7355] dark:text-[#DDA46F]">
            {title || defaultTitle}
          </p>
        </div>
        <Link href="/upgrade">
          <Button size="sm" className="bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] shadow-lg shadow-[#420c14]/20">
            <Sparkles className="w-4 h-4 mr-1" />
            Upgrade
          </Button>
        </Link>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-[#DDA46F] via-[#c99560] to-[#DDA46F] p-1 rounded-lg">
        <div className="bg-background rounded-md p-6 text-center">
          <Crown className="w-10 h-10 mx-auto mb-3 text-[#DDA46F]" />
          <h3 className="text-lg font-semibold mb-2">{title || defaultTitle}</h3>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            {description || defaultDescription}
          </p>
          <Link href="/upgrade">
            <Button className="bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] shadow-lg shadow-[#420c14]/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <Card className="relative overflow-hidden border-2 border-[#DDA46F]/30 dark:border-[#DDA46F]/40">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DDA46F] via-[#c99560] to-[#DDA46F]" />
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#F5EFE6] to-[#FAF7F0] dark:from-[#2A2520]/50 dark:to-[#252018]/50 mb-4 border border-[#DDA46F]/20">
          <Lock className="w-8 h-8 text-[#DDA46F]" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title || defaultTitle}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {description || defaultDescription}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/upgrade">
            <Button className="bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] shadow-lg shadow-[#420c14]/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View Pricing
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

// Badge component to show premium status
export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-[#DDA46F] to-[#c99560] text-white ${className}`}>
      <Crown className="w-3 h-3" />
      Premium
    </span>
  )
}

// Small lock icon to indicate premium feature
export function PremiumLock({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F5EFE6] dark:bg-[#2A2520]/50 ${className}`}>
      <Lock className="w-3 h-3 text-[#DDA46F]" />
    </span>
  )
}

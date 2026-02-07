"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Loader2 
} from "lucide-react"

interface StripeConnectCardProps {
  weddingId: string
  stripeAccountId: string | null
  stripeOnboardingCompleted: boolean
  payoutsEnabled: boolean
  onStatusChange?: () => void
}

export function StripeConnectCard({
  weddingId,
  stripeAccountId,
  stripeOnboardingCompleted,
  payoutsEnabled,
  onStatusChange,
}: StripeConnectCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnectStripe = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Create account if not exists
      if (!stripeAccountId) {
        const createResponse = await fetch("/api/connect/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weddingId }),
        })

        if (!createResponse.ok) {
          const data = await createResponse.json()
          throw new Error(data.error || "Failed to create Stripe account")
        }
      }

      // Step 2: Get onboarding link
      const linkResponse = await fetch("/api/connect/account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId, type: "onboarding" }),
      })

      if (!linkResponse.ok) {
        const data = await linkResponse.json()
        throw new Error(data.error || "Failed to get onboarding link")
      }

      const { url } = await linkResponse.json()
      
      // Redirect to Stripe onboarding
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsLoading(false)
    }
  }

  const handleAccessDashboard = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/connect/account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId, type: "login" }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to get dashboard link")
      }

      const { url } = await response.json()
      window.open(url, "_blank")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  // Determine status
  const getStatus = () => {
    if (payoutsEnabled) {
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        title: "Stripe Connected",
        description: "Your account is fully set up and ready to receive payments from guests.",
        variant: "success" as const,
      }
    }
    if (stripeAccountId && stripeOnboardingCompleted) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
        title: "Pending Verification",
        description: "Your account is being verified by Stripe. This usually takes a few minutes.",
        variant: "warning" as const,
      }
    }
    if (stripeAccountId) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
        title: "Complete Onboarding",
        description: "Please complete your Stripe account setup to start receiving payments.",
        variant: "incomplete" as const,
      }
    }
    return {
      icon: <CreditCard className="w-5 h-5 text-muted-foreground" />,
      title: "Connect Stripe to Receive Payments",
      description: "Set up your Stripe account to receive contributions directly from guests. A 20 MXN platform fee applies per contribution.",
      variant: "disconnected" as const,
    }
  }

  const status = getStatus()

  if (payoutsEnabled) {
    return null
  }

  const borderColor = {
    success: "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900",
    warning: "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900",
    incomplete: "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900",
    disconnected: "border-border",
  }

  return (
    <Card className={`p-6 mb-8 ${borderColor[status.variant]}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">{status.icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">{status.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{status.description}</p>
          
          {error && (
            <div className="text-sm text-destructive mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {!payoutsEnabled && (
              <Button
                onClick={handleConnectStripe}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {stripeAccountId ? "Continue Setup" : "Connect Stripe"}
              </Button>
            )}
            
            {stripeAccountId && payoutsEnabled && (
              <Button
                variant="outline"
                onClick={handleAccessDashboard}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <ExternalLink className="w-4 h-4 mr-2" />
                Stripe Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

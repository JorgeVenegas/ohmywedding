"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Loader2,
  Info,
  Shield,
  DollarSign,
  FileCheck,
  User,
  Clock
} from "lucide-react"

interface AccountStatus {
  stripeAccountId: string | null
  onboardingCompleted: boolean
  payoutsEnabled: boolean
  chargesEnabled: boolean
  detailsSubmitted: boolean
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'restricted'
  restrictionReason?: string
  businessType?: string
  country?: string
  email?: string
  requirements?: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
  }
}

interface StripeAccountInfoProps {
  weddingId: string
  partnerName: string
  onStatusChange?: () => void
}

export function StripeAccountInfo({
  weddingId,
  partnerName,
  onStatusChange,
}: StripeAccountInfoProps) {
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'support'>('overview')
  const [previousPayoutsEnabled, setPreviousPayoutsEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetchAccountStatus()
    // Refresh status every 10 seconds to catch Stripe updates
    const interval = setInterval(fetchAccountStatus, 10000)
    return () => clearInterval(interval)
  }, [weddingId])

  const fetchAccountStatus = async () => {
    try {
      const response = await fetch(`/api/connect/account-status?weddingId=${weddingId}`)
      if (!response.ok) throw new Error("Failed to fetch account status")
      
      const data = await response.json()
      
      // Check if payouts status changed
      if (previousPayoutsEnabled !== null && previousPayoutsEnabled !== data.payoutsEnabled && onStatusChange) {
        onStatusChange()
      }
      
      setAccountStatus(data)
      setPreviousPayoutsEnabled(data.payoutsEnabled)
      setError(null)
    } catch (err) {
      console.error("Error fetching account status:", err)
      // Don't show error if this is just a polling update
      if (isLoading) {
        setError(err instanceof Error ? err.message : "Failed to load account status")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartOnboarding = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch("/api/connect/account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId, type: "onboarding" }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to start onboarding")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsConnecting(false)
    }
  }

  const handleViewDashboard = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch("/api/connect/account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId, type: "login" }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to access dashboard")
      }

      const { url } = await response.json()
      window.open(url, "_blank")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsConnecting(false)
    }
  }

  const getVerificationBadge = () => {
    if (!accountStatus) return null

    if (accountStatus.payoutsEnabled && accountStatus.chargesEnabled) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Fully Verified
        </div>
      )
    }

    if (accountStatus.detailsSubmitted && !accountStatus.payoutsEnabled) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
          <Clock className="w-4 h-4" />
          Under Review
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
        <AlertCircle className="w-4 h-4" />
        Pending Setup
      </div>
    )
  }

  const getRequirementsList = () => {
    if (!accountStatus?.requirements) return []
    
    const all = [
      ...(accountStatus.requirements.currently_due || []),
      ...(accountStatus.requirements.eventually_due || []),
      ...(accountStatus.requirements.past_due || []),
    ]
    return [...new Set(all)] // Remove duplicates
  }

  const requirementsList = getRequirementsList()

  if (isLoading) {
    return (
      <Card className="p-8 border border-border">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading account information...</p>
        </div>
      </Card>
    )
  }

  if (!accountStatus) {
    return (
      <Card className="p-6 border border-border">
        <div className="flex items-center gap-4 mb-4">
          <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground">Account Error</h3>
            <p className="text-sm text-muted-foreground">Unable to load your Stripe account information</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 border border-border">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Account</h2>
            <p className="text-muted-foreground">Manage your Stripe Connect account for receiving guest contributions</p>
          </div>
          {getVerificationBadge()}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Status Overview Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Account Status */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Status</p>
            </div>
            {accountStatus.stripeAccountId ? (
              <div>
                <p className="font-mono text-sm text-foreground break-all mb-3">{accountStatus.stripeAccountId}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {accountStatus.detailsSubmitted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    )}
                    <span className="text-sm text-foreground">Details Submitted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {accountStatus.chargesEnabled ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    )}
                    <span className="text-sm text-foreground">Can Accept Payments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {accountStatus.payoutsEnabled ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    )}
                    <span className="text-sm text-foreground">Can Receive Payouts</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not connected yet</p>
            )}
          </div>

          {/* Account Info */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Information</p>
            </div>
            <div className="space-y-2">
              {accountStatus.email && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground">{accountStatus.email}</p>
                </div>
              )}
              {accountStatus.country && (
                <div>
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="text-sm text-foreground">{accountStatus.country === 'MX' ? 'Mexico' : accountStatus.country}</p>
                </div>
              )}
              {accountStatus.businessType && (
                <div>
                  <p className="text-xs text-muted-foreground">Business Type</p>
                  <p className="text-sm text-foreground capitalize">{accountStatus.businessType.replace(/_/g, ' ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!accountStatus.stripeAccountId ? (
            <Button onClick={handleStartOnboarding} disabled={isConnecting}>
              {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CreditCard className="w-4 h-4 mr-2" />
              Connect Stripe Account
            </Button>
          ) : (
            <>
              <Button 
                variant="outline"
                onClick={handleViewDashboard} 
                disabled={isConnecting}
              >
                {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Stripe Dashboard
              </Button>
              {!accountStatus.payoutsEnabled && (
                <Button 
                  onClick={handleStartOnboarding} 
                  disabled={isConnecting}
                  variant="outline"
                >
                  {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Complete Setup
                </Button>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Tabs for Details */}
      {accountStatus.stripeAccountId && (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            {requirementsList.length > 0 && (
              <button
                onClick={() => setActiveTab('requirements')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'requirements'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Requirements ({requirementsList.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('support')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'support'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Help
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <Card className="p-6 border border-border">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 pb-4 border-b border-border">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Payment Processing</h3>
                      <p className="text-sm text-muted-foreground">
                        {accountStatus.chargesEnabled
                          ? "Your account can accept payments from guests."
                          : "Your account is not yet ready to accept payments. Complete the setup process above."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pb-4 border-b border-border">
                    <DollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Payouts</h3>
                      <p className="text-sm text-muted-foreground">
                        {accountStatus.payoutsEnabled
                          ? "Payments from guests will be transferred to your bank account. A 20 MXN platform fee applies per contribution."
                          : "Payouts are not yet enabled. Complete account verification to enable transfers."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <FileCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Verification Status</h3>
                      <p className="text-sm text-muted-foreground">
                        {accountStatus.payoutsEnabled
                          ? "Your account is fully verified and approved."
                          : accountStatus.detailsSubmitted
                          ? "Your details are under review by Stripe. This usually takes 24-48 hours."
                          : "No details have been submitted yet. Start the onboarding to provide your information."}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'requirements' && (
              <Card className="p-6 border border-border">
                {requirementsList.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-2">All Requirements Met</p>
                    <p className="text-sm text-muted-foreground">Your account has all required information.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground mb-4">
                      Please provide the following information in your Stripe account:
                    </p>
                    {requirementsList.map((req) => (
                      <div key={req} className="flex items-start gap-3 p-3 bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200 capitalize">
                          {req.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                    <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Click "Open Stripe Dashboard" to complete these requirements in your Stripe account.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'support' && (
              <Card className="p-6 border border-border">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">Getting Started</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Click "Connect Stripe Account" to create your Stripe Express account</li>
                      <li>Provide your personal or business information during onboarding</li>
                      <li>Add your bank account details for receiving payments</li>
                      <li>Wait for Stripe verification (usually 24-48 hours)</li>
                      <li>Once verified, guests can start contributing to your registry</li>
                    </ol>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="font-semibold text-foreground mb-2">Fees</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      A platform fee of 20 MXN is charged per guest contribution. This helps us maintain and improve the service.
                    </p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      For detailed information about Stripe Connect and account requirements, visit:
                    </p>
                    <a 
                      href="https://stripe.com/help/connect"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                    >
                      Stripe Connect Documentation
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}

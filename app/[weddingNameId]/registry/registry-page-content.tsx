"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Gift, Heart, DollarSign, CheckCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useI18n } from "@/components/contexts/i18n-context"

interface RegistryItem {
  id: string
  title: string
  description: string | null
  goal_amount: number
  current_amount: number
  image_urls: string[]
  is_active: boolean
  display_order: number
}

export default function RegistryPageContent({ weddingNameId }: { weddingNameId: string }) {
  const searchParams = useSearchParams()
  const { t } = useI18n()
  
  const [items, setItems] = useState<RegistryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [weddingUuid, setWeddingUuid] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(null)
  const [showContributeForm, setShowContributeForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    contributorName: "",
    contributorEmail: "",
    message: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!weddingNameId) return
    
    fetchWeddingUuid()
    
    // Check for success in URL
    const success = searchParams?.get("success")
    if (success === "true") {
      setShowSuccess(true)
      // Remove success param from URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [weddingNameId])

  useEffect(() => {
    if (weddingUuid) {
      fetchRegistryItems(weddingUuid)
    }
  }, [weddingUuid])

  async function fetchWeddingUuid() {
    try {
      const { data, error } = await supabase
        .from("weddings")
        .select("id")
        .eq("wedding_name_id", weddingNameId)
        .single()

      if (error) {
        throw error
      }
      setWeddingUuid(data?.id || null)
    } catch (error) {
      setIsLoading(false)
    }
  }

  async function fetchRegistryItems(idToUse: string) {
    if (!idToUse) {
      setIsLoading(false)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from("custom_registry_items")
        .select("*")
        .eq("wedding_id", idToUse)
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) {
        throw error
      }
      setItems(data || [])
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const handleContribute = (item: RegistryItem) => {
    setSelectedItem(item)
    setShowContributeForm(true)
    setFormData({ amount: "", contributorName: "", contributorEmail: "", message: "" })
  }

  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    setIsProcessing(true)

    try {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount < 0.01) {
        alert("Please enter a valid amount (minimum $0.01)")
        setIsProcessing(false)
        return
      }

      // Create Stripe checkout session
      const response = await fetch("/api/registry/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: selectedItem.id,
          amount,
          contributorName: formData.contributorName,
          contributorEmail: formData.contributorEmail,
          message: formData.message,
        }),
      })

      const { sessionId, url, error } = await response.json()

      if (error) {
        alert(error)
        setIsProcessing(false)
        return
      }

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      alert("Failed to process contribution. Please try again.")
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('registry.loadingRegistry')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">{t('registry.pageTitle')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('registry.pageSubtitle')}
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <Card className="p-6 mb-8 border-secondary bg-secondary/5">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-secondary" />
              <div>
                <h3 className="font-semibold text-foreground">{t('registry.thankYou')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('registry.confirmationEmail')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Registry Items */}
        {items.length === 0 ? (
          <Card className="p-12 text-center border border-border">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('registry.noItemsAvailable')}</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {items.map((item) => {
              const progress = Number(item.goal_amount) > 0 
                ? (Number(item.current_amount) / Number(item.goal_amount)) * 100 
                : 0
              const isFullyFunded = progress >= 100

              return (
                <Card key={item.id} className="p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                  {/* Image Gallery */}
                  {item.image_urls && item.image_urls.length > 0 && (
                    <div className="mb-4 aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={item.image_urls[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                      {item.description && (
                        <p className="text-muted-foreground mb-4">{item.description}</p>
                      )}
                    </div>
                    <Heart className="w-6 h-6 text-primary ml-4 flex-shrink-0" />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('registry.progress')}</span>
                      <span className="font-semibold text-foreground">
                        ${Number(item.current_amount).toFixed(2)} / ${Number(item.goal_amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-secondary h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {progress.toFixed(1)}% {t('registry.funded')}
                      {isFullyFunded && ` - ${t('registry.goalReached')}`}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleContribute(item)}
                    className="w-full"
                    disabled={isFullyFunded}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    {isFullyFunded ? t('registry.fullyFunded') : t('registry.contribute')}
                  </Button>
                </Card>
              )
            })}
          </div>
        )}

        {/* Contribution Form Modal */}
        {showContributeForm && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6 border border-border shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {t('registry.contributeTo')} {selectedItem.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t('registry.everyContribution')}
              </p>

              <form onSubmit={handleSubmitContribution} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('registry.contributionAmount')} *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="pl-10"
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('registry.remaining')}: ${(Number(selectedItem.goal_amount) - Number(selectedItem.current_amount)).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('registry.yourName')} ({t('common.optional')})
                  </label>
                  <Input
                    value={formData.contributorName}
                    onChange={(e) => setFormData({ ...formData, contributorName: e.target.value })}
                    placeholder="John Doe"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('registry.email')} ({t('common.optional')})
                  </label>
                  <Input
                    type="email"
                    value={formData.contributorEmail}
                    onChange={(e) => setFormData({ ...formData, contributorEmail: e.target.value })}
                    placeholder="john@example.com"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('registry.messageLabel')} ({t('common.optional')})
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t('registry.addPersonalMessage')}
                    rows={3}
                    disabled={isProcessing}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('registry.processing')}
                      </>
                    ) : (
                      <>{t('registry.proceedToPayment')}</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowContributeForm(false)
                      setSelectedItem(null)
                    }}
                    disabled={isProcessing}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"
import { use, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, DollarSign, X, AlertCircle, CheckCircle2, Crown, Lock } from "lucide-react"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { createBrowserClient } from "@supabase/ssr"
import { ImageUpload } from "@/components/ui/image-upload"
import { useImageUpload } from "@/hooks/use-image-upload"
import { StripeConnectCard } from "@/components/stripe-connect-card"
import { RegistryContributionsList } from "@/components/registry-contributions-list"
import { useWeddingFeatures, isFeatureEnabled } from "@/hooks/use-wedding-features"
import Link from "next/link"

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

interface WeddingData {
  id: string
  stripe_account_id: string | null
  stripe_onboarding_completed: boolean
  payouts_enabled: boolean
  partner1_first_name: string | null
  partner2_first_name: string | null
}

interface RegistryPageProps {
  params: Promise<{ weddingId: string }>
}

export default function RegistryPage({ params }: RegistryPageProps) {
  const resolvedParams = use(params)
  const weddingId = decodeURIComponent(resolvedParams.weddingId)
  const searchParams = useSearchParams()
  const router = useRouter()
  const connectStatus = searchParams.get("connect")
  
  const { uploadImage } = useImageUpload()
  const { plan, features, loading: featuresLoading } = useWeddingFeatures(weddingId)
  
  const [items, setItems] = useState<RegistryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null)
  const [weddingData, setWeddingData] = useState<WeddingData | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal_amount: "",
    image_urls: [] as string[],
  })
  const [errorDialog, setErrorDialog] = useState<{ show: boolean; message: string }>({ 
    show: false, 
    message: "" 
  })
  const [showConnectSuccess, setShowConnectSuccess] = useState(connectStatus === "success")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const customRegistryEnabled = isFeatureEnabled(features, 'custom_registry_enabled')

  useEffect(() => {
    fetchWeddingData()
  }, [weddingId])

  // When returning from Stripe, refresh immediately and periodically
  useEffect(() => {
    if (showConnectSuccess) {
      // Refresh immediately
      fetchWeddingData()
      
      // Refresh every 2 seconds while success message is shown
      const interval = setInterval(() => {
        fetchWeddingData()
      }, 2000)
      
      // Hide message and clear URL after 5 seconds
      const timer = setTimeout(() => {
        setShowConnectSuccess(false)
        // Clear the query param from URL
        router.replace(`/admin/${weddingId}/registry`)
      }, 5000)
      
      return () => {
        clearInterval(interval)
        clearTimeout(timer)
      }
    }
  }, [showConnectSuccess, weddingId, router])

  const fetchWeddingData = async () => {
    try {
      // Detect if weddingId is a UUID (contains hyphens) or a wedding_name_id
      const isUUID = weddingId.includes('-')
      const query = supabase
        .from("weddings")
        .select("id, stripe_account_id, stripe_onboarding_completed, payouts_enabled, partner1_first_name, partner2_first_name")
      
      const { data, error } = isUUID 
        ? await query.eq("id", weddingId).single()
        : await query.eq("wedding_name_id", weddingId).single()

      if (error) {
        console.error("Error fetching wedding data:", error)
        setErrorDialog({ show: true, message: `Failed to load wedding: ${error.message}` })
        setIsLoading(false)
        return
      }
      
      if (data) {
        // If there's a Stripe account, fetch live status from Stripe API
        if (data.stripe_account_id) {
          try {
            const statusResponse = await fetch(`/api/connect/account-status?weddingId=${data.id}`)
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              // Override payouts_enabled with live Stripe data
              data.payouts_enabled = statusData.payoutsEnabled
            }
          } catch (err) {
            console.warn("Failed to fetch live Stripe status:", err)
            // Continue with database payouts_enabled if API fails
          }
        }
        
        setWeddingData(data)
        fetchItems(data.id)
      } else {
        console.error("No wedding found for:", weddingId)
        setErrorDialog({ show: true, message: "Wedding not found" })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      setIsLoading(false)
    }
  }

  const fetchItems = async (uuid?: string) => {
    const idToUse = uuid || weddingData?.id
    if (!idToUse) return

    try {
      const { data, error } = await supabase
        .from("custom_registry_items")
        .select("*")
        .eq("wedding_id", idToUse)
        .order("display_order", { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!weddingData?.id) {
      console.error("Wedding data not loaded:", { weddingData, weddingId })
      setErrorDialog({ show: true, message: "Wedding data is not loaded. Please refresh the page." })
      return
    }
    
    if (!formData.title.trim()) {
      setErrorDialog({ show: true, message: "Title is required" })
      return
    }

    if (!formData.goal_amount || parseFloat(formData.goal_amount) <= 0) {
      setErrorDialog({ show: true, message: "Goal amount must be greater than 0" })
      return
    }
    
    try {
      const itemData = {
        wedding_id: weddingData.id,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        goal_amount: parseFloat(formData.goal_amount) || 0,
        image_urls: formData.image_urls,
        display_order: editingItem ? editingItem.display_order : items.length,
      }

      if (editingItem) {
        const { error } = await supabase
          .from("custom_registry_items")
          .update(itemData)
          .eq("id", editingItem.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("custom_registry_items")
          .insert([itemData])

        if (error) throw error
      }

      setFormData({ title: "", description: "", goal_amount: "", image_urls: [] })
      setShowForm(false)
      setEditingItem(null)
      fetchItems(weddingData.id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      console.error("Error saving item:", error)
      setErrorDialog({ show: true, message: errorMessage })
    }
  }

  const handleEdit = (item: RegistryItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description || "",
      goal_amount: item.goal_amount.toString(),
      image_urls: item.image_urls || [],
    })
    setShowForm(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await uploadImage(file)
    if (result) {
      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, result.url]
      }))
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }))
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this registry item?")) return

    try {
      const { error } = await supabase
        .from("custom_registry_items")
        .delete()
        .eq("id", id)

      if (error) throw error
      fetchItems()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete item"
      setErrorDialog({ show: true, message: errorMessage })
    }
  }

  const toggleActive = async (item: RegistryItem) => {
    try {
      const { error } = await supabase
        .from("custom_registry_items")
        .update({ is_active: !item.is_active })
        .eq("id", item.id)

      if (error) throw error
      fetchItems()
    } catch (error) {
    }
  }

  const totalGoal = items.reduce((sum, item) => sum + Number(item.goal_amount), 0)
  const totalRaised = items.reduce((sum, item) => sum + Number(item.current_amount), 0)
  const percentageRaised = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(weddingId, 'dashboard')}
        title="Registry Manager"
        rightContent={
          <Button
            size="sm"
            onClick={() => {
              setShowForm(!showForm)
              setEditingItem(null)
              setFormData({ title: "", description: "", goal_amount: "", image_urls: [] })
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Custom Registry</h1>
          <p className="text-muted-foreground">
            Create custom registry items for experiences, funds, and special requests
          </p>
        </div>

        {/* Feature Gate - Premium/Deluxe Only */}
        {!featuresLoading && !customRegistryEnabled && (
          <Card className="p-8 mb-8 border-[#DDA46F]/30 shadow-sm bg-gradient-to-br from-[#420c14]/5 to-[#DDA46F]/5">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#420c14] to-[#DDA46F] flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-[#420c14] mb-2">Premium Feature</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Custom registry with bespoke items and secure payouts is available on <strong>Premium</strong> and <strong>Deluxe</strong> plans.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/upgrade">
                  <Button className="bg-gradient-to-r from-[#420c14] to-[#DDA46F] hover:from-[#420c14]/90 hover:to-[#DDA46F]/90 text-white">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => router.push(`/admin/${weddingId}/dashboard`)}>
                  Go to Dashboard
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Current plan: <span className="font-semibold capitalize">{plan}</span>
              </p>
            </div>
          </Card>
        )}

        {/* Rest of content only shows if feature is enabled */}
        {!featuresLoading && customRegistryEnabled && (
          <>
        
        {/* Error Display */}
        {errorDialog.show && (
          <Card className="p-4 mb-8 border-destructive bg-destructive/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Error</h3>
                <p className="text-sm text-destructive">{errorDialog.message}</p>
              </div>
              <button 
                onClick={() => setErrorDialog({ show: false, message: "" })}
                className="text-destructive hover:text-destructive/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>
        )}

        {/* Connect Success Message */}
        {showConnectSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 dark:text-green-200">
              Stripe account setup updated! Your account status will be refreshed shortly.
            </p>
            <button 
              onClick={() => setShowConnectSuccess(false)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stripe Connect Card */}
        {weddingData && (
          <StripeConnectCard
            weddingId={weddingData.id}
            stripeAccountId={weddingData.stripe_account_id}
            stripeOnboardingCompleted={weddingData.stripe_onboarding_completed}
            payoutsEnabled={weddingData.payouts_enabled}
            onStatusChange={fetchWeddingData}
          />
        )}

        {/* Contributions List */}
        {weddingData && items.length > 0 && (
          <div className="mb-8">
            <RegistryContributionsList weddingId={weddingData.id} items={items} />
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 border border-border shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
              Total Items
            </p>
            <p className="text-2xl font-bold text-foreground">{items.length}</p>
          </Card>
          <Card className="p-4 border border-border shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
              Total Goal
            </p>
            <p className="text-2xl font-bold text-foreground">${totalGoal.toFixed(2)}</p>
          </Card>
          <Card className="p-4 border border-border shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
              Total Raised
            </p>
            <p className="text-2xl font-bold text-secondary">${totalRaised.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {percentageRaised.toFixed(1)}% of goal
            </p>
          </Card>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-6 mb-8 border border-border shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingItem ? "Edit Registry Item" : "Add New Registry Item"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Honeymoon Fund, Dream Home Down Payment"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell guests about this registry item..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Goal Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.goal_amount}
                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Images
                </label>
                <div className="space-y-3">
                  {/* Image Preview Grid */}
                  {formData.image_urls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {formData.image_urls.map((url, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Upload Component */}
                  <ImageUpload
                    onUpload={(url) => {
                      setFormData(prev => ({
                        ...prev,
                        image_urls: [...prev.image_urls, url]
                      }))
                    }}
                    placeholder="Add registry item image"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingItem ? "Update Item" : "Create Item"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingItem(null)
                    setFormData({ title: "", description: "", goal_amount: "", image_urls: [] })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Items List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading registry items...</p>
            </div>
          ) : items.length === 0 ? (
            <Card className="p-12 text-center border border-border">
              <p className="text-muted-foreground mb-4">No registry items yet</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Item
              </Button>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="p-6 border border-border shadow-sm">
                <div className="flex items-start gap-4">
                  {/* Image Thumbnail */}
                  {item.image_urls && item.image_urls.length > 0 && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted relative">
                      <img
                        src={item.image_urls[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      {item.image_urls.length > 1 && (
                        <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                          +{item.image_urls.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.is_active
                            ? "bg-secondary/10 text-secondary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-muted-foreground mb-4">{item.description}</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">
                          ${Number(item.current_amount).toFixed(2)} / ${Number(item.goal_amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-secondary h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (Number(item.current_amount) / Number(item.goal_amount)) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Number(item.goal_amount) > 0
                          ? ((Number(item.current_amount) / Number(item.goal_amount)) * 100).toFixed(1)
                          : 0}
                        % funded
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(item)}
                    >
                      {item.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
        
        </>
        )}
      </div>

      {/* Error Dialog */}
      {errorDialog.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setErrorDialog({ show: false, message: "" })}>
          <Card className="w-full max-w-md p-6 border border-border shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Error</h3>
                <p className="text-sm text-muted-foreground mb-4">{errorDialog.message}</p>
                <Button onClick={() => setErrorDialog({ show: false, message: "" })}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  )
}

"use client"
import { use, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ViewSwitcher } from "@/components/ui/view-switcher"
import { UpgradeModal } from "@/components/ui/upgrade-modal"
import { Plus, Edit, Trash2, DollarSign, X, AlertCircle, CheckCircle2, Crown, Lock, LayoutGrid, Filter, ArrowUpDown, Search, ExternalLink } from "lucide-react"
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
  created_at: string
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
  
  // View mode: 'items' or 'contributions' - initialized from URL param
  const initialViewMode = searchParams.get('view') === 'contributions' ? 'contributions' : 'items'
  const [viewModeState, setViewModeState] = useState<'items' | 'contributions'>(initialViewMode)
  
  // Update URL when view mode changes
  const setViewMode = (mode: 'items' | 'contributions') => {
    setViewModeState(mode)
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', mode)
    router.replace(`?${params.toString()}`, { scroll: false })
  }
  
  const viewMode = viewModeState
  
  const { uploadImage } = useImageUpload()
  const { plan, features, loading: featuresLoading } = useWeddingFeatures(weddingId)
  
  const [items, setItems] = useState<RegistryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null)
  const [weddingData, setWeddingData] = useState<WeddingData | null>(null)
  const [itemsWithPendingContributions, setItemsWithPendingContributions] = useState<Set<string>>(new Set())
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  // Filter states for items
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  
  // Filter states for contributions
  const [contributionSearchQuery, setContributionSearchQuery] = useState("")
  const [contributionFilterByItem, setContributionFilterByItem] = useState<string>("all")
  const [contributionFilterByStatus, setContributionFilterByStatus] = useState<string>("all")
  const [contributionSortBy, setContributionSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  const [contributionStats, setContributionStats] = useState({ count: 0, amount: 0 })

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
      
      // Check for items with pending contributions
      checkForPendingContributions(data || [])
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const checkForPendingContributions = async (items: RegistryItem[]) => {
    if (items.length === 0) {
      setItemsWithPendingContributions(new Set())
      return
    }

    try {
      const itemIds = items.map(item => item.id)
      const { data: contributions, error } = await supabase
        .from("custom_registry_contributions")
        .select("custom_registry_item_id, status")
        .in("custom_registry_item_id", itemIds)
        .eq("status", "requires_action")

      if (error) {
        console.warn("Error checking for pending contributions:", error)
        return
      }

      const itemsWithPending = new Set(
        contributions?.map(c => c.custom_registry_item_id) || []
      )
      setItemsWithPendingContributions(itemsWithPending)
    } catch (error) {
      console.warn("Error checking for pending contributions:", error)
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
    // Check if this item has pending contributions
    if (itemsWithPendingContributions.has(id)) {
      setErrorDialog({ 
        show: true, 
        message: "Cannot delete this registry item because it has contributions requiring action. Please resolve pending contributions first or deactivate the item instead." 
      })
      return
    }

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

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = item.title.toLowerCase().includes(query)
        const matchesDescription = item.description?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesDescription) return false
      }
      
      // Status filter
      if (statusFilter === 'active' && !item.is_active) return false
      if (statusFilter === 'inactive' && item.is_active) return false
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'highest':
          return Number(b.goal_amount) - Number(a.goal_amount)
        case 'lowest':
          return Number(a.goal_amount) - Number(b.goal_amount)
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(weddingId, 'dashboard')}
        title="Registry Manager"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with Title and Stats */}
        {!featuresLoading && (
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Custom Registry</h1>
                <p className="text-sm text-muted-foreground">
                  Create custom registry items for experiences, funds, and special requests
                </p>
              </div>
              
              {/* Stats Pills and Action Button */}
              <div className="flex items-center gap-3 flex-wrap">
                {viewMode === 'items' ? (
                  <>
                    {/* Items Stats */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium">
                      <LayoutGrid className="w-3 h-3 text-muted-foreground" />
                      <span className="text-foreground font-semibold">{items.length}</span>
                      <span className="text-muted-foreground">items</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      <span className="text-foreground font-semibold">${totalGoal.toFixed(2)}</span>
                      <span className="text-muted-foreground">goal</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-xs font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span className="text-secondary font-semibold">${totalRaised.toFixed(2)}</span>
                      <span className="text-muted-foreground">raised</span>
                    </div>
                    {/* Add Item Button */}
                    <Button
                      size="sm"
                      onClick={() => {
                        if (plan === 'free') {
                          setShowUpgradeModal(true)
                        } else {
                          setShowForm(!showForm)
                          setEditingItem(null)
                          setFormData({ title: "", description: "", goal_amount: "", image_urls: [] })
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Contributions Stats */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      <span className="text-foreground font-semibold">{contributionStats.count}</span>
                      <span className="text-muted-foreground">contributions</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-xs font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span className="text-secondary font-semibold">${contributionStats.amount.toFixed(2)}</span>
                      <span className="text-muted-foreground">received</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* View Switcher and Filters Row */}
            <div className="sticky top-[72px] z-40 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 bg-background/95 supports-[backdrop-filter]:bg-background/75 backdrop-blur border-b border-border/40">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                {/* View Switcher */}
                <ViewSwitcher
                  options={[
                    { value: 'items', label: 'Items', icon: LayoutGrid },
                    { value: 'contributions', label: 'Contributions', icon: DollarSign },
                  ]}
                  value={viewMode}
                  onChange={(mode) => setViewMode(mode as 'items' | 'contributions')}
                />
                
                {/* Inline Filters - Items */}
                {viewMode === 'items' && items.length > 0 && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-7 h-8 w-36 text-sm"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="highest">Highest Goal</option>
                      <option value="lowest">Lowest Goal</option>
                    </select>
                  </>
                )}
                
                {/* Inline Filters - Contributions */}
                {viewMode === 'contributions' && items.length > 0 && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={contributionSearchQuery}
                        onChange={(e) => setContributionSearchQuery(e.target.value)}
                        className="pl-7 h-8 w-36 text-sm"
                      />
                    </div>
                    <select
                      value={contributionFilterByItem}
                      onChange={(e) => setContributionFilterByItem(e.target.value)}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="all">All Items</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                    <select
                      value={contributionFilterByStatus}
                      onChange={(e) => setContributionFilterByStatus(e.target.value)}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="incomplete">Incomplete</option>
                      <option value="requires_action">Requires Action</option>
                      <option value="failed">Failed</option>
                    </select>
                    <select
                      value={contributionSortBy}
                      onChange={(e) => setContributionSortBy(e.target.value as typeof contributionSortBy)}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="highest">Highest Amount</option>
                      <option value="lowest">Lowest Amount</option>
                    </select>
                  </>
                )}
                </div>
                
                {/* Stripe Status Indicator - Right Side */}
                {weddingData && (
                  <div className="flex items-center gap-2">
                  {weddingData.payouts_enabled ? (
                    <>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-300">Stripe Connected</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/connect/account-link", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ weddingId: weddingData.id, type: "login" }),
                            })
                            if (!response.ok) throw new Error("Failed to get dashboard link")
                            const { url } = await response.json()
                            window.open(url, "_blank")
                          } catch (err) {
                            console.error(err)
                          }
                        }}
                        className="h-8"
                      >
                        <ExternalLink className="w-3 h-3 mr-1.5" />
                        Dashboard
                      </Button>
                    </>
                  ) : weddingData.stripe_account_id ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-xs font-medium border border-amber-200 dark:border-amber-800">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <span className="text-amber-700 dark:text-amber-300">Setup Incomplete</span>
                    </div>
                  ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rest of content */}
        {!featuresLoading && (
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

        {/* Contributions View */}
        {viewMode === 'contributions' && weddingData && items.length > 0 && (
          <RegistryContributionsList 
            weddingId={weddingData.id} 
            items={items}
            searchQuery={contributionSearchQuery}
            filterByItem={contributionFilterByItem}
            filterByStatus={contributionFilterByStatus}
            sortBy={contributionSortBy}
            onStatsChange={setContributionStats}
          />
        )}

        {/* Items View */}
        {viewMode === 'items' && (
          <>
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
                      if (!url) return
                      setFormData(prev => ({
                        ...prev,
                        image_urls: [
                          url,
                          ...prev.image_urls.filter(Boolean).filter(existing => existing !== url)
                        ]
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
          ) : filteredAndSortedItems.length === 0 ? (
            <Card className="p-12 text-center border border-border shadow-sm">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No items match your filters</p>
            </Card>
          ) : (
            filteredAndSortedItems.map((item) => (
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
                    <div className="relative group">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        disabled={itemsWithPendingContributions.has(item.id)}
                        className={itemsWithPendingContributions.has(item.id) ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {itemsWithPendingContributions.has(item.id) && (
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-[#420c14] text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          Resolve pending contributions first
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
        </>
        )}
        {/* End Items View */}
        
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="general"
      />
    </main>
  )
}

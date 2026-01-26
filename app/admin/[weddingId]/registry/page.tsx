"use client"
import { use, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, DollarSign, X, AlertCircle } from "lucide-react"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { createBrowserClient } from "@supabase/ssr"
import { ImageUpload } from "@/components/ui/image-upload"
import { useImageUpload } from "@/hooks/use-image-upload"

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

interface RegistryPageProps {
  params: Promise<{ weddingId: string }>
}

export default function RegistryPage({ params }: RegistryPageProps) {
  const resolvedParams = use(params)
  const weddingId = decodeURIComponent(resolvedParams.weddingId)
  
  const { uploadImage } = useImageUpload()
  
  const [items, setItems] = useState<RegistryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null)
  const [weddingUuid, setWeddingUuid] = useState<string | null>(null)
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchWeddingUuid()
  }, [weddingId])

  const fetchWeddingUuid = async () => {
    try {
      const { data, error } = await supabase
        .from("weddings")
        .select("id")
        .eq("wedding_name_id", weddingId)
        .single()

      if (error) throw error
      if (data) {
        setWeddingUuid(data.id)
        fetchItems(data.id)
      }
    } catch (error) {
      setIsLoading(false)
    }
  }

  const fetchItems = async (uuid?: string) => {
    const idToUse = uuid || weddingUuid
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
    
    if (!weddingUuid) {
      setErrorDialog({ show: true, message: "Wedding ID not found" })
      return
    }
    
    try {
      const itemData = {
        wedding_id: weddingUuid,
        title: formData.title,
        description: formData.description || null,
        goal_amount: parseFloat(formData.goal_amount) || 0,
        image_urls: formData.image_urls,
        display_order: editingItem ? editingItem.display_order : items.length,
      }

      if (editingItem) {
        const { data, error } = await supabase
          .from("custom_registry_items")
          .update(itemData)
          .eq("id", editingItem.id)
          .select()
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("custom_registry_items")
          .insert([itemData])
          .select()
        if (error) throw error
      }

      setFormData({ title: "", description: "", goal_amount: "", image_urls: [] })
      setShowForm(false)
      setEditingItem(null)
      fetchItems()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
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

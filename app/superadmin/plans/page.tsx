"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Save, DollarSign, Check, X, Crown, TrendingUp, Infinity } from "lucide-react"
import { toast } from "sonner"

type PlanType = 'free' | 'premium' | 'deluxe'

interface PlanFeature {
  id: string
  plan: PlanType
  feature_key: string
  enabled: boolean
  limit_value: number | null
  config_json: Record<string, unknown>
  description: string | null
  unit?: string
}

interface PlanPricing {
  id: string
  plan: PlanType
  price_usd: number
  price_mxn: number
}

interface PendingChange {
  featureId: string
  field: 'enabled' | 'limit_value' | 'unit'
  oldValue: boolean | number | string | null
  newValue: boolean | number | string | null
}

export default function PlanFeaturesPage() {
  const [features, setFeatures] = useState<PlanFeature[]>([])
  const [pricing, setPricing] = useState<PlanPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [saving, setSaving] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveReason, setSaveReason] = useState("")
  
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [featuresRes, pricingRes] = await Promise.all([
        supabase.from('plan_features').select('*').order('feature_key'),
        supabase.from('plan_pricing').select('*').order('price_usd')
      ])
      
      if (featuresRes.error) throw featuresRes.error
      if (pricingRes.error) throw pricingRes.error
      
      setFeatures(featuresRes.data || [])
      setPricing(pricingRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load plan features')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Get unique feature keys
  const featureKeys = [...new Set(features.map(f => f.feature_key))].sort()
  
  // Get feature for a specific plan and key
  const getFeature = (plan: PlanType, key: string) => 
    features.find(f => f.plan === plan && f.feature_key === key)

  // Check if a feature has pending changes
  const hasPendingChange = (featureId: string, field: 'enabled' | 'limit_value' | 'unit') =>
    pendingChanges.some(c => c.featureId === featureId && c.field === field)

  // Get current value (with pending changes applied)
  const getCurrentValue = (feature: PlanFeature, field: 'enabled' | 'limit_value' | 'unit') => {
    const pending = pendingChanges.find(c => c.featureId === feature.id && c.field === field)
    if (pending) return pending.newValue
    if (field === 'enabled') return feature.enabled
    if (field === 'limit_value') return feature.limit_value
    return feature.unit || null
  }

  // Handle toggle change
  const handleToggle = (feature: PlanFeature, newEnabled: boolean) => {
    setPendingChanges(prev => {
      // Remove any existing change for this feature/field
      const filtered = prev.filter(c => !(c.featureId === feature.id && c.field === 'enabled'))
      // Add new change if different from original
      if (newEnabled !== feature.enabled) {
        return [...filtered, { featureId: feature.id, field: 'enabled', oldValue: feature.enabled, newValue: newEnabled }]
      }
      return filtered
    })
  }

  // Handle limit change
  const handleLimitChange = (feature: PlanFeature, newLimit: string) => {
    const parsedLimit = newLimit === '' || newLimit === '∞' ? null : parseInt(newLimit)
    setPendingChanges(prev => {
      const filtered = prev.filter(c => !(c.featureId === feature.id && c.field === 'limit_value'))
      if (parsedLimit !== feature.limit_value) {
        return [...filtered, { featureId: feature.id, field: 'limit_value', oldValue: feature.limit_value, newValue: parsedLimit }]
      }
      return filtered
    })
  }

  // Handle unit change
  const handleUnitChange = (feature: PlanFeature, newUnit: string) => {
    setPendingChanges(prev => {
      const filtered = prev.filter(c => !(c.featureId === feature.id && c.field === 'unit'))
      const oldUnit = feature.unit || null
      if (newUnit !== oldUnit) {
        return [...filtered, { featureId: feature.id, field: 'unit', oldValue: oldUnit, newValue: newUnit }]
      }
      return filtered
    })
  }

  // Save all changes
  const handleSaveAll = async () => {
    if (!saveReason.trim()) {
      toast.error('Please provide a reason for the changes')
      return
    }

    setSaving(true)
    try {
      // Group changes by feature
      const changesByFeature: Record<string, { enabled?: boolean; limit_value?: number | null; unit?: string }> = {}
      for (const change of pendingChanges) {
        if (!changesByFeature[change.featureId]) changesByFeature[change.featureId] = {}
        if (change.field === 'enabled') {
          changesByFeature[change.featureId].enabled = change.newValue as boolean
        } else if (change.field === 'limit_value') {
          changesByFeature[change.featureId].limit_value = change.newValue as number | null
        } else if (change.field === 'unit') {
          changesByFeature[change.featureId].unit = change.newValue as string
        }
      }

      // Save each feature
      for (const [featureId, changes] of Object.entries(changesByFeature)) {
        const feature = features.find(f => f.id === featureId)
        if (!feature) continue

        const response = await fetch('/api/superadmin/plan-features', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureId,
            enabled: changes.enabled ?? feature.enabled,
            limitValue: changes.limit_value !== undefined ? changes.limit_value : feature.limit_value,
            unit: changes.unit !== undefined ? changes.unit : feature.unit,
            configJson: feature.config_json,
            reason: saveReason.trim()
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update feature')
        }
      }

      toast.success(`${Object.keys(changesByFeature).length} features updated successfully`)
      setSaveDialogOpen(false)
      setSaveReason("")
      setPendingChanges([])
      fetchData()
    } catch (error) {
      console.error('Error saving features:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save features')
    } finally {
      setSaving(false)
    }
  }

  const formatFeatureKey = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
      </div>
    )
  }

  const freePricing = pricing.find(p => p.plan === 'free')
  const premiumPricing = pricing.find(p => p.plan === 'premium')
  const deluxePricing = pricing.find(p => p.plan === 'deluxe')

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Configuration</p>
          <h1 className="text-4xl font-serif text-[#420c14]">Plan Features</h1>
          <p className="text-[#420c14]/60 mt-2">
            Configure limits and features for each subscription plan
          </p>
        </div>
        
        {pendingChanges.length > 0 && (
          <Button 
            onClick={() => setSaveDialogOpen(true)}
            className="bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] rounded-xl px-6"
          >
            <Save className="w-4 h-4 mr-2" />
            Save {pendingChanges.length} changes
          </Button>
        )}
      </div>
      
      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free */}
        <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[#420c14]/40" />
            <h3 className="font-medium text-[#420c14]">Free</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#420c14]/60">USD</span>
              <span className="font-medium text-[#420c14]">${freePricing ? (freePricing.price_usd / 100).toFixed(0) : 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#420c14]/60">MXN</span>
              <span className="font-medium text-[#420c14]">${freePricing ? (freePricing.price_mxn / 100).toFixed(0) : 0}</span>
            </div>
          </div>
        </div>
        
        {/* Premium */}
        <div className="bg-white rounded-2xl border border-[#DDA46F]/30 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#DDA46F]" />
            <h3 className="font-medium text-[#DDA46F]">Premium</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#420c14]/60">USD</span>
              <span className="font-medium text-[#420c14]">${premiumPricing ? (premiumPricing.price_usd / 100).toFixed(0) : 250}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#420c14]/60">MXN</span>
              <span className="font-medium text-[#420c14]">${premiumPricing ? (premiumPricing.price_mxn / 100).toFixed(0) : 5000}</span>
            </div>
          </div>
        </div>
        
        {/* Deluxe */}
        <div className="bg-gradient-to-br from-[#420c14] to-[#5a1a22] rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-[#DDA46F]" />
            <h3 className="font-medium text-[#f5f2eb]">Deluxe</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#f5f2eb]/60">USD</span>
              <span className="font-medium text-[#f5f2eb]">${deluxePricing ? (deluxePricing.price_usd / 100).toFixed(0) : 500}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#f5f2eb]/60">MXN</span>
              <span className="font-medium text-[#f5f2eb]">${deluxePricing ? (deluxePricing.price_mxn / 100).toFixed(0) : 10000}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Table */}
      <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="border-b-2 border-[#420c14]/10">
                <th className="text-left py-5 px-6 font-medium text-[#420c14]/60 text-sm">Feature</th>
                <th className="text-center py-5 px-6 font-medium text-[#420c14]/60 text-sm border-l-2 border-[#420c14]/5">Free</th>
                <th className="text-center py-5 px-6 font-medium text-[#DDA46F] text-sm border-l-2 border-[#420c14]/10">Premium</th>
                <th className="text-center py-5 px-6 font-medium text-[#420c14] text-sm bg-[#420c14]/5 border-l-2 border-[#420c14]/20">Deluxe</th>
              </tr>
            </thead>
            <tbody>
              {featureKeys.map((key, index) => {
                const freeFeature = getFeature('free', key)
                const premiumFeature = getFeature('premium', key)
                const deluxeFeature = getFeature('deluxe', key)
                const description = freeFeature?.description || premiumFeature?.description || deluxeFeature?.description
                
                return (
                  <tr key={key}>
                    <td className={`py-6 px-6 ${index % 2 === 0 ? 'bg-[#f5f2eb]/80' : ''}`}>
                      <p className="font-medium text-[#420c14] text-sm">{formatFeatureKey(key)}</p>
                      {description && (
                        <p className="text-xs text-[#420c14]/50 mt-0.5">{description}</p>
                      )}
                    </td>
                    
                    {/* Free column */}
                    <td className={`text-center py-6 px-6 border-l-2 border-[#420c14]/5 ${index % 2 === 0 ? 'bg-[#f5f2eb]/80' : ''}`}>
                      {freeFeature && (
                        <FeatureCell 
                          feature={freeFeature} 
                          getCurrentValue={getCurrentValue}
                          hasPendingChange={hasPendingChange}
                          onToggle={handleToggle}
                          onLimitChange={handleLimitChange}
                          onUnitChange={handleUnitChange}
                        />
                      )}
                    </td>
                    
                    {/* Premium column */}
                    <td className={`text-center py-6 px-6 border-l-2 border-[#420c14]/10 ${index % 2 === 0 ? 'bg-[#f5f2eb]/80' : ''}`}>
                      {premiumFeature && (
                        <FeatureCell 
                          feature={premiumFeature} 
                          getCurrentValue={getCurrentValue}
                          hasPendingChange={hasPendingChange}
                          onToggle={handleToggle}
                          onLimitChange={handleLimitChange}
                          onUnitChange={handleUnitChange}
                        />
                      )}
                    </td>
                    
                    {/* Deluxe column */}
                    <td className={`text-center py-6 px-6 border-l-2 border-[#420c14]/20 ${index % 2 === 0 ? 'bg-[#420c14]/20' : ''}`}>
                      {deluxeFeature && (
                        <FeatureCell 
                          feature={deluxeFeature} 
                          getCurrentValue={getCurrentValue}
                          hasPendingChange={hasPendingChange}
                          onToggle={handleToggle}
                          onLimitChange={handleLimitChange}
                          onUnitChange={handleUnitChange}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-[#420c14]/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#420c14]">Save Changes</DialogTitle>
            <DialogDescription className="text-[#420c14]/60">
              You are about to save {pendingChanges.length} changes to plan features.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-[#f5f2eb] rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
              {pendingChanges.map((change, i) => {
                const feature = features.find(f => f.id === change.featureId)
                if (!feature) return null
                return (
                  <div key={i} className="text-sm flex items-center gap-2">
                    <span className="font-medium text-[#420c14]">{formatFeatureKey(feature.feature_key)}</span>
                    <span className="text-[#420c14]/40">({feature.plan})</span>
                    <span className="text-[#420c14]/30">→</span>
                    <span className="text-[#DDA46F]">
                      {change.field === 'enabled' 
                        ? (change.newValue ? 'Enabled' : 'Disabled')
                        : (change.newValue === null ? '∞' : change.newValue)
                      }
                    </span>
                  </div>
                )
              })}
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#420c14]/70 text-sm">Reason for changes *</Label>
              <Textarea
                placeholder="Why are you making these changes?"
                value={saveReason}
                onChange={(e) => setSaveReason(e.target.value)}
                rows={3}
                className="rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/20 resize-none"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setSaveDialogOpen(false)}
              className="rounded-xl border-[#420c14]/10 text-[#420c14] hover:bg-[#420c14]/5"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAll}
              disabled={saving || !saveReason.trim()}
              className="rounded-xl bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Feature cell component
function FeatureCell({ 
  feature, 
  getCurrentValue, 
  hasPendingChange,
  onToggle, 
  onLimitChange,
  onUnitChange
}: {
  feature: PlanFeature
  getCurrentValue: (feature: PlanFeature, field: 'enabled' | 'limit_value' | 'unit') => boolean | number | string | null
  hasPendingChange: (featureId: string, field: 'enabled' | 'limit_value' | 'unit') => boolean
  onToggle: (feature: PlanFeature, enabled: boolean) => void
  onLimitChange: (feature: PlanFeature, limit: string) => void
  onUnitChange: (feature: PlanFeature, unit: string) => void
}) {
  const enabled = getCurrentValue(feature, 'enabled') as boolean
  const limit = getCurrentValue(feature, 'limit_value') as number | null
  const hasEnabledChange = hasPendingChange(feature.id, 'enabled')
  const hasLimitChange = hasPendingChange(feature.id, 'limit_value')
  const hasUnitChange = hasPendingChange(feature.id, 'unit')
  
  // Determine if this is a boolean-only feature or has a limit
  const hasLimit = feature.limit_value !== null || hasLimitChange
  
  // Get current unit
  const getDefaultUnit = () => {
    if (feature.feature_key.includes('tracking_limit')) return 'items'
    if (feature.feature_key.includes('days')) return 'days'
    if (feature.feature_key.includes('storage')) return 'MB'
    return 'items'
  }
  const unit = (getCurrentValue(feature, 'unit') as string) || feature.unit || getDefaultUnit()

  return (
    <div className="flex items-center justify-center gap-2 min-h-[60px] px-2">
      {/* Enable/Disable toggle */}
      <div className={`flex-shrink-0 transition-all ${hasEnabledChange ? 'ring-2 ring-[#DDA46F] ring-offset-2 rounded-full' : ''}`}>
        {enabled ? (
          <button
            onClick={() => onToggle(feature, false)}
            className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
          >
            <Check className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => onToggle(feature, true)}
            className="w-9 h-9 rounded-full bg-[#420c14]/5 text-[#420c14]/30 flex items-center justify-center hover:bg-[#420c14]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Limit input with unit selector */}
      {hasLimit && (
        <div className="flex items-center justify-center gap-1.5">
          {!enabled ? (
            <div className="h-9" />
          ) : limit === null || limit === 0 ? (
            <button
              onClick={() => onLimitChange(feature, '10')}
              className="flex items-center gap-1 text-[#DDA46F] hover:text-[#c99560] transition-colors h-9 px-2"
              title="Click to set a limit"
            >
              <Infinity className="w-4 h-4" />
              <span className="text-[9px] uppercase tracking-wider whitespace-nowrap">Unlimited</span>
            </button>
          ) : (
            <>
              <Input
                type="number"
                value={limit}
                onChange={(e) => onLimitChange(feature, e.target.value)}
                className="w-16 h-9 text-center text-sm rounded-lg border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/20 font-medium"
                min={0}
              />
              <Select value={unit} onValueChange={(value) => onUnitChange(feature, value)}>
                <SelectTrigger className={`w-20 h-9 text-xs rounded-lg border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/20 ${hasUnitChange ? 'ring-2 ring-[#DDA46F] ring-offset-1' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="items">Items</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="MB">MB</SelectItem>
                  <SelectItem value="GB">GB</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="emails">Emails</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      )}
    </div>
  )
}

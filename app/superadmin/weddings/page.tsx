"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { Search, Heart, Calendar, User, Loader2, ExternalLink, Crown, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

type PlanType = 'free' | 'premium' | 'deluxe'

interface Wedding {
  id: string
  wedding_name_id: string
  partner1_name: string
  partner2_name: string
  wedding_date: string | null
  owner_id: string
  created_at: string
  owner_email?: string
  plan?: PlanType
}

export default function WeddingsManagementPage() {
  const [search, setSearch] = useState("")
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWedding, setSelectedWedding] = useState<Wedding | null>(null)
  const [newPlan, setNewPlan] = useState<PlanType>('free')
  const [reason, setReason] = useState("")
  const [updating, setUpdating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const searchWeddings = useCallback(async () => {
    if (!search.trim()) {
      setWeddings([])
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/superadmin/weddings/search?q=${encodeURIComponent(search)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to search weddings')
      }
      
      const { weddings: weddingsData } = await response.json()
      setWeddings(weddingsData || [])
    } catch (error) {
      console.error('Error searching weddings:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to search weddings')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchWeddings()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search, searchWeddings])

  const openChangePlanDialog = (wedding: Wedding) => {
    setSelectedWedding(wedding)
    setNewPlan(wedding.plan || 'free')
    setReason("")
    setDialogOpen(true)
  }

  const handleChangePlan = async () => {
    if (!selectedWedding || !reason.trim()) {
      toast.error('Please provide a reason for the change')
      return
    }
    
    if (newPlan === selectedWedding.plan) {
      toast.error('Please select a different plan')
      return
    }
    
    setUpdating(true)
    try {
      const response = await fetch('/api/superadmin/weddings/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: selectedWedding.id,
          newPlan,
          reason: reason.trim()
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change plan')
      }
      
      toast.success(`Plan changed to ${newPlan} successfully`)
      setDialogOpen(false)
      
      // Update local state
      setWeddings(prev => prev.map(w => 
        w.id === selectedWedding.id ? { ...w, plan: newPlan } : w
      ))
    } catch (error) {
      console.error('Error changing plan:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to change plan')
    } finally {
      setUpdating(false)
    }
  }

  const getPlanBadge = (plan: PlanType) => {
    switch (plan) {
      case 'deluxe': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#420c14] to-[#5a1a22] text-[#f5f2eb] text-xs font-medium">
            <Crown className="w-3 h-3 text-[#DDA46F]" />
            Deluxe
          </span>
        )
      case 'premium': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DDA46F]/10 text-[#DDA46F] text-xs font-medium border border-[#DDA46F]/30">
            <TrendingUp className="w-3 h-3" />
            Premium
          </span>
        )
      default: 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#420c14]/5 text-[#420c14]/60 text-xs font-medium">
            Free
          </span>
        )
    }
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Management</p>
        <h1 className="text-4xl font-serif text-[#420c14]">Weddings</h1>
        <p className="text-[#420c14]/60 mt-2">
          Search and manage wedding plans
        </p>
      </div>
      
      {/* Search */}
      <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm p-6">
        <h2 className="font-medium text-[#420c14] mb-1">Search Weddings</h2>
        <p className="text-sm text-[#420c14]/60 mb-4">Search by wedding name ID, partner names</p>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#420c14]/40" />
          <Input
            placeholder="Search weddings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/20 bg-[#f5f2eb]/50"
          />
        </div>
      </div>
      
      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
        </div>
      ) : weddings.length > 0 ? (
        <div className="space-y-4">
          {weddings.map((wedding) => (
            <div 
              key={wedding.id}
              className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm p-6 hover:shadow-md hover:border-[#DDA46F]/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-[#420c14]/5 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-[#420c14]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-xl text-[#420c14]">
                        {wedding.partner1_name} & {wedding.partner2_name}
                      </h3>
                      {getPlanBadge(wedding.plan || 'free')}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#420c14]/50 mt-2">
                      <span className="font-mono text-xs bg-[#420c14]/5 px-2 py-0.5 rounded">{wedding.wedding_name_id}</span>
                      {wedding.wedding_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(wedding.wedding_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Created {format(new Date(wedding.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Link 
                    href={`/${wedding.wedding_name_id}`} 
                    target="_blank"
                    className="w-10 h-10 rounded-xl bg-[#420c14]/5 flex items-center justify-center text-[#420c14]/40 hover:text-[#420c14] hover:bg-[#420c14]/10 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <Button 
                    onClick={() => openChangePlanDialog(wedding)}
                    className="bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] rounded-xl px-5"
                  >
                    Change Plan
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : search.trim() ? (
        <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm py-16 text-center">
          <Search className="w-12 h-12 text-[#420c14]/20 mx-auto mb-4" />
          <p className="text-[#420c14]/60">No weddings found matching &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm py-16 text-center">
          <Heart className="w-12 h-12 text-[#420c14]/20 mx-auto mb-4" />
          <p className="text-[#420c14]/60">Start typing to search for weddings</p>
        </div>
      )}
      
      {/* Change Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-[#420c14]/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#420c14]">Change Wedding Plan</DialogTitle>
            <DialogDescription className="text-[#420c14]/60">
              {selectedWedding && (
                <>
                  Changing plan for <strong className="text-[#420c14]">{selectedWedding.partner1_name} & {selectedWedding.partner2_name}</strong>
                  <br />
                  <span className="font-mono text-xs bg-[#420c14]/5 px-2 py-0.5 rounded mt-1 inline-block">{selectedWedding.wedding_name_id}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[#420c14]/70 text-sm">Current Plan</Label>
              {selectedWedding && getPlanBadge(selectedWedding.plan || 'free')}
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#420c14]/70 text-sm">New Plan</Label>
              <Select value={newPlan} onValueChange={(v) => setNewPlan(v as PlanType)}>
                <SelectTrigger className="h-12 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#420c14]/10">
                  <SelectItem value="free" className="rounded-lg">Free</SelectItem>
                  <SelectItem value="premium" className="rounded-lg">Premium</SelectItem>
                  <SelectItem value="deluxe" className="rounded-lg">Deluxe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#420c14]/70 text-sm">Reason for Change *</Label>
              <Textarea
                placeholder="Why are you changing this plan?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/20 resize-none"
              />
              <p className="text-xs text-[#420c14]/40">
                This will be logged for audit purposes
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="rounded-xl border-[#420c14]/10 text-[#420c14] hover:bg-[#420c14]/5"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleChangePlan} 
              disabled={updating || !reason.trim() || newPlan === selectedWedding?.plan}
              className="rounded-xl bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Change Plan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

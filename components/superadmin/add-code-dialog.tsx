"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AddCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  couponId: string
  couponName: string
  onSuccess: () => void
}

export function AddCodeDialog({ open, onOpenChange, couponId, couponName, onSuccess }: AddCodeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState("")
  const [maxRedemptions, setMaxRedemptions] = useState("")
  const [expiresAt, setExpiresAt] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code) {
      toast.error("Please enter a promotion code")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/coupons/${couponId}/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          maxRedemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : null,
          expiresAt: expiresAt || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to create code")
        return
      }

      toast.success(`Code "${code.toUpperCase()}" added`)
      setCode("")
      setMaxRedemptions("")
      setExpiresAt("")
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error("Failed to create code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-[#420c14]/10">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif text-[#420c14]">
            Add Code to &ldquo;{couponName}&rdquo;
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sm text-[#420c14]/70">Promotion Code *</Label>
            <Input
              placeholder="e.g. FRIENDS50"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              className="border-[#420c14]/15 uppercase tracking-wider font-mono"
              maxLength={30}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#420c14]/70">Max Uses</Label>
            <Input
              type="number"
              placeholder="Unlimited"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              className="border-[#420c14]/15"
              min={1}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#420c14]/70">Expiration Date</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="border-[#420c14]/15"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#420c14]/15 text-[#420c14]/70"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#420c14] hover:bg-[#5a1a22] text-white"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Code
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

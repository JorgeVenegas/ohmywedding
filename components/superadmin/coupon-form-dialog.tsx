"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CouponFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CouponFormDialog({ open, onOpenChange, onSuccess }: CouponFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent")
  const [discountValue, setDiscountValue] = useState("")
  const [code, setCode] = useState("")
  const [maxRedemptions, setMaxRedemptions] = useState("")
  const [codeMaxRedemptions, setCodeMaxRedemptions] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [premiumApplies, setPremiumApplies] = useState(true)
  const [deluxeApplies, setDeluxeApplies] = useState(true)

  const resetForm = () => {
    setName("")
    setDiscountType("percent")
    setDiscountValue("")
    setCode("")
    setMaxRedemptions("")
    setCodeMaxRedemptions("")
    setExpiresAt("")
    setPremiumApplies(true)
    setDeluxeApplies(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !discountValue || !code) {
      toast.error("Please fill in all required fields")
      return
    }

    const plans = [
      ...(premiumApplies ? ["premium"] : []),
      ...(deluxeApplies ? ["deluxe"] : []),
    ]

    if (plans.length === 0) {
      toast.error("Select at least one plan")
      return
    }

    const numericValue = parseInt(discountValue, 10)
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error("Discount value must be a positive number")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/superadmin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          discountType,
          discountValue: numericValue,
          code: code.toUpperCase().trim(),
          maxRedemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : null,
          codeMaxRedemptions: codeMaxRedemptions ? parseInt(codeMaxRedemptions, 10) : null,
          expiresAt: expiresAt || null,
          appliesToPlans: plans,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to create coupon")
        return
      }

      toast.success("Coupon created successfully")
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error("Failed to create coupon")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border-[#420c14]/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif text-[#420c14]">Create Coupon</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#420c14]/70">Name *</Label>
            <Input
              placeholder="e.g. Launch Discount"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-[#420c14]/15 focus:ring-[#DDA46F]"
            />
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-[#420c14]/70">Discount Type *</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percent" | "fixed")}>
                <SelectTrigger className="border-[#420c14]/15">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (MXN)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-[#420c14]/70">
                {discountType === "percent" ? "Percentage *" : "Amount (centavos) *"}
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder={discountType === "percent" ? "20" : "100000"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="border-[#420c14]/15 pr-16"
                  min={1}
                  max={discountType === "percent" ? 100 : undefined}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#420c14]/40">
                  {discountType === "percent" ? "%" : "centavos"}
                </span>
              </div>
              {discountType === "fixed" && discountValue && (
                <p className="text-[10px] text-[#420c14]/40">
                  = ${(parseInt(discountValue, 10) / 100).toLocaleString()} MXN
                </p>
              )}
            </div>
          </div>

          {/* Promotion Code */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#420c14]/70">Promotion Code *</Label>
            <Input
              placeholder="e.g. WEDDING2026"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              className="border-[#420c14]/15 uppercase tracking-wider font-mono"
              maxLength={30}
            />
            <p className="text-[10px] text-[#420c14]/40">
              3-30 alphanumeric characters. This is what users will type.
            </p>
          </div>

          {/* Plans */}
          <div className="space-y-2">
            <Label className="text-sm text-[#420c14]/70">Applicable Plans</Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={premiumApplies} onCheckedChange={setPremiumApplies} />
                <span className="text-sm text-[#420c14]/80">Premium</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={deluxeApplies} onCheckedChange={setDeluxeApplies} />
                <span className="text-sm text-[#420c14]/80">Deluxe</span>
              </label>
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-[#420c14]/70">Coupon Max Uses</Label>
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
              <Label className="text-sm text-[#420c14]/70">Code Max Uses</Label>
              <Input
                type="number"
                placeholder="Unlimited"
                value={codeMaxRedemptions}
                onChange={(e) => setCodeMaxRedemptions(e.target.value)}
                className="border-[#420c14]/15"
                min={1}
              />
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#420c14]/70">Expiration Date</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="border-[#420c14]/15"
            />
          </div>

          {/* Submit */}
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
              Create Coupon
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

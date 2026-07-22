"use client"

import { useState, useId } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  Sparkles,
  Check,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WeddingDatePicker } from "@/components/ui/wedding-date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import {
  INVITATION_PRICING,
  MANAGEMENT_PRICING,
} from "@/lib/subscription-shared"
import {
  type QuoteScenario,
  type DiscountType,
  getScenarioPrices,
  computeDiscountedPrice,
  getScenarioFeatures,
  formatMXN,
} from "@/lib/quote-types"

// ─── Scenario row ────────────────────────────────────────────────────────────

interface ScenarioDraft {
  id: string
  label: string
  invitation_tier: string
  management_tier: string
}

const NONE = "none"

const INVITATION_OPTIONS = [
  { value: NONE, label: "None" },
  { value: "basic", label: `Basic — ${INVITATION_PRICING.basic.priceDisplayMXN}` },
  { value: "personalized", label: `Personalized — ${INVITATION_PRICING.personalized.priceDisplayMXN}` },
  { value: "bespoke", label: `Bespoke — ${INVITATION_PRICING.bespoke.priceDisplayMXN}` },
]
const MANAGEMENT_OPTIONS = [
  { value: NONE, label: "None" },
  { value: "basic", label: `Basic — ${MANAGEMENT_PRICING.basic.priceDisplayMXN}` },
  { value: "pro", label: `Pro — ${MANAGEMENT_PRICING.pro.priceDisplayMXN}` },
  { value: "agency", label: `Agency — ${MANAGEMENT_PRICING.agency.priceDisplayMXN}` },
]

function ScenarioCard({
  draft,
  index,
  discount,
  language,
  onUpdate,
  onRemove,
  canRemove,
}: {
  draft: ScenarioDraft
  index: number
  discount: { type: DiscountType; value: number }
  language: "es" | "en"
  onUpdate: (d: Partial<ScenarioDraft>) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const prices = getScenarioPrices(
    draft.invitation_tier !== NONE ? draft.invitation_tier : undefined,
    draft.management_tier !== NONE ? draft.management_tier : undefined
  )
  const discounted = computeDiscountedPrice(prices.total_price_cents, discount.type, discount.value)
  const hasAny = prices.total_price_cents > 0

  // Preview features
  const scenario: QuoteScenario = {
    label: draft.label,
    invitation_tier: draft.invitation_tier !== NONE ? (draft.invitation_tier as any) : undefined,
    management_tier: draft.management_tier !== NONE ? (draft.management_tier as any) : undefined,
    ...prices,
  }
  const { invitation, management } = getScenarioFeatures(scenario)

  return (
    <div className="border border-[#420c14]/10 rounded-2xl bg-white overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-[#420c14]/[0.02] border-b border-[#420c14]/10">
        <span className="w-6 h-6 rounded-full bg-[#420c14] text-white text-xs flex items-center justify-center font-medium flex-shrink-0">
          {index + 1}
        </span>
        <Input
          placeholder={language === "es" ? `Opción ${index + 1} — ej. "Paquete Estándar"` : `Option ${index + 1} — e.g. "Standard Package"`}
          value={draft.label}
          onChange={e => onUpdate({ label: e.target.value })}
          className="border-0 bg-transparent p-0 h-auto text-sm font-medium text-[#420c14] placeholder:text-[#420c14]/30 focus-visible:ring-0"
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="ml-auto text-[#420c14]/30 hover:text-red-500 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Tier selects */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-[#420c14]/50 uppercase tracking-wider">Invitation</Label>
            <Select
              value={draft.invitation_tier}
              onValueChange={v => onUpdate({ invitation_tier: v })}
            >
              <SelectTrigger className="border-[#420c14]/15 text-sm h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITATION_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#420c14]/50 uppercase tracking-wider">Management</Label>
            <Select
              value={draft.management_tier}
              onValueChange={v => onUpdate({ management_tier: v })}
            >
              <SelectTrigger className="border-[#420c14]/15 text-sm h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANAGEMENT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pricing summary */}
        {hasAny && (
          <div className="rounded-xl bg-[#420c14]/[0.03] p-3.5 space-y-1.5">
            {prices.invitation_price_cents > 0 && (
              <div className="flex justify-between text-xs text-[#420c14]/60">
                <span>Invitation {draft.invitation_tier}</span>
                <span>{formatMXN(prices.invitation_price_cents)}</span>
              </div>
            )}
            {prices.management_price_cents > 0 && (
              <div className="flex justify-between text-xs text-[#420c14]/60">
                <span>Management {draft.management_tier}</span>
                <span>{formatMXN(prices.management_price_cents)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1 border-t border-[#420c14]/10">
              <span className="text-xs font-medium text-[#420c14]">Total</span>
              <div className="text-right">
                {discount.value > 0 && (
                  <span className="text-xs text-[#420c14]/40 line-through mr-2">
                    {formatMXN(prices.total_price_cents)}
                  </span>
                )}
                <span className="text-sm font-bold text-[#DDA46F]">
                  {formatMXN(discounted)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Feature preview (collapsed) */}
        {(invitation.length > 0 || management.length > 0) && (
          <details className="group">
            <summary className="text-xs text-[#420c14]/50 cursor-pointer hover:text-[#420c14] flex items-center gap-1.5 list-none">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              Preview included features
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {invitation.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#DDA46F] mb-2">Invitation</p>
                  <ul className="space-y-1">
                    {invitation.filter(f => !f.startsWith('RSVP')).map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-[#420c14]/70">
                        <Check className="w-3 h-3 text-[#DDA46F] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {management.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#DDA46F] mb-2">Management</p>
                  <ul className="space-y-1">
                    {management.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-[#420c14]/70">
                        <Check className="w-3 h-3 text-[#DDA46F] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

let idCounter = 0
const uid = () => `s-${++idCounter}`

export default function NewQuotePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Recipient
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientWhatsapp, setRecipientWhatsapp] = useState("")
  const [notes, setNotes] = useState("")
  const [language, setLanguage] = useState<"es" | "en">("es")

  // Scenarios
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>([
    { id: uid(), label: "", invitation_tier: NONE, management_tier: NONE },
  ])

  // Discount
  const [discountType, setDiscountType] = useState<DiscountType>("percent")
  const [discountValue, setDiscountValue] = useState("")
  const [couponCode, setCouponCode] = useState("")
  const [couponExpiresAt, setCouponExpiresAt] = useState("")

  const discountRaw = parseInt(discountValue, 10) || 0
  const discount = {
    type: discountType,
    // Preview uses centavos; fixed discount input is in MXN so convert for the preview
    value: discountType === "fixed" ? discountRaw * 100 : discountRaw,
  }

  const addScenario = () => {
    if (scenarios.length >= 4) return
    setScenarios(prev => [
      ...prev,
      { id: uid(), label: "", invitation_tier: NONE, management_tier: NONE },
    ])
  }

  const updateScenario = (id: string, patch: Partial<ScenarioDraft>) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  const removeScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id))
  }

  // Auto-suggest coupon code from recipient name
  const suggestCode = () => {
    if (!recipientName.trim()) return
    const base = recipientName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)
    const year = new Date().getFullYear().toString().slice(-2)
    setCouponCode(`${base}${year}`)
  }

  const validate = (): string | null => {
    if (!recipientName.trim()) return "Recipient name is required"
    const validScenarios = scenarios.filter(
      s => s.invitation_tier !== NONE || s.management_tier !== NONE
    )
    if (validScenarios.length === 0) return "At least one scenario must have a tier selected"
    if (!discountValue || parseInt(discountValue, 10) <= 0) return "Discount value is required"
    if (discountType === "percent" && parseInt(discountValue, 10) > 100)
      return "Percentage cannot exceed 100"
    if (!couponCode.trim()) return "Coupon code is required"
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { toast.error(err); return }

    const validScenarios: QuoteScenario[] = scenarios
      .filter(s => s.invitation_tier !== NONE || s.management_tier !== NONE)
      .map((s, idx) => {
        const prices = getScenarioPrices(
          s.invitation_tier !== NONE ? s.invitation_tier : undefined,
          s.management_tier !== NONE ? s.management_tier : undefined
        )
        return {
          label: s.label.trim() || (language === "es" ? `Opción ${idx + 1}` : `Option ${idx + 1}`),
          invitation_tier: s.invitation_tier !== NONE ? (s.invitation_tier as any) : undefined,
          management_tier: s.management_tier !== NONE ? (s.management_tier as any) : undefined,
          ...prices,
        }
      })

    setLoading(true)
    try {
      const res = await fetch("/api/superadmin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim() || undefined,
          recipientWhatsapp: recipientWhatsapp.trim() || undefined,
          notes: notes.trim() || undefined,
          scenarios: validScenarios,
          discountType,
          discountValue: discountType === "fixed"
            ? parseInt(discountValue, 10) * 100  // user enters MXN, we store centavos
            : parseInt(discountValue, 10),
          couponCode: couponCode.trim(),
          couponExpiresAt: couponExpiresAt || undefined,
          language,
        }),
      })

      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Failed to create quote"); return }

      toast.success(`Quote ${data.quote.quote_number} created`)
      router.push(`/superadmin/quotes/${data.quote.id}`)
    } catch {
      toast.error("Failed to create quote")
    } finally {
      setLoading(false)
    }
  }

  const totalValid = scenarios.filter(
    s => s.invitation_tier !== NONE || s.management_tier !== NONE
  ).length

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <Link
          href="/superadmin/quotes"
          className="inline-flex items-center gap-1.5 text-sm text-[#420c14]/50 hover:text-[#420c14] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quotes
        </Link>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-1">New Quote</p>
        <h1 className="text-4xl font-serif text-[#420c14]">Build a Quote</h1>
        <p className="text-[#420c14]/60 mt-1.5">
          Create a custom price quote with a one-time discount code for a specific client.
        </p>
      </div>

      {/* Recipient */}
      <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#420c14]/10">
          <h2 className="font-medium text-[#420c14] text-sm uppercase tracking-wider">Recipient</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-[#420c14]/70">Full Name *</Label>
              <Input
                placeholder="María García"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                onBlur={suggestCode}
                className="border-[#420c14]/15"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-[#420c14]/70">Email</Label>
              <Input
                type="email"
                placeholder="maria@example.com"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="border-[#420c14]/15"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-[#420c14]/70">WhatsApp</Label>
            <Input
              type="tel"
              placeholder="+52 55 1234 5678"
              value={recipientWhatsapp}
              onChange={e => setRecipientWhatsapp(e.target.value)}
              className="border-[#420c14]/15"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-[#420c14]/70">Quote Language</Label>
            <div className="flex gap-2">
              {(["es", "en"] as const).map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    language === lang
                      ? "border-[#420c14] bg-[#420c14] text-white"
                      : "border-[#420c14]/15 text-[#420c14]/60 hover:border-[#420c14]/30"
                  }`}
                >
                  <span>{lang === "es" ? "🇲🇽" : "🇺🇸"}</span>
                  {lang === "es" ? "Español" : "English"}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#420c14]/40">The public quote page will be shown in this language.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-[#420c14]/70">Internal Notes</Label>
            <Textarea
              placeholder="e.g. Referred by wedding planner, looking for November 2027…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="border-[#420c14]/15 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium text-[#420c14]">Pricing Scenarios</h2>
            <p className="text-xs text-[#420c14]/50 mt-0.5">
              Add up to 4 package combinations to show the client their options.
            </p>
          </div>
          {scenarios.length < 4 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addScenario}
              className="border-[#420c14]/20 text-[#420c14]/70 hover:bg-[#420c14]/5"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Scenario
            </Button>
          )}
        </div>

        {scenarios.map((s, i) => (
          <ScenarioCard
            key={s.id}
            draft={s}
            index={i}
            discount={discount}
            language={language}
            onUpdate={patch => updateScenario(s.id, patch)}
            onRemove={() => removeScenario(s.id)}
            canRemove={scenarios.length > 1}
          />
        ))}

        {totalValid === 0 && (
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Select at least one tier in a scenario to generate pricing.
          </div>
        )}
      </div>

      {/* Discount & Code */}
      <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#420c14]/10">
          <h2 className="font-medium text-[#420c14] text-sm uppercase tracking-wider">Discount & Coupon Code</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-[#420c14]/70">Discount Type *</Label>
              <Select value={discountType} onValueChange={v => setDiscountType(v as DiscountType)}>
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
                {discountType === "percent" ? "Percentage *" : "Amount (MXN) *"}
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder={discountType === "percent" ? "20" : "1000"}
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  className="border-[#420c14]/15 pr-12"
                  min={1}
                  max={discountType === "percent" ? 100 : undefined}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#420c14]/40">
                  {discountType === "percent" ? "%" : "MXN"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#420c14]/70">Coupon Code *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="MARIA26"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                className="border-[#420c14]/15 uppercase tracking-widest font-mono"
                maxLength={30}
              />
              <Button
                type="button"
                variant="outline"
                onClick={suggestCode}
                className="border-[#420c14]/20 text-[#420c14]/60 hover:bg-[#420c14]/5 text-xs px-3 whitespace-nowrap"
              >
                Auto-suggest
              </Button>
            </div>
            <p className="text-[10px] text-[#420c14]/40">
              3–30 alphanumeric characters. Single-use code exclusive to this quote.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-[#420c14]/70">Code Expiry Date</Label>
            <WeddingDatePicker
              value={couponExpiresAt}
              onChange={setCouponExpiresAt}
              placeholder="No expiry"
              locale="en"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pb-8">
        <Link href="/superadmin/quotes">
          <Button variant="outline" className="border-[#420c14]/15 text-[#420c14]/60">
            Cancel
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#420c14] hover:bg-[#5a1a22] text-white px-8"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Quote
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Heart, Calendar, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import {
  MANAGEMENT_CARDS,
  MANAGEMENT_PRICING,
  formatMXNFromCents,
  type ManagementTier,
} from "@/lib/subscription-shared"

// ─── Falling petals ────────────────────────────────────────────────────────────

function Petals() {
  const petals = [
    { left: "8%",  delay: "0s",   dur: "6s",  size: 8,  rot: 45 },
    { left: "18%", delay: "1.2s", dur: "7.5s", size: 5, rot: 120 },
    { left: "29%", delay: "0.4s", dur: "5.8s", size: 10, rot: 20 },
    { left: "42%", delay: "2.1s", dur: "8s",  size: 6,  rot: 80 },
    { left: "55%", delay: "0.8s", dur: "6.5s", size: 9, rot: 200 },
    { left: "66%", delay: "3s",   dur: "7s",  size: 5,  rot: 30 },
    { left: "77%", delay: "1.6s", dur: "9s",  size: 7,  rot: 150 },
    { left: "88%", delay: "0.2s", dur: "6.2s", size: 6, rot: 60 },
    { left: "13%", delay: "4s",   dur: "7.8s", size: 4, rot: 90 },
    { left: "93%", delay: "2.8s", dur: "5.5s", size: 8, rot: 180 },
  ]
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <style>{`
        @keyframes petalDrift {
          0%   { transform: translateY(-30px) rotate(0deg) translateX(0px); opacity: 0; }
          8%   { opacity: 0.7; }
          85%  { opacity: 0.4; }
          100% { transform: translateY(110vh) rotate(var(--rot)) translateX(40px); opacity: 0; }
        }
      `}</style>
      {petals.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: i % 3 === 0 ? "50% 0 50% 0" : "50%",
            background: i % 2 === 0 ? "#DDA46F" : "#420c14",
            opacity: 0,
            "--rot": `${p.rot}deg`,
            animation: `petalDrift ${p.dur} ${p.delay} infinite ease-in`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ─── Editorial input ────────────────────────────────────────────────────────────

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
}) {
  return (
    <div className="relative pt-5">
      <label className="absolute top-0 left-0 text-[9px] uppercase tracking-[0.25em] text-[#DDA46F] font-medium">
        {label}{required && " *"}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        style={{ colorScheme: "light" }}
        className="w-full bg-transparent border-0 border-b border-[#420c14]/20 pb-2.5 text-[#420c14] placeholder-[#420c14]/25 focus:outline-none focus:border-[#420c14] transition-colors text-base"
      />
    </div>
  )
}

// ─── Main content ───────────────────────────────────────────────────────────────

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")
  const paymentIntentClientSecret = searchParams.get("payment_intent_client_secret")
  const redirectStatus = searchParams.get("redirect_status")

  const [paymentStatus, setPaymentStatus] = useState<"loading" | "success" | "error">("loading")
  const [existingWedding, setExistingWedding] = useState<{ id: string; wedding_name_id: string } | null | undefined>(undefined)
  const [pendingBundle, setPendingBundle] = useState<ManagementTier | null>(null)
  const [bundleLoading, setBundleLoading] = useState(false)
  const [bundleError, setBundleError] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    p1First: "",
    p1Last: "",
    p2First: "",
    p2Last: "",
    date: "",
    hasDate: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  // Fulfill: verify payment + activate subscription synchronously.
  // Falls back to wedding list if the endpoint fails.
  useEffect(() => {
    async function checkWeddingList() {
      try {
        const r = await fetch("/api/weddings")
        const data = await r.json()
        const list = data.weddings || []
        setExistingWedding(list.length > 0 ? list[0] : null)
      } catch {
        setExistingWedding(null)
      }
    }

    async function fulfill() {
      // Handle payment intent redirect flow (e.g. bank redirect)
      if (paymentIntentClientSecret) {
        setPaymentStatus(redirectStatus === "failed" || redirectStatus === "canceled" ? "error" : "success")
        await checkWeddingList()
        return
      }

      if (!sessionId) { setPaymentStatus("error"); return }

      try {
        const res = await fetch("/api/subscriptions/fulfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
        const data = await res.json()

        setPaymentStatus("success")

        if (res.ok && data.weddingNameId) {
          // Fulfill returned the specific wedding that was activated
          setExistingWedding({ id: "", wedding_name_id: data.weddingNameId })
        } else {
          // No orders found or no wedding linked — fall back to listing weddings
          await checkWeddingList()
        }
      } catch {
        setPaymentStatus("success")
        await checkWeddingList()
      }
    }

    fulfill()
  }, [sessionId, paymentIntentClientSecret, redirectStatus])

  // Read pending bundle from sessionStorage once payment is confirmed
  useEffect(() => {
    if (paymentStatus !== "success") return
    try {
      const raw = sessionStorage.getItem("omw_pending_bundle")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.axis === "management" && parsed?.tier in MANAGEMENT_CARDS) {
          setPendingBundle(parsed.tier as ManagementTier)
        }
      }
    } catch {}
  }, [paymentStatus])

  // Entrance animation
  useEffect(() => {
    if (paymentStatus === "success" && existingWedding !== undefined) {
      setTimeout(() => setVisible(true), 80)
    }
  }, [paymentStatus, existingWedding])

  const handleAddManagement = async () => {
    if (!pendingBundle || !existingWedding) return
    setBundleLoading(true)
    setBundleError(null)
    try {
      const res = await fetch(`/api/weddings/${existingWedding.id}/subscription/checkout-tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          axis: "management",
          tier: pendingBundle,
          paymentMethod: "card",
          source: "bundle_upsell",
          bundleDiscount: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Checkout failed")
      if (data.url) {
        sessionStorage.removeItem("omw_pending_bundle")
        window.location.href = data.url
      }
    } catch (err) {
      setBundleError(err instanceof Error ? err.message : "Something went wrong")
      setBundleLoading(false)
    }
  }

  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.p1First.trim() || !form.p2First.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner1FirstName: form.p1First.trim(),
          partner1LastName: form.p1Last.trim() || undefined,
          partner2FirstName: form.p2First.trim(),
          partner2LastName: form.p2Last.trim() || undefined,
          weddingDate: form.hasDate && form.date ? form.date : undefined,
          redirectOrigin: window.location.origin,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create wedding")

      if (pendingBundle) {
        // Go through bundle checkout with the new wedding
        sessionStorage.removeItem("omw_pending_bundle")
        const bundleRes = await fetch(`/api/weddings/${data.weddingId}/subscription/checkout-tier`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            axis: "management",
            tier: pendingBundle,
            paymentMethod: "card",
            source: "bundle_upsell",
            bundleDiscount: true,
          }),
        })
        const bundleData = await bundleRes.json()
        if (bundleData.url) { window.location.href = bundleData.url; return }
      }

      router.push(`/admin/${data.weddingNameId}/dashboard`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  const isFormValid = form.p1First.trim() && form.p2First.trim()

  // ── Error ────────────────────────────────────────────────────────────────────
  if (paymentStatus === "error") {
    return (
      <div className="min-h-screen bg-[#f5f2eb] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-2xl font-serif text-[#420c14]">Something went wrong</h1>
          <p className="text-[#420c14]/55 text-sm leading-relaxed">
            We couldn't verify your payment. If you were charged, please contact us.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/upgrade" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-[#420c14]/20 text-sm text-[#420c14]/70 hover:bg-[#420c14]/5 transition-colors">
              Try again
            </Link>
            <a href="mailto:hola@ohmywedding.mx" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#420c14] text-[#f5f2eb] text-sm hover:bg-[#5a1a22] transition-colors">
              Contact us
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading (payment verifying or wedding check pending) ─────────────────────
  if (paymentStatus === "loading" || existingWedding === undefined) {
    return (
      <div className="min-h-screen bg-[#f5f2eb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
          <p className="text-sm text-[#420c14]/50 tracking-wide">Confirmando tu pago…</p>
        </div>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f2eb] relative">
      <Petals />

      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .visible .reveal { opacity: 1; transform: translateY(0); }
        .d1 { transition-delay: 0.05s; }
        .d2 { transition-delay: 0.15s; }
        .d3 { transition-delay: 0.25s; }
        .d4 { transition-delay: 0.35s; }
        .d5 { transition-delay: 0.45s; }
        .d6 { transition-delay: 0.55s; }
        .d7 { transition-delay: 0.65s; }

        .wedding-input::placeholder { color: rgba(66,12,20,0.22); }
        .wedding-input:focus { border-color: #420c14; }

        @keyframes ring {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        .ring-sway { animation: ring 3s ease-in-out infinite; transform-origin: top center; }
      `}</style>

      <div className={`relative z-10 ${visible ? "visible" : ""}`}>
        {/* Top nav — logo only */}
        <header className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto">
          <Link href="/">
            <Image
              src="/images/logos/OMW Logo Gold.png"
              alt="OhMyWedding"
              width={140}
              height={40}
              className="h-8 w-auto object-contain object-left"
            />
          </Link>
          <div className="reveal d1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#420c14]/8 border border-[#420c14]/12">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#DDA46F]" />
            <span className="text-[11px] font-medium text-[#420c14]/70 tracking-wide">Pago confirmado</span>
          </div>
        </header>

        <main className="max-w-md mx-auto px-6 pb-20">

          {/* Hero */}
          <div className="pt-8 pb-12 text-center space-y-3">
            <div className="reveal d1 flex justify-center mb-4">
              <span className="ring-sway text-5xl select-none" role="img" aria-label="rings">💍</span>
            </div>
            <p className="reveal d2 text-[10px] uppercase tracking-[0.35em] text-[#DDA46F]">
              Bienvenidos a OhMyWedding
            </p>
            <h1 className="reveal d2 font-serif text-4xl sm:text-5xl text-[#420c14] leading-[1.1]">
              {existingWedding
                ? "¡Todo listo!"
                : "Tu boda está\na punto de nacer."}
            </h1>
            <p className="reveal d3 text-[#420c14]/50 text-base leading-relaxed max-w-xs mx-auto">
              {existingWedding
                ? "Tu plan está activo. Entra a tu panel y empieza a planear."
                : "Cuéntanos quiénes son la pareja para crear tu espacio."}
            </p>
          </div>

          {/* ── Existing wedding: go to dashboard ── */}
          {existingWedding ? (
            <div className="space-y-4">
              <div className="reveal d4">
                <Link
                  href={`/admin/${existingWedding.wedding_name_id}/dashboard`}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#420c14] text-[#f5f2eb] text-sm font-medium hover:bg-[#5a1a22] transition-colors shadow-lg shadow-[#420c14]/20"
                >
                  Ir a mi boda
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Bundle offer */}
              {pendingBundle && (
                <div className="reveal d5 rounded-2xl bg-[#420c14] text-[#f5f2eb] p-6 space-y-4">
                  <p className="text-[10px] uppercase tracking-widest text-[#DDA46F]">Completa tu paquete</p>
                  <h3 className="font-serif text-xl leading-snug">
                    Agrega {MANAGEMENT_CARDS[pendingBundle].name} Management
                  </h3>
                  <p className="text-[#f5f2eb]/60 text-sm leading-relaxed">{MANAGEMENT_CARDS[pendingBundle].description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-serif">
                      {formatMXNFromCents(Math.round(MANAGEMENT_PRICING[pendingBundle].price_mxn / 2))}
                    </span>
                    <span className="text-sm line-through text-[#f5f2eb]/35">
                      {MANAGEMENT_PRICING[pendingBundle].priceDisplayMXN}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#DDA46F] text-[#420c14] font-bold">50% OFF</span>
                  </div>
                  {bundleError && <p className="text-red-300 text-sm">{bundleError}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddManagement}
                      disabled={bundleLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] text-sm font-medium transition-colors disabled:opacity-60"
                    >
                      {bundleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Agregar con 50% off
                    </button>
                    <button
                      onClick={() => { try { sessionStorage.removeItem("omw_pending_bundle") } catch {} setPendingBundle(null) }}
                      className="px-4 py-3 rounded-xl text-[#f5f2eb]/50 hover:text-[#f5f2eb] text-sm transition-colors"
                    >
                      No gracias
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── No wedding: create it here ── */
            <form onSubmit={handleCreateWedding} className="space-y-10">
              {/* Ornamental divider */}
              <div className="reveal d3 flex items-center gap-4">
                <div className="flex-1 border-t border-[#420c14]/12" />
                <Heart className="w-3.5 h-3.5 text-[#DDA46F] fill-[#DDA46F]" />
                <div className="flex-1 border-t border-[#420c14]/12" />
              </div>

              {/* Partner 1 */}
              <div className="reveal d4 space-y-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#420c14]/35">Primera persona</p>
                <div className="grid grid-cols-2 gap-6">
                  <Field
                    label="Nombre *"
                    value={form.p1First}
                    onChange={v => setForm(f => ({ ...f, p1First: v }))}
                    placeholder="Emma"
                    required
                    autoFocus
                  />
                  <Field
                    label="Apellido"
                    value={form.p1Last}
                    onChange={v => setForm(f => ({ ...f, p1Last: v }))}
                    placeholder="García"
                  />
                </div>
              </div>

              {/* Heart divider */}
              <div className="reveal d4 flex items-center gap-4">
                <div className="flex-1 border-t border-[#420c14]/10" />
                <div className="flex items-center gap-1.5 text-[#DDA46F]">
                  <span className="text-xs font-serif italic text-[#420c14]/30">&</span>
                </div>
                <div className="flex-1 border-t border-[#420c14]/10" />
              </div>

              {/* Partner 2 */}
              <div className="reveal d5 space-y-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#420c14]/35">Segunda persona</p>
                <div className="grid grid-cols-2 gap-6">
                  <Field
                    label="Nombre *"
                    value={form.p2First}
                    onChange={v => setForm(f => ({ ...f, p2First: v }))}
                    placeholder="James"
                    required
                  />
                  <Field
                    label="Apellido"
                    value={form.p2Last}
                    onChange={v => setForm(f => ({ ...f, p2Last: v }))}
                    placeholder="López"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="reveal d5 space-y-4">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, hasDate: !f.hasDate }))}
                  className="flex items-center gap-2.5 text-sm text-[#420c14]/60 hover:text-[#420c14] transition-colors"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${form.hasDate ? "bg-[#420c14] border-[#420c14]" : "border-[#420c14]/30"}`}>
                    {form.hasDate && <CheckCircle2 className="w-3 h-3 text-[#f5f2eb]" />}
                  </div>
                  <Calendar className="w-3.5 h-3.5" />
                  Ya tenemos fecha de boda
                </button>
                {form.hasDate && (
                  <Field
                    label="Fecha de boda"
                    type="date"
                    value={form.date}
                    onChange={v => setForm(f => ({ ...f, date: v }))}
                  />
                )}
              </div>

              {submitError && (
                <p className="reveal d5 text-red-600 text-sm">{submitError}</p>
              )}

              {/* Submit */}
              <div className="reveal d6 pt-2">
                <button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  className="relative w-full py-4 rounded-2xl bg-[#420c14] text-[#f5f2eb] text-sm font-medium hover:bg-[#5a1a22] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#420c14]/20 overflow-hidden group"
                >
                  <span className={`flex items-center justify-center gap-2 transition-opacity ${submitting ? "opacity-0" : "opacity-100"}`}>
                    <Heart className="w-4 h-4 fill-[#DDA46F] text-[#DDA46F]" />
                    Crear mi boda
                    <ArrowRight className="w-4 h-4" />
                  </span>
                  {submitting && (
                    <span className="absolute inset-0 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando tu boda…
                    </span>
                  )}
                  {/* Shine sweep on hover */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </button>
              </div>

              {/* Fine print */}
              <p className="reveal d7 text-center text-[11px] text-[#420c14]/30 leading-relaxed">
                Podrás cambiar estos datos en cualquier momento desde tu panel.
              </p>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f2eb] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}

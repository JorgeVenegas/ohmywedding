"use client"

import { useState, useRef, useCallback } from "react"
import { flushSync } from "react-dom"

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
  } else {
    const el = document.createElement("textarea")
    el.value = text
    el.style.cssText = "position:fixed;top:-9999px"
    document.body.appendChild(el)
    el.select()
    document.execCommand("copy")
    document.body.removeChild(el)
  }
}
import Image from "next/image"
import { format } from "date-fns"
import { es as esLocale } from "date-fns/locale"
import { Check, Copy, CheckCircle2, FileDown, Loader2, ChevronDown } from "lucide-react"
import type { Quote, QuoteScenario } from "@/lib/quote-types"
import {
  computeDiscountedPrice,
  getScenarioFeaturesLocalized,
  formatMXN,
} from "@/lib/quote-types"
import { INVITATION_PRICING, MANAGEMENT_PRICING } from "@/lib/subscription-shared"
import { captureAndAssemblePDF, downloadBlob } from "@/components/summary-pdf/pdf-capture"
import { createClient } from "@/lib/supabase-client"
import { AuthCheckoutDialog } from "./auth-checkout-dialog"

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  en: {
    tagline: "Your Custom Quote",
    greeting: (name: string) => `Hello, ${name}`,
    intro: (d: string) => d,
    paidTitle: "Thank you for choosing OhMyWedding",
    paidBody: "Your purchase has been processed. Check your email for next steps.",
    expiredTitle: "This quote has expired",
    expiredBody: "This quote is no longer valid. Please contact us for a new one.",
    quoteLabel: "Quote",
    validUntil: "Valid until",
    discountLabel: "Discount",
    recommended: "Recommended",
    invitation: "Invitation",
    management: "Management",
    showFeatures: "Show what's included",
    hideFeatures: "Hide",
    choosePackage: "Choose this package",
    processing: "Processing…",
    discountCodeTagline: "Your Exclusive Discount Code",
    discountCodeHeadline: (d: string) => `Save ${d} at checkout`,
    discountCodeBody:
      'Click "Choose this package" on any option above — your discount is applied automatically, no code entry needed.',
    promoCodeLabel: "Promo Code",
    copyCode: "Copy code",
    copied: "Copied!",
    howToRedeem: "How to redeem",
    step1Title: "Choose a package",
    step1Body: "Click the button on the option that suits your wedding best.",
    step2Title: "Sign in or create account",
    step2Body: "Log in or create your account to access the wedding dashboard.",
    step3Title: "Your discount is applied",
    step3Body: (d: string) => `The ${d} discount is applied automatically — you're good to go.`,
    off: "off",
    contactUs: "Questions? Email us at",
    copyright: (y: number) => `© ${y} OhMyWedding. All rights reserved.`,
    savePdf: "Save as PDF",
    noWedding: "Please create your wedding first, then come back to complete your purchase.",
    couponUsedTitle: "This discount code has already been redeemed",
    couponUsedBody: "This quote's promo code was already used. Please contact your OhMyWedding advisor for a new quote.",
    selectWeddingTitle: "Apply to which wedding?",
    selectWeddingBody: "Choose the wedding this package should be applied to.",
    continueBtn: "Continue to checkout",
    cancelBtn: "Cancel",
    generatingPdf: "Generating PDF…",
    exclusiveDiscount: "Exclusive discount",
    customQuote: "Custom Quote",
    validUntilPdf: "Valid until",
    discountCode: "Discount Code",
    useAtCheckout: "Applies automatically at checkout",
    footerContact: "",
  },
  es: {
    tagline: "Tu Cotización Personalizada",
    greeting: (name: string) => `Hola, ${name}`,
    intro: (d: string) => d,
    paidTitle: "Gracias por elegir OhMyWedding",
    paidBody: "Tu compra ha sido procesada. Revisa tu correo para los próximos pasos.",
    expiredTitle: "Esta cotización ha vencido",
    expiredBody: "Esta cotización ya no es válida. Por favor contáctanos para obtener una nueva.",
    quoteLabel: "Cotización",
    validUntil: "Válida hasta",
    discountLabel: "Descuento",
    recommended: "Recomendado",
    invitation: "Invitación",
    management: "Gestión",
    showFeatures: "Ver qué incluye",
    hideFeatures: "Ocultar",
    choosePackage: "Elegir este paquete",
    processing: "Procesando…",
    discountCodeTagline: "Tu Código de Descuento Exclusivo",
    discountCodeHeadline: (d: string) => `Ahorra ${d} en el pago`,
    discountCodeBody:
      'Haz clic en "Elegir este paquete" — tu descuento se aplica automáticamente, sin necesidad de ingresar ningún código.',
    promoCodeLabel: "Código Promo",
    copyCode: "Copiar código",
    copied: "¡Copiado!",
    howToRedeem: "Cómo canjear",
    step1Title: "Elige un paquete",
    step1Body: "Haz clic en el botón de la opción que mejor se adapte a tu boda.",
    step2Title: "Inicia sesión o crea una cuenta",
    step2Body: "Accede o crea tu cuenta para gestionar tu boda.",
    step3Title: "Tu descuento se aplica",
    step3Body: (d: string) => `El descuento de ${d} se aplica automáticamente — ya estás listo.`,
    off: "de descuento",
    contactUs: "¿Preguntas? Escríbenos a",
    copyright: (y: number) => `© ${y} OhMyWedding. Todos los derechos reservados.`,
    savePdf: "Guardar como PDF",
    noWedding: "Por favor crea tu boda primero y luego regresa para completar tu compra.",
    couponUsedTitle: "Este código de descuento ya fue canjeado",
    couponUsedBody: "El código de esta cotización ya fue utilizado. Por favor contacta a tu asesor de OhMyWedding para obtener una nueva cotización.",
    selectWeddingTitle: "¿A cuál boda aplicar?",
    selectWeddingBody: "Elige a cuál de tus bodas quieres aplicar este paquete.",
    continueBtn: "Continuar al pago",
    cancelBtn: "Cancelar",
    generatingPdf: "Generando PDF…",
    exclusiveDiscount: "Descuento exclusivo",
    customQuote: "Cotización Personalizada",
    validUntilPdf: "Válida hasta",
    discountCode: "Código de Descuento",
    useAtCheckout: "Se aplica automáticamente al pagar",
    footerContact: "",
  },
}

function formatDate(dateStr: string, lang: "en" | "es"): string {
  const d = new Date(dateStr)
  if (lang === "es") {
    return format(d, "d 'de' MMMM 'de' yyyy", { locale: esLocale })
  }
  return format(d, "MMMM d, yyyy")
}

function localizeLabel(label: string, lang: "en" | "es"): string {
  if (lang === "es") {
    return label.replace(/^Option (\d+)$/, "Opción $1")
  }
  return label
}

// ─── PDF Page — A4 branded layout ─────────────────────────────────────────────

const PAGE_W = 794
const PAGE_H = 1123

function QuotePDFPage({
  quote,
  lang,
  t,
  discountLabel,
}: {
  quote: Quote
  lang: "en" | "es"
  t: typeof T["en"]
  discountLabel: string
}) {
  const cols = Math.min(quote.scenarios.length, 3)

  return (
    <div
      data-pdf-page
      style={{
        width: PAGE_W,
        height: PAGE_H,
        backgroundColor: "#f5f2eb",
        fontFamily: "Georgia, 'Times New Roman', serif",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ── Header band ── */}
      <div style={{
        backgroundColor: "#420c14",
        height: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 44px",
        flexShrink: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/OMW%20Logo%20Gold.png"
          alt="OhMyWedding"
          style={{ height: 30, width: "auto" }}
        />
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#DDA46F", fontSize: 8, letterSpacing: 3, textTransform: "uppercase", marginBottom: 3 }}>
            {t.customQuote}
          </div>
          <div style={{ color: "rgba(245,242,235,0.45)", fontSize: 9 }}>
            {quote.quote_number}
          </div>
        </div>
      </div>

      {/* ── Gold stripe ── */}
      <div style={{ height: 3, background: "linear-gradient(to right, #DDA46F, #c99560, #DDA46F)" }} />

      {/* ── Body ── */}
      <div style={{ padding: "30px 44px 24px", height: PAGE_H - 75 - 52, overflow: "hidden", boxSizing: "border-box" }}>

        {/* Greeting row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: 3, textTransform: "uppercase", color: "#DDA46F", marginBottom: 6 }}>
              {t.tagline}
            </div>
            <div style={{ fontSize: 26, color: "#420c14", fontWeight: 400, marginBottom: 3 }}>
              {lang === "es" ? `Hola, ${quote.recipient_name.split(" ")[0]}` : `Hello, ${quote.recipient_name.split(" ")[0]}`}
            </div>
            <div style={{ fontSize: 10, color: "rgba(66,12,20,0.45)" }}>
              {quote.recipient_name}
              {quote.coupon_expires_at && (
                <> &nbsp;·&nbsp; {t.validUntilPdf}: {formatDate(quote.coupon_expires_at, lang)}</>
              )}
            </div>
          </div>

          {/* Discount badge */}
          <div style={{
            backgroundColor: "#420c14",
            borderRadius: 24,
            padding: "8px 18px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 7, color: "#DDA46F", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>
              {t.exclusiveDiscount}
            </div>
            <div style={{ fontSize: 16, color: "#DDA46F", fontWeight: 700, letterSpacing: 1 }}>
              {discountLabel} {t.off}
            </div>
          </div>
        </div>

        {/* ── Scenario cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 10,
          marginBottom: 18,
        }}>
          {quote.scenarios.map((scenario, i) => {
            const discounted = computeDiscountedPrice(scenario.total_price_cents, quote.discount_type, quote.discount_value)
            const savings = scenario.total_price_cents - discounted
            const { invitation, management } = getScenarioFeaturesLocalized(scenario, lang)
            const maxPerSection = cols === 1 ? 6 : cols === 2 ? 5 : 4
            const invFeatures = invitation.slice(0, maxPerSection)
            const mgmtFeatures = management.slice(0, maxPerSection)
            const invName = scenario.invitation_tier ? INVITATION_PRICING[scenario.invitation_tier].name : null
            const mgmtName = scenario.management_tier ? MANAGEMENT_PRICING[scenario.management_tier].name : null

            const isDark = i === 0
            const bg = isDark ? "#420c14" : "#ffffff"
            const textMain = isDark ? "#f5f2eb" : "#420c14"
            const textMuted = isDark ? "rgba(245,242,235,0.45)" : "rgba(66,12,20,0.4)"
            const textFeature = isDark ? "rgba(245,242,235,0.72)" : "rgba(66,12,20,0.68)"

            return (
              <div key={i} style={{
                backgroundColor: bg,
                borderRadius: 14,
                padding: "16px 16px 14px",
                border: isDark ? "none" : "1px solid rgba(66,12,20,0.1)",
                boxSizing: "border-box",
              }}>
                {/* Recommended badge */}
                {i === 0 && (
                  <div style={{
                    display: "inline-block",
                    fontSize: 7,
                    color: "#DDA46F",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 5,
                  }}>
                    {t.recommended}
                  </div>
                )}

                {/* Scenario name */}
                <div style={{ fontSize: 16, color: textMain, marginBottom: 2 }}>
                  {localizeLabel(scenario.label, lang)}
                </div>

                {/* Tier tags */}
                <div style={{ fontSize: 9, color: textMuted, marginBottom: 10 }}>
                  {[invName && `${t.invitation} ${invName}`, mgmtName && `${t.management} ${mgmtName}`].filter(Boolean).join(" · ")}
                </div>

                {/* Price */}
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 20, color: textMain, fontWeight: 400 }}>
                    {formatMXN(discounted)}
                  </span>
                  {savings > 0 && (
                    <span style={{ fontSize: 10, color: textMuted, textDecoration: "line-through", marginLeft: 8 }}>
                      {formatMXN(scenario.total_price_cents)}
                    </span>
                  )}
                </div>

                {/* Thin separator */}
                <div style={{ height: 1, backgroundColor: isDark ? "rgba(221,164,111,0.2)" : "rgba(66,12,20,0.08)", marginBottom: 10 }} />

                {/* Features — invitation and management as separate labeled sections */}
                <div>
                  {invFeatures.length > 0 && (
                    <div style={{ marginBottom: mgmtFeatures.length > 0 ? 8 : 0 }}>
                      {mgmtFeatures.length > 0 && (
                        <div style={{ fontSize: 7, color: "#DDA46F", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>
                          {lang === "es" ? "Invitación" : "Invitation"}
                        </div>
                      )}
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {invFeatures.map((f, fi) => (
                          <li key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
                            <span style={{ color: "#DDA46F", fontSize: 9, lineHeight: "14px", flexShrink: 0, marginTop: 1 }}>✓</span>
                            <span style={{ fontSize: 9, color: textFeature, lineHeight: "14px" }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {mgmtFeatures.length > 0 && (
                    <div>
                      {invFeatures.length > 0 && (
                        <div style={{ fontSize: 7, color: "#DDA46F", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5, marginTop: 2 }}>
                          {lang === "es" ? "Gestión" : "Management"}
                        </div>
                      )}
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {mgmtFeatures.map((f, fi) => (
                          <li key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
                            <span style={{ color: "#DDA46F", fontSize: 9, lineHeight: "14px", flexShrink: 0, marginTop: 1 }}>✓</span>
                            <span style={{ fontSize: 9, color: textFeature, lineHeight: "14px" }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Coupon code ── */}
        {quote.coupon_code && (
          <div style={{
            backgroundColor: "#420c14",
            borderRadius: 14,
            padding: "14px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}>
            <div>
              <div style={{ fontSize: 7, color: "#DDA46F", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>
                {t.discountCode}
              </div>
              <div style={{ fontSize: 10, color: "rgba(245,242,235,0.55)" }}>
                {t.useAtCheckout}
              </div>
            </div>
            <div style={{
              border: "1.5px dashed rgba(221,164,111,0.45)",
              borderRadius: 10,
              padding: "9px 20px",
              backgroundColor: "rgba(221,164,111,0.1)",
            }}>
              <span style={{ fontSize: 18, color: "#DDA46F", fontFamily: "monospace", fontWeight: 700, letterSpacing: 4 }}>
                {quote.coupon_code}
              </span>
            </div>
          </div>
        )}

        {/* ── Price breakdown table (if both axes) ── */}
        {quote.scenarios.some(s => s.invitation_tier && s.management_tier) && (
          <div style={{
            backgroundColor: "rgba(66,12,20,0.04)",
            borderRadius: 10,
            padding: "10px 16px",
            display: "flex",
            gap: 24,
          }}>
            {quote.scenarios.map((s, i) => {
              if (!s.invitation_tier || !s.management_tier) return null
              const discounted = computeDiscountedPrice(s.total_price_cents, quote.discount_type, quote.discount_value)
              return (
                <div key={i} style={{ fontSize: 9, color: "rgba(66,12,20,0.6)" }}>
                  <span style={{ color: "#DDA46F", fontWeight: 600 }}>{localizeLabel(s.label, lang)}</span>
                  {" — "}
                  {t.invitation} {INVITATION_PRICING[s.invitation_tier].name} {formatMXN(s.invitation_price_cents)}
                  {" + "}
                  {t.management} {MANAGEMENT_PRICING[s.management_tier].name} {formatMXN(s.management_price_cents)}
                  {" = "}
                  <span style={{ color: "#420c14", fontWeight: 600 }}>{formatMXN(discounted)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 52,
        borderTop: "1px solid rgba(66,12,20,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 44px",
      }}>
        <span style={{ fontSize: 8, color: "rgba(66,12,20,0.32)" }}>
          {`© ${new Date().getFullYear()} OhMyWedding`}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logos/OMW%20Logo%20Gold.png"
          alt="OhMyWedding"
          style={{ height: 20, width: "auto", opacity: 0.4 }}
        />
        <span style={{ fontSize: 8, color: "rgba(66,12,20,0.32)" }}>
          ohmy.wedding
        </span>
      </div>
    </div>
  )
}

// ─── Scenario card ────────────────────────────────────────────────────────────

function ScenarioCard({
  scenario,
  index,
  quote,
  isOnly,
  t,
  onCheckout,
  checkingOut,
  couponUsed,
}: {
  scenario: QuoteScenario
  index: number
  quote: Quote
  isOnly: boolean
  t: typeof T["en"]
  onCheckout: (index: number) => void
  checkingOut: number | null
  couponUsed: boolean
}) {
  const [open, setOpen] = useState(isOnly || index === 0)
  const lang = quote.language ?? "es"
  const discounted = computeDiscountedPrice(
    scenario.total_price_cents,
    quote.discount_type,
    quote.discount_value
  )
  const savings = scenario.total_price_cents - discounted
  const { invitation, management, isExpanded } = getScenarioFeaturesLocalized(scenario, lang)

  const invName = scenario.invitation_tier
    ? INVITATION_PRICING[scenario.invitation_tier].name
    : null
  const mgmtName = scenario.management_tier
    ? MANAGEMENT_PRICING[scenario.management_tier].name
    : null

  const allFeatures = [...invitation, ...management]

  const isProcessing = checkingOut === index

  return (
    <div
      className={`scenario-card rounded-3xl overflow-hidden transition-all duration-300 print:break-inside-avoid ${
        index === 0
          ? "bg-[#420c14] text-[#f5f2eb] shadow-2xl shadow-[#420c14]/20"
          : "bg-white border border-[#420c14]/12 shadow-lg shadow-[#420c14]/5"
      }`}
    >
      {/* Header */}
      <div className="p-7 pb-5">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            {index === 0 && (
              <span className="inline-block text-[10px] uppercase tracking-[0.25em] text-[#DDA46F] mb-2 font-medium">
                {t.recommended}
              </span>
            )}
            <h3
              className={`text-2xl font-serif ${
                index === 0 ? "text-[#f5f2eb]" : "text-[#420c14]"
              }`}
            >
              {localizeLabel(scenario.label, lang)}
            </h3>
            <div className={`flex gap-2 mt-1.5 flex-wrap text-sm ${
              index === 0 ? "text-[#f5f2eb]/60" : "text-[#420c14]/50"
            }`}>
              {invName && <span>{t.invitation} {invName}</span>}
              {invName && mgmtName && <span>·</span>}
              {mgmtName && <span>{t.management} {mgmtName}</span>}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className={`text-3xl font-serif ${index === 0 ? "text-[#f5f2eb]" : "text-[#420c14]"}`}>
              {formatMXN(discounted)}
            </div>
            {savings > 0 && (
              <div className="mt-1">
                <span className={`text-sm line-through ${index === 0 ? "text-[#f5f2eb]/35" : "text-[#420c14]/30"}`}>
                  {formatMXN(scenario.total_price_cents)}
                </span>
                <span className="ml-2 text-sm font-bold text-emerald-400">
                  -{formatMXN(savings)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Price breakdown */}
        {scenario.invitation_tier && scenario.management_tier && (
          <div className={`rounded-xl p-3 mb-5 grid grid-cols-2 gap-3 text-xs ${
            index === 0 ? "bg-white/10" : "bg-[#420c14]/[0.04]"
          }`}>
            <div>
              <p className="text-[#DDA46F]">{t.invitation}</p>
              <p className={`font-medium ${index === 0 ? "text-[#f5f2eb]" : "text-[#420c14]"}`}>
                {invName} · {formatMXN(scenario.invitation_price_cents)}
              </p>
            </div>
            <div>
              <p className="text-[#DDA46F]">{t.management}</p>
              <p className={`font-medium ${index === 0 ? "text-[#f5f2eb]" : "text-[#420c14]"}`}>
                {mgmtName} · {formatMXN(scenario.management_price_cents)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Features toggle */}
      <div className="px-7 pb-7">
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium mb-3 transition-colors print:hidden ${
            index === 0 ? "text-[#DDA46F] hover:text-[#f5f2eb]" : "text-[#DDA46F] hover:text-[#420c14]"
          }`}
        >
          {open ? t.hideFeatures : t.showFeatures}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Features — always shown in print */}
        <div className={`feature-list ${open ? "" : "hidden"} print:block`}>
          {isExpanded ? (
            <ul className="space-y-2.5">
              {allFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    index === 0 ? "bg-[#DDA46F]/30" : "bg-[#420c14]/10"
                  }`}>
                    <Check className={`w-2.5 h-2.5 ${index === 0 ? "text-[#DDA46F]" : "text-[#420c14]"}`} />
                  </span>
                  <span className={`text-sm leading-snug ${
                    index === 0 ? "text-[#f5f2eb]/80" : "text-[#420c14]/75"
                  }`}>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {invitation.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#DDA46F] mb-2.5">{t.invitation}</p>
                  <ul className="space-y-2">
                    {invitation.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-3 h-3 flex-shrink-0 mt-0.5 text-[#DDA46F]" />
                        <span className={`text-sm ${index === 0 ? "text-[#f5f2eb]/75" : "text-[#420c14]/75"}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {management.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#DDA46F] mb-2.5">{t.management}</p>
                  <ul className="space-y-2">
                    {management.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-3 h-3 flex-shrink-0 mt-0.5 text-[#DDA46F]" />
                        <span className={`text-sm ${index === 0 ? "text-[#f5f2eb]/75" : "text-[#420c14]/75"}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => onCheckout(index)}
          disabled={isProcessing || checkingOut !== null || couponUsed}
          className={`mt-6 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 print:hidden disabled:opacity-60 disabled:cursor-not-allowed ${
            index === 0
              ? "bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14]"
              : "bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.processing}
            </>
          ) : (
            t.choosePackage
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function QuotePageClient({
  quote,
  isExpired,
  isPaid,
  couponUsed,
}: {
  quote: Quote
  isExpired: boolean
  isPaid: boolean
  couponUsed: boolean
}) {
  type WeddingOption = { id: string; wedding_name_id: string; partner1_first_name: string; partner2_first_name: string }

  const [codeCopied, setCodeCopied] = useState(false)
  const [checkingOut, setCheckingOut] = useState<number | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [pendingScenario, setPendingScenario] = useState<number | null>(null)
  const [weddings, setWeddings] = useState<WeddingOption[] | null>(null)
  const [selectedWeddingId, setSelectedWeddingId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loadingWeddings, setLoadingWeddings] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [showPdfRender, setShowPdfRender] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authDialogInitialMode, setAuthDialogInitialMode] = useState<'choice' | 'create-wedding'>('choice')
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  const lang = (quote.language ?? "es") as "en" | "es"
  const t = T[lang]

  const copyCode = async () => {
    if (!quote.coupon_code) return
    await copyToClipboard(quote.coupon_code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2500)
  }

  const discountLabel =
    quote.discount_type === "percent"
      ? `${quote.discount_value}%`
      : formatMXN(quote.discount_value)

  const handleSavePdf = useCallback(async () => {
    setGeneratingPdf(true)
    try {
      flushSync(() => setShowPdfRender(true))
      await new Promise(r => setTimeout(r, 120)) // let images settle
      if (!pdfContainerRef.current) throw new Error("PDF container not ready")
      const blob = await captureAndAssemblePDF(pdfContainerRef.current)
      downloadBlob(blob, `quote-${quote.quote_number}.pdf`)
    } catch (e) {
      console.error("PDF generation failed:", e)
    } finally {
      setShowPdfRender(false)
      setGeneratingPdf(false)
    }
  }, [quote])

  // Sends to Stripe checkout once we have a weddingId
  const proceedToCheckout = async (scenarioIndex: number, weddingId: string) => {
    setCheckingOut(scenarioIndex)
    try {
      const res = await fetch(`/api/quotes/${quote.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioIndex, weddingId, locale: lang }),
      })
      const data = await res.json()
      if (!res.ok) { setCheckoutError(data.error || "Something went wrong"); return }
      window.location.href = data.url
    } catch {
      setCheckoutError("Something went wrong. Please try again.")
    } finally {
      setCheckingOut(null)
      setPendingScenario(null)
    }
  }

  // Step 1: check auth, fetch weddings, open the right dialog
  const handleCheckout = async (scenarioIndex: number) => {
    setCheckoutError(null)
    setPendingScenario(scenarioIndex)

    // Already have weddings loaded — reuse them
    if (weddings !== null) {
      setPickerOpen(true)
      return
    }

    // Check auth status via client-side Supabase
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setAuthDialogInitialMode('choice')
      setAuthDialogOpen(true)
      return
    }

    // Logged in — fetch weddings
    setLoadingWeddings(true)
    try {
      const res = await fetch("/api/weddings")
      const data = await res.json()
      const list: WeddingOption[] = data.weddings || []

      if (list.length === 0) {
        // Has account but no weddings yet
        setAuthDialogInitialMode('create-wedding')
        setAuthDialogOpen(true)
        return
      }

      setWeddings(list)
      setSelectedWeddingId(list[0].id)
      setPickerOpen(true)
    } catch {
      setCheckoutError("Something went wrong. Please try again.")
      setPendingScenario(null)
    } finally {
      setLoadingWeddings(false)
    }
  }

  // Step 2 (existing picker): user confirmed a wedding from the already-loaded list
  const handleConfirmWedding = async () => {
    if (pendingScenario === null || !selectedWeddingId) return
    setPickerOpen(false)
    await proceedToCheckout(pendingScenario, selectedWeddingId)
  }

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .scenario-card { break-inside: avoid; }
          .feature-list { display: block !important; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      {/* ── Hidden PDF render container ── */}
      <div
        ref={pdfContainerRef}
        style={{
          position: "fixed",
          top: 0,
          left: -9999,
          opacity: showPdfRender ? 1 : 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        {showPdfRender && (
          <QuotePDFPage
            quote={quote}
            lang={lang}
            t={t}
            discountLabel={discountLabel}
          />
        )}
      </div>

      <div className="min-h-screen bg-[#f5f2eb]">
        {/* Full-screen loading overlay while redirecting to Stripe */}
        {checkingOut !== null && (
          <div className="fixed inset-0 z-50 bg-[#f5f2eb]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
            <Loader2 className="w-10 h-10 animate-spin text-[#420c14]" />
            <p className="text-[#420c14] font-medium text-lg">{t.processing}</p>
            <p className="text-[#420c14]/50 text-sm">{lang === "es" ? "Redirigiendo al pago…" : "Redirecting to checkout…"}</p>
          </div>
        )}

        {/* Fetching weddings spinner */}
        {loadingWeddings && (
          <div className="fixed inset-0 z-50 bg-[#f5f2eb]/80 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#420c14]" />
          </div>
        )}

        {/* Auth dialog — sign up / login / create wedding for unauthenticated users */}
        {authDialogOpen && (
          <AuthCheckoutDialog
            key={authDialogInitialMode}
            lang={lang}
            initialMode={authDialogInitialMode}
            onClose={() => { setAuthDialogOpen(false); setPendingScenario(null) }}
            onReady={(weddingId) => {
              setAuthDialogOpen(false)
              if (pendingScenario !== null) proceedToCheckout(pendingScenario, weddingId)
            }}
          />
        )}

        {/* Wedding picker dialog — for already-authenticated users with multiple weddings */}
        {pickerOpen && weddings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[#420c14]/30 backdrop-blur-sm" onClick={() => setPickerOpen(false)} />
            <div className="relative bg-[#f5f2eb] rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6">
              <div className="space-y-1.5">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#DDA46F]">OhMyWedding</p>
                <h2 className="font-serif text-2xl text-[#420c14] leading-snug">{t.selectWeddingTitle}</h2>
                <p className="text-sm text-[#420c14]/50">{t.selectWeddingBody}</p>
              </div>

              <div className="space-y-2">
                {weddings.map(w => {
                  const selected = selectedWeddingId === w.id
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWeddingId(w.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                        selected
                          ? "border-[#420c14] bg-[#420c14]/5"
                          : "border-[#420c14]/15 hover:border-[#420c14]/30 hover:bg-[#420c14]/3"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        selected ? "border-[#420c14]" : "border-[#420c14]/30"
                      }`}>
                        {selected && <span className="w-2 h-2 rounded-full bg-[#420c14]" />}
                      </span>
                      <span className="font-medium text-[#420c14] text-sm">
                        {w.partner1_first_name} &amp; {w.partner2_first_name}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setPickerOpen(false); setPendingScenario(null) }}
                  className="flex-1 py-3 rounded-2xl border border-[#420c14]/15 text-sm text-[#420c14]/60 hover:text-[#420c14] hover:border-[#420c14]/30 transition-colors"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWedding}
                  disabled={!selectedWeddingId}
                  className="flex-1 py-3 rounded-2xl bg-[#420c14] text-[#f5f2eb] text-sm font-medium hover:bg-[#5a1a22] transition-colors disabled:opacity-50"
                >
                  {t.continueBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top bar */}
        <header className="no-print sticky top-0 z-10 bg-[#f5f2eb]/80 backdrop-blur-md border-b border-[#420c14]/8 px-6 py-3 flex items-center justify-between">
          <div className="relative h-9 w-36">
            <Image
              src="/images/logos/OMW Logo Gold.png"
              alt="OhMyWedding"
              fill
              className="object-contain object-left"
            />
          </div>
          <button
            onClick={handleSavePdf}
            disabled={generatingPdf}
            className="flex items-center gap-1.5 text-sm text-[#420c14]/60 hover:text-[#420c14] transition-colors disabled:opacity-50"
          >
            {generatingPdf ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{t.generatingPdf}</>
            ) : (
              <><FileDown className="w-4 h-4" />{t.savePdf}</>
            )}
          </button>
        </header>

        {/* Print-only header */}
        <div className="print-only px-12 pt-10 pb-6 border-b border-[#420c14]/15 flex items-center justify-between">
          <div className="relative h-10 w-44">
            <Image
              src="/images/logos/OMW Logo Gold.png"
              alt="OhMyWedding"
              fill
              className="object-contain object-left"
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-[#420c14]/50">{quote.quote_number}</p>
            <p className="text-xs text-[#420c14]/50">
              {formatDate(quote.created_at, lang)}
            </p>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
          {/* Hero greeting */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#DDA46F]">{t.tagline}</p>
            <h1 className="text-4xl sm:text-5xl font-serif text-[#420c14] leading-tight">
              {isPaid
                ? t.paidTitle
                : isExpired
                ? t.expiredTitle
                : t.greeting(quote.recipient_name.split(" ")[0])}
            </h1>
            {!isPaid && !isExpired && (
              <p className="text-[#420c14]/60 text-lg max-w-xl">
                {lang === "es"
                  ? <>Hemos preparado una cotización con un descuento de <strong className="text-[#420c14] font-bold">{discountLabel}</strong> especialmente para ti. Elige el paquete que mejor se adapte a tu boda.</>
                  : <>We've prepared a custom quote with a <strong className="text-[#420c14] font-bold">{discountLabel}</strong> discount especially for you. Browse the options below and choose the package that fits your wedding best.</>}
              </p>
            )}
            {isPaid && (
              <p className="text-[#420c14]/60 text-lg">{t.paidBody}</p>
            )}
            {isExpired && !isPaid && (
              <p className="text-[#420c14]/60 text-lg">{t.expiredBody}</p>
            )}
          </div>

          {/* Quote meta bar */}
          <div className="flex flex-wrap gap-6 text-sm text-[#420c14]/60">
            <span>
              <span className="font-medium text-[#420c14]">{t.quoteLabel}</span>{" "}
              {quote.quote_number}
            </span>
            {quote.coupon_expires_at && (
              <span>
                <span className="font-medium text-[#420c14]">{t.validUntil}</span>{" "}
                {formatDate(quote.coupon_expires_at, lang)}
              </span>
            )}
            <span>
              <span className="font-medium text-[#420c14]">{t.discountLabel}</span>{" "}
              <strong className="text-[#420c14] font-bold">{discountLabel} {t.off}</strong>
            </span>
          </div>

          {!isPaid && !isExpired && (
            <>
              {/* Coupon already redeemed */}
              {couponUsed && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 space-y-1">
                  <p className="text-sm font-semibold text-red-800">{t.couponUsedTitle}</p>
                  <p className="text-sm text-red-700">{t.couponUsedBody}</p>
                </div>
              )}

              {/* Checkout error */}
              {checkoutError && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800">
                  {checkoutError}
                </div>
              )}

              {/* Scenarios */}
              <div
                className={`grid gap-6 ${
                  quote.scenarios.length === 1
                    ? "grid-cols-1 max-w-lg"
                    : quote.scenarios.length === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {quote.scenarios.map((scenario, i) => (
                  <ScenarioCard
                    key={i}
                    scenario={scenario}
                    index={i}
                    quote={quote}
                    isOnly={quote.scenarios.length === 1}
                    t={t}
                    onCheckout={handleCheckout}
                    checkingOut={checkingOut}
                    couponUsed={couponUsed}
                  />
                ))}
              </div>

              {/* Coupon code section */}
              {quote.coupon_code && (
                <div className="bg-white rounded-3xl border border-[#420c14]/10 shadow-sm overflow-hidden">
                  <div className="p-8 sm:flex items-center gap-8">
                    <div className="flex-1 mb-6 sm:mb-0">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">
                        {t.discountCodeTagline}
                      </p>
                      <h2 className="text-2xl font-serif text-[#420c14] mb-2">
                        {t.discountCodeHeadline(discountLabel)}
                      </h2>
                      <p className="text-[#420c14]/55 text-sm">
                        {t.discountCodeBody}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-[#DDA46F]/40 -m-2" />
                        <div className="bg-[#420c14] text-[#f5f2eb] rounded-xl px-8 py-4 text-center">
                          <p className="text-[10px] uppercase tracking-widest text-[#DDA46F] mb-1">{t.promoCodeLabel}</p>
                          <p className="text-3xl font-mono font-bold tracking-[0.2em] text-[#DDA46F]">
                            {quote.coupon_code}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={copyCode}
                        className="no-print flex items-center gap-1.5 text-sm font-medium text-[#420c14]/60 hover:text-[#420c14] transition-colors"
                      >
                        {codeCopied ? (
                          <><CheckCircle2 className="w-4 h-4 text-green-600" /> {t.copied}</>
                        ) : (
                          <><Copy className="w-4 h-4" /> {t.copyCode}</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="border-t border-[#420c14]/8 pt-10">
                <p className="text-xs uppercase tracking-[0.25em] text-[#DDA46F] mb-6">{t.howToRedeem}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { n: "1", title: t.step1Title, body: t.step1Body },
                    { n: "2", title: t.step2Title, body: t.step2Body },
                    { n: "3", title: t.step3Title, body: t.step3Body(discountLabel) },
                  ].map(step => (
                    <div key={step.n} className="flex gap-4">
                      <span className="w-7 h-7 rounded-full bg-[#420c14] text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                        {step.n}
                      </span>
                      <div>
                        <p className="font-medium text-[#420c14] text-sm mb-1">{step.title}</p>
                        <p className="text-xs text-[#420c14]/55 leading-relaxed">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#420c14]/8 px-6 py-8 mt-12">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#420c14]/40">
            <p>{t.copyright(new Date().getFullYear())}</p>
          </div>
        </footer>
      </div>
    </>
  )
}

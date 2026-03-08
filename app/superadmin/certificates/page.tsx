"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Award, Printer, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

function formattedDateEs(): string {
  const d = new Date()
  return `${d.getDate()} de ${MONTHS_ES[d.getMonth()]} de ${d.getFullYear()}`
}

// ─── Plan data ───────────────────────────────────────────────────────────────

const PLANS = {
  premium: {
    id: "premium",
    name: "Premium",
    experience: "Premium Experience",
    value: "$7,000 MXN",
    valueRaw: "SIETE MIL PESOS 00/100 M.N.",
    accentColor: "#8B6914",
    features: [
      "Sitio web de boda personalizado",
      "Confirmaciones de asistencia en línea",
      "Mesa de regalos con Stripe",
      "Hasta 250 invitados",
      "Asesoría personalizada",
      "Acceso para colaboradores y planificadores",
    ],
  },
  deluxe: {
    id: "deluxe",
    name: "Deluxe",
    experience: "Deluxe Experience",
    value: "$15,000 MXN",
    valueRaw: "QUINCE MIL PESOS 00/100 M.N.",
    accentColor: "#DDA46F",
    features: [
      "Diseño completamente a la medida",
      "Invitados ilimitados",
      "Plano de mesas interactivo",
      "Soporte dedicado personal",
      "Componentes exclusivos",
      "Automatización WhatsApp",
    ],
  },
} as const

type PlanKey = keyof typeof PLANS

// ─── Certificate HTML generator ─────────────────────────────────────────────

function buildCertificateHTML(plan: typeof PLANS[PlanKey], recipient: string, uuid: string, origin: string): string {
  const date = formattedDateEs()
  const isDeluxe = plan.id === "deluxe"
  const mainAccent = isDeluxe ? "#C9974A" : "#8B6914"
  const lightAccent = isDeluxe ? "#DDA46F" : "#B8962E"
  const featureList = plan.features.map(f => `<li>${f}</li>`).join("")

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <base href="${origin}/">
  <title>Certificado OhMyWedding ${plan.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');

    @page {
      size: 17in 11in landscape;
      margin: 0;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      width: 17in;
      height: 11in;
      overflow: hidden;
      background: #f5f2eb;
    }

    .certificate {
      width: 17in;
      height: 11in;
      position: relative;
      background: #f5f2eb;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Outer decorative border frame */
    .frame-outer {
      position: absolute;
      inset: 0.28in;
      border: 2.5px solid ${mainAccent};
      pointer-events: none;
      z-index: 10;
    }
    .frame-inner {
      position: absolute;
      inset: 0.35in;
      border: 1px solid ${mainAccent}60;
      pointer-events: none;
      z-index: 10;
    }

    /* Corner ornaments */
    .corner {
      position: absolute;
      width: 0.6in;
      height: 0.6in;
      z-index: 11;
    }
    .corner svg { width: 100%; height: 100%; }
    .corner-tl { top: 0.2in; left: 0.2in; }
    .corner-tr { top: 0.2in; right: 0.2in; transform: scaleX(-1); }
    .corner-bl { bottom: 0.2in; left: 0.2in; transform: scaleY(-1); }
    .corner-br { bottom: 0.2in; right: 0.2in; transform: scale(-1, -1); }

    /* Burgundy side panels */
    .side-panel-left {
      position: absolute;
      left: 0;
      top: 0;
      width: 0.65in;
      height: 11in;
      background: #420c14;
      z-index: 1;
    }
    .side-panel-right {
      position: absolute;
      right: 0;
      top: 0;
      width: 0.18in;
      height: 11in;
      background: #420c14;
      z-index: 1;
    }

    /* Gold stripe on left panel edge */
    .side-panel-left::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, transparent, ${lightAccent}, ${mainAccent}, ${lightAccent}, transparent);
    }
    .side-panel-right::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, transparent, ${lightAccent}, ${mainAccent}, ${lightAccent}, transparent);
    }

    /* Main content area */
    .main-content {
      position: absolute;
      left: 0.75in;
      right: 0.3in;
      top: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0.5in 0.55in 0.4in 0.55in;
      z-index: 2;
    }

    .header-logo {
      width: 1.6in;
      height: auto;
      object-fit: contain;
      opacity: 0.9;
      margin-bottom: 0.18in;
      display: block;
    }

    /* Top label */
    .top-label {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      font-weight: 600;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: ${mainAccent};
      margin-bottom: 0.12in;
    }

    /* Main heading */
    .heading-certificado {
      font-family: 'Playfair Display', serif;
      font-size: 64pt;
      font-weight: 800;
      color: #420c14;
      line-height: 1.0;
      letter-spacing: -0.01em;
      margin-bottom: 0.06in;
    }

    .heading-de-regalo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 40pt;
      font-weight: 300;
      font-style: italic;
      color: #420c14;
      opacity: 0.7;
      line-height: 1.0;
      letter-spacing: 0.02em;
      margin-bottom: 0.18in;
    }

    /* Plan highlight */
    .plan-highlight {
      display: inline-block;
      margin-bottom: 0.22in;
    }
    .plan-highlight-text {
      font-family: 'Playfair Display', serif;
      font-size: 28pt;
      font-weight: 700;
      color: ${mainAccent};
      letter-spacing: 0.04em;
    }
    .plan-line {
      height: 2px;
      background: linear-gradient(90deg, ${mainAccent}, ${lightAccent}40);
      margin-top: 0.03in;
    }

    /* Divider line */
    .section-divider {
      height: 1px;
      background: linear-gradient(90deg, #42000e20, #42000e60, #42000e20);
      margin: 0.16in 0;
    }

    /* Recipient */
    .recipient-label {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      font-weight: 600;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #420c14;
      opacity: 0.45;
      margin-bottom: 0.06in;
    }
    .recipient-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 42pt;
      font-weight: 400;
      font-style: italic;
      color: #420c14;
      line-height: 1.1;
      margin-bottom: 0.16in;
      border-bottom: 1.5px solid ${mainAccent}50;
      padding-bottom: 0.06in;
      min-width: 4.5in;
    }

    /* Value block */
    .value-block {
      margin-bottom: 0.16in;
    }
    .value-label {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #420c14;
      opacity: 0.45;
      margin-bottom: 0.04in;
    }
    .value-amount {
      font-family: 'Playfair Display', serif;
      font-size: 54pt;
      font-weight: 800;
      color: ${mainAccent};
      line-height: 1;
      letter-spacing: 0.02em;
    }
    .value-written {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      color: #420c14;
      opacity: 0.55;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-top: 0.04in;
    }

    /* Description */
    .description {
      font-family: 'Cormorant Garamond', serif;
      font-size: 14pt;
      color: #420c14;
      opacity: 0.65;
      line-height: 1.55;
      max-width: 12in;
      margin-bottom: 0.18in;
      font-style: italic;
    }

    /* Bottom row: signature + date */
    .bottom-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1in;
    }

    .signature-block {
      flex: 1;
    }
    .signature-line {
      width: 3in;
      height: 1px;
      background: #420c14;
      opacity: 0.4;
      margin-bottom: 0.06in;
    }
    .signature-label {
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #420c14;
      opacity: 0.4;
    }

    .date-block {
      text-align: right;
    }
    .date-text {
      font-family: 'Cormorant Garamond', serif;
      font-size: 12pt;
      font-style: italic;
      color: #420c14;
      opacity: 0.6;
      line-height: 1.5;
    }

    /* UUID */
    .uuid-label {
      position: absolute;
      bottom: 0.15in;
      right: 0.3in;
      font-family: 'Inter', sans-serif;
      font-size: 7pt;
      color: #420c14;
      opacity: 0.25;
      letter-spacing: 0.06em;
      z-index: 12;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      right: 0.3in;
      top: 50%;
      transform: translateY(-50%);
      font-family: 'Playfair Display', serif;
      font-size: 180pt;
      font-weight: 900;
      color: #420c14;
      opacity: 0.025;
      pointer-events: none;
      z-index: 1;
      letter-spacing: -0.06em;
      line-height: 1;
    }

    /* Seal */
    .seal {
      position: absolute;
      bottom: 0.8in;
      right: 0.4in;
      width: 1.4in;
      height: 1.4in;
      z-index: 5;
    }
    .seal-ring {
      position: absolute;
      inset: 0;
    }
    .seal-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -56%);
      width: 62%;
      height: auto;
      opacity: 0.45;
    }
    .seal-text {
      position: absolute;
      bottom: 18%;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Inter', sans-serif;
      font-size: 5pt;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: ${mainAccent};
      opacity: 0.45;
      white-space: nowrap;
    }

    @media print {
      html, body { width: 17in; height: 11in; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <!-- Watermark -->
    <div class="watermark">OMW</div>

    <!-- Side panels -->
    <div class="side-panel-left"></div>
    <div class="side-panel-right"></div>

    <!-- Decorative frames -->
    <div class="frame-outer"></div>
    <div class="frame-inner"></div>

    <!-- Corner ornaments -->
    <div class="corner corner-tl">
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 L2 58" stroke="${mainAccent}" stroke-width="1.5"/>
        <path d="M2 2 L58 2" stroke="${mainAccent}" stroke-width="1.5"/>
        <path d="M2 2 L22 22" stroke="${mainAccent}" stroke-width="0.8" stroke-dasharray="2 3"/>
        <circle cx="2" cy="2" r="3" fill="${mainAccent}"/>
        <path d="M12 2 Q12 12 2 12" stroke="${lightAccent}" stroke-width="0.8" fill="none"/>
        <path d="M22 2 Q22 22 2 22" stroke="${mainAccent}40" stroke-width="0.5" fill="none"/>
        <circle cx="32" cy="2" r="1.5" fill="${mainAccent}60"/>
        <circle cx="2" cy="32" r="1.5" fill="${mainAccent}60"/>
      </svg>
    </div>
    <div class="corner corner-tr">
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 L2 58" stroke="${mainAccent}" stroke-width="1.5"/>
        <path d="M2 2 L58 2" stroke="${mainAccent}" stroke-width="1.5"/>
        <circle cx="2" cy="2" r="3" fill="${mainAccent}"/>
        <path d="M12 2 Q12 12 2 12" stroke="${lightAccent}" stroke-width="0.8" fill="none"/>
        <circle cx="32" cy="2" r="1.5" fill="${mainAccent}60"/>
        <circle cx="2" cy="32" r="1.5" fill="${mainAccent}60"/>
      </svg>
    </div>
    <div class="corner corner-bl">
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 L2 58" stroke="${mainAccent}" stroke-width="1.5"/>
        <path d="M2 2 L58 2" stroke="${mainAccent}" stroke-width="1.5"/>
        <circle cx="2" cy="2" r="3" fill="${mainAccent}"/>
        <path d="M12 2 Q12 12 2 12" stroke="${lightAccent}" stroke-width="0.8" fill="none"/>
        <circle cx="32" cy="2" r="1.5" fill="${mainAccent}60"/>
        <circle cx="2" cy="32" r="1.5" fill="${mainAccent}60"/>
      </svg>
    </div>
    <div class="corner corner-br">
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 L2 58" stroke="${mainAccent}" stroke-width="1.5"/>
        <path d="M2 2 L58 2" stroke="${mainAccent}" stroke-width="1.5"/>
        <circle cx="2" cy="2" r="3" fill="${mainAccent}"/>
        <path d="M12 2 Q12 12 2 12" stroke="${lightAccent}" stroke-width="0.8" fill="none"/>
        <circle cx="32" cy="2" r="1.5" fill="${mainAccent}60"/>
        <circle cx="2" cy="32" r="1.5" fill="${mainAccent}60"/>
      </svg>
    </div>

    <!-- Left panel content -->

    <!-- Main certificate content -->
    <div class="main-content">
      <img src="images/logos/OMW Logo Gold.png" class="header-logo" alt="OhMyWedding" />
      <div class="top-label">Certificado Oficial</div>

      <div class="heading-certificado">CERTIFICADO</div>
      <div class="heading-de-regalo">de regalo</div>

      <div class="plan-highlight">
        <div class="plan-highlight-text">OHMYWEDDING ${plan.name.toUpperCase()} EXPERIENCE</div>
        <div class="plan-line"></div>
      </div>

      <div class="section-divider"></div>

      <div class="recipient-label">Otorgado a</div>
      <div class="recipient-name">${recipient || "________________________________"}</div>

      <div class="value-block">
        <div class="value-label">Valor del certificado</div>
        <div class="value-amount">${plan.value}</div>
        <div class="value-written">${plan.valueRaw}</div>
      </div>

      <div class="description">
        Este certificado garantiza al portador el acceso completo al Plan
        <strong style="color:#420c14; opacity:0.8; font-style:normal;">${plan.name}</strong>
        de OhMyWedding, válido para la creación y publicación de un sitio web de boda
        con todas las funciones del plan indicado.</div>

      <div class="bottom-row">
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">Firma autorizada &nbsp;·&nbsp; OhMyWedding</div>
        </div>
        <div class="date-block">
          <div class="date-text">
            Expedido a ${date}<br>
            Torreón, Coahuila, México
          </div>
        </div>
      </div>
    </div>

    <!-- Circular seal -->
    <div class="seal">
      <svg class="seal-ring" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" stroke="${mainAccent}" stroke-width="1.5" opacity="0.4"/>
        <circle cx="50" cy="50" r="40" stroke="${mainAccent}" stroke-width="0.5" opacity="0.25" stroke-dasharray="2 3"/>
      </svg>
      <img src="images/logos/OMW Logo Gold.png" class="seal-logo" alt="OhMyWedding" />
      <span class="seal-text">Oficial</span>
    </div>

    <!-- UUID -->
    <div class="uuid-label">Nº ${uuid}</div>
  </div>
</body>
</html>`
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("deluxe")
  const [recipient, setRecipient] = useState("")
  const [uuid, setUuid] = useState("")
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(0.5)

  useEffect(() => {
    setUuid(generateUUID())
  }, [])

  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const update = () => setPreviewScale(el.offsetWidth / 1632)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const plan = PLANS[selectedPlan]

  const refreshUUID = useCallback(() => setUuid(generateUUID()), [])

  const handlePrint = useCallback(() => {
    const html = buildCertificateHTML(plan, recipient, uuid, window.location.origin)
    const win = window.open("", "_blank", "width=1200,height=800")
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.onload = () => {
      setTimeout(() => {
        win.focus()
        win.print()
      }, 600)
    }
  }, [plan, recipient, uuid])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Superadmin Panel</p>
        <h1 className="text-4xl font-serif text-[#420c14]">Certificados de Regalo</h1>
        <p className="text-[#420c14]/60 mt-2">
          Genera e imprime certificados de regalo para cada plan.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-8">
        {/* ── Left: Configuration panel ── */}
        <div className="space-y-6">
          {/* Plan selector */}
          <div className="bg-white rounded-2xl border border-[#420c14]/8 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#420c14] tracking-wide uppercase">Plan</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["premium", "deluxe"] as PlanKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                    selectedPlan === key
                      ? "bg-[#420c14] text-white border-[#420c14]"
                      : "bg-white text-[#420c14]/60 border-[#420c14]/15 hover:border-[#420c14]/30 hover:text-[#420c14]"
                  }`}
                >
                  {PLANS[key].name}
                  <span className="block text-[10px] font-normal opacity-70 mt-0.5">{PLANS[key].value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient */}
          <div className="bg-white rounded-2xl border border-[#420c14]/8 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#420c14] tracking-wide uppercase">Destinatario</h2>
            <div className="space-y-2">
              <Label className="text-xs text-[#420c14]/60 uppercase tracking-wide">Otorgado a</Label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Nombre del destinatario…"
                className="border-[#420c14]/15 focus-visible:ring-[#DDA46F]/40 text-[#420c14]"
              />
              <p className="text-[10px] text-[#420c14]/40">
                Deja en blanco para imprimir con línea para firma manual.
              </p>
            </div>
          </div>

          {/* UUID */}
          <div className="bg-white rounded-2xl border border-[#420c14]/8 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#420c14] tracking-wide uppercase">Número de Serie</h2>
              <button
                onClick={refreshUUID}
                className="p-1.5 rounded-lg hover:bg-[#420c14]/5 text-[#420c14]/40 hover:text-[#420c14] transition-colors"
                title="Generar nuevo UUID"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-mono text-[10px] text-[#420c14]/50 break-all leading-relaxed bg-[#420c14]/3 rounded-lg px-3 py-2">
              {uuid}
            </p>
            <p className="text-[10px] text-[#420c14]/40">
              UUID único por certificado para verificación y control de duplicados.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handlePrint}
              className="w-full bg-[#420c14] hover:bg-[#5a1a22] text-white rounded-xl h-12 gap-2 text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Descargar PDF
            </Button>
            <p className="text-[10px] text-[#420c14]/40 text-center leading-relaxed">
              Se abrirá el diálogo de impresión. Selecciona &ldquo;Guardar como PDF&rdquo; para descargar.
              <br />Tamaño de página: 11 × 17 in (Tabloide), horizontal.
            </p>
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#420c14]/60 uppercase tracking-wide">Vista Previa — {plan.name}</h2>
            <span className="text-[10px] text-[#420c14]/40 bg-[#420c14]/5 px-3 py-1 rounded-full">
              11 × 17 in · Horizontal
            </span>
          </div>

          {/* Scaled preview */}
          <div
            ref={previewRef}
            className="w-full rounded-2xl border border-[#420c14]/10 shadow-lg bg-[#f5f2eb]"
            style={{ aspectRatio: "17/11", position: "relative", overflow: "hidden" }}
          >
            <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: "1632px", height: "1056px", position: "absolute", top: 0, left: 0 }}>
              <CertificatePreview plan={plan} recipient={recipient} uuid={uuid} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Inline React preview (matches print output) ────────────────────────────

interface CertificatePreviewProps {
  plan: typeof PLANS[PlanKey]
  recipient: string
  uuid: string
}

function CertificatePreview({ plan, recipient, uuid }: CertificatePreviewProps) {
  const isDeluxe = plan.id === "deluxe"
  const mainAccent = isDeluxe ? "#C9974A" : "#8B6914"
  const lightAccent = isDeluxe ? "#DDA46F" : "#B8962E"
  const date = formattedDateEs()

  return (
    <div
      style={{
        width: "1632px",
        height: "1056px",
        background: "#f5f2eb",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Watermark */}
      <div style={{
        position: "absolute", right: "30px", top: "50%", transform: "translateY(-50%)",
        fontFamily: "Georgia, serif", fontSize: "600px", fontWeight: 900,
        color: "#420c14", opacity: 0.025, pointerEvents: "none", zIndex: 1,
        letterSpacing: "-10px", lineHeight: 1,
      }}>OMW</div>

      {/* Left burgundy panel */}
      <div style={{
        position: "absolute", left: 0, top: 0, width: "62px", height: "1056px",
        background: "#420c14", zIndex: 2,
        borderRight: `4px solid ${lightAccent}`,
      }} />
      {/* Right burgundy strip */}
      <div style={{
        position: "absolute", right: 0, top: 0, width: "18px", height: "1056px",
        background: "#420c14", zIndex: 2,
        borderLeft: `4px solid ${lightAccent}`,
      }} />

      {/* Outer frame */}
      <div style={{
        position: "absolute", inset: "28px",
        border: `2.5px solid ${mainAccent}`, zIndex: 10, pointerEvents: "none",
      }} />
      {/* Inner frame */}
      <div style={{
        position: "absolute", inset: "38px",
        border: `1px solid ${mainAccent}50`, zIndex: 10, pointerEvents: "none",
      }} />

      {/* Left panel — decorative only */}

      {/* Main content */}
      <div style={{
        position: "absolute", left: "72px", right: "28px", top: 0, bottom: 0,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "48px 52px 38px 52px", zIndex: 3,
      }}>
        {/* Logo */}
        <img
          src="/images/logos/OMW Logo Gold.png"
          alt="OhMyWedding"
          style={{ width: "154px", height: "auto", objectFit: "contain", opacity: 0.9, marginBottom: "18px" }}
        />
        {/* Top label */}
        <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.35em", textTransform: "uppercase", color: mainAccent, marginBottom: "12px" }}>
          Certificado Oficial
        </div>

        {/* CERTIFICADO */}
        <div style={{ fontFamily: "Georgia, serif", fontSize: "82px", fontWeight: 800, color: "#420c14", lineHeight: 1.0, letterSpacing: "-0.01em", marginBottom: "6px" }}>
          CERTIFICADO
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: "50px", fontWeight: 300, fontStyle: "italic", color: "#420c14", opacity: 0.7, lineHeight: 1.0, letterSpacing: "0.02em", marginBottom: "18px" }}>
          de regalo
        </div>

        {/* Plan highlight */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 700, color: mainAccent, letterSpacing: "0.04em" }}>
            OHMYWEDDING {plan.name.toUpperCase()} EXPERIENCE
          </div>
          <div style={{ height: "2px", background: `linear-gradient(90deg, ${mainAccent}, ${lightAccent}40)`, marginTop: "3px", width: "700px" }} />
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "linear-gradient(90deg, #42000e20, #42000e60, #42000e20)", margin: "0 0 14px" }} />

        {/* Recipient */}
        <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#420c14", opacity: 0.45, marginBottom: "6px" }}>
          Otorgado a
        </div>
        <div style={{
          fontFamily: "Georgia, serif", fontSize: "52px", fontWeight: 400, fontStyle: "italic", color: "#420c14",
          lineHeight: 1.1, marginBottom: "14px", borderBottom: `1.5px solid ${mainAccent}50`,
          paddingBottom: "6px", minWidth: "400px",
        }}>
          {recipient || <span style={{ opacity: 0.3 }}>________________________________</span>}
        </div>

        {/* Value */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#420c14", opacity: 0.45, marginBottom: "3px" }}>
            Valor del certificado
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "68px", fontWeight: 800, color: mainAccent, lineHeight: 1, letterSpacing: "0.02em" }}>
            {plan.value}
          </div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#420c14", opacity: 0.55, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "4px" }}>
            {plan.valueRaw}
          </div>
        </div>

        {/* Description */}
        <div style={{ fontFamily: "Georgia, serif", fontSize: "15px", color: "#420c14", opacity: 0.65, lineHeight: 1.55, maxWidth: "1100px", marginBottom: "16px", fontStyle: "italic" }}>
          Este certificado garantiza al portador el acceso completo al Plan <strong style={{ fontStyle: "normal", opacity: 0.85 }}>{plan.name}</strong> de OhMyWedding, válido para la creación y publicación de un sitio web de boda con todas las funciones del plan indicado.
        </div>

        {/* Bottom: signature + date */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "96px" }}>
          <div>
            <div style={{ width: "290px", height: "1px", background: "#420c14", opacity: 0.35, marginBottom: "6px" }} />
            <div style={{ fontFamily: "Arial, sans-serif", fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#420c14", opacity: 0.4 }}>
              Firma autorizada &nbsp;·&nbsp; OhMyWedding
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "12px", fontStyle: "italic", color: "#420c14", opacity: 0.6, lineHeight: 1.5 }}>
              Expedido a {date}<br />
              Torreón, Coahuila, México
            </div>
          </div>
        </div>
      </div>

      {/* Seal */}
      <div style={{ position: "absolute", bottom: "78px", right: "38px", width: "130px", height: "130px", zIndex: 5 }}>
        {/* Ring */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" stroke={mainAccent} strokeWidth="1.5" opacity="0.4"/>
          <circle cx="50" cy="50" r="40" stroke={mainAccent} strokeWidth="0.5" strokeDasharray="2 3" opacity="0.25"/>
        </svg>
        {/* Logo inside seal */}
        <img
          src="/images/logos/OMW Logo Gold.png"
          alt="OhMyWedding"
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -58%)", width: "58%", height: "auto", opacity: 0.45 }}
        />
        {/* Oficial text */}
        <div style={{ position: "absolute", bottom: "22%", left: "50%", transform: "translateX(-50%)", fontFamily: "Arial, sans-serif", fontSize: "6px", letterSpacing: "0.25em", textTransform: "uppercase", color: mainAccent, opacity: 0.45, whiteSpace: "nowrap" }}>Oficial</div>
      </div>

      {/* UUID */}
      <div style={{
        position: "absolute", bottom: "14px", right: "28px",
        fontFamily: "monospace", fontSize: "8px", color: "#420c14", opacity: 0.22, letterSpacing: "0.04em", zIndex: 12,
      }}>
        Nº {uuid}
      </div>
    </div>
  )
}

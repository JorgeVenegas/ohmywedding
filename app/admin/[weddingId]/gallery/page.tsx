"use client"

import { use, useState, useEffect, useCallback, useRef } from "react"
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { getWeddingPath } from "@/lib/wedding-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import {
  Check, X, Download, Loader2, Camera, Copy, CheckCircle2,
  ExternalLink, Trash2, ChevronLeft, ChevronRight, ArrowLeft, Heart, Maximize2,
  Info, MapPin, Clock, Aperture, FileImage, User, ChevronDown, AlertTriangle, RotateCw,
  Users,
} from "lucide-react"
import { ContributionTimeline } from "./components/contribution-timeline"

interface GalleryPageProps {
  params: Promise<{ weddingId: string }>
}

interface GuestPhotoMetadata {
  taken_at?: string | null
  location?: { lat: number; lon: number; city?: string | null } | null
  camera?: { make?: string | null; model?: string | null } | null
  dimensions?: { width?: number | null; height?: number | null } | null
}

interface GuestPhoto {
  id: string
  wedding_id?: string
  s3_key?: string
  display_url: string | null
  download_url: string | null
  preview_status: 'ready' | 'generating' | 'unavailable'
  uploader_name: string | null
  status: "pending" | "approved" | "rejected"
  file_name: string | null
  file_size: number | null
  preview_size: number | null
  mime_type: string | null
  created_at: string
  metadata?: GuestPhotoMetadata | null
}

type FilterStatus = "pending" | "approved" | "rejected" | "favorites" | "all"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    })
  } catch { return "" }
}

function isVideo(photo: GuestPhoto) {
  return (
    photo.mime_type?.startsWith("video/") ||
    /\.(mp4|mov|webm|avi|mkv)$/i.test(photo.file_name ?? "")
  )
}

const STATUS_DOT: Record<string, string> = {
  approved: "#22c55e",
  rejected: "#ef4444",
  pending:  "#f59e0b",
}

// ─── CSS animations injected once ────────────────────────────────────────────

const REVIEW_STYLES = `
  @keyframes reviewFadeIn {
    from { opacity: 0 }
    to   { opacity: 1 }
  }
  @keyframes photoSlideRight {
    from { opacity: 0; transform: translateX(56px) scale(0.95) }
    to   { opacity: 1; transform: translateX(0) scale(1) }
  }
  @keyframes photoSlideLeft {
    from { opacity: 0; transform: translateX(-56px) scale(0.95) }
    to   { opacity: 1; transform: translateX(0) scale(1) }
  }
  @keyframes photoFadeIn {
    from { opacity: 0; transform: scale(0.97) }
    to   { opacity: 1; transform: scale(1) }
  }
  @keyframes thumbPulse {
    0%   { outline-color: rgba(255,255,255,0.75) }
    50%  { outline-color: rgba(255,255,255,0.35) }
    100% { outline-color: rgba(255,255,255,0.75) }
  }
  @keyframes heartBeat {
    0%   { transform: scale(1) }
    25%  { transform: scale(1.3) }
    50%  { transform: scale(1) }
    75%  { transform: scale(1.15) }
    100% { transform: scale(1) }
  }
  @keyframes snackIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.94) }
    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1) }
  }
`

// ─── Toolbar button ───────────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>

function TBtn({
  icon: Icon, label, onClick, active = false, activeColor,
  danger = false, disabled = false, badge,
}: {
  icon: LucideIcon; label: string; onClick: () => void
  active?: boolean; activeColor?: string; danger?: boolean
  disabled?: boolean; badge?: string
}) {
  const color    = active && activeColor ? activeColor : danger ? "rgba(185,28,28,0.6)" : "rgba(66,12,20,0.45)"
  const hoverCol = danger ? "#b91c1c" : "#420c14"
  const hoverBg  = danger ? "rgba(185,28,28,0.08)" : "rgba(66,12,20,0.06)"

  return (
    <button
      title={label} disabled={disabled} onClick={onClick}
      className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium
                 transition-colors duration-100 disabled:opacity-30 select-none cursor-pointer"
      style={{ background: active && activeColor ? `${activeColor}18` : "transparent", color }}
      onMouseEnter={e => {
        if (!active) { const el = e.currentTarget as HTMLElement; el.style.color = hoverCol; el.style.background = hoverBg }
      }}
      onMouseLeave={e => {
        if (!active) { const el = e.currentTarget as HTMLElement; el.style.color = color; el.style.background = active && activeColor ? `${activeColor}18` : "transparent" }
      }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden md:inline">{label}</span>
      {badge && (
        <kbd className="hidden md:inline text-[9px] font-bold rounded px-1" style={{ background: "rgba(66,12,20,0.07)", color: "rgba(66,12,20,0.3)" }}>
          {badge}
        </kbd>
      )}
    </button>
  )
}

function TDivider() {
  return <div className="w-px h-5 shrink-0 mx-0.5" style={{ background: "rgba(66,12,20,0.1)" }} />
}

// ─── Filmstrip ────────────────────────────────────────────────────────────────

function Filmstrip({ photos, currentIndex, onSelect, favorites }: {
  photos: GuestPhoto[]; currentIndex: number; onSelect: (i: number) => void; favorites: Set<string>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbRefs    = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const container = containerRef.current
    const thumb     = thumbRefs.current[currentIndex]
    if (!container || !thumb) return
    const left = thumb.offsetLeft - container.clientWidth / 2 + thumb.clientWidth / 2
    container.scrollTo({ left: Math.max(0, left), behavior: "smooth" })
  }, [currentIndex])

  return (
    <div
      ref={containerRef}
      className="hidden sm:flex shrink-0 items-center gap-px overflow-x-auto overflow-y-hidden"
      style={{
        height: 108,
        background: "#0d0a08",
        borderTop: "1px solid rgba(221,164,111,0.12)",
        scrollbarWidth: "none",
        paddingLeft: 6, paddingRight: 6,
        animation: "reviewFadeIn 0.35s ease-out 0.1s both",
      }}
    >
      {photos.map((photo, i) => {
        const active = i === currentIndex
        const dotCol = favorites.has(photo.id) ? "#fb7185" : STATUS_DOT[photo.status]
        return (
          <button
            key={photo.id}
            ref={el => { thumbRefs.current[i] = el }}
            onClick={() => onSelect(i)}
            className="relative shrink-0 group cursor-pointer"
            style={{
              width: 80, height: 80,
              outline: active ? "2px solid rgba(255,255,255,0.78)" : "2px solid transparent",
              outlineOffset: 1,
              animation: active ? "thumbPulse 2s ease-in-out infinite" : "none",
              transition: "outline-color 0.2s",
            }}
          >
            {isVideo(photo) ? (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "#1e1e1e" }}>
                <span className="text-white/25">▶</span>
              </div>
            ) : photo.display_url ? (
              <img
                src={photo.display_url} draggable={false}
                className="w-full h-full object-cover transition-all duration-150 group-hover:brightness-125"
                style={{ opacity: active ? 1 : 0.48 }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#420c14]/5">
                <Camera className="w-4 h-4 text-[#420c14]/20" />
              </div>
            )}
            <span
              className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
              style={{ background: dotCol, boxShadow: "0 0 0 1px rgba(0,0,0,0.55)" }}
            />
          </button>
        )
      })}
    </div>
  )
}

// ─── Metadata row ────────────────────────────────────────────────────────────

function MetaRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <Icon className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "rgba(221,164,111,0.55)" }} />
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-[0.25em] mb-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>{label}</p>
        <p className="text-[11px] leading-snug break-words" style={{ color: "rgba(255,255,255,0.78)" }}>{value}</p>
      </div>
    </div>
  )
}

// ─── Review mode ─────────────────────────────────────────────────────────────

function ReviewMode({ photos, startIndex, onClose, onStatusChange, onDelete, favorites, onToggleFavorite, onRetryPreview, retryingPreview }: {
  photos: GuestPhoto[]
  startIndex: number
  onClose: () => void
  onStatusChange: (id: string, status: "approved" | "rejected") => Promise<void>
  onDelete: (id: string) => Promise<void>
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
  onRetryPreview: (id: string) => void
  retryingPreview: string | null
}) {
  const [index, setIndex]                 = useState(startIndex)
  const [direction, setDirection]         = useState<"next" | "prev" | null>(null)
  const [busy, setBusy]                   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showInfo, setShowInfo]           = useState(false)
  const showInfoRef                       = useRef(false)
  showInfoRef.current = showInfo

  const { t } = useTranslation()
  const [snack, setSnack] = useState<{ text: string; type: "approved" | "rejected" } | null>(null)
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showSnack = useCallback((text: string, type: "approved" | "rejected") => {
    if (snackTimer.current) clearTimeout(snackTimer.current)
    setSnack({ text, type })
    snackTimer.current = setTimeout(() => setSnack(null), 2500)
  }, [])
  useEffect(() => () => { if (snackTimer.current) clearTimeout(snackTimer.current) }, [])

  // Ref-based drag — bypasses React state for 60fps smoothness
  const cardRef      = useRef<HTMLDivElement>(null)
  const overlayRef   = useRef<HTMLDivElement>(null)
  const startXRef    = useRef(0)
  const rawDxRef     = useRef(0)
  const draggingRef  = useRef(false)
  const swipeDirRef  = useRef<"right" | "left" | null>(null)
  const THRESHOLD    = 92

  // Keep index in bounds if photos shrink (deletion)
  useEffect(() => {
    if (photos.length === 0) { onClose(); return }
    if (index >= photos.length) setIndex(photos.length - 1)
  }, [photos.length, index, onClose])

  useEffect(() => { setConfirmDelete(false); setShowInfo(false) }, [index])

  // Prefetch adjacent photos so navigation after approve/reject is instant
  useEffect(() => {
    const targets = [photos[index + 1], photos[index + 2], photos[index - 1]].filter(Boolean)
    targets.forEach(p => { if (!isVideo(p) && p.display_url) { new Image().src = p.display_url } })
  }, [index, photos])

  const current = photos[index]
  if (!current) return null

  const canNext = index < photos.length - 1
  const canPrev = index > 0
  const isFav   = favorites.has(current.id)
  const isVid   = isVideo(current)

  // ── Card DOM helpers ─────────────────────────────────────────────────────

  const springCard = (dx = 0) => {
    if (!cardRef.current) return
    cardRef.current.style.transition = "transform 0.38s cubic-bezier(0.34,1.38,0.64,1)"
    cardRef.current.style.transform  = dx === 0 ? "none" : `translateX(${dx}px) rotate(${dx * 0.012}deg)`
  }

  const hideOverlay = () => {
    if (!overlayRef.current) return
    overlayRef.current.style.opacity    = "0"
    overlayRef.current.style.background = "transparent"
    swipeDirRef.current = null
  }

  const resetCard = () => {
    draggingRef.current = false
    rawDxRef.current    = 0
    springCard(0)
    hideOverlay()
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  const navigate = useCallback((i: number, dir: "next" | "prev") => {
    setDirection(dir)
    setIndex(i)
    resetCard()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goNext = useCallback(() => {
    if (canNext) navigate(index + 1, "next")
  }, [canNext, index, navigate])

  const goPrev = useCallback(() => {
    if (canPrev) navigate(index - 1, "prev")
  }, [canPrev, index, navigate])

  // ── Actions ──────────────────────────────────────────────────────────────

  const approve = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      await onStatusChange(current.id, "approved")
      showSnack(t("admin.settings.gallery.review.approved"), "approved")
      if (canNext) navigate(index + 1, "next")
    } finally { setBusy(false) }
  }, [busy, current.id, onStatusChange, canNext, index, navigate, showSnack, t])

  const reject = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      await onStatusChange(current.id, "rejected")
      showSnack(t("admin.settings.gallery.review.rejected"), "rejected")
      if (canNext) navigate(index + 1, "next")
    } finally { setBusy(false) }
  }, [busy, current.id, onStatusChange, canNext, index, navigate, showSnack, t])

  const handleDelete = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try { await onDelete(current.id); setConfirmDelete(false) }
    finally { setBusy(false) }
  }, [busy, current.id, onDelete])

  const toggleFav = () => onToggleFavorite(current.id)

  // ── Keyboard ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext()
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   goPrev()
      if (e.key === "a" || e.key === "A") approve()
      if (e.key === "r" || e.key === "R" || e.key === "x" || e.key === "X") reject()
      if (e.key === "f" || e.key === "F") toggleFav()
      if (e.key === "i" || e.key === "I") setShowInfo(v => !v)
      if (e.key === "Escape") { if (showInfoRef.current) { setShowInfo(false) } else { onClose() } }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goNext, goPrev, approve, reject, onClose])

  // ── Drag / swipe (DOM-direct for silky 60fps) ─────────────────────────────

  const onPointerDown = (e: React.PointerEvent) => {
    if (isVid || busy) return
    e.currentTarget.setPointerCapture(e.pointerId)
    startXRef.current   = e.clientX
    rawDxRef.current    = 0
    draggingRef.current = true
    if (cardRef.current) {
      cardRef.current.style.transition = "none"
      cardRef.current.style.cursor     = "grabbing"
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return
    const rawDx = e.clientX - startXRef.current
    rawDxRef.current = rawDx

    const abs  = Math.abs(rawDx)
    const sign = Math.sign(rawDx)
    // Rubber-band resistance past threshold
    const visualDx = abs > THRESHOLD
      ? sign * (THRESHOLD + (abs - THRESHOLD) * 0.22)
      : rawDx

    // Update card directly (no React state)
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${visualDx}px) rotate(${visualDx * 0.011}deg)`
    }

    // Update overlay
    const overlay = overlayRef.current
    if (!overlay) return

    if (abs < 10) {
      overlay.style.opacity = "0"
      swipeDirRef.current   = null
      return
    }

    const progress = Math.min(abs / THRESHOLD, 1)
    const isRight  = rawDx > 0
    const dir      = isRight ? "right" : "left"

    overlay.style.opacity    = "1"
    overlay.style.background = isRight
      ? `rgba(34,197,94,${progress * 0.5})`
      : `rgba(239,68,68,${progress * 0.5})`

    if (dir !== swipeDirRef.current) {
      swipeDirRef.current = dir
      // Flip icon & label visibility
      overlay.querySelectorAll("[data-swipe-approve]").forEach(el =>
        (el as HTMLElement).style.display = isRight ? "flex" : "none"
      )
      overlay.querySelectorAll("[data-swipe-reject]").forEach(el =>
        (el as HTMLElement).style.display = isRight ? "none" : "flex"
      )
      overlay.querySelectorAll("[data-label-approve]").forEach(el =>
        (el as HTMLElement).style.opacity = isRight ? "1" : "0"
      )
      overlay.querySelectorAll("[data-label-reject]").forEach(el =>
        (el as HTMLElement).style.opacity = isRight ? "0" : "1"
      )
    }

    // Scale icon based on progress
    overlay.querySelectorAll("[data-swipe-icon]").forEach(el => {
      ;(el as HTMLElement).style.transform = `scale(${0.35 + progress * 0.65})`
    })
  }

  const onPointerUp = () => {
    if (!draggingRef.current) return
    const rawDx = rawDxRef.current
    if (cardRef.current) cardRef.current.style.cursor = "grab"
    resetCard()
    if      (rawDx >  THRESHOLD) approve()
    else if (rawDx < -THRESHOLD) reject()
  }

  // ── Status config ────────────────────────────────────────────────────────

  const statusCfg = {
    approved: { bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.25)",   text: "#15803d" },
    rejected: { bg: "rgba(185,28,28,0.09)",  border: "rgba(185,28,28,0.22)",   text: "#b91c1c" },
    pending:  { bg: "rgba(180,83,9,0.09)",   border: "rgba(180,83,9,0.22)",    text: "#b45309" },
  }[current.status]

  // Animation for photo on index change
  const photoAnim =
    direction === "next" ? "photoSlideRight 0.28s cubic-bezier(0.22,1,0.36,1) both" :
    direction === "prev" ? "photoSlideLeft  0.28s cubic-bezier(0.22,1,0.36,1) both" :
    "photoFadeIn 0.22s ease-out both"

  return (
    <>
      <style>{REVIEW_STYLES}</style>

      <div
        className="fixed inset-0 z-[9999] flex flex-col overflow-hidden"
        style={{ background: "#0d0a08", animation: "reviewFadeIn 0.18s ease-out" }}
      >
        {/* ── TOP TOOLBAR ─────────────────────────────────────────────── */}
        {/* Gold brand-line — the OhMyWedding signature */}
        <div className="shrink-0 h-px" style={{ background: "linear-gradient(to right, transparent, #DDA46F, transparent)" }} />

        <div
          className="flex items-center shrink-0 px-2 gap-0.5"
          style={{
            height: 56,
            background: "linear-gradient(to bottom, #fdf8f1 0%, #f7ede0 100%)",
            borderBottom: "1px solid rgba(221,164,111,0.28)",
            boxShadow: "0 2px 12px rgba(66,12,20,0.1), 0 1px 0 rgba(255,255,255,0.8) inset",
            animation: "reviewFadeIn 0.22s ease-out",
          }}
        >
          {/* Back */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium cursor-pointer"
            style={{ color: "rgba(66,12,20,0.4)" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = "#420c14"; el.style.background = "rgba(66,12,20,0.06)" }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = "rgba(66,12,20,0.4)"; el.style.background = "transparent" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("admin.settings.gallery.actions.backToGallery")}</span>
          </button>

          <TDivider />

          {/* Uploader / date */}
          <div className="flex flex-col justify-center px-1.5 min-w-0 max-w-[140px] sm:max-w-[200px]">
            {current.uploader_name && (
              <span className="text-[11px] font-medium truncate" style={{ color: "#420c14" }}>
                {current.uploader_name}
              </span>
            )}
            <span className="text-[10px] tabular-nums" style={{ color: "rgba(66,12,20,0.38)" }}>
              {formatDate(current.created_at)}
            </span>
          </div>

          <div className="flex-1" />

          {/* ── PRIMARY: Approve / Reject ── */}
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "rgba(66,12,20,0.04)", border: "1px solid rgba(66,12,20,0.1)" }}>
            <button
              onClick={approve} disabled={busy} title={t("admin.settings.gallery.actions.approve")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150 disabled:opacity-40"
              style={{
                background: current.status === "approved" ? "rgba(22,163,74,0.14)" : "rgba(22,163,74,0.05)",
                color:      current.status === "approved" ? "#15803d" : "rgba(22,163,74,0.7)",
                border:     `1px solid ${current.status === "approved" ? "rgba(22,163,74,0.35)" : "rgba(22,163,74,0.18)"}`,
              }}
              onMouseEnter={e => { if (current.status !== "approved") { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(22,163,74,0.1)"; el.style.color = "#15803d" } }}
              onMouseLeave={e => { if (current.status !== "approved") { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(22,163,74,0.05)"; el.style.color = "rgba(22,163,74,0.7)" } }}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{t("admin.settings.gallery.actions.approve")}</span>
              <kbd className="hidden lg:inline text-[9px] rounded px-1" style={{ background: "rgba(66,12,20,0.07)", color: "rgba(66,12,20,0.3)" }}>A</kbd>
            </button>

            <button
              onClick={reject} disabled={busy} title={t("admin.settings.gallery.actions.reject")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150 disabled:opacity-40"
              style={{
                background: current.status === "rejected" ? "rgba(185,28,28,0.12)" : "rgba(185,28,28,0.04)",
                color:      current.status === "rejected" ? "#b91c1c" : "rgba(185,28,28,0.55)",
                border:     `1px solid ${current.status === "rejected" ? "rgba(185,28,28,0.3)" : "rgba(185,28,28,0.16)"}`,
              }}
              onMouseEnter={e => { if (current.status !== "rejected") { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(185,28,28,0.09)"; el.style.color = "#b91c1c" } }}
              onMouseLeave={e => { if (current.status !== "rejected") { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(185,28,28,0.04)"; el.style.color = "rgba(185,28,28,0.55)" } }}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{t("admin.settings.gallery.actions.reject")}</span>
              <kbd className="hidden lg:inline text-[9px] rounded px-1" style={{ background: "rgba(66,12,20,0.07)", color: "rgba(66,12,20,0.3)" }}>R</kbd>
            </button>
          </div>

          <TDivider />

          {/* ── SECONDARY: Heart / Download ── */}
          <button
            onClick={toggleFav} title={isFav ? t("admin.settings.gallery.actions.unfavorite") : t("admin.settings.gallery.actions.favorite")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium cursor-pointer transition-all duration-150"
            style={{
              background: isFav ? "rgba(251,113,133,0.12)" : "transparent",
              color:      isFav ? "#e11d48" : "rgba(66,12,20,0.4)",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; if (!isFav) { el.style.color = "#e11d48"; el.style.background = "rgba(251,113,133,0.08)" } }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; if (!isFav) { el.style.color = "rgba(66,12,20,0.4)"; el.style.background = "transparent" } }}
          >
            <Heart
              className="w-3.5 h-3.5 shrink-0 transition-all"
              style={{
                fill: isFav ? "#e11d48" : "transparent",
                color: isFav ? "#e11d48" : undefined,
                animation: isFav ? "heartBeat 0.4s ease-out" : "none",
              }}
            />
            <span className="hidden md:inline">{isFav ? t("admin.settings.gallery.actions.favorited") : t("admin.settings.gallery.actions.favorite")}</span>
          </button>

          <a
            href={current.download_url ?? current.display_url ?? '#'} download={current.file_name ?? "photo"} target="_blank" rel="noopener noreferrer"
            title={t("admin.settings.gallery.actions.download")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium cursor-pointer"
            style={{ color: "rgba(66,12,20,0.4)" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = "#420c14"; el.style.background = "rgba(66,12,20,0.06)" }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = "rgba(66,12,20,0.4)"; el.style.background = "transparent" }}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">{t("admin.settings.gallery.actions.download")}</span>
          </a>

          <button
            onClick={() => setShowInfo(v => !v)}
            title={t("admin.settings.gallery.actions.info")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium cursor-pointer transition-all duration-150"
            style={{
              background: showInfo ? "rgba(66,12,20,0.08)" : "transparent",
              color:      showInfo ? "#420c14" : "rgba(66,12,20,0.4)",
            }}
            onMouseEnter={e => { if (!showInfo) { const el = e.currentTarget as HTMLElement; el.style.color = "#420c14"; el.style.background = "rgba(66,12,20,0.06)" } }}
            onMouseLeave={e => { if (!showInfo) { const el = e.currentTarget as HTMLElement; el.style.color = "rgba(66,12,20,0.4)"; el.style.background = "transparent" } }}
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">{t("admin.settings.gallery.actions.info")}</span>
          </button>

          <TDivider />

          {/* ── Delete ── */}
          {confirmDelete ? (
            <div className="flex items-center gap-1 px-1">
              <span className="text-[10px] hidden sm:inline" style={{ color: "rgba(185,28,28,0.7)" }}>{t("admin.settings.gallery.actions.deleteConfirm")}</span>
              <button onClick={handleDelete} className="px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer" style={{ background: "rgba(185,28,28,0.1)", color: "#b91c1c" }}>
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : t("admin.settings.gallery.actions.yes")}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-md text-[11px] cursor-pointer" style={{ color: "rgba(66,12,20,0.4)" }}>{t("admin.settings.gallery.actions.no")}</button>
            </div>
          ) : (
            <TBtn icon={Trash2} label={t("admin.settings.gallery.actions.delete")} onClick={() => setConfirmDelete(true)} danger />
          )}

          <TDivider />

          {/* ── Status + counter ── */}
          <div className="flex items-center gap-2 px-1.5 shrink-0">
            <span
              className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, color: statusCfg.text }}
            >
              {t(`admin.settings.gallery.filters.${current.status}` as any)}
            </span>
            <span className="text-xs tabular-nums" style={{ color: "rgba(66,12,20,0.45)" }}>
              {index + 1}<span style={{ color: "rgba(66,12,20,0.2)" }}> / {photos.length}</span>
            </span>
          </div>
        </div>

        {/* ── PHOTO AREA ──────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden select-none">

          {/* Left nav */}
          <button
            onClick={goPrev} disabled={!canPrev || busy}
            className="hidden sm:flex absolute left-4 z-10 w-11 h-11 rounded-full items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.15)"; el.style.color = "#fff"; el.style.transform = "scale(1.08)" }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.07)"; el.style.color = "rgba(255,255,255,0.55)"; el.style.transform = "" }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Outer drag wrapper */}
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="relative touch-none"
            style={{
              maxWidth: "min(90vw, 1100px)",
              cursor: isVid ? "default" : "grab",
            }}
          >
            {/* Inner card — ref'd for direct DOM transform */}
            <div ref={cardRef} className="relative">

              {/* Photo/video with entrance animation on navigation */}
              <div key={`${index}`} style={{ animation: photoAnim }}>
                {isVid ? (
                  <video
                    src={current.display_url ?? undefined} controls
                    className="block max-w-full"
                    style={{ maxHeight: "calc(100vh - 52px - 108px - 8px)", boxShadow: "0 24px 80px rgba(0,0,0,0.92)" }}
                  />
                ) : current.display_url ? (
                  <img
                    src={current.display_url} alt={current.file_name ?? "Photo"} draggable={false}
                    className="block max-w-full"
                    style={{
                      maxHeight: "calc(100vh - 52px - 108px - 8px)",
                      objectFit: "contain",
                      boxShadow: "0 24px 80px rgba(0,0,0,0.92)",
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-white/40"
                    style={{ minHeight: 260 }}>
                    <Camera className="w-10 h-10" />
                    <p className="text-sm">
                      {current.preview_status === 'generating' ? 'Preview generating…' : 'Preview not available'}
                    </p>
                    <button
                      onClick={() => onRetryPreview(current.id)}
                      disabled={retryingPreview === current.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                    >
                      {retryingPreview === current.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <RotateCw className="w-3.5 h-3.5" />
                      }
                      Retry preview
                    </button>
                  </div>
                )}
              </div>

              {/* Swipe overlay — always in DOM, shown/hidden via direct DOM ops */}
              <div
                ref={overlayRef}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ opacity: 0, transition: "opacity 0.05s", background: "transparent" }}
              >
                {/* Approve icon */}
                <div data-swipe-approve data-swipe-icon
                  className="rounded-full flex items-center justify-center"
                  style={{ display: "none", width: 72, height: 72, background: "rgba(34,197,94,0.9)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", transform: "scale(0.35)", transition: "transform 0.05s" }}
                >
                  <Check className="w-8 h-8 text-white" />
                </div>
                {/* Reject icon */}
                <div data-swipe-reject data-swipe-icon
                  className="rounded-full flex items-center justify-center"
                  style={{ display: "none", width: 72, height: 72, background: "rgba(239,68,68,0.9)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", transform: "scale(0.35)", transition: "transform 0.05s" }}
                >
                  <X className="w-8 h-8 text-white" />
                </div>
                {/* APPROVE label */}
                <div data-label-approve
                  className="absolute left-4 top-1/2 px-3 py-1.5 rounded-lg border-[2.5px] text-sm font-bold tracking-widest uppercase"
                  style={{ transform: "translateY(-50%) rotate(-12deg)", color: "#fff", borderColor: "#22c55e", opacity: 0, transition: "opacity 0.06s" }}
                >APPROVE</div>
                {/* REJECT label */}
                <div data-label-reject
                  className="absolute right-4 top-1/2 px-3 py-1.5 rounded-lg border-[2.5px] text-sm font-bold tracking-widest uppercase"
                  style={{ transform: "translateY(-50%) rotate(12deg)", color: "#fff", borderColor: "#ef4444", opacity: 0, transition: "opacity 0.06s" }}
                >REJECT</div>
              </div>
            </div>
          </div>

          {/* Right nav */}
          <button
            onClick={goNext} disabled={!canNext || busy}
            className="hidden sm:flex absolute right-4 z-10 w-11 h-11 rounded-full items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.15)"; el.style.color = "#fff"; el.style.transform = "scale(1.08)" }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.07)"; el.style.color = "rgba(255,255,255,0.55)"; el.style.transform = "" }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Mobile nav strip */}
          <div className="sm:hidden absolute bottom-2 inset-x-0 flex justify-between px-5">
            <button onClick={goPrev} disabled={!canPrev} className="disabled:opacity-0 flex items-center gap-1 text-xs cursor-pointer" style={{ color: "rgba(255,255,255,0.3)" }}>
              <ChevronLeft className="w-4 h-4" /> {t("admin.settings.gallery.actions.prev")}
            </button>
            <span className="self-center text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.2)" }}>{index + 1} / {photos.length}</span>
            <button onClick={goNext} disabled={!canNext} className="disabled:opacity-0 flex items-center gap-1 text-xs cursor-pointer" style={{ color: "rgba(255,255,255,0.3)" }}>
              {t("admin.settings.gallery.actions.next")} <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="sm:hidden absolute top-2 inset-x-0 text-center text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
            {t("admin.settings.gallery.actions.swipeHint")}
          </p>

          {/* ── INFO PANEL ─────────────────────────────────────────────── */}
          {showInfo && (
            <div
              className="absolute right-0 top-0 bottom-0 w-72 overflow-y-auto"
              style={{
                background: "linear-gradient(to bottom, rgba(13,10,8,0.96) 0%, rgba(20,14,10,0.98) 100%)",
                borderLeft: "1px solid rgba(221,164,111,0.12)",
                animation: "reviewFadeIn 0.18s ease-out",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Gold line */}
              <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(221,164,111,0.5), transparent)" }} />

              <div className="p-5 space-y-5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.45em] mb-3" style={{ color: "#DDA46F" }}>{t("admin.settings.gallery.review.photoDetails")}</p>

                  {/* Contributor */}
                  <MetaRow icon={User} label={t("admin.settings.gallery.review.contributor")} value={current.uploader_name ?? "—"} />

                  {/* Upload time */}
                  <MetaRow
                    icon={Clock}
                    label={t("admin.settings.gallery.review.uploaded")}
                    value={new Date(current.created_at).toLocaleString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  />

                  {/* EXIF taken_at */}
                  {current.metadata?.taken_at && (
                    <MetaRow
                      icon={Clock}
                      label={t("admin.settings.gallery.review.taken")}
                      value={new Date(current.metadata.taken_at).toLocaleString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    />
                  )}

                  {/* Location */}
                  {current.metadata?.location && (
                    <MetaRow
                      icon={MapPin}
                      label={t("admin.settings.gallery.review.location")}
                      value={
                        current.metadata.location.city
                          ? current.metadata.location.city
                          : `${current.metadata.location.lat.toFixed(4)}, ${current.metadata.location.lon.toFixed(4)}`
                      }
                    />
                  )}

                  {/* Camera */}
                  {current.metadata?.camera && (current.metadata.camera.make || current.metadata.camera.model) && (
                    <MetaRow
                      icon={Aperture}
                      label={t("admin.settings.gallery.review.camera")}
                      value={[current.metadata.camera.make, current.metadata.camera.model].filter(Boolean).join(" ")}
                    />
                  )}

                  {/* Dimensions */}
                  {current.metadata?.dimensions && (current.metadata.dimensions.width || current.metadata.dimensions.height) && (
                    <MetaRow
                      icon={FileImage}
                      label={t("admin.settings.gallery.review.resolution")}
                      value={`${current.metadata.dimensions.width ?? "?"}×${current.metadata.dimensions.height ?? "?"} px`}
                    />
                  )}

                  {/* File info */}
                  {(current.file_name || current.file_size) && (
                    <MetaRow
                      icon={FileImage}
                      label={t("admin.settings.gallery.review.file")}
                      value={[
                        current.file_name,
                        current.file_size ? `${(current.file_size / 1024 / 1024).toFixed(1)} MB` : null,
                      ].filter(Boolean).join(" · ")}
                    />
                  )}
                </div>

                {/* GPS coordinates footer */}
                {current.metadata?.location && (
                  <div
                    className="rounded-xl px-3 py-2.5 text-[10px] tabular-nums"
                    style={{ background: "rgba(221,164,111,0.07)", color: "rgba(221,164,111,0.5)" }}
                  >
                    GPS {current.metadata.location.lat.toFixed(6)}, {current.metadata.location.lon.toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── FILMSTRIP ───────────────────────────────────────────────── */}
        <Filmstrip photos={photos} currentIndex={index} onSelect={i => { setDirection(i > index ? "next" : "prev"); setIndex(i); resetCard() }} favorites={favorites} />

        {/* ── SNACKBAR ────────────────────────────────────────────────── */}
        {snack && (
          <div
            className="absolute bottom-20 left-1/2 px-5 py-2.5 rounded-full text-sm font-semibold pointer-events-none"
            style={{
              background: snack.type === "approved" ? "rgba(16,185,129,0.92)" : "rgba(185,28,28,0.88)",
              color: "#fff",
              backdropFilter: "blur(8px)",
              animation: "snackIn 0.24s cubic-bezier(0.34,1.56,0.64,1) both",
              transform: "translateX(-50%)",
            }}
          >
            {snack.text}
          </div>
        )}
      </div>
    </>
  )
}

// ─── QR Modal ────────────────────────────────────────────────────────────────

// Pick the right logo variant based on background luminance
function getLogo(bgColor: string): string {
  if (bgColor === "transparent") return "/images/logos/OMW Logo Gold.png"
  const hex = bgColor.replace('#', '')
  if (hex.length !== 6) return "/images/logos/OMW Logo Gold.png"
  const num = parseInt(hex, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const lum = 0.2126 * r / 255 + 0.7152 * g / 255 + 0.0722 * b / 255
  return lum < 0.45 ? "/images/logos/OMW Logo White.png" : "/images/logos/OMW Logo Gold.png"
}

const CHECKER_BG = "repeating-conic-gradient(#d0d0d0 0% 25%, #ffffff 0% 50%) 0 0 / 8px 8px"

const QR_MODAL_STYLES = `
  @keyframes qrModalIn {
    from { opacity: 0; transform: scale(0.94) translateY(20px) }
    to   { opacity: 1; transform: scale(1) translateY(0) }
  }
`

function QRColorPicker({ label, value, onChange, themeColors, allowTransparent }: {
  label: string
  value: string
  onChange: (v: string) => void
  themeColors?: { primary?: string; secondary?: string; accent?: string }
  allowTransparent?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  const brandColors = [
    { label: t("admin.settings.gallery.qr.colorBurgundy"), color: "#420c14" },
    { label: t("admin.settings.gallery.qr.colorGold"),     color: "#DDA46F" },
    { label: t("admin.settings.gallery.qr.colorIvory"),    color: "#f5f2eb" },
    { label: t("admin.settings.gallery.qr.colorBlack"),    color: "#000000" },
    { label: t("admin.settings.gallery.qr.colorWhite"),    color: "#ffffff" },
  ]

  const weddingColors = themeColors ? [
    themeColors.primary   ? { label: t("admin.settings.gallery.qr.colorPrimary"),   color: themeColors.primary }   : null,
    themeColors.secondary ? { label: t("admin.settings.gallery.qr.colorSecondary"), color: themeColors.secondary } : null,
    themeColors.accent    ? { label: t("admin.settings.gallery.qr.colorAccent"),    color: themeColors.accent }    : null,
  ].filter(Boolean) as { label: string; color: string }[] : []

  const swatchStyle = (c: string, active: boolean) => ({
    background:  active ? "#420c14" : "#fff",
    borderColor: active ? "#420c14" : "rgba(66,12,20,0.12)",
    color:       active ? "#f5f2eb" : "rgba(66,12,20,0.6)",
  })

  const borderColor = open ? "#DDA46F" : "rgba(66,12,20,0.1)"

  return (
    <div className="flex-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 bg-white px-3 py-2.5 text-left cursor-pointer transition-colors"
        style={{
          border: `1px solid ${borderColor}`,
          borderRadius: open ? "0.75rem 0.75rem 0 0" : "0.75rem",
          borderBottom: open ? `1px solid ${borderColor}` : undefined,
        }}
      >
        <div className="w-4 h-4 rounded shrink-0" style={{
          background: value === "transparent" ? CHECKER_BG : value,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
        }} />
        <span className="flex-1 text-[11px]" style={{ color: "rgba(66,12,20,0.55)" }}>{label}</span>
        <ChevronDown className="w-3 h-3 shrink-0 transition-transform duration-150"
          style={{ color: "rgba(66,12,20,0.3)", transform: open ? "rotate(180deg)" : undefined }} />
      </button>

      {open && (
        <div className="bg-white p-3"
          style={{ border: `1px solid ${borderColor}`, borderTop: "none", borderRadius: "0 0 0.75rem 0.75rem" }}>

          {weddingColors.length > 0 && (
            <>
              <p className="text-[8px] uppercase tracking-[0.3em] mb-2" style={{ color: "rgba(66,12,20,0.35)" }}>{t("admin.settings.gallery.qr.colorSectionWedding")}</p>
              <div className="flex gap-1.5 flex-wrap mb-3">
                {weddingColors.map(c => (
                  <button key={c.label} onClick={() => { onChange(c.color); setOpen(false) }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] border cursor-pointer transition-all"
                    style={swatchStyle(c.color, value === c.color)}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color, boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }} />
                    {c.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="text-[8px] uppercase tracking-[0.3em] mb-2" style={{ color: "rgba(66,12,20,0.35)" }}>{t("admin.settings.gallery.qr.colorSectionBrand")}</p>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {brandColors.map(c => (
              <button key={c.label} onClick={() => { onChange(c.color); setOpen(false) }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] border cursor-pointer transition-all"
                style={swatchStyle(c.color, value === c.color)}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color, boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }} />
                {c.label}
              </button>
            ))}
          </div>

          {allowTransparent && (
            <button onClick={() => { onChange("transparent"); setOpen(false) }}
              className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-[10px] border cursor-pointer mb-2 transition-all"
              style={swatchStyle("transparent", value === "transparent")}>
              <span className="w-4 h-4 rounded shrink-0" style={{ background: CHECKER_BG, boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }} />
              {t("admin.settings.gallery.qr.colorNone")}
            </button>
          )}

          <label className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl border cursor-pointer text-[10px]"
            style={{ borderColor: "rgba(66,12,20,0.1)", color: "rgba(66,12,20,0.5)" }}>
            <div className="relative w-4 h-4 rounded shrink-0"
              style={{ background: value !== "transparent" ? value : "#ffffff", boxShadow: "0 0 0 1px rgba(0,0,0,0.15)" }}>
              <input type="color" value={value !== "transparent" ? value : "#ffffff"}
                onChange={e => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            {t("admin.settings.gallery.qr.colorCustom")}
          </label>
        </div>
      )}
    </div>
  )
}

function QRModal({ url, onClose, coupleInitials = "", displayFontFamily, themeColors }: {
  url: string
  onClose: () => void
  coupleInitials?: string
  displayFontFamily?: string
  themeColors?: { primary?: string; secondary?: string; accent?: string }
}) {
  const { t } = useTranslation()
  const defaultInitials = coupleInitials
  const [fgColor,           setFgColor]           = useState("#420c14")
  const [bgColor,           setBgColor]           = useState("#ffffff")
  const [centerType,        setCenterType]        = useState<"none" | "rings" | "initials" | "logo-initials">(
    defaultInitials ? "logo-initials" : "none"
  )
  const [initials,          setInitials]          = useState(defaultInitials)
  const [centerUrl,         setCenterUrl]         = useState<string | undefined>(undefined)
  const [downloadCenterUrl, setDownloadCenterUrl] = useState<string | undefined>(undefined)
  const [downloadSize,      setDownloadSize]      = useState<540 | 720 | 1080>(1080)
  const [fontReady,         setFontReady]         = useState(0)
  const canvasRef         = useRef<HTMLDivElement>(null)
  const downloadCanvasRef = useRef<HTMLDivElement>(null)

  const handleDownload = useCallback(() => {
    const canvas = downloadCanvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null
    if (!canvas) return
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = `wedding-qr-${downloadSize}.png`
    a.click()
  }, [downloadSize])

  // Load the wedding display font so it renders on canvas
  useEffect(() => {
    if (!displayFontFamily) return
    const fontName = displayFontFamily.replace(/['"]/g, '').split(',')[0].trim()
    if (!document.querySelector(`link[data-qr-font="${fontName}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.split(' ').join('+')}&display=swap`
      link.setAttribute('data-qr-font', fontName)
      document.head.appendChild(link)
    }
    document.fonts.load(`600 40px "${fontName}"`).then(() => setFontReady(r => r + 1)).catch(() => {})
  }, [displayFontFamily])

  // Build center-image data URLs at display size (120px) and download size (proportional)
  useEffect(() => {
    if (centerType === "none") { setCenterUrl(undefined); setDownloadCenterUrl(undefined); return }

    const generate = (S: number): Promise<string | undefined> => new Promise(resolve => {
      const cv = document.createElement("canvas")
      cv.width = S; cv.height = S
      const ctx = cv.getContext("2d")
      if (!ctx) { resolve(undefined); return }

      if (bgColor !== "transparent") {
        ctx.fillStyle = bgColor
        ctx.beginPath()
        ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      if (centerType === "rings" || centerType === "logo-initials") {
        const img = new Image()
        img.onload = () => {
          const iw = img.naturalWidth || 1
          const ih = img.naturalHeight || 1
          if (centerType === "rings") {
            const scale = Math.min((S * 0.76) / iw, (S * 0.76) / ih)
            const w = iw * scale; const h = ih * scale
            ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h)
          } else {
            const scale = Math.min((S * 0.70) / iw, (S * 0.48) / ih)
            const w = iw * scale; const h = ih * scale
            ctx.drawImage(img, (S - w) / 2, S * 0.08, w, h)
            const text = initials.trim().slice(0, 4)
            if (text) {
              const fs = text.length > 2 ? S * 0.19 : S * 0.23
              const fontName = displayFontFamily
                ? displayFontFamily.replace(/['"]/g, '').split(',')[0].trim()
                : 'Georgia'
              ctx.fillStyle    = fgColor
              ctx.font         = `600 ${fs}px "${fontName}", Georgia, serif`
              ctx.textAlign    = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(text, S / 2, S * 0.83)
            }
          }
          resolve(cv.toDataURL("image/png"))
        }
        img.onerror = () => resolve(undefined)
        img.src = getLogo(bgColor)
        return
      }

      const text = initials.trim().slice(0, 4)
      if (!text) { resolve(undefined); return }
      const fs = text.length > 2 ? S * 0.26 : S * 0.34
      const fontName = displayFontFamily
        ? displayFontFamily.replace(/['"]/g, '').split(',')[0].trim()
        : 'Georgia'
      ctx.fillStyle     = fgColor
      ctx.font          = `600 ${fs}px "${fontName}", Georgia, serif`
      ctx.textAlign     = "center"
      ctx.textBaseline  = "middle"
      ctx.letterSpacing = "1px"
      ctx.fillText(text, S / 2, S / 2)
      resolve(cv.toDataURL("image/png"))
    })

    const dlS = Math.round(120 * downloadSize / 240)
    Promise.all([generate(120), generate(dlS)]).then(([display, download]) => {
      setCenterUrl(display)
      setDownloadCenterUrl(download)
    })
  }, [centerType, initials, fgColor, bgColor, displayFontFamily, fontReady, downloadSize])

  const imgSettings = centerUrl
    ? { src: centerUrl, height: 72, width: 72, excavate: true }
    : undefined
  const downloadImgSettings = downloadCenterUrl
    ? { src: downloadCenterUrl, height: Math.round(72 * downloadSize / 240), width: Math.round(72 * downloadSize / 240), excavate: true }
    : undefined

  return (
    <>
      <style>{QR_MODAL_STYLES}</style>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4"
        style={{ background: "rgba(15,6,8,0.65)", backdropFilter: "blur(10px)" }}
        onClick={onClose}
      >
        {/* Card */}
        <div
          className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-x-hidden overflow-y-auto"
          style={{
            background: "#fdf8f1",
            boxShadow: "0 24px 80px rgba(66,12,20,0.45)",
            animation: "qrModalIn 0.28s cubic-bezier(0.22,1,0.36,1) both",
            maxHeight: "90dvh",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Gold signature line */}
          <div style={{ height: 2, background: "linear-gradient(to right, transparent, #DDA46F, transparent)" }} />

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.5em] text-[#DDA46F] font-medium mb-0.5">{t("admin.settings.gallery.qr.eyebrow")}</p>
              <h3 className="text-xl font-serif text-[#420c14]">{t("admin.settings.gallery.qr.title")}</h3>
            </div>
            <button
              onClick={onClose}
              className="mt-1 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(66,12,20,0.07)", color: "rgba(66,12,20,0.5)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(66,12,20,0.12)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(66,12,20,0.07)" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* QR Preview */}
          <div className="flex flex-col items-center px-6 pb-4">
            <div
              ref={canvasRef}
              className="rounded-2xl p-4"
              style={{
                background: bgColor === "transparent" ? CHECKER_BG : bgColor,
                border: "1px solid rgba(66,12,20,0.08)",
                boxShadow: "0 8px 32px rgba(66,12,20,0.16)",
              }}
            >
              <QRCodeCanvas
                key={`${fgColor}-${bgColor}-${centerType}-${initials}-${fontReady}`}
                value={url}
                size={240}
                fgColor={fgColor}
                bgColor={bgColor === "transparent" ? "rgba(0,0,0,0)" : bgColor}
                level="H"
                imageSettings={imgSettings}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="px-5 pb-6 space-y-4">

            {/* ── Color ── */}
            <div>
              <p className="text-[9px] uppercase tracking-[0.45em] text-[#DDA46F] mb-2.5">{t("admin.settings.gallery.qr.color")}</p>
              <div className="flex gap-2">
                <QRColorPicker
                  label={t("admin.settings.gallery.qr.pattern")}
                  value={fgColor}
                  onChange={setFgColor}
                  themeColors={themeColors}
                  allowTransparent={false}
                />
                <QRColorPicker
                  label={t("admin.settings.gallery.qr.background")}
                  value={bgColor}
                  onChange={setBgColor}
                  themeColors={themeColors}
                  allowTransparent={true}
                />
              </div>
            </div>

            {/* ── Center element ── */}
            <div>
              <p className="text-[9px] uppercase tracking-[0.45em] text-[#DDA46F] mb-2.5">{t("admin.settings.gallery.qr.center")}</p>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {([
                  ["none",         t("admin.settings.gallery.qr.centerNone")],
                  ["rings",        t("admin.settings.gallery.qr.centerLogo")],
                  ["initials",     t("admin.settings.gallery.qr.centerInitials")],
                  ["logo-initials",t("admin.settings.gallery.qr.centerLogoInitials")],
                ] as const).map(([type, label]) => {
                  const active = centerType === type
                  return (
                    <button
                      key={type}
                      onClick={() => setCenterType(type)}
                      className="py-2 px-3 rounded-xl text-[11px] font-medium border transition-all cursor-pointer"
                      style={{
                        background:  active ? "#420c14" : "#fff",
                        borderColor: active ? "#420c14" : "rgba(66,12,20,0.1)",
                        color:       active ? "#f5f2eb" : "rgba(66,12,20,0.55)",
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {(centerType === "initials" || centerType === "logo-initials") && (
                <div>
                  <input
                    type="text"
                    value={initials}
                    onChange={e => setInitials(e.target.value.slice(0, 4))}
                    placeholder={t("admin.settings.gallery.qr.initialsPlaceholder")}
                    autoFocus
                    className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors"
                    style={{
                      borderColor: "rgba(66,12,20,0.12)",
                      color: "#420c14",
                      fontFamily: displayFontFamily || "Georgia, serif",
                      letterSpacing: "0.06em",
                    }}
                    onFocus={e  => { e.currentTarget.style.borderColor = "#DDA46F" }}
                    onBlur={e   => { e.currentTarget.style.borderColor = "rgba(66,12,20,0.12)" }}
                  />
                  {displayFontFamily && (
                    <p className="mt-1 text-[9px]" style={{ color: "rgba(66,12,20,0.3)" }}>
                      {t("admin.settings.gallery.qr.usingWeddingFont").replace("{font}", displayFontFamily.replace(/['"]/g, '').split(',')[0].trim())}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Quality ── */}
            <div>
              <p className="text-[9px] uppercase tracking-[0.45em] text-[#DDA46F] mb-2.5">{t("admin.settings.gallery.qr.quality")}</p>
              <div className="flex gap-1.5">
                {([540, 720, 1080] as const).map(size => {
                  const active = downloadSize === size
                  return (
                    <button
                      key={size}
                      onClick={() => setDownloadSize(size)}
                      className="flex-1 py-2 rounded-xl border transition-all cursor-pointer"
                      style={{
                        background:  active ? "#420c14" : "#fff",
                        borderColor: active ? "#420c14" : "rgba(66,12,20,0.1)",
                        color:       active ? "#f5f2eb" : "rgba(66,12,20,0.55)",
                      }}
                    >
                      <span className="block text-[11px] font-semibold">
                        {size === 1080 ? t("admin.settings.gallery.qr.qualityMax") : size === 720 ? t("admin.settings.gallery.qr.qualityHigh") : t("admin.settings.gallery.qr.qualityMedium")}
                      </span>
                      <span className="block text-[9px] opacity-60 mt-0.5">{size}×{size}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Download ── */}
            <button
              onClick={handleDownload}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              style={{ background: "#420c14", color: "#f5f2eb" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#5a1a22" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#420c14" }}
            >
              <Download className="w-4 h-4" />
              {t("admin.settings.gallery.actions.downloadQr")}
            </button>

          </div>
        </div>
      </div>

      {/* Hidden high-res canvas — sized to downloadSize for export */}
      <div
        ref={downloadCanvasRef}
        aria-hidden
        style={{ position: "fixed", left: "-9999px", top: "-9999px", pointerEvents: "none" }}
      >
        <QRCodeCanvas
          key={`dl-${fgColor}-${bgColor}-${centerType}-${initials}-${fontReady}-${downloadSize}`}
          value={url}
          size={downloadSize}
          fgColor={fgColor}
          bgColor={bgColor === "transparent" ? "rgba(0,0,0,0)" : bgColor}
          level="H"
          imageSettings={downloadImgSettings}
        />
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GalleryPage({ params }: GalleryPageProps) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)
  const { t } = useTranslation()

  const [photos, setPhotos]                           = useState<GuestPhoto[]>([])
  const [loading, setLoading]                         = useState(true)
  const [filter, setFilter]                           = useState<FilterStatus>("all")
  const setFilterAndReset = (f: FilterStatus) => { setFilter(f); setConfirmBulkDelete(false) }
  const [guestUploadsEnabled, setGuestUploadsEnabled] = useState(false)
  const [copiedLink, setCopiedLink]                   = useState(false)
  const [updatingId, setUpdatingId]                   = useState<string | null>(null)
  const [togglingUploads, setTogglingUploads]         = useState(false)
  const [reviewIndex, setReviewIndex]                 = useState<number | null>(null)
  const [favorites, setFavorites]                     = useState<Set<string>>(new Set())
  const [downloading, setDownloading]                 = useState(false)
  const [bulkDeleting, setBulkDeleting]               = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete]     = useState(false)
  const [qrModalOpen, setQrModalOpen]                 = useState(false)
  const [shareExpanded, setShareExpanded]             = useState(false)
  const [coupleInitials, setCoupleInitials]           = useState("")
  const [retryingPreview, setRetryingPreview]         = useState<string | null>(null)
  const [displayFontFamily, setDisplayFontFamily]     = useState<string | undefined>()
  const [themeColors, setThemeColors]                 = useState<{ primary?: string; secondary?: string; accent?: string } | undefined>()
  const [hiddenPhotoIds, setHiddenPhotoIds]           = useState<Set<string>>(new Set())
  const [showTimeline, setShowTimeline]               = useState(false)
  const [gallerySort, setGallerySort]                 = useState<"taken" | "uploaded">("taken")
  const checkedExistenceRef                           = useRef<Set<string>>(new Set())

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }, [])

  const retryPreview = useCallback(async (photoId: string) => {
    setRetryingPreview(photoId)
    try {
      const retryRes = await fetch('/api/guest-photos/retry-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      })
      const retryData = await retryRes.json().catch(() => ({}))
      if (!retryRes.ok || retryData.generated === false) {
        console.error('[retry-preview] generation failed for', photoId, retryData)
      }
      // Reload so the new preview URL appears (or we see updated status)
      const res = await fetch(`/api/guest-photos?weddingNameId=${encodeURIComponent(decodedWeddingId)}`)
      if (res.ok) setPhotos((await res.json()).photos ?? [])
    } finally {
      setRetryingPreview(null)
    }
  }, [decodedWeddingId])

  // Auto-generate previews for any stuck photos on gallery load
  const autoGeneratingRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    const stuck = photos.filter(p => p.preview_status === 'generating' && !autoGeneratingRef.current.has(p.id))
    if (stuck.length === 0) return
    stuck.forEach(p => autoGeneratingRef.current.add(p.id))

    let cancelled = false
    void (async () => {
      for (const photo of stuck) {
        if (cancelled) return
        await fetch('/api/guest-photos/retry-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId: photo.id }),
        }).catch(() => {})
      }
      if (cancelled) return
      const res = await fetch(`/api/guest-photos?weddingNameId=${encodeURIComponent(decodedWeddingId)}`)
      if (!cancelled && res.ok) setPhotos((await res.json()).photos ?? [])
    })()
    return () => { cancelled = true }
  }, [photos, decodedWeddingId])

  const uploadUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${getWeddingPath(decodedWeddingId, "photos")}`
      : ""

  useEffect(() => {
    fetch(`/api/weddings/${decodedWeddingId}/settings`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.settings) setGuestUploadsEnabled(!!data.settings.gallery_allow_guest_uploads) })
  }, [decodedWeddingId])

  useEffect(() => {
    fetch(`/api/weddings/${decodedWeddingId}/details`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.details) return
        const { partner1_first_name, partner2_first_name, page_config } = data.details
        const i1 = partner1_first_name?.trim().charAt(0).toUpperCase() ?? ""
        const i2 = partner2_first_name?.trim().charAt(0).toUpperCase() ?? ""
        const built = [i1, i2].filter(Boolean).join("&")
        if (built) setCoupleInitials(built)
        const theme = page_config?.siteSettings?.theme
        if (theme?.fonts?.displayFamily) setDisplayFontFamily(theme.fonts.displayFamily)
        if (theme?.colors?.primary || theme?.colors?.secondary || theme?.colors?.accent) {
          setThemeColors({
            primary:   theme.colors.primary,
            secondary: theme.colors.secondary,
            accent:    theme.colors.accent,
          })
        }
      })
      .catch(() => {})
  }, [decodedWeddingId])

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/guest-photos?weddingNameId=${encodeURIComponent(decodedWeddingId)}`)
      if (res.ok) setPhotos((await res.json()).photos ?? [])
    } finally { setLoading(false) }
  }, [decodedWeddingId])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  // Check S3 existence for photos that have no preview and aren't generating.
  // On failure we assume existing — never hide a photo due to a transient S3/network error.
  useEffect(() => {
    const unchecked = photos.filter(p =>
      !p.display_url &&
      p.preview_status === 'unavailable' &&
      !checkedExistenceRef.current.has(p.id)
    )
    if (unchecked.length === 0) return
    unchecked.forEach(p => checkedExistenceRef.current.add(p.id))

    void fetch('/api/guest-photos/check-exists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoIds: unchecked.map(p => p.id) }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.results) return
        const missing = Object.entries(data.results as Record<string, boolean>)
          .filter(([, exists]) => !exists)
          .map(([id]) => id)
        if (missing.length > 0) setHiddenPhotoIds(prev => new Set([...prev, ...missing]))
      })
      .catch(() => {})
  }, [photos])

  const updateStatus = useCallback(async (photoId: string, status: "approved" | "rejected") => {
    setUpdatingId(photoId)
    try {
      const res = await fetch("/api/guest-photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, status }),
      })
      if (res.ok) {
        setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, status } : p))
      }
    } finally { setUpdatingId(null) }
  }, [])

  const deletePhoto = useCallback(async (photoId: string) => {
    try {
      await fetch(`/api/guest-photos?photoId=${encodeURIComponent(photoId)}`, { method: "DELETE" })
      setPhotos(prev => prev.filter(p => p.id !== photoId))
    } catch { /* handled via UI */ }
  }, [])

  const downloadAll = async (filterType: 'approved' | 'all') => {
    setDownloading(true)
    try {
      const res = await fetch('/api/guest-photos/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingNameId: decodedWeddingId, filter: filterType }),
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${decodedWeddingId}-photos-${filterType}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // silently fail — user can retry
    } finally {
      setDownloading(false)
    }
  }

  const bulkDeleteRejected = async () => {
    setBulkDeleting(true)
    try {
      const res = await fetch('/api/guest-photos/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingNameId: decodedWeddingId }),
      })
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.status !== 'rejected'))
      }
    } finally {
      setBulkDeleting(false)
      setConfirmBulkDelete(false)
    }
  }

  const copyUploadLink = async () => {
    if (!uploadUrl) return
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(uploadUrl)
      else {
        const ta = document.createElement("textarea")
        ta.value = uploadUrl; ta.style.cssText = "position:fixed;opacity:0"
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta)
      }
      setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000)
    } catch { /* ignore */ }
  }

  const enableUploads = async () => {
    setTogglingUploads(true)
    try {
      const res = await fetch(`/api/weddings/${decodedWeddingId}/settings`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gallery_allow_guest_uploads: true }),
      })
      if (res.ok) setGuestUploadsEnabled(true)
    } finally { setTogglingUploads(false) }
  }

  const visiblePhotos = photos.filter(p => !hiddenPhotoIds.has(p.id))

  const counts = {
    pending:  visiblePhotos.filter(p => p.status === "pending").length,
    approved: visiblePhotos.filter(p => p.status === "approved").length,
    rejected: visiblePhotos.filter(p => p.status === "rejected").length,
  }

  const storageBytes = visiblePhotos.reduce((sum, p) => sum + (p.file_size ?? 0) + (p.preview_size ?? 0), 0)

  const filteredBase =
    filter === "all"       ? visiblePhotos :
    filter === "favorites" ? visiblePhotos.filter(p => favorites.has(p.id)) :
    visiblePhotos.filter(p => p.status === filter)

  const filtered = [...filteredBase].sort((a, b) => {
    const keyA = gallerySort === "taken"
      ? (a.metadata?.taken_at ? new Date(a.metadata.taken_at).getTime() : new Date(a.created_at).getTime())
      : new Date(a.created_at).getTime()
    const keyB = gallerySort === "taken"
      ? (b.metadata?.taken_at ? new Date(b.metadata.taken_at).getTime() : new Date(b.created_at).getTime())
      : new Date(b.created_at).getTime()
    return keyA - keyB
  })

  const filters: { key: FilterStatus; label: string; count?: number; icon?: React.ReactNode }[] = [
    { key: "all",       label: t("admin.settings.gallery.filters.all") },
    { key: "pending",   label: t("admin.settings.gallery.filters.pending"),  count: counts.pending },
    { key: "approved",  label: t("admin.settings.gallery.filters.approved"), count: counts.approved },
    { key: "rejected",  label: t("admin.settings.gallery.filters.rejected"), count: counts.rejected },
    { key: "favorites", label: t("admin.settings.gallery.filters.favorites"), count: favorites.size, icon: <Heart className="w-3 h-3" style={{ fill: "currentColor" }} /> },
  ]

  const emptyTitle =
    filter === "all"      ? t("admin.settings.gallery.empty.noPhotos")  :
    filter === "pending"  ? t("admin.settings.gallery.empty.noPending") :
    filter === "approved" ? t("admin.settings.gallery.empty.noApproved") :
                            t("admin.settings.gallery.empty.noRejected")

  return (
    <>
      {/* QR customization modal */}
      {qrModalOpen && uploadUrl && (
        <QRModal
          url={uploadUrl}
          onClose={() => setQrModalOpen(false)}
          coupleInitials={coupleInitials}
          displayFontFamily={displayFontFamily}
          themeColors={themeColors}
        />
      )}

      {reviewIndex !== null && filtered.length > 0 && (
        <ReviewMode
          photos={filtered}
          startIndex={Math.min(reviewIndex, filtered.length - 1)}
          onClose={() => setReviewIndex(null)}
          onStatusChange={updateStatus}
          onDelete={deletePhoto}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onRetryPreview={retryPreview}
          retryingPreview={retryingPreview}
        />
      )}

      <ContributionTimeline
        photos={photos}
        isOpen={showTimeline}
        onClose={() => setShowTimeline(false)}
        onPhotoClick={(photoId) => {
          const idx = filtered.findIndex(p => p.id === photoId)
          if (idx !== -1) {
            setReviewIndex(idx)
          } else {
            // Photo might be filtered out — switch to "all" and open it
            setFilterAndReset("all")
            const allIdx = photos.findIndex(p => p.id === photoId)
            if (allIdx !== -1) setReviewIndex(allIdx)
          }
          // Timeline stays open — ReviewMode (z-[9999]) covers it, and closing ReviewMode reveals the panel again
        }}
      />

      <main className="min-h-screen bg-background">
        <Header
          showBackButton
          backHref={getCleanAdminUrl(weddingId, "dashboard")}
          title={t("admin.dashboard.cards.gallery.title")}
          rightContent={null}
        />

        <div className="page-container">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">
              {t("admin.dashboard.management")}
            </p>
            <h1 className="text-2xl font-serif text-[#420c14] mb-1">
              {t("admin.dashboard.cards.gallery.title")}
            </h1>
            <p className="text-sm text-[#420c14]/60">
              {t("admin.dashboard.cards.gallery.description")}
            </p>
          </div>

          {/* Storage stats */}
          {!loading && photos.length > 0 && (() => {
            const QUOTA = 10 * 1024 * 1024 * 1024 // 10 GB
            const usedPct = Math.min(storageBytes / QUOTA, 1)
            const available = Math.max(QUOTA - storageBytes, 0)
            return (
              <div className="mb-6 flex flex-wrap gap-3">
                {[
                  { label: "Total photos", value: String(photos.length) },
                  { label: "Pending review", value: String(counts.pending), accent: counts.pending > 0 },
                  { label: "Approved", value: String(counts.approved) },
                ].map(stat => (
                  <div
                    key={stat.label}
                    className="flex-1 min-w-[120px] rounded-xl px-4 py-3"
                    style={{ background: "rgba(66,12,20,0.03)", border: "1px solid rgba(66,12,20,0.07)" }}
                  >
                    <p className="text-[9px] uppercase tracking-[0.25em] mb-1" style={{ color: stat.accent ? "#b45309" : "rgba(66,12,20,0.4)" }}>
                      {stat.label}
                    </p>
                    <p className="text-lg font-semibold tabular-nums leading-none" style={{ color: stat.accent ? "#b45309" : "#420c14" }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
                {/* Storage card with progress bar */}
                <div
                  className="flex-1 min-w-[180px] rounded-xl px-4 py-3"
                  style={{ background: "rgba(66,12,20,0.03)", border: "1px solid rgba(66,12,20,0.07)" }}
                >
                  <p className="text-[9px] uppercase tracking-[0.25em] mb-1" style={{ color: "rgba(66,12,20,0.4)" }}>Storage</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-semibold tabular-nums leading-none" style={{ color: "#420c14" }}>{formatBytes(storageBytes)}</span>
                    <span className="text-[10px]" style={{ color: "rgba(66,12,20,0.35)" }}>used</span>
                  </div>
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(66,12,20,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${usedPct * 100}%`, background: usedPct > 0.9 ? "#b91c1c" : "#DDA46F" }} />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "rgba(66,12,20,0.35)" }}>{formatBytes(available)} available</p>
                </div>
              </div>
            )
          })()}

          {/* Share / QR card — collapsible */}
          {uploadUrl && (
            <div className={`mb-8 rounded-2xl border overflow-hidden ${
              guestUploadsEnabled ? "border-[#DDA46F]/30 bg-[#DDA46F]/5" : "border-[#420c14]/10 bg-[#420c14]/3"
            }`}>
              {/* Toggle header */}
              <button
                onClick={() => setShareExpanded(v => !v)}
                className="w-full flex items-center justify-between px-5 sm:px-6 py-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] font-medium">
                    {t("admin.settings.gallery.share.title")}
                  </p>
                  {!shareExpanded && (
                    <span className="text-[11px] text-[#420c14]/45 italic hidden sm:block">
                      {t("admin.settings.gallery.share.viewQr")}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className="w-4 h-4 shrink-0 transition-transform duration-200"
                  style={{ color: "rgba(66,12,20,0.4)", transform: shareExpanded ? "rotate(180deg)" : undefined }}
                />
              </button>

              {/* Expanded content */}
              {shareExpanded && (
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-5 sm:pb-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center border-t border-[#420c14]/8">
                  <button
                    onClick={() => guestUploadsEnabled && setQrModalOpen(true)}
                    className={`shrink-0 p-3 bg-white rounded-xl border shadow-sm transition-all duration-200 ${
                      guestUploadsEnabled
                        ? "border-[#DDA46F]/20 cursor-pointer hover:shadow-md hover:scale-[1.03] hover:border-[#DDA46F]/45"
                        : "border-[#420c14]/10 opacity-30 blur-[2px] select-none cursor-default"
                    }`}
                    title={guestUploadsEnabled ? t("admin.settings.gallery.actions.customizeQrTitle") : undefined}
                  >
                    <QRCodeSVG value={uploadUrl} size={110} fgColor="#420c14" bgColor="transparent" level="M" />
                    {guestUploadsEnabled && (
                      <p className="text-[9px] text-center mt-1.5 tracking-wide uppercase font-medium" style={{ color: "rgba(66,12,20,0.35)" }}>
                        {t("admin.settings.gallery.actions.customize")}
                      </p>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#420c14]/70 leading-relaxed mb-4 max-w-md">
                      {guestUploadsEnabled
                        ? t("admin.settings.gallery.share.description")
                        : t("admin.settings.gallerySettings.allowGuestUploadsDescription")}
                    </p>
                    {guestUploadsEnabled ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={copyUploadLink}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#420c14] text-[#f5f2eb] px-3 py-2 text-sm font-medium hover:bg-[#5a1a22] transition-colors cursor-pointer">
                          {copiedLink
                            ? <><CheckCircle2 className="w-3.5 h-3.5" />{t("admin.settings.gallery.actions.copied")}</>
                            : <><Copy className="w-3.5 h-3.5" />{t("admin.settings.gallery.actions.copyLink")}</>}
                        </button>
                        <a href={uploadUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#420c14]/20 bg-white text-[#420c14] px-3 py-2 text-sm font-medium hover:bg-[#420c14]/5 transition-colors cursor-pointer">
                          <ExternalLink className="w-3.5 h-3.5" /> {t("admin.settings.gallery.actions.viewPage")}
                        </a>
                      </div>
                    ) : (
                      <button onClick={enableUploads} disabled={togglingUploads}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#420c14] text-[#f5f2eb] px-4 py-2 text-sm font-medium hover:bg-[#5a1a22] transition-colors disabled:opacity-60 cursor-pointer">
                        {togglingUploads ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                        {t("admin.settings.gallery.actions.enableUploads")}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filter tabs + Review entry */}
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Timeline toggle */}
              {photos.length > 0 && (
                <button
                  onClick={() => setShowTimeline(v => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer"
                  style={showTimeline
                    ? { background: "#420c14", color: "#f5f2eb" }
                    : { background: "rgba(66,12,20,0.05)", color: "rgba(66,12,20,0.55)" }
                  }
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Contributions</span>
                </button>
              )}
              {filters.map(({ key, label, count, icon }) => (
                <button key={key} onClick={() => setFilterAndReset(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    key === "favorites"
                      ? filter === key
                        ? "bg-rose-500 text-white"
                        : "text-rose-400/70 hover:text-rose-500 bg-rose-50 hover:bg-rose-100"
                      : filter === key
                        ? "bg-[#420c14] text-[#f5f2eb]"
                        : "text-[#420c14]/50 hover:text-[#420c14] bg-[#420c14]/5 hover:bg-[#420c14]/8"
                  }`}
                >
                  {icon}
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className={`text-xs tabular-nums ${filter === key ? "opacity-55" : "opacity-50"}`}>{count}</span>
                  )}
                </button>
              ))}
            </div>

            {visiblePhotos.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Sort toggle */}
                <div
                  className="flex items-center gap-0.5 p-0.5 rounded-lg"
                  style={{ background: "rgba(66,12,20,0.06)" }}
                >
                  {(["taken", "uploaded"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setGallerySort(mode)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer"
                      style={gallerySort === mode
                        ? { background: "#fff", color: "#420c14", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                        : { color: "rgba(66,12,20,0.45)" }
                      }
                    >
                      {mode === "taken" ? "Taken" : "Uploaded"}
                    </button>
                  ))}
                </div>
                {/* Download all — approved or all */}
                {(filter === 'approved' || filter === 'all') && (
                  <button
                    onClick={() => downloadAll(filter === 'approved' ? 'approved' : 'all')}
                    disabled={downloading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#420c14]/20 bg-white text-[#420c14] px-4 py-2 text-sm font-medium hover:bg-[#420c14]/5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {downloading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />}
                    {downloading ? 'Preparing…' : `Download ${filter === 'approved' ? 'approved' : 'all'} (${filtered.length})`}
                  </button>
                )}

                {/* Delete all rejected */}
                {filter === 'rejected' && (
                  confirmBulkDelete ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="text-xs text-red-700">Delete {filtered.length} photos?</span>
                      <button
                        onClick={bulkDeleteRejected}
                        disabled={bulkDeleting}
                        className="ml-1 px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-medium cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-60"
                      >
                        {bulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmBulkDelete(false)}
                        className="px-2 py-1 rounded-lg text-xs text-red-500 cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmBulkDelete(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete all rejected ({filtered.length})
                    </button>
                  )
                )}

                <button onClick={() => setReviewIndex(0)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#420c14] text-[#f5f2eb] px-4 py-2 text-sm font-medium hover:bg-[#5a1a22] transition-colors cursor-pointer">
                  <Check className="w-3.5 h-3.5" />
                  {filter === "pending" ? `Review ${filtered.length} pending` : t("admin.settings.gallery.actions.reviewPhotos")}
                </button>
              </div>
            )}
          </div>

          {/* Grid — click to review, hover shows expand hint */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-full bg-[#420c14]/5 flex items-center justify-center mb-5">
                <Camera className="w-6 h-6 text-[#420c14]/25" />
              </div>
              <h3 className="text-base font-serif text-[#420c14] mb-2">{emptyTitle}</h3>
              {!guestUploadsEnabled ? (
                <>
                  <p className="text-sm text-[#420c14]/50 mb-6 max-w-xs leading-relaxed">
                    Enable guest uploads so they can share photos with you.
                  </p>
                  <Button variant="outline" size="sm" disabled={togglingUploads} onClick={enableUploads}>
                    {togglingUploads && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    {t("admin.settings.gallery.actions.enableUploads")}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-[#420c14]/50 max-w-xs">{emptyTitle}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0.5">
              {filtered.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setReviewIndex(idx)}
                  className="relative group aspect-square overflow-hidden bg-[#420c14]/5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#420c14]"
                  style={{ borderRadius: 0 }}
                >
                  {isVideo(photo) ? (
                    <div className="w-full h-full flex items-center justify-center bg-[#420c14]/8">
                      <ChevronRight className="w-6 h-6 text-[#420c14]/25" />
                    </div>
                  ) : photo.display_url ? (
                    <img
                      src={photo.display_url} alt={photo.file_name ?? "Guest photo"}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.05] group-hover:brightness-90"
                      style={photo.status === "rejected" ? { filter: "grayscale(1)", opacity: 0.5 } : undefined}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-[#420c14]/5">
                      <Camera className="w-5 h-5 text-[#420c14]/20" />
                      <span className="text-[9px] text-[#420c14]/30 leading-none">
                        {photo.preview_status === 'generating' ? 'Generating…' : 'No preview'}
                      </span>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={e => { e.stopPropagation(); if (retryingPreview !== photo.id) retryPreview(photo.id) }}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); if (retryingPreview !== photo.id) retryPreview(photo.id) } }}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium cursor-pointer"
                        style={{ background: 'rgba(66,12,20,0.08)', color: retryingPreview === photo.id ? 'rgba(66,12,20,0.25)' : 'rgba(66,12,20,0.45)' }}
                      >
                        {retryingPreview === photo.id
                          ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          : <RotateCw className="w-2.5 h-2.5" />
                        }
                        Retry
                      </div>
                    </div>
                  )}

                  {/* Hover overlay — subtle dark tint + expand icon */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300 pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 translate-y-1 group-hover:translate-y-0 w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
                      <Maximize2 className="w-4 h-4 text-white/90" />
                    </div>
                  </div>

                  {/* Status + favorite badges — top-right cluster */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                    {favorites.has(photo.id) && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full"
                        style={{ background: "rgba(0,0,0,0.5)" }}>
                        <Heart className="w-2.5 h-2.5" style={{ fill: "#fb7185", color: "#fb7185" }} />
                      </span>
                    )}
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: STATUS_DOT[photo.status], boxShadow: "0 0 0 1.5px rgba(0,0,0,0.4)" }}
                    />
                  </div>

                  {/* Uploader name */}
                  {photo.uploader_name && (
                    <div
                      className="absolute inset-x-0 bottom-0 px-2 pt-5 pb-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-250"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)" }}
                    >
                      <p className="text-[10px] text-white/85 truncate leading-none">{photo.uploader_name}</p>
                    </div>
                  )}

                  {updatingId === photo.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

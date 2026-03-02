"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Image as ImageIcon, Trash2, FileText, Download, Check, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageGalleryDialog } from '@/components/ui/image-gallery-dialog'
import { useI18n } from '@/components/contexts/i18n-context'

interface SectionOption {
  key: string
  label: string
  available: boolean
}

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  weddingNameId: string
  heroImageUrl?: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  availableSections: SectionOption[]
  onExport: (options: ExportOptions) => void
  isExporting: boolean
  exportProgress: number | null
}

export type PaletteVariant = 'original' | 'light' | 'lighter'
export type ColorSource = 'primary' | 'accent'

export interface ExportOptions {
  coverImageUrl?: string
  closingImageUrl?: string
  selectedSections: string[]
  bgSource: ColorSource
  bgVariant: PaletteVariant
  hlSource: ColorSource
  hlVariant: PaletteVariant
  showSuppliersFinancial: boolean
  showDeclinedGuests: boolean
}

// ─────────────────────────────────────────────
function getLightTintHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255
  return `#${[r, g, b].map(c => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')).join('')}`
}

function isLightColor(hex: string): boolean {
  if (!hex.startsWith('#') || hex.length < 4) return false
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
}

// Miniature A4 page previews ~100×141px
function PageMiniPreview({ type, primaryColor, accentColor, coverImageUrl }: {
  type: 'cover' | 'index' | 'closing'
  primaryColor: string; accentColor: string; coverImageUrl?: string
}) {
  const W = 100, H = Math.round(W * (1123 / 794))
  if (type === 'cover') {
    return (
      <div style={{ width: W, height: H, backgroundColor: primaryColor, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {coverImageUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${primaryColor}BB 0%, ${primaryColor}66 50%, ${accentColor}55 100%)` }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: `linear-gradient(to top, ${primaryColor}EE 0%, transparent 100%)` }} />
        <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ height: 2, width: 32, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
          <div style={{ height: 1.5, width: 22, backgroundColor: `${accentColor}AA`, borderRadius: 1 }} />
          <div style={{ height: 1, width: 16, backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: 1 }} />
        </div>
      </div>
    )
  }
  if (type === 'index') {
    return (
      <div style={{ width: W, height: H, backgroundColor: '#fefdfb', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', backgroundColor: primaryColor }} />
        <div style={{ position: 'absolute', top: '9%', left: 10 }}>
          <div style={{ height: 1, width: 12, backgroundColor: accentColor, marginBottom: 4 }} />
          <div style={{ height: 3, width: 45, backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 1 }} />
        </div>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ position: 'absolute', left: 10, right: 10, top: `${34 + i * 17}%`, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', border: `1px solid ${accentColor}`, flexShrink: 0 }} />
            <div style={{ height: 1.5, flex: 1, backgroundColor: '#e0dbd4', borderRadius: 1 }} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div style={{ width: W, height: H, backgroundColor: primaryColor, position: 'relative', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {coverImageUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18 }} />}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, transparent 30%, ${primaryColor}BB 90%)` }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 34, height: 9, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 1 }} />
        <div style={{ height: 1, width: 18, backgroundColor: 'rgba(255,255,255,0.25)' }} />
        <div style={{ height: 3, width: 38, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
        <div style={{ height: 1.5, width: 22, backgroundColor: `${accentColor}88`, borderRadius: 1 }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Luxury export progress overlay (Canva-like)
// ─────────────────────────────────────────────
function ExportProgressOverlay({ progress, primaryColor, accentColor, t }: {
  progress: number
  primaryColor: string
  accentColor: string
  t: (k: string) => string
}) {
  const step = useMemo(() => {
    if (progress < 15) return { key: 'preparing', index: 0 }
    if (progress < 60) return { key: 'capturing', index: 1 }
    if (progress < 85) return { key: 'assembling', index: 2 }
    if (progress < 100) return { key: 'finishing', index: 3 }
    return { key: 'complete', index: 4 }
  }, [progress])

  const waveHeight = Math.min(progress, 100)

  return (
    <div className="flex flex-col items-center justify-center px-8 py-12" style={{ minHeight: 380 }}>
      {/* Wave circle container */}
      <div
        className="relative mb-8"
        style={{ width: 140, height: 140 }}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${accentColor}30`,
          }}
        />
        {/* Rotating accent ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid transparent`,
            borderTopColor: accentColor,
            borderRightColor: accentColor,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner circle with wave fill */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            top: 6, left: 6, right: 6, bottom: 6,
            backgroundColor: `${primaryColor}0A`,
          }}
        >
          {/* Rising wave fill */}
          <motion.div
            className="absolute bottom-0 left-0 right-0"
            style={{
              backgroundColor: `${accentColor}25`,
            }}
            initial={{ height: '0%' }}
            animate={{ height: `${waveHeight}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Wave SVG on top */}
            <svg
              viewBox="0 0 200 20"
              preserveAspectRatio="none"
              className="absolute -top-2.5 left-0 w-full"
              style={{ height: 12 }}
            >
              <motion.path
                d="M0,10 C30,4 60,16 100,10 C140,4 170,16 200,10 L200,20 L0,20 Z"
                fill={`${accentColor}25`}
                animate={{
                  d: [
                    'M0,10 C30,4 60,16 100,10 C140,4 170,16 200,10 L200,20 L0,20 Z',
                    'M0,10 C30,16 60,4 100,10 C140,16 170,4 200,10 L200,20 L0,20 Z',
                    'M0,10 C30,4 60,16 100,10 C140,4 170,16 200,10 L200,20 L0,20 Z',
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </svg>
          </motion.div>

          {/* Second wave layer */}
          <motion.div
            className="absolute bottom-0 left-0 right-0"
            style={{
              backgroundColor: `${accentColor}18`,
            }}
            initial={{ height: '0%' }}
            animate={{ height: `${Math.max(0, waveHeight - 3)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <svg
              viewBox="0 0 200 20"
              preserveAspectRatio="none"
              className="absolute -top-2 left-0 w-full"
              style={{ height: 10 }}
            >
              <motion.path
                d="M0,10 C40,16 80,4 120,10 C160,16 200,4 200,10 L200,20 L0,20 Z"
                fill={`${accentColor}18`}
                animate={{
                  d: [
                    'M0,10 C40,16 80,4 120,10 C160,16 200,4 200,10 L200,20 L0,20 Z',
                    'M0,10 C40,4 80,16 120,10 C160,4 200,16 200,10 L200,20 L0,20 Z',
                    'M0,10 C40,16 80,4 120,10 C160,16 200,4 200,10 L200,20 L0,20 Z',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </svg>
          </motion.div>

          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.span
              key={progress}
              initial={{ opacity: 0.7, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="font-semibold tabular-nums"
              style={{ fontSize: 32, color: primaryColor, letterSpacing: -1 }}
            >
              {progress}%
            </motion.span>
          </div>
        </div>
      </div>

      {/* Step label with animation */}
      <AnimatePresence mode="wait">
        <motion.p
          key={step.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-medium text-foreground mb-2 text-center"
        >
          {t(`admin.summary.exportModal.exportSteps.${step.key}`)}
        </motion.p>
      </AnimatePresence>

      {/* Step dots */}
      <div className="flex items-center gap-2 mt-3">
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: i === step.index ? 20 : 6,
              height: 6,
              backgroundColor: i <= step.index ? accentColor : `${primaryColor}20`,
            }}
            animate={{
              width: i === step.index ? 20 : 6,
              backgroundColor: i <= step.index ? accentColor : `${primaryColor}20`,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Subtle tip */}
      <p className="text-xs text-muted-foreground/60 mt-6 text-center">
        {progress < 100 ? t('admin.summary.exportModal.exportSteps.pleaseWait') : t('admin.summary.exportModal.exportSteps.downloadStarting')}
      </p>
    </div>
  )
}

export function ExportModal({
  isOpen,
  onClose,
  weddingNameId,
  heroImageUrl,
  primaryColor,
  secondaryColor,
  accentColor,
  availableSections,
  onExport,
  isExporting,
  exportProgress,
}: ExportModalProps) {
  const { t } = useI18n()

  // Persistence key per wedding
  const storageKey = `export-settings-${weddingNameId}`

  // Load saved settings from localStorage (once)
  const savedSettings = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) as Partial<ExportOptions> : null
    } catch { return null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const defaultSections = useMemo(() => availableSections.filter(s => s.available).map(s => s.key), [availableSections])

  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(heroImageUrl ?? undefined)
  const [closingImageUrl, setClosingImageUrl] = useState<string | undefined>(savedSettings?.closingImageUrl)
  const [selectedSections, setSelectedSections] = useState<string[]>(
    savedSettings?.selectedSections?.filter(k => availableSections.some(s => s.key === k && s.available)) ?? defaultSections
  )
  const [bgSource, setBgSource] = useState<ColorSource>(savedSettings?.bgSource ?? 'primary')
  const [bgVariant, setBgVariant] = useState<PaletteVariant>(savedSettings?.bgVariant ?? 'original')
  const [hlSource, setHlSource] = useState<ColorSource>(savedSettings?.hlSource ?? 'accent')
  const [hlVariant, setHlVariant] = useState<PaletteVariant>(savedSettings?.hlVariant ?? 'original')
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [showClosingImagePicker, setShowClosingImagePicker] = useState(false)
  const [showSuppliersFinancial, setShowSuppliersFinancial] = useState(savedSettings?.showSuppliersFinancial ?? false)
  const [showDeclinedGuests, setShowDeclinedGuests] = useState(savedSettings?.showDeclinedGuests ?? true)

  const resolveColor = (source: ColorSource, variant: PaletteVariant) => {
    const base = source === 'primary' ? primaryColor : accentColor
    if (variant === 'light') return getLightTintHex(base, 0.5)
    if (variant === 'lighter') return getLightTintHex(base, 0.88)
    return base
  }

  const effectiveBg = useMemo(() => resolveColor(bgSource, bgVariant), [bgSource, bgVariant, primaryColor, accentColor])
  const effectiveHl = useMemo(() => resolveColor(hlSource, hlVariant), [hlSource, hlVariant, primaryColor, accentColor])

  useEffect(() => {
    if (isOpen) {
      setCoverImageUrl(heroImageUrl ?? undefined)
    }
  }, [isOpen, heroImageUrl])

  const toggleSection = (key: string) => {
    setSelectedSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const handleExport = () => {
    const opts: ExportOptions = { coverImageUrl, closingImageUrl, selectedSections, bgSource, bgVariant, hlSource, hlVariant, showSuppliersFinancial, showDeclinedGuests }
    // Persist settings for next export
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        closingImageUrl, selectedSections, bgSource, bgVariant, hlSource, hlVariant, showSuppliersFinancial, showDeclinedGuests,
      }))
    } catch { /* ignore quota errors */ }
    onExport(opts)
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && !isExporting && onClose()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-foreground">{t('admin.summary.exportModal.title')}</h2>
                </div>
                {!isExporting && (
                  <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Content: form OR progress overlay */}
              <AnimatePresence mode="wait">
                {isExporting && exportProgress !== null ? (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ExportProgressOverlay
                      progress={exportProgress}
                      primaryColor={primaryColor}
                      accentColor={accentColor}
                      t={t}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
                      {/* Document Palette — two role slots with swap */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                          {t('admin.summary.exportModal.weddingColors')}
                        </p>

                        {/* Role labels row */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex-1 text-center text-[11px] font-semibold text-foreground">
                            {t('admin.summary.exportModal.backgrounds')}
                          </span>
                          <div className="w-8" />{/* spacer for swap btn */}
                          <span className="flex-1 text-center text-[11px] font-semibold text-foreground">
                            {t('admin.summary.exportModal.highlights')}
                          </span>
                        </div>

                        {/* Two swatch columns + swap button */}
                        <div className="flex items-center gap-2">
                          {/* BG column */}
                          <div className="flex-1 border border-border rounded-xl p-2.5 space-y-2">
                            {([
                              { src: 'primary' as ColorSource, base: primaryColor },
                              { src: 'accent' as ColorSource, base: accentColor },
                            ]).map(({ src, base }) => (
                              <div key={src} className="flex items-center gap-1.5">
                                <span className="text-[9px] text-muted-foreground uppercase w-10 shrink-0 tracking-wide">
                                  {t(`admin.summary.exportModal.${src}`)}
                                </span>
                                <div className="flex gap-1">
                                  {([
                                    { v: 'original' as PaletteVariant, hex: base },
                                    { v: 'light' as PaletteVariant, hex: getLightTintHex(base, 0.5) },
                                    { v: 'lighter' as PaletteVariant, hex: getLightTintHex(base, 0.88) },
                                  ]).map(({ v, hex }) => {
                                    const sel = bgSource === src && bgVariant === v
                                    return (
                                      <button key={v} type="button"
                                        title={`${t(`admin.summary.exportModal.backgrounds`)}: ${src} ${v}`}
                                        onClick={() => { setBgSource(src); setBgVariant(v) }}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                          sel ? 'border-blue-500 ring-2 ring-blue-200 scale-110' : 'border-border hover:border-muted-foreground/60'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                      >
                                        {sel && <Check className="w-2.5 h-2.5" style={{ color: isLightColor(hex) ? '#374151' : '#ffffff' }} />}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Swap button */}
                          <button
                            type="button"
                            title={t('admin.summary.exportModal.swapColors')}
                            onClick={() => {
                              const prevBgSource = bgSource, prevBgVariant = bgVariant
                              setBgSource(hlSource); setBgVariant(hlVariant)
                              setHlSource(prevBgSource); setHlVariant(prevBgVariant)
                            }}
                            className="w-8 h-8 rounded-full border border-border bg-muted/50 hover:bg-muted flex items-center justify-center flex-shrink-0 transition-colors"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>

                          {/* HL column */}
                          <div className="flex-1 border border-border rounded-xl p-2.5 space-y-2">
                            {([
                              { src: 'primary' as ColorSource, base: primaryColor },
                              { src: 'accent' as ColorSource, base: accentColor },
                            ]).map(({ src, base }) => (
                              <div key={src} className="flex items-center gap-1.5">
                                <span className="text-[9px] text-muted-foreground uppercase w-10 shrink-0 tracking-wide">
                                  {t(`admin.summary.exportModal.${src}`)}
                                </span>
                                <div className="flex gap-1">
                                  {([
                                    { v: 'original' as PaletteVariant, hex: base },
                                    { v: 'light' as PaletteVariant, hex: getLightTintHex(base, 0.5) },
                                    { v: 'lighter' as PaletteVariant, hex: getLightTintHex(base, 0.88) },
                                  ]).map(({ v, hex }) => {
                                    const sel = hlSource === src && hlVariant === v
                                    return (
                                      <button key={v} type="button"
                                        title={`${t(`admin.summary.exportModal.highlights`)}: ${src} ${v}`}
                                        onClick={() => { setHlSource(src); setHlVariant(v) }}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                          sel ? 'border-blue-500 ring-2 ring-blue-200 scale-110' : 'border-border hover:border-muted-foreground/60'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                      >
                                        {sel && <Check className="w-2.5 h-2.5" style={{ color: isLightColor(hex) ? '#374151' : '#ffffff' }} />}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Page previews */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                          {t('admin.summary.exportModal.preview')}
                        </p>
                        <div className="flex gap-2">
                          {(['cover', 'index', 'closing'] as const).map(type => (
                            <div key={type} className="flex-1 flex flex-col items-center gap-1">
                              <div className="rounded overflow-hidden shadow-sm border border-border/40">
                                <PageMiniPreview
                                  type={type}
                                  primaryColor={effectiveBg}
                                  accentColor={effectiveHl}
                                  coverImageUrl={coverImageUrl}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground capitalize">{type}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cover image */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                          {t('admin.summary.exportModal.coverImage')}
                        </p>
                        {coverImageUrl ? (
                          <div className="relative rounded-lg overflow-hidden border border-border aspect-video">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0" style={{ backgroundColor: primaryColor, opacity: 0.55 }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white/80 text-xs font-medium drop-shadow">
                                {t('admin.summary.exportModal.previewOverlay')}
                              </span>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1.5">
                              <button
                                onClick={() => setShowImagePicker(true)}
                                className="bg-black/50 hover:bg-black/70 text-white rounded-md p-1.5 transition-colors"
                                title={t('admin.summary.exportModal.changeImage')}
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setCoverImageUrl(undefined)}
                                className="bg-black/50 hover:bg-destructive/80 text-white rounded-md p-1.5 transition-colors"
                                title={t('admin.summary.exportModal.removeImage')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowImagePicker(true)}
                            className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-lg py-6 flex flex-col items-center gap-2 transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <ImageIcon className="w-6 h-6 opacity-50" />
                            <span className="text-sm">{t('admin.summary.exportModal.selectImage')}</span>
                            <span className="text-xs opacity-60">{t('admin.summary.exportModal.noImageNote')}</span>
                          </button>
                        )}
                      </div>

                      {/* Closing image */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                          {t('admin.summary.closingImage')}
                        </p>
                        {closingImageUrl ? (
                          <div className="relative rounded-lg overflow-hidden border border-border aspect-video">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={closingImageUrl} alt="Closing" className="w-full h-full object-cover" />
                            <div className="absolute inset-0" style={{ backgroundColor: primaryColor, opacity: 0.55 }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white/80 text-xs font-medium drop-shadow">
                                {t('admin.summary.exportModal.previewOverlay')}
                              </span>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1.5">
                              <button
                                onClick={() => setShowClosingImagePicker(true)}
                                className="bg-black/50 hover:bg-black/70 text-white rounded-md p-1.5 transition-colors"
                                title={t('admin.summary.exportModal.changeImage')}
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setClosingImageUrl(undefined)}
                                className="bg-black/50 hover:bg-destructive/80 text-white rounded-md p-1.5 transition-colors"
                                title={t('admin.summary.exportModal.removeImage')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowClosingImagePicker(true)}
                            className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-lg py-4 flex flex-col items-center gap-1.5 transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <ImageIcon className="w-5 h-5 opacity-50" />
                            <span className="text-sm">{t('admin.summary.exportModal.selectImage')}</span>
                            <span className="text-xs opacity-60">{t('admin.summary.closingImageNote')}</span>
                          </button>
                        )}
                      </div>

                      {/* Options */}
                      {(selectedSections.includes('suppliers') || selectedSections.some(k => k.startsWith('guestsBy'))) && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                            {t('admin.summary.exportModal.options')}
                          </p>
                          <div className="space-y-2">
                            {selectedSections.includes('suppliers') && (
                              <label className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                showSuppliersFinancial ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-border/80'
                              }`}>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  showSuppliersFinancial ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                                }`}>
                                  {showSuppliersFinancial && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                </div>
                                <div>
                                  <span className="text-sm text-foreground">{t('admin.summary.exportModal.showFinancialInfo')}</span>
                                  <span className="text-xs text-muted-foreground block">{t('admin.summary.exportModal.showFinancialInfoDesc')}</span>
                                </div>
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={showSuppliersFinancial}
                                  onChange={() => setShowSuppliersFinancial(prev => !prev)}
                                />
                              </label>
                            )}
                            {selectedSections.some(k => k.startsWith('guestsBy')) && (
                              <label className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                showDeclinedGuests ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-border/80'
                              }`}>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  showDeclinedGuests ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                                }`}>
                                  {showDeclinedGuests && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                </div>
                                <div>
                                  <span className="text-sm text-foreground">{t('admin.summary.exportModal.showDeclinedGuests')}</span>
                                  <span className="text-xs text-muted-foreground block">{t('admin.summary.exportModal.showDeclinedGuestsDesc')}</span>
                                </div>
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={showDeclinedGuests}
                                  onChange={() => setShowDeclinedGuests(prev => !prev)}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sections */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                          {t('admin.summary.exportModal.sections')}
                        </p>
                        <div className="space-y-2">
                          {availableSections.map(section => (
                            <label
                              key={section.key}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                !section.available
                                  ? 'opacity-40 cursor-not-allowed border-border bg-muted/30'
                                  : selectedSections.includes(section.key)
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-border hover:border-border/80'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  !section.available
                                    ? 'border-muted-foreground/30 bg-muted'
                                    : selectedSections.includes(section.key)
                                      ? 'border-primary bg-primary'
                                      : 'border-muted-foreground/40'
                                }`}
                              >
                                {selectedSections.includes(section.key) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                              </div>
                              <span className="text-sm text-foreground">{section.label}</span>
                              {!section.available && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {t('admin.summary.exportModal.noData')}
                                </span>
                              )}
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={selectedSections.includes(section.key)}
                                disabled={!section.available}
                                onChange={() => section.available && toggleSection(section.key)}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border bg-muted/20">
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                          {t('common.cancel')}
                        </Button>
                        <Button
                          onClick={handleExport}
                          disabled={selectedSections.length === 0}
                          className="flex-1"
                        >
                          <span className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            {t('admin.summary.exportModal.exportButton')}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageGalleryDialog
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={urls => {
          if (urls[0]) setCoverImageUrl(urls[0])
          setShowImagePicker(false)
        }}
        weddingNameId={weddingNameId}
        mode="both"
      />

      <ImageGalleryDialog
        isOpen={showClosingImagePicker}
        onClose={() => setShowClosingImagePicker(false)}
        onSelectImage={urls => {
          if (urls[0]) setClosingImageUrl(urls[0])
          setShowClosingImagePicker(false)
        }}
        weddingNameId={weddingNameId}
        mode="both"
      />
    </>
  )
}

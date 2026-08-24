"use client"

import { useRef } from "react"
import { Camera, ArrowUpFromLine, X, Check, AlertCircle, Loader2, Film } from "lucide-react"
import type { BaseVariantProps, UploadItem } from "./types"
import { resolveBackground, getLuminance, MAX_CONTRIBUTION_BYTES } from "./types"

function fmtBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}
import { useI18n } from "@/components/contexts/i18n-context"
import { UploadProgressPanel } from "./upload-progress-panel"

// ─── Design tokens ────────────────────────────────────────────────────────────
// Deliberately NOT using the ornaments library — that's what makes it look AI-generated.
// This variant is built from raw CSS/SVG so every detail is intentional.

const PAPER  = '#ece6d8'  // warm laid paper — NOT generic ivory
const INK    = '#1a1412'  // letterpress near-black with warm undertone
const MUTED  = '#88786a'  // aged brown-gray

const ANIMATIONS = `
  @keyframes albumFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes albumShimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes albumPop {
    0%   { opacity: 0; transform: scale(0.85) rotate(-4deg); }
    70%  { opacity: 1; transform: scale(1.05) rotate(1deg); }
    100% { opacity: 1; transform: scale(1)    rotate(0deg); }
  }
  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes checkBounce {
    0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
    55%  { transform: scale(1.25) rotate(6deg); opacity: 1; }
    78%  { transform: scale(0.93) rotate(-2deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes errorShake {
    0%,100% { transform: translateX(0); }
    25%      { transform: translateX(-3px); }
    75%      { transform: translateX(3px); }
  }
  .album-photo  { animation: albumFadeIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
  .album-pop    { animation: albumPop   0.3s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .album-shimmer {
    background: linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.07) 50%, rgba(0,0,0,0.04) 75%);
    background-size: 200% 100%;
    animation: albumShimmer 1.6s ease-in-out infinite;
  }
  .overlay-in   { animation: overlayFadeIn 0.18s ease both; }
  .check-bounce { animation: checkBounce 0.38s cubic-bezier(0.34,1.56,0.64,1) both; }
  .error-shake  { animation: errorShake 0.32s ease both 0.05s; }
`

// ─── Paper grain overlay ───────────────────────────────────────────────────────

function PaperGrain() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)' opacity='0.06'/%3E%3C/svg%3E")`,
        mixBlendMode: 'multiply',
        opacity: 0.55,
        zIndex: 0,
      }}
    />
  )
}

// ─── Single hairline rule ─────────────────────────────────────────────────────

function HairlineRule({ accent, className = '' }: { accent: string; className?: string }) {
  return (
    <div className={`relative h-px ${className}`}>
      <div className="absolute inset-0" style={{ background: `${INK}18` }} />
      <div
        className="absolute left-0 top-0 h-full"
        style={{ width: 48, background: accent, opacity: 0.5 }}
      />
    </div>
  )
}

// ─── Photo with mounting-corner tabs ─────────────────────────────────────────

function PhotoCorners({ accent }: { accent: string }) {
  const style = { borderColor: accent, opacity: 0.75 }
  return (
    <>
      <span className="absolute top-0   left-0  w-3.5 h-3.5 border-t-[1.5px] border-l-[1.5px] pointer-events-none" style={style} />
      <span className="absolute top-0   right-0 w-3.5 h-3.5 border-t-[1.5px] border-r-[1.5px] pointer-events-none" style={style} />
      <span className="absolute bottom-0 left-0  w-3.5 h-3.5 border-b-[1.5px] border-l-[1.5px] pointer-events-none" style={style} />
      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-[1.5px] border-r-[1.5px] pointer-events-none" style={style} />
    </>
  )
}

// ─── Upload queue thumbnail ───────────────────────────────────────────────────

function QueueThumb({ item, onRemove, accent }: { item: UploadItem; onRemove: () => void; accent: string }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
      {/* Image + overlays + corners — clipped separately */}
      <div className="absolute inset-0 overflow-hidden">
        {item.file.type.startsWith('video/')
          ? <video src={item.preview} className="w-full h-full object-cover" muted playsInline preload="metadata" />
          : <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
        }
        <PhotoCorners accent={accent} />

        {item.file.type.startsWith('video/') && item.progress === 'idle' && (
          <div className="absolute top-1 left-1 rounded-sm px-0.5 py-0.5" style={{ background: 'rgba(0,0,0,0.55)' }}>
            <Film className="w-2.5 h-2.5 text-white" />
          </div>
        )}

        {item.progress === 'uploading' && (
          <div className="overlay-in absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="relative w-7 h-7">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                <circle
                  cx="14" cy="14" r="11" fill="none" stroke="white" strokeWidth="2"
                  strokeDasharray={2 * Math.PI * 11}
                  strokeDashoffset={2 * Math.PI * 11 * (1 - (item.uploadProgress ?? 0))}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.45s cubic-bezier(0.4,0,0.2,1)' }}
                />
              </svg>
            </div>
          </div>
        )}
        {item.progress === 'done' && (
          <div className="overlay-in absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.52)' }}>
            <div className="check-bounce">
              <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
          </div>
        )}
        {item.progress === 'error' && (
          <div className="overlay-in absolute inset-0 bg-red-600/50 flex items-center justify-center">
            <div className="error-shake">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Remove bubble — outside overflow-hidden, pops off the corner */}
      {(item.progress === 'idle' || item.progress === 'error') && (
        <button
          onClick={onRemove}
          className="absolute flex items-center justify-center rounded-full"
          style={{
            top: -8, right: -8,
            width: 18, height: 18,
            background: INK,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
        >
          <X className="w-2.5 h-2.5 text-white" />
        </button>
      )}
    </div>
  )
}

// ─── Custom upload zone ───────────────────────────────────────────────────────

function OldMoneyUpload({
  props,
  ink,
  bg,
  accent,
}: {
  props: BaseVariantProps
  ink: string
  bg: string
  accent: string
}) {
  const {
    uploaderName, uploaderPlaceholder, uploads, isDragging, fileInputRef,
    onUploaderNameChange, onDragOver, onDragLeave, onDrop, onDropZoneClick,
    onFileChange, onRemoveUpload, onSubmitAll, submitted, submittedUploads, moderationEnabled,
  } = props

  const { t } = useI18n()
  const btnTextColor = getLuminance(accent) > 0.35 ? INK : PAPER
  const nameEmpty = uploaderName.trim() === ''
  const idleUploads = uploads.filter(u => u.progress === 'idle')
  const allDone = uploads.length > 0 && uploads.every(u => u.progress === 'done')

  const usedBytes = uploads.reduce((sum, u) => sum + u.file.size, 0)
  const isAtLimit = usedBytes >= MAX_CONTRIBUTION_BYTES
  const usedPct = Math.min(100, (usedBytes / MAX_CONTRIBUTION_BYTES) * 100)

  const isUploading = uploads.some(u => u.progress === 'uploading')
  const doneCount = uploads.filter(u => u.progress === 'done').length
  const errorCount = uploads.filter(u => u.progress === 'error').length
  const showSummary = !isUploading && idleUploads.length === 0 && errorCount > 0
  const overallPct = uploads.length > 0
    ? Math.min(99, Math.round(uploads.reduce((sum, u) => {
        if (u.progress === 'done' || u.progress === 'error') return sum + 100
        if (u.progress === 'uploading') return sum + Math.round((u.uploadProgress ?? 0) * 100)
        return sum
      }, 0) / uploads.length))
    : 0
  const stepIndex = overallPct < 25 ? 0 : overallPct < 80 ? 1 : 2
  const stepKey = (['uploadStep1', 'uploadStep2', 'uploadStep3'] as const)[stepIndex]

  // Google Drive-style panel handles uploading state

  if (submitted) {
    const photos = (submittedUploads ?? []).filter(p => p.preview).slice(0, 5)
    const totalCount = (submittedUploads ?? []).length

    return (
      <div className="mb-12 album-pop">
        <style>{ANIMATIONS}</style>
        {/* Eyebrow */}
        <p className="text-[9px] tracking-[0.5em] uppercase mb-8" style={{ color: MUTED }}>
          {t('guestPhotos.contributionReceived')}
        </p>

        {/* Mounted photo strip */}
        {photos.length > 0 && (
          <div className="flex gap-3 justify-center mb-8 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className="album-photo relative flex-shrink-0"
                style={{
                  width: photos.length === 1 ? 200 : photos.length === 2 ? 160 : 120,
                  animationDelay: `${i * 0.1}s`,
                  transform: `rotate(${[-1.8, 1.2, -0.8, 1.5, -1.1][i % 5]}deg)`,
                }}
              >
                {/* Paper mat */}
                <div
                  className="p-2 pb-8"
                  style={{
                    background: PAPER,
                    boxShadow: '0 4px 20px rgba(26,20,18,0.18), 0 1px 4px rgba(26,20,18,0.1)',
                  }}
                >
                  <img
                    src={photo.preview} alt=""
                    className="w-full object-cover"
                    style={{ aspectRatio: '3/4', display: 'block' }}
                  />
                  <PhotoCorners accent={accent} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <HairlineRule accent={accent} className="mb-8" />

        {/* Serif thank-you */}
        <div className="text-center">
          <p
            className="leading-none mb-5"
            style={{
              fontFamily: 'var(--font-display, Georgia, serif)',
              fontSize: 'clamp(2.6rem, 9vw, 4.5rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: ink,
              letterSpacing: '-0.01em',
            }}
          >
            {t('guestPhotos.thankYou')}
          </p>

          {totalCount > 0 && (
            <p className="text-[9px] tracking-[0.4em] uppercase mb-5" style={{ color: MUTED }}>
              {totalCount === 1 ? t('guestPhotos.photograph') : t('guestPhotos.photographsCount').replace('{{count}}', String(totalCount))}
            </p>
          )}

          <div className="w-8 h-px mx-auto mb-5" style={{ background: accent, opacity: 0.55 }} />

          <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: MUTED }}>
            {moderationEnabled !== false
              ? t('guestPhotos.photographsPendingReview')
              : t('guestPhotos.photographsAddedAlbum')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-12">
      <UploadProgressPanel uploads={uploads} primary={accent} onRetryFailed={props.onRetryFailed} />
      {/* Eyebrow */}
      <p className="text-[9px] tracking-[0.5em] uppercase mb-5" style={{ color: MUTED }}>
        {t('guestPhotos.contributeEyebrow')}
      </p>

      {/* Name — bottom-border only, no box */}
      <div className="mb-6">
        <input
          type="text"
          value={uploaderName}
          onChange={e => onUploaderNameChange(e.target.value)}
          placeholder={uploaderPlaceholder}
          className="w-full bg-transparent pb-2 text-sm outline-none transition-all duration-200"
          style={{
            borderBottom: `1px solid ${INK}22`,
            color: ink,
            caretColor: accent,
            fontFamily: 'var(--font-body, sans-serif)',
          }}
          onFocus={e => { e.currentTarget.style.borderBottomColor = accent }}
          onBlur={e => { e.currentTarget.style.borderBottomColor = `${INK}22` }}
        />
      </div>

      {/* Quota bar — shown as soon as any files are queued */}
      {uploads.length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: MUTED }}>
              {t('guestPhotos.quotaLabel').replace('{{used}}', fmtBytes(usedBytes))}
            </span>
            {isAtLimit && (
              <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#c0392b' }}>
                {t('guestPhotos.limitReached')}
              </span>
            )}
          </div>
          <div className="h-px w-full relative" style={{ background: `${INK}12` }}>
            <div
              className="absolute left-0 top-0 h-full transition-all duration-500"
              style={{
                width: `${usedPct}%`,
                background: usedPct >= 95 ? '#c0392b' : usedPct >= 75 ? '#b8860b' : accent,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
      )}

      {/* Drop zone — blocked when at limit */}
      {isAtLimit ? (
        <div
          className="py-10 px-6 flex flex-col items-center gap-2.5 select-none"
          style={{ border: `1px solid rgba(192,57,43,0.2)`, background: 'rgba(192,57,43,0.03)' }}
        >
          <p className="text-[11px] tracking-[0.3em] uppercase" style={{ color: '#c0392b' }}>
            {t('guestPhotos.limitReached')}
          </p>
          <p className="text-[10px]" style={{ color: MUTED }}>
            {t('guestPhotos.limitReachedHint')}
          </p>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onDropZoneClick}
          className="cursor-pointer transition-all duration-200 py-10 px-6 flex flex-col items-center gap-2.5 select-none"
          style={{
            border: `1px solid ${isDragging ? accent : `${INK}18`}`,
            background: isDragging ? `${accent}06` : 'transparent',
          }}
        >
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
            onChange={e => onFileChange(e.target.files)} />
          <div style={{ color: isDragging ? accent : `${INK}35` }}>
            {isDragging
              ? <ArrowUpFromLine className="w-5 h-5 transition-all" />
              : <Camera className="w-5 h-5" />
            }
          </div>
          <p className="text-[11px] tracking-[0.3em] uppercase" style={{ color: isDragging ? accent : MUTED }}>
            {isDragging ? t('guestPhotos.releaseToAdd') : t('guestPhotos.dragPhotographsHere')}
          </p>
          <p className="text-[10px]" style={{ color: `${INK}35` }}>
            {t('guestPhotos.tapToBrowseHint')}
          </p>
        </div>
      )}


      {/* Queue */}
      {uploads.length > 0 && (
        <div className="mt-5">
          <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none', paddingTop: 10, paddingBottom: 4, paddingRight: 10 }}>
            {uploads.map(item => (
              <QueueThumb
                key={item.id}
                item={item}
                accent={accent}
                onRemove={() => onRemoveUpload(item.id)}
              />
            ))}
          </div>

          {/* Error captions */}
          {uploads.some(u => u.progress === 'error') && (
            <div className="flex gap-3 mt-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {uploads.map(item => (
                <p
                  key={item.id}
                  className="flex-shrink-0 text-[9px] text-center truncate"
                  style={{ width: 64, color: item.progress === 'error' ? '#c0392b' : 'transparent' }}
                >
                  {item.progress === 'error' ? (item.error ?? '×') : ''}
                </p>
              ))}
            </div>
          )}

          {/* Mobile upload progress — hidden on sm+ where the floating panel takes over */}
          {isUploading && (
            <div className="sm:hidden mt-4 flex items-center gap-3 px-4 py-3" style={{ background: INK, borderRadius: 4 }}>
              <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                  <circle
                    cx="20" cy="20" r="16"
                    fill="none" stroke={accent} strokeWidth="2.5"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={2 * Math.PI * 16 * (1 - overallPct / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium tabular-nums" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body, sans-serif)' }}>
                  {overallPct}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] tracking-[0.08em] leading-snug" style={{ color: PAPER, fontFamily: 'var(--font-body, sans-serif)' }}>
                  {t('guestPhotos.uploadingProgress')
                    .replace('{{current}}', String(doneCount + 1))
                    .replace('{{total}}', String(uploads.filter(u => u.progress !== 'idle').length))}
                </p>
                <p className="text-[10px] tracking-[0.2em] uppercase mt-0.5" style={{ color: `${PAPER}55` }}>
                  {t('guestPhotos.uploading')}
                </p>
              </div>
            </div>
          )}

          {/* Post-upload summary */}
          {showSummary && (
            <div className="mt-4">
              <div className="py-2.5 px-3 mb-0" style={{ borderLeft: `2px solid #c0392b`, background: 'rgba(192,57,43,0.04)' }}>
                <p className="text-[10px] tracking-[0.15em] leading-relaxed font-medium" style={{ color: '#c0392b' }}>
                  {doneCount > 0
                    ? t('guestPhotos.uploadSummary')
                        .replace('{{succeeded}}', String(doneCount))
                        .replace('{{failed}}', String(errorCount))
                    : t('guestPhotos.uploadAllFailed')}
                </p>
                {uploads.filter(u => u.progress === 'error').map(item => (
                  <p key={item.id} className="text-[9px] mt-0.5 tracking-[0.05em] truncate" style={{ color: 'rgba(192,57,43,0.7)' }}>
                    {item.file.name}{item.error ? ` — ${item.error}` : ''}
                  </p>
                ))}
              </div>
              <button
                onClick={props.onRetryFailed}
                className="mt-3 px-8 py-2.5 text-[11px] tracking-[0.35em] uppercase transition-all duration-200"
                style={{ background: '#c0392b', color: '#fff', cursor: 'pointer' }}
              >
                {t('guestPhotos.retryFailed')}
              </button>
            </div>
          )}

          {allDone && !showSummary && (
            <p className="mt-3 text-[10px] tracking-[0.3em] uppercase" style={{ color: accent }}>
              {t('guestPhotos.photographsAddedConfirm')}
            </p>
          )}

          {idleUploads.length > 0 && (
            <div className="mt-5">
              {/* Reason callout — name required or size limit */}
              {(nameEmpty || props.uploadError) && (
                <div
                  className="flex items-start gap-2 mb-4 py-2.5 px-3"
                  style={{
                    borderLeft: `2px solid ${nameEmpty ? accent : '#c0392b'}`,
                    background: nameEmpty ? `${accent}08` : 'rgba(192,57,43,0.05)',
                  }}
                >
                  <p className="text-[10px] tracking-[0.15em] leading-relaxed" style={{ color: nameEmpty ? ink : '#c0392b' }}>
                    {nameEmpty ? t('guestPhotos.nameRequired') : props.uploadError}
                  </p>
                </div>
              )}
              <button
                onClick={onSubmitAll}
                disabled={nameEmpty}
                className="px-8 py-2.5 text-[11px] tracking-[0.35em] uppercase transition-all duration-200"
                style={{
                  background: accent,
                  color: btnTextColor,
                  boxShadow: nameEmpty ? 'none' : `0 4px 14px ${accent}45`,
                  opacity: nameEmpty ? 0.35 : 1,
                  cursor: nameEmpty ? 'not-allowed' : 'pointer',
                }}
              >
                {idleUploads.length === 1
                  ? t('guestPhotos.contributePhoto')
                  : t('guestPhotos.contributePhotos', { count: idleUploads.length })}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main variant ─────────────────────────────────────────────────────────────

export function OldMoneyVariant(props: BaseVariantProps) {
  const { theme, primary, title, subtitle, useColorBackground, backgroundColorChoice, uploadsEnabled, submitted } = props
  const { bgColor, needsLightText } = resolveBackground(theme, useColorBackground, backgroundColorChoice)

  const bg     = bgColor ?? PAPER
  const ink    = needsLightText ? '#f0ead8' : INK
  const muted  = needsLightText ? 'rgba(240,234,216,0.55)' : MUTED
  const accent = primary

  return (
    <section className="relative overflow-hidden" style={{ background: bg }}>
      <style>{ANIMATIONS}</style>
      <PaperGrain />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-14 py-16">

        {/* Editorial header — left-aligned, asymmetric */}
        <header className="mb-14">
          {/* Eyebrow row */}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-[9px] tracking-[0.55em] uppercase flex-shrink-0" style={{ color: muted }}>
              The Album
            </p>
            <div className="flex-1" style={{ height: '0.5px', background: `${ink}15` }} />
          </div>

          {/* Large italic title — left-aligned, commanding */}
          <h2
            className="leading-[0.92] mb-6"
            style={{
              fontFamily: 'var(--font-display, Georgia, serif)',
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              letterSpacing: '-0.01em',
              color: ink,
              maxWidth: '16ch',
            }}
          >
            {title}
          </h2>

          {/* Subtitle — left-aligned, small, tracked */}
          {subtitle && (
            <p
              className="text-sm leading-relaxed"
              style={{
                color: muted,
                fontFamily: 'var(--font-body, sans-serif)',
                maxWidth: '42ch',
                fontStyle: 'italic',
              }}
            >
              {subtitle}
            </p>
          )}

          {/* Single accent hairline — with leading accent bar */}
          <HairlineRule accent={accent} className="mt-10" />
        </header>

        {/* Upload */}
        {(uploadsEnabled || submitted) && (
          <OldMoneyUpload props={props} ink={ink} bg={bg} accent={accent} />
        )}

        {/* Footer rule */}
        <HairlineRule accent={accent} className="mt-14" />

        {/* Footer caption */}
        <p className="mt-4 text-[9px] tracking-[0.4em] uppercase" style={{ color: `${ink}30` }}>
          Private collection
        </p>
      </div>
    </section>
  )
}

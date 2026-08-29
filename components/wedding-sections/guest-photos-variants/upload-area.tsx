"use client"

import type { CSSProperties } from "react"
import { Camera, ArrowUpFromLine, X, Check, AlertCircle, Ban, Heart, Film } from "lucide-react"
import type { UploadItem } from "./types"
import { MAX_CONTRIBUTION_BYTES } from "./types"
import { useI18n } from "@/components/contexts/i18n-context"
import { UploadProgressPanel } from "./upload-progress-panel"

function fmtBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

// Renders an item's local preview as <video> for video files (an <img> can't decode video data),
// seeking to a fraction of a second in so the browser paints a frame instead of a blank box.
function MosaicMedia({ item, className, style }: { item: UploadItem; className?: string; style?: CSSProperties }) {
  if (item.file.type.startsWith('video/')) {
    return <video src={`${item.preview}#t=0.1`} className={className} style={style} muted playsInline preload="metadata" />
  }
  return <img src={item.preview} alt="" className={className} style={style} />
}

const UPLOAD_ANIMATIONS = `
  @keyframes marchDash {
    to { stroke-dashoffset: -14; }
  }
  @keyframes queueIn {
    from { opacity: 0; transform: translateX(12px) scale(0.92); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes popCheck {
    0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
    60%  { transform: scale(1.25) rotate(4deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes successBounce {
    0%   { opacity: 0; transform: scale(0.4); }
    60%  { opacity: 1; transform: scale(1.15); }
    80%  { transform: scale(0.94); }
    100% { transform: scale(1); }
  }
  @keyframes ringExpand {
    0%   { transform: scale(1); opacity: 0.55; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  @keyframes successFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes errorShake {
    0%,100% { transform: translateX(0); }
    25%      { transform: translateX(-3px); }
    75%      { transform: translateX(3px); }
  }
  .queue-item      { animation: queueIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
  .pop-check       { animation: popCheck 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
  .success-icon    { animation: successBounce 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }
  .success-ring    { animation: ringExpand 1s ease-out 0.25s both; }
  .success-title   { animation: successFadeUp 0.4s ease-out 0.35s both; opacity: 0; }
  .success-sub     { animation: successFadeUp 0.4s ease-out 0.5s both; opacity: 0; }
  .overlay-in      { animation: overlayFadeIn 0.18s ease both; }
  .error-shake     { animation: errorShake 0.32s ease both 0.05s; }

  @keyframes mosaicReveal {
    from { opacity: 0; transform: scale(1.06); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes badgeFloat {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes captionDrift {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cardReveal {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .mosaic-img    { animation: mosaicReveal 0.55s cubic-bezier(0.4,0,0.2,1) both; }
  .mosaic-badge  { animation: badgeFloat   0.45s cubic-bezier(0.34,1.56,0.64,1) 0.4s both; opacity: 0; }
  .mosaic-caption{ animation: captionDrift 0.4s  ease 0.55s both; opacity: 0; }
  .card-reveal   { animation: cardReveal   0.5s  cubic-bezier(0.34,1.36,0.64,1) both; }
`

function ProgressRing({ progress }: { progress: number }) {
  const r = 15
  const circ = 2 * Math.PI * r
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
      <circle
        cx="20" cy="20" r={r} fill="none" stroke="white" strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progress)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.45s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  )
}

interface UploadAreaProps {
  primary: string
  uploaderPlaceholder: string
  uploads: UploadItem[]
  uploaderName: string
  isDragging: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onUploaderNameChange: (v: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onDropZoneClick: () => void
  onFileChange: (files: FileList | null) => void
  onRemoveUpload: (id: string) => void
  onSubmitAll: () => void
  onRetryFailed?: () => void
  zoneBg?: string
  zoneBorder?: string
  zoneBorderDragging?: string
  zoneBgDragging?: string
  zoneRadius?: string
  inputBg?: string
  inputBorder?: string
  inputRadius?: string
  buttonBg?: string
  buttonText?: string
  textColor?: string
  mutedColor?: string
  submitted?: boolean
  submittedUploads?: UploadItem[]
  moderationEnabled?: boolean
  uploadError?: string
}

export function UploadArea({
  primary, uploaderPlaceholder, uploads, uploaderName, isDragging, fileInputRef,
  onUploaderNameChange, onDragOver, onDragLeave, onDrop, onDropZoneClick, onFileChange,
  onRemoveUpload, onSubmitAll, onRetryFailed,
  zoneBg = '#fafaf9',
  zoneBorder = 'rgba(0,0,0,0.12)',
  zoneBorderDragging,
  zoneBgDragging,
  zoneRadius = '1rem',
  inputBg = '#fff',
  inputBorder = 'rgba(0,0,0,0.12)',
  inputRadius = '0.625rem',
  buttonBg,
  buttonText = '#fff',
  textColor = '#374151',
  mutedColor = '#9ca3af',
  submitted = false,
  submittedUploads = [],
  moderationEnabled = true,
  uploadError,
}: UploadAreaProps) {
  const { t } = useI18n()
  const activeBorder = zoneBorderDragging ?? primary
  const activeBg = zoneBgDragging ?? `${primary}12`
  const btn = buttonBg ?? primary
  const idleUploads = uploads.filter(u => u.progress === 'idle')
  const hasUploads = uploads.length > 0
  const allDone = uploads.length > 0 && uploads.every(u => u.progress === 'done')
  const nameRequired = uploaderName.trim() === ""

  const usedBytes = uploads.reduce((sum, u) => sum + u.file.size, 0)
  const isAtLimit = usedBytes >= MAX_CONTRIBUTION_BYTES
  const usedPct = Math.min(100, (usedBytes / MAX_CONTRIBUTION_BYTES) * 100)

  const isUploading = uploads.some(u => u.progress === 'uploading')
  const doneCount = uploads.filter(u => u.progress === 'done').length
  const errorCount = uploads.filter(u => u.progress === 'error').length
  const activeUploads = uploads.filter(u => u.progress !== 'idle')
  const overallPct = activeUploads.length > 0
    ? Math.round(activeUploads.reduce((sum, u) => {
        if (u.progress === 'done' || u.progress === 'error') return sum + 100
        return sum + Math.round((u.uploadProgress ?? 0) * 100)
      }, 0) / activeUploads.length)
    : 0
  const showSummary = !isUploading && !submitted && idleUploads.length === 0 && errorCount > 0
  const stepIndex = overallPct < 25 ? 0 : overallPct < 80 ? 1 : 2
  const stepKey = (['uploadStep1', 'uploadStep2', 'uploadStep3'] as const)[stepIndex]

  const R = 46
  const CIRC = 2 * Math.PI * R

  // Google Drive-style panel handles uploading state — no full-screen overlay needed

  if (submitted) {
    const photos = submittedUploads.filter(p => p.preview)
    const shown = photos.slice(0, 4)
    const extra = photos.length > 4 ? photos.length - 4 : 0
    const count = photos.length

    // Build the mosaic grid based on photo count
    const renderMosaic = () => {
      if (shown.length === 0) return null
      if (shown.length === 1) {
        return (
          <MosaicMedia
            item={shown[0]}
            className="mosaic-img absolute inset-0 w-full h-full object-cover"
          />
        )
      }
      if (shown.length === 2) {
        return (
          <div className="absolute inset-0 grid grid-cols-2" style={{ gap: 2 }}>
            {shown.map((p, i) => (
              <MosaicMedia key={p.id} item={p} className="mosaic-img w-full h-full object-cover"
                style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        )
      }
      if (shown.length === 3) {
        return (
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 2 }}>
            <MosaicMedia item={shown[0]} className="mosaic-img w-full h-full object-cover" style={{ animationDelay: '0s' }} />
            <div className="grid grid-rows-2" style={{ gap: 2 }}>
              <MosaicMedia item={shown[1]} className="mosaic-img w-full h-full object-cover" style={{ animationDelay: '0.08s' }} />
              <MosaicMedia item={shown[2]} className="mosaic-img w-full h-full object-cover" style={{ animationDelay: '0.16s' }} />
            </div>
          </div>
        )
      }
      // 4+
      return (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2" style={{ gap: 2 }}>
          {shown.map((p, i) => (
            <div key={p.id} className="relative overflow-hidden">
              <MosaicMedia item={p} className="mosaic-img w-full h-full object-cover"
                style={{ animationDelay: `${i * 0.07}s` }} />
              {i === 3 && extra > 0 && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">+{extra}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="mb-10 card-reveal">
        <style>{UPLOAD_ANIMATIONS}</style>

        <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
          {/* Photo mosaic */}
          <div className="relative" style={{ aspectRatio: shown.length <= 1 ? '16/9' : shown.length <= 3 ? '4/3' : '1/1' }}>
            {shown.length > 0 ? renderMosaic() : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}33 0%, ${primary}11 100%)` }} />
            )}

            {/* Bottom gradient for legibility */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)' }}
            />

            {/* Frosted glass badge */}
            <div className="mosaic-badge absolute bottom-0 left-0 right-0 pb-5 flex justify-center">
              <div
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.13)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                }}
              >
                <Heart className="w-3.5 h-3.5 text-white" fill="white" />
                <span className="text-sm font-medium text-white" style={{ letterSpacing: '0.01em' }}>
                  {count === 1 ? t('guestPhotos.photoShared') : t('guestPhotos.photosSharedPlural').replace('{{count}}', String(count))}
                </span>
              </div>
            </div>
          </div>

          {/* Caption strip */}
          <div
            className="mosaic-caption px-6 py-4 text-center"
            style={{ background: `${primary}0d`, borderTop: `1px solid ${primary}14` }}
          >
            <p className="text-xs tracking-wide" style={{ color: mutedColor }}>
              {moderationEnabled ? t('guestPhotos.pendingReview') : t('guestPhotos.thankYouSharing')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-10">
      <style>{UPLOAD_ANIMATIONS}</style>
      <UploadProgressPanel uploads={uploads} primary={primary} onRetryFailed={onRetryFailed} />

      {/* Name input */}
      <div className="relative mb-3">
        <input
          type="text"
          value={uploaderName}
          onChange={e => onUploaderNameChange(e.target.value)}
          placeholder={`${uploaderPlaceholder} *`}
          className="w-full pl-4 pr-4 py-3 text-sm transition-all duration-150 outline-none"
          style={{
            background: inputBg,
            border: `1.5px solid ${inputBorder}`,
            borderRadius: inputRadius,
            color: textColor,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = primary }}
          onBlur={e => { e.currentTarget.style.borderColor = inputBorder }}
        />
      </div>

      {/* Quota bar — shown as soon as any files are queued */}
      {hasUploads && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs" style={{ color: mutedColor }}>
              {t('guestPhotos.quotaLabel').replace('{{used}}', fmtBytes(usedBytes))}
            </span>
            {isAtLimit && (
              <span className="text-xs font-medium" style={{ color: '#dc2626' }}>
                {t('guestPhotos.limitReached')}
              </span>
            )}
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: `${primary}18` }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${usedPct}%`,
                background: usedPct >= 95 ? '#dc2626' : usedPct >= 75 ? '#f59e0b' : primary,
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1), background 0.4s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Drop zone — disabled entirely when at limit */}
      {isAtLimit ? (
        <div
          className="relative select-none"
          style={{
            background: 'rgba(220,38,38,0.04)',
            borderRadius: zoneRadius,
            padding: '2.5rem 1.5rem',
            border: `2px dashed rgba(220,38,38,0.25)`,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-1" style={{ background: 'rgba(220,38,38,0.08)' }}>
              <Ban className="w-6 h-6" style={{ color: '#dc2626' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#dc2626' }}>
              {t('guestPhotos.limitReached')}
            </p>
            <p className="text-xs text-center" style={{ color: mutedColor }}>
              {t('guestPhotos.limitReachedHint')}
            </p>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onDropZoneClick}
          className="relative cursor-pointer select-none transition-all duration-200"
          style={{
            background: isDragging ? activeBg : zoneBg,
            borderRadius: zoneRadius,
            padding: '2.5rem 1.5rem',
            border: isDragging ? 'none' : `2px dashed ${zoneBorder}`,
          }}
        >
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
            onChange={e => onFileChange(e.target.files)} />

          {/* Marching-ants SVG border when dragging */}
          {isDragging && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ borderRadius: zoneRadius, overflow: 'visible' }}
              preserveAspectRatio="none"
            >
              <rect
                x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)"
                fill="none" stroke={activeBorder} strokeWidth="2"
                strokeDasharray="8 6"
                rx={zoneRadius}
                style={{ animation: 'marchDash 0.3s linear infinite', strokeDashoffset: 0 }}
              />
            </svg>
          )}

          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-1 transition-all duration-200"
              style={{ background: isDragging ? `${primary}22` : 'rgba(0,0,0,0.05)' }}
            >
              {isDragging
                ? <ArrowUpFromLine className="w-6 h-6 transition-all" style={{ color: primary }} />
                : <Camera className="w-6 h-6" style={{ color: mutedColor }} />
              }
            </div>
            <p className="text-sm font-medium transition-colors duration-200" style={{ color: isDragging ? primary : textColor }}>
              {isDragging ? t('guestPhotos.dropDragging') : t('guestPhotos.submitEmpty')}
            </p>
            <p className="text-xs" style={{ color: mutedColor }}>
              {t('guestPhotos.dropHint')}
            </p>
          </div>
        </div>
      )}


      {/* Photo queue */}
      {hasUploads && (
        <div className="mt-4">
          {/* Thumbnail strip — pt-3 gives vertical room for the remove bubble */}
          <div className="flex gap-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none', paddingTop: 10, paddingBottom: 4, paddingRight: 10 }}>
            {uploads.map((item, i) => (
              <div
                key={item.id}
                className="relative flex-shrink-0 queue-item"
                style={{ width: 72, height: 72, animationDelay: `${i * 0.04}s` }}
              >
                {/* Image + overlays — overflow-hidden lives here, not the outer wrapper */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  {item.file.type.startsWith('video/')
                    ? <video src={`${item.preview}#t=0.1`} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    : <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
                  }

                  {/* Video badge */}
                  {item.file.type.startsWith('video/') && item.progress === 'idle' && (
                    <div className="absolute top-1 left-1 rounded-sm px-0.5 py-0.5" style={{ background: 'rgba(0,0,0,0.55)' }}>
                      <Film className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}

                  {/* Uploading */}
                  {item.progress === 'uploading' && (
                    <div className="overlay-in absolute inset-0 bg-black/45 flex items-center justify-center">
                      <ProgressRing progress={item.uploadProgress ?? 0} />
                      <span className="absolute text-[9px] text-white font-medium tabular-nums">
                        {Math.round((item.uploadProgress ?? 0) * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Done — green tint */}
                  {item.progress === 'done' && (
                    <div className="overlay-in absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.52)' }}>
                      <div className="pop-check">
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {item.progress === 'error' && (
                    <div className="overlay-in absolute inset-0 bg-red-500/55 flex items-center justify-center">
                      <div className="error-shake">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Remove bubble — sits outside overflow-hidden, pops off the corner */}
                {(item.progress === 'idle' || item.progress === 'error') && (
                  <button
                    onClick={e => { e.stopPropagation(); onRemoveUpload(item.id) }}
                    className="absolute flex items-center justify-center rounded-full"
                    style={{
                      top: -8, right: -8,
                      width: 20, height: 20,
                      background: '#111',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                      zIndex: 10,
                    }}
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* File name captions */}
          <div className="flex gap-2.5 mt-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', paddingRight: 10 }}>
            {uploads.map(item => (
              <p
                key={item.id}
                className="flex-shrink-0 text-[10px] text-center truncate"
                style={{ width: 72, color: item.progress === 'error' ? '#ef4444' : mutedColor }}
              >
                {item.progress === 'error' ? (item.error ?? t('guestPhotos.failed')) : item.progress === 'done' ? `✓ ${t('guestPhotos.shared')}` : item.file.name}
              </p>
            ))}
          </div>

          {/* Mobile upload progress — compact ring + text, hidden on sm+ where the panel takes over */}
          {isUploading && (
            <div className="sm:hidden mt-3 flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: '#1c1917' }}>
              <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                  <circle
                    cx="20" cy="20" r="16"
                    fill="none" stroke={primary} strokeWidth="3"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={2 * Math.PI * 16 * (1 - overallPct / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {overallPct}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium leading-snug" style={{ color: '#fff' }}>
                  {t('guestPhotos.uploadingProgress')
                    .replace('{{current}}', String(doneCount + 1))
                    .replace('{{total}}', String(activeUploads.length))}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {t('guestPhotos.uploading')}
                </p>
              </div>
            </div>
          )}

          {/* Post-upload summary — shown when some failed and nothing is idle */}
          {showSummary && (
            <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(220,38,38,0.18)' }}>
              <div className="px-3 py-2.5" style={{ background: 'rgba(220,38,38,0.05)' }}>
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-snug" style={{ color: '#dc2626' }}>
                      {doneCount > 0
                        ? t('guestPhotos.uploadSummary')
                            .replace('{{succeeded}}', String(doneCount))
                            .replace('{{failed}}', String(errorCount))
                        : t('guestPhotos.uploadAllFailed')}
                    </p>
                    {uploads.filter(u => u.progress === 'error').map(item => (
                      <p key={item.id} className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(220,38,38,0.75)' }}>
                        {item.file.name}{item.error ? ` — ${item.error}` : ''}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={onRetryFailed}
                className="w-full py-2.5 text-xs font-medium transition-all duration-150 hover:opacity-80 active:scale-[0.99]"
                style={{ background: '#dc2626', color: '#fff' }}
              >
                {t('guestPhotos.retryFailed')} →
              </button>
            </div>
          )}

          {/* All-done banner */}
          {allDone && !showSummary && (
            <div
              className="mt-3 py-3 rounded-xl text-center text-sm font-medium transition-all"
              style={{ background: `${primary}14`, color: primary }}
            >
              {t('guestPhotos.allShared')}
            </div>
          )}

          {/* Submit CTA */}
          {idleUploads.length > 0 && (
            <>
              {/* Reason callout — shown whenever button is blocked */}
              {(nameRequired || uploadError) && (
                <div
                  className="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{
                    background: nameRequired ? `${primary}0f` : 'rgba(220,38,38,0.06)',
                    border: `1px solid ${nameRequired ? `${primary}30` : 'rgba(220,38,38,0.2)'}`,
                  }}
                >
                  <AlertCircle
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: nameRequired ? primary : '#dc2626' }}
                  />
                  <p className="text-xs font-medium leading-snug" style={{ color: nameRequired ? primary : '#dc2626' }}>
                    {nameRequired ? t('guestPhotos.nameRequired') : uploadError}
                  </p>
                </div>
              )}
              <button
                onClick={onSubmitAll}
                disabled={nameRequired || isUploading}
                className="w-full mt-3 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed"
                style={{
                  background: btn,
                  color: buttonText,
                  letterSpacing: '0.01em',
                  boxShadow: nameRequired ? 'none' : `0 4px 16px ${btn}50`,
                }}
              >
                {(idleUploads.length === 1 ? t('guestPhotos.submit') : t('guestPhotos.submitPlural')).replace('{count}', String(idleUploads.length))} →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

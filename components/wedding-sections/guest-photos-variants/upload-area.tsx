"use client"

import { Camera, ArrowUpFromLine, X, Check, AlertCircle, CheckCircle2, Ban } from "lucide-react"
import type { UploadItem } from "./types"
import { MAX_CONTRIBUTION_BYTES } from "./types"
import { useI18n } from "@/components/contexts/i18n-context"

function fmtBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
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
  @keyframes pulseRing {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.5; }
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
  @keyframes uploadSpin {
    to { transform: rotate(360deg); }
  }
  @keyframes uploadLabelIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .queue-item      { animation: queueIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
  .pop-check       { animation: popCheck 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
  .success-icon    { animation: successBounce 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }
  .success-ring    { animation: ringExpand 1s ease-out 0.25s both; }
  .success-title   { animation: successFadeUp 0.4s ease-out 0.35s both; opacity: 0; }
  .success-sub     { animation: successFadeUp 0.4s ease-out 0.5s both; opacity: 0; }
  .upload-spin     { animation: uploadSpin 6s linear infinite; transform-origin: 68px 68px; }
  .upload-label-in { animation: uploadLabelIn 0.25s ease-out both; }
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
        style={{ transition: 'stroke-dashoffset 0.15s linear' }}
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
  moderationEnabled?: boolean
  uploadError?: string
}

export function UploadArea({
  primary, uploaderPlaceholder, uploads, uploaderName, isDragging, fileInputRef,
  onUploaderNameChange, onDragOver, onDragLeave, onDrop, onDropZoneClick, onFileChange,
  onRemoveUpload, onSubmitAll,
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
  const overallPct = uploads.length > 0
    ? Math.min(99, Math.round(uploads.reduce((sum, u) => {
        if (u.progress === 'done' || u.progress === 'error') return sum + 100
        if (u.progress === 'uploading') return sum + Math.round((u.uploadProgress ?? 0) * 100)
        return sum
      }, 0) / uploads.length))
    : 0
  const stepIndex = overallPct < 25 ? 0 : overallPct < 80 ? 1 : 2
  const stepKey = (['uploadStep1', 'uploadStep2', 'uploadStep3'] as const)[stepIndex]

  const R = 46
  const CIRC = 2 * Math.PI * R

  if (isUploading) {
    return (
      <div className="mb-10">
        <style>{UPLOAD_ANIMATIONS}</style>
        <div
          className="py-14 px-6 text-center rounded-2xl relative overflow-hidden"
          style={{ background: `${primary}0d` }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 70% 60% at 50% 40%, ${primary}14 0%, transparent 70%)` }}
          />

          {/* Progress ring */}
          <div className="relative inline-flex items-center justify-center mb-6" style={{ width: 120, height: 120 }}>
            {/* Spinning dashed outer ring */}
            <svg width="136" height="136" viewBox="0 0 136 136" className="upload-spin absolute" style={{ top: -8, left: -8 }}>
              <circle cx="68" cy="68" r="64" fill="none" strokeWidth="1.5"
                strokeDasharray="5 22" strokeLinecap="round"
                style={{ stroke: `${primary}40` }}
              />
            </svg>
            {/* Progress arc */}
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r={R} fill="none" stroke={`${primary}1a`} strokeWidth="5" />
              <circle
                cx="60" cy="60" r={R} fill="none" stroke={primary} strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - overallPct / 100)}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            {/* Percentage */}
            <span
              className="absolute text-2xl font-semibold tabular-nums"
              style={{ color: primary, letterSpacing: '-0.03em' }}
            >
              {overallPct}%
            </span>
          </div>

          {/* Step label — keyed so it fades on change */}
          <p key={stepKey} className="upload-label-in text-sm font-medium mb-5" style={{ color: textColor }}>
            {t(`guestPhotos.${stepKey}`)}
          </p>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: i === stepIndex ? 20 : 6,
                  height: 6,
                  background: i <= stepIndex ? primary : `${primary}25`,
                  transition: 'width 0.3s ease, background 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="mb-10">
        <style>{UPLOAD_ANIMATIONS}</style>
        <div
          className="text-center py-16 px-6 rounded-2xl relative overflow-hidden"
          style={{ background: `${primary}0d` }}
        >
          {/* Soft radial glow behind the icon */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${primary}18 0%, transparent 70%)`,
            }}
          />

          {/* Icon + expanding ring */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div
              className="success-ring absolute rounded-full"
              style={{ width: 80, height: 80, background: `${primary}35` }}
            />
            <div
              className="success-icon relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: `${primary}22` }}
            >
              <CheckCircle2 className="w-10 h-10" style={{ color: primary }} />
            </div>
          </div>

          <p className="success-title text-xl font-semibold mb-2" style={{ color: primary }}>
            {t('guestPhotos.submitted')}
          </p>
          <p className="success-sub text-sm leading-relaxed max-w-xs mx-auto" style={{ color: mutedColor }}>
            {moderationEnabled ? t('guestPhotos.pendingReview') : t('guestPhotos.thankYouSharing')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-10">
      <style>{UPLOAD_ANIMATIONS}</style>

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
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${usedPct}%`,
                background: usedPct >= 95 ? '#dc2626' : usedPct >= 75 ? '#f59e0b' : primary,
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
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
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
          {/* Thumbnail strip */}
          <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {uploads.map((item, i) => (
              <div
                key={item.id}
                className="relative flex-shrink-0 rounded-xl overflow-hidden group queue-item"
                style={{ width: 72, height: 72, animationDelay: `${i * 0.04}s` }}
              >
                <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />

                {/* Uploading */}
                {item.progress === 'uploading' && (
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                    <ProgressRing progress={item.uploadProgress ?? 0} />
                    <span className="absolute text-[9px] text-white font-medium">
                      {Math.round((item.uploadProgress ?? 0) * 100)}%
                    </span>
                  </div>
                )}

                {/* Done */}
                {item.progress === 'done' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="pop-check">
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}

                {/* Error */}
                {item.progress === 'error' && (
                  <div className="absolute inset-0 bg-red-500/55 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Remove */}
                {(item.progress === 'idle' || item.progress === 'error') && (
                  <button
                    onClick={e => { e.stopPropagation(); onRemoveUpload(item.id) }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* File name captions */}
          <div className="flex gap-2.5 mt-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {uploads.map(item => (
              <p
                key={item.id}
                className="flex-shrink-0 text-[10px] text-center truncate"
                style={{ width: 72, color: item.progress === 'error' ? '#ef4444' : mutedColor }}
              >
                {item.progress === 'error' ? t('guestPhotos.failed') : item.progress === 'done' ? `✓ ${t('guestPhotos.shared')}` : item.file.name}
              </p>
            ))}
          </div>

          {/* Success banner */}
          {allDone && (
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
                disabled={nameRequired}
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

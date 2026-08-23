"use client"

import { Camera, ArrowUpFromLine, X, Check, AlertCircle, CheckCircle2 } from "lucide-react"
import type { UploadItem } from "./types"
import { useI18n } from "@/components/contexts/i18n-context"

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
  .queue-item { animation: queueIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
  .pop-check  { animation: popCheck 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
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
}: UploadAreaProps) {
  const { t } = useI18n()
  const activeBorder = zoneBorderDragging ?? primary
  const activeBg = zoneBgDragging ?? `${primary}12`
  const btn = buttonBg ?? primary
  const idleUploads = uploads.filter(u => u.progress === 'idle')
  const hasUploads = uploads.length > 0
  const allDone = uploads.length > 0 && uploads.every(u => u.progress === 'done')
  const nameRequired = uploaderName.trim() === ""

  if (submitted) {
    return (
      <div className="mb-10">
        <div
          className="text-center py-10 px-4 rounded-2xl"
          style={{ background: `${primary}0a`, border: `1.5px dashed ${primary}30` }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: `${primary}18` }}
          >
            <CheckCircle2 className="w-7 h-7" style={{ color: primary }} />
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: textColor }}>
            {t('guestPhotos.submitted')}
          </p>
          <p className="text-sm" style={{ color: mutedColor }}>
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

      {/* Drop zone */}
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
              {nameRequired && (
                <p className="text-[11px] text-center mt-2" style={{ color: mutedColor }}>
                  {t('guestPhotos.nameRequired')}
                </p>
              )}
              <button
                onClick={onSubmitAll}
                disabled={nameRequired}
                className="w-full mt-2 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: btn, color: buttonText, letterSpacing: '0.01em', boxShadow: `0 4px 16px ${btn}50` }}
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

"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Check, AlertCircle, ChevronDown, ChevronUp, Upload } from "lucide-react"
import type { UploadItem } from "./types"
import { useI18n } from "@/components/contexts/i18n-context"

const PANEL_ANIMATIONS = `
  @keyframes panelSlideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes panelSlideDown {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(12px) scale(0.97); }
  }
  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes checkBounce {
    0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
    55%  { transform: scale(1.22) rotate(6deg); opacity: 1; }
    78%  { transform: scale(0.93) rotate(-2deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes errorShake {
    0%,100% { transform: translateX(0); }
    25%      { transform: translateX(-3px); }
    75%      { transform: translateX(3px); }
  }
  @keyframes headerFade {
    from { opacity: 0; transform: translateY(3px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes progressPulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.65; }
  }
  .panel-enter    { animation: panelSlideUp   0.28s cubic-bezier(0.34,1.36,0.64,1) both; }
  .panel-exit     { animation: panelSlideDown 0.2s  cubic-bezier(0.4,0,1,1) both; }
  .overlay-in     { animation: overlayFadeIn  0.18s ease both; }
  .check-bounce   { animation: checkBounce   0.38s cubic-bezier(0.34,1.56,0.64,1) both; }
  .error-shake    { animation: errorShake    0.32s ease both 0.05s; }
  .header-fade    { animation: headerFade    0.18s ease both; }
  .ring-pulse     { animation: progressPulse 1.6s  ease-in-out infinite; }
`

function FileRow({ item, primary }: { item: UploadItem; primary: string }) {
  const pct = Math.round((item.uploadProgress ?? 0) * 100)
  const R = 14
  const CIRC = 2 * Math.PI * R

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 border-b border-black/[0.04] last:border-0">
      {/* Thumbnail with layered state overlays */}
      <div className="relative flex-shrink-0 rounded-md overflow-hidden bg-gray-100" style={{ width: 36, height: 36 }}>
        <img src={item.preview} alt="" className="w-full h-full object-cover" />

        {item.progress === 'uploading' && (
          <div className="overlay-in absolute inset-0 bg-black/40 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
              <circle
                cx="18" cy="18" r={R}
                fill="none" stroke="white" strokeWidth="2.5"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - (item.uploadProgress ?? 0))}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.45s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </svg>
          </div>
        )}
        {item.progress === 'done' && (
          <div className="overlay-in absolute inset-0 bg-black/25 flex items-center justify-center">
            <div className="check-bounce">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          </div>
        )}
        {item.progress === 'error' && (
          <div className="overlay-in absolute inset-0 bg-red-500/55 flex items-center justify-center">
            <div className="error-shake">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* File name + inline progress */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: '#1c1917', lineHeight: '1.3' }}>
          {item.file.name}
        </p>
        {item.progress === 'uploading' && (
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex-1 h-[3px] rounded-full overflow-hidden bg-black/8">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: primary,
                  transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
            <span className="text-[10px] tabular-nums flex-shrink-0 font-medium" style={{ color: '#78716c' }}>{pct}%</span>
          </div>
        )}
        {item.progress === 'error' && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: '#dc2626' }}>
            {item.error ?? 'Upload failed'}
          </p>
        )}
        {item.progress === 'done' && (
          <p className="text-[10px] mt-0.5" style={{ color: '#16a34a' }}>Uploaded</p>
        )}
      </div>

      {/* Status badge */}
      {item.progress === 'done' && (
        <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} strokeWidth={2.5} />
      )}
      {item.progress === 'error' && (
        <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#dc2626' }} />
      )}
      {item.progress === 'uploading' && (
        <span className="text-[10px] font-semibold tabular-nums flex-shrink-0" style={{ color: primary }}>
          {pct}%
        </span>
      )}
    </div>
  )
}

interface UploadProgressPanelProps {
  uploads: UploadItem[]
  primary: string
  onRetryFailed?: () => void
}

function Panel({ uploads, primary, onRetryFailed }: UploadProgressPanelProps) {
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  const active = uploads.filter(u => u.progress !== 'idle')
  const isUploading = active.some(u => u.progress === 'uploading')
  const doneCount = active.filter(u => u.progress === 'done').length
  const errorCount = active.filter(u => u.progress === 'error').length
  const pendingCount = active.length - doneCount - errorCount
  const overallPct = active.length > 0
    ? Math.round(active.reduce((sum, u) => {
        if (u.progress === 'done' || u.progress === 'error') return sum + 100
        return sum + Math.round((u.uploadProgress ?? 0) * 100)
      }, 0) / active.length)
    : 0

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissing(true)
    setTimeout(() => setDismissed(true), 210)
  }

  useEffect(() => {
    if (isUploading) {
      setDismissed(false)
      setDismissing(false)
      setCollapsed(false)
    }
  }, [isUploading])

  // Auto-dismiss 5 s after a fully clean upload
  useEffect(() => {
    if (!isUploading && active.length > 0 && errorCount === 0 && doneCount === active.length) {
      const timer = setTimeout(() => {
        setDismissing(true)
        setTimeout(() => setDismissed(true), 210)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isUploading, active.length, errorCount, doneCount])

  if (dismissed || active.length === 0) return null

  const headerText = isUploading
    ? `Uploading ${pendingCount > 0 ? `${doneCount + 1} of ${active.length}` : active.length}…`
    : errorCount > 0
    ? t('guestPhotos.uploadSummary').replace('{{succeeded}}', String(doneCount)).replace('{{failed}}', String(errorCount))
    : `${doneCount} photo${doneCount !== 1 ? 's' : ''} uploaded`

  const headerAccent = isUploading ? primary : errorCount > 0 ? '#ef4444' : '#22c55e'

  return (
    <>
      <style>{PANEL_ANIMATIONS}</style>
      <div
        className={dismissing ? 'panel-exit' : 'panel-enter'}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 340,
          zIndex: 9999,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.09)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-3.5 py-3 cursor-pointer select-none"
          style={{
            background: '#1c1917',
            color: '#fff',
            transition: 'background 0.3s ease',
          }}
          onClick={() => setCollapsed(c => !c)}
        >
          <div style={{ transition: 'transform 0.2s ease, opacity 0.2s ease' }}>
            {isUploading
              ? <Upload className="w-4 h-4 flex-shrink-0" style={{ color: primary }} />
              : errorCount > 0
              ? <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f87171' }} />
              : <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} strokeWidth={2.5} />
            }
          </div>

          {/* Status text — re-mounts with fade on each change */}
          <span key={headerText} className="header-fade flex-1 text-[13px] font-medium truncate">
            {headerText}
          </span>

          {isUploading && (
            <span
              key={overallPct}
              className="text-[11px] font-semibold tabular-nums mr-1"
              style={{ color: headerAccent, transition: 'color 0.3s ease' }}
            >
              {overallPct}%
            </span>
          )}

          <button
            onClick={e => { e.stopPropagation(); setCollapsed(c => !c) }}
            className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ transition: 'background 0.15s ease' }}
          >
            {collapsed
              ? <ChevronUp className="w-3.5 h-3.5 text-white/70" />
              : <ChevronDown className="w-3.5 h-3.5 text-white/70" />
            }
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-white/10 flex-shrink-0"
            style={{ transition: 'background 0.15s ease' }}
          >
            <X className="w-3.5 h-3.5 text-white/70" />
          </button>
        </div>

        {/* Overall progress bar — smooth material easing */}
        {isUploading && (
          <div className="h-[3px]" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full"
              style={{
                width: `${overallPct}%`,
                background: primary,
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
        )}

        {/* File list */}
        {!collapsed && (
          <div style={{ background: '#fafaf9', maxHeight: 280, overflowY: 'auto' }}>
            {active.map(item => (
              <FileRow key={item.id} item={item} primary={primary} />
            ))}

            {/* Retry button */}
            {errorCount > 0 && !isUploading && onRetryFailed && (
              <div className="px-3 py-2.5">
                <button
                  onClick={onRetryFailed}
                  className="w-full py-2 rounded-lg text-xs font-medium text-white"
                  style={{
                    background: '#dc2626',
                    transition: 'opacity 0.15s ease, transform 0.1s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {t('guestPhotos.retryFailed')} →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export function UploadProgressPanel(props: UploadProgressPanelProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(<Panel {...props} />, document.body)
}

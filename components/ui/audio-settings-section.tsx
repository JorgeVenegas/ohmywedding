"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Music, Upload, X, Play, Pause } from 'lucide-react'
import { useAudioUpload } from '@/hooks/use-audio-upload'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parseTime(str: string): number {
  const parts = str.split(':')
  if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1])
  return Number(str) || 0
}

// ─── WaveformScrubber ────────────────────────────────────────────────────────

interface WaveformScrubberProps {
  audioUrl: string
  startTime: number
  endTime: number
  onStartTimeChange: (t: number) => void
  onEndTimeChange: (t: number) => void
}

function WaveformScrubber({
  audioUrl,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: WaveformScrubberProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLAudioElement>(null)
  const [peaks, setPeaks] = useState<number[]>([])
  const [totalDuration, setTotalDuration] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const dragStartXRef = useRef(0)
  const dragStartTimeRef = useRef(0)
  const resizeStartXRef = useRef(0)
  const resizeStartEndRef = useRef(0)

  const NUM_BARS = 140

  // Load and decode audio to extract waveform peaks
  useEffect(() => {
    if (!audioUrl) return
    setLoading(true)
    setLoadError(false)

    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch(audioUrl, { mode: 'cors' })
        const buffer = await res.arrayBuffer()
        if (cancelled) return

        const ctx = new AudioContext()
        const decoded = await ctx.decodeAudioData(buffer)
        if (cancelled) return

        setTotalDuration(decoded.duration)

        const channelData = decoded.getChannelData(0)
        const blockSize = Math.floor(channelData.length / NUM_BARS)
        const p: number[] = []
        for (let i = 0; i < NUM_BARS; i++) {
          const start = i * blockSize
          let max = 0
          for (let j = start; j < start + blockSize; j++) {
            if (Math.abs(channelData[j]) > max) max = Math.abs(channelData[j])
          }
          p.push(max)
        }
        setPeaks(p)
        setLoading(false)
        ctx.close()
      } catch {
        if (!cancelled) setLoadError(true)
        setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [audioUrl])

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !peaks.length) return

    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)

    const effective = totalDuration || 1
    const winStart = startTime / effective
    const winEnd = (endTime > 0 ? endTime : effective) / effective

    const barW = W / NUM_BARS
    const gap = 1.5

    peaks.forEach((peak, i) => {
      const ratio = i / NUM_BARS
      const inWindow = ratio >= winStart && ratio < winEnd
      const barH = Math.max(3, peak * H * 0.92)
      const x = i * barW
      const y = (H - barH) / 2

      ctx.fillStyle = inWindow ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.22)'
      ctx.beginPath()
      ctx.roundRect(x + gap / 2, y, Math.max(barW - gap, 1), barH, 1.5)
      ctx.fill()
    })
  }, [peaks, startTime, endTime, totalDuration])

  const getStartRatio = () => totalDuration ? startTime / totalDuration : 0
  const getEndRatio = () => {
    const eff = endTime > 0 ? endTime : totalDuration
    return totalDuration ? eff / totalDuration : 1
  }

  // ── drag window (change startTime) ────────────────────────────────────────
  const handleWindowMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartXRef.current = e.clientX
    dragStartTimeRef.current = startTime
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartXRef.current = e.clientX
    resizeStartEndRef.current = endTime > 0 ? endTime : totalDuration
  }

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container || !totalDuration) return
      const rect = container.getBoundingClientRect()
      const deltaRatio = (e.clientX - dragStartXRef.current) / rect.width

      if (isDragging) {
        const windowDuration = (endTime > 0 ? endTime : totalDuration) - startTime
        const newStart = Math.max(0, Math.min(
          totalDuration - windowDuration,
          dragStartTimeRef.current + deltaRatio * totalDuration
        ))
        onStartTimeChange(Math.round(newStart))
        if (endTime > 0) {
          onEndTimeChange(Math.round(newStart + windowDuration))
        }
      }

      if (isResizing) {
        const deltaResizeRatio = (e.clientX - resizeStartXRef.current) / rect.width
        const newEnd = Math.max(
          startTime + 1,
          Math.min(totalDuration, resizeStartEndRef.current + deltaResizeRatio * totalDuration)
        )
        onEndTimeChange(Math.round(newEnd))
      }
    }

    const handleUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, isResizing, startTime, endTime, totalDuration, onStartTimeChange, onEndTimeChange])

  // Preview playback
  const togglePreview = () => {
    const audio = previewRef.current
    if (!audio) return
    if (isPreviewing) {
      audio.pause()
    } else {
      audio.currentTime = startTime
      audio.play().catch(() => {})
    }
  }

  useEffect(() => {
    const audio = previewRef.current
    if (!audio) return
    const handleTimeUpdate = () => {
      if (endTime > 0 && audio.currentTime >= endTime) {
        audio.pause()
        audio.currentTime = startTime
      }
    }
    audio.addEventListener('timeupdate', handleTimeUpdate)
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate)
  }, [startTime, endTime])

  const windowLeft = `${getStartRatio() * 100}%`
  const windowWidth = `${Math.max((getEndRatio() - getStartRatio()) * 100, 3)}%`

  if (loadError) return null // fall back to plain inputs below

  return (
    <div>
      <audio
        ref={previewRef}
        src={audioUrl}
        onPlay={() => setIsPreviewing(true)}
        onPause={() => setIsPreviewing(false)}
        onEnded={() => setIsPreviewing(false)}
      />

      {/* Waveform canvas */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: 56,
          background: '#1a1a1a',
          borderRadius: 6,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'default',
          userSelect: 'none',
        }}
      >
        {loading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Cargando forma de onda…</span>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={560}
              height={56}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Dim overlay outside window */}
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                pointerEvents: 'none',
                WebkitMaskImage: `linear-gradient(to right,
                  black 0%, black ${windowLeft},
                  transparent ${windowLeft}, transparent calc(${windowLeft} + ${windowWidth}),
                  black calc(${windowLeft} + ${windowWidth}), black 100%)`,
                maskImage: `linear-gradient(to right,
                  black 0%, black ${windowLeft},
                  transparent ${windowLeft}, transparent calc(${windowLeft} + ${windowWidth}),
                  black calc(${windowLeft} + ${windowWidth}), black 100%)`,
              }}
            />

            {/* Draggable selection window */}
            <div
              onMouseDown={handleWindowMouseDown}
              style={{
                position: 'absolute',
                top: 0, bottom: 0,
                left: windowLeft,
                width: windowWidth,
                border: '2px solid rgba(255,255,255,0.85)',
                borderRadius: 3,
                cursor: isDragging ? 'grabbing' : 'grab',
                boxSizing: 'border-box',
              }}
            >
              {/* Resize handle — right edge */}
              <div
                onMouseDown={handleResizeMouseDown}
                style={{
                  position: 'absolute',
                  top: 0, bottom: 0, right: -4,
                  width: 8,
                  cursor: 'ew-resize',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <div style={{
                  width: 3, height: 20,
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: 2,
                }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Time labels + preview button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
          {fmtTime(startTime)} — {fmtTime(endTime > 0 ? endTime : totalDuration)}
        </span>
        <button
          onClick={togglePreview}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: 99,
            fontSize: 11,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          {isPreviewing
            ? <><Pause style={{ width: 10, height: 10 }} /> Pausar</>
            : <><Play style={{ width: 10, height: 10 }} /> Previsualizar</>
          }
        </button>
      </div>

      <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
        Arrastra para elegir el momento. Ajusta el borde derecho para cambiar la duración.
      </p>
    </div>
  )
}

// ─── Main AudioSettingsSection ────────────────────────────────────────────────

interface AudioSettingsSectionProps {
  audioUrl?: string
  startTime?: number
  endTime?: number
  showControls?: boolean
  onAudioUrlChange: (url: string | undefined) => void
  onStartTimeChange: (t: number) => void
  onEndTimeChange: (t: number) => void
  onShowControlsChange: (show: boolean) => void
}

export function AudioSettingsSection({
  audioUrl,
  startTime = 0,
  endTime = 0,
  showControls = true,
  onAudioUrlChange,
  onStartTimeChange,
  onEndTimeChange,
  onShowControlsChange,
}: AudioSettingsSectionProps) {
  const { uploadAudio, uploading, error: uploadError } = useAudioUpload()
  const [startInput, setStartInput] = useState(fmtTime(startTime))
  const [endInput, setEndInput] = useState(endTime > 0 ? fmtTime(endTime) : '')

  // Sync inputs when props change (e.g. from scrubber drag)
  useEffect(() => { setStartInput(fmtTime(startTime)) }, [startTime])
  useEffect(() => { setEndInput(endTime > 0 ? fmtTime(endTime) : '') }, [endTime])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await uploadAudio(file)
    if (result?.url) onAudioUrlChange(result.url)
    e.target.value = ''
  }

  const fileName = audioUrl
    ? decodeURIComponent(audioUrl.split('/').pop()?.split('?')[0] || 'audio')
    : null

  const commitStartInput = () => {
    const t = parseTime(startInput)
    onStartTimeChange(Math.max(0, t))
  }

  const commitEndInput = () => {
    if (!endInput.trim()) { onEndTimeChange(0); return }
    const t = parseTime(endInput)
    onEndTimeChange(Math.max(0, t))
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="flex items-center gap-2 mb-3">
        <Music className="w-4 h-4 text-gray-600" />
        <label className="text-sm font-medium text-gray-700">Música de fondo</label>
      </div>

      <div className="space-y-3">
        {/* Upload / current file */}
        {audioUrl ? (
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <Music className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate flex-1 min-w-0">{fileName}</span>
            <label className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer flex-shrink-0">
              Cambiar
              <input type="file" accept="audio/*" className="hidden" disabled={uploading} onChange={handleFileChange} />
            </label>
            <button onClick={() => onAudioUrlChange(undefined)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 px-3 py-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
            <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600">
                {uploading ? 'Subiendo…' : 'Subir canción'}
              </p>
              <p className="text-[10px] text-gray-400">MP3, WAV, OGG, M4A — máx. 50 MB</p>
            </div>
            <input type="file" accept="audio/*" className="hidden" disabled={uploading} onChange={handleFileChange} />
          </label>
        )}

        {uploadError && (
          <p className="text-xs text-red-500">{uploadError}</p>
        )}

        {/* Waveform scrubber + time controls */}
        {audioUrl && (
          <div className="space-y-3">
            <WaveformScrubber
              audioUrl={audioUrl}
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={onStartTimeChange}
              onEndTimeChange={onEndTimeChange}
            />

            {/* Manual time inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">Inicio (m:ss)</label>
                <input
                  type="text"
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  onBlur={commitStartInput}
                  onKeyDown={(e) => e.key === 'Enter' && commitStartInput()}
                  placeholder="0:00"
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded text-center font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">Fin (m:ss)</label>
                <input
                  type="text"
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  onBlur={commitEndInput}
                  onKeyDown={(e) => e.key === 'Enter' && commitEndInput()}
                  placeholder="Al final"
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded text-center font-mono"
                />
              </div>
            </div>

            {/* Show controls toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Mostrar controles</p>
                <p className="text-xs text-gray-500">Botón de play/pausa visible al invitado</p>
              </div>
              <button
                onClick={() => onShowControlsChange(!showControls)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showControls ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  showControls ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <p className="text-[10px] text-gray-400">
              La música comienza automáticamente cuando el invitado abre el sobre.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

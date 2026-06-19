"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { VariantDropdown } from '@/components/ui/variant-dropdown'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { useAudioUpload } from '@/hooks/use-audio-upload'
import { Upload, X, Play, Pause, Music, Check } from 'lucide-react'

type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'
type SectionHeight = 'compact' | 'normal' | 'tall' | 'full'

function isLightColor(color: string): boolean {
  if (color.startsWith('rgb')) {
    const m = color.match(/(\d+),\s*(\d+),\s*(\d+)/)
    if (m) return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255 > 0.5
  }
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
}

function getLightTint(hex: string, t: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return `rgb(${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)})`
}

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parseTime(str: string): number {
  const parts = str.split(':')
  if (parts.length === 2) return Math.max(0, Number(parts[0]) * 60 + Number(parts[1]))
  return Math.max(0, Number(str) || 0)
}

// ─── WaveformScrubber ────────────────────────────────────────────────────────

interface WaveformScrubberProps {
  audioUrl: string
  startTime: number
  endTime: number
  onStartTimeChange: (t: number) => void
  onEndTimeChange: (t: number) => void
}

function WaveformScrubber({ audioUrl, startTime, endTime, onStartTimeChange, onEndTimeChange }: WaveformScrubberProps) {
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
  const dragStartX = useRef(0)
  const dragStartTime = useRef(0)
  const resizeStartX = useRef(0)
  const resizeStartEnd = useRef(0)
  const NUM_BARS = 140

  useEffect(() => {
    if (!audioUrl) return
    setLoading(true); setLoadError(false)
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(audioUrl, { mode: 'cors' })
        const buf = await res.arrayBuffer()
        if (cancelled) return
        const ctx = new AudioContext()
        const decoded = await ctx.decodeAudioData(buf)
        if (cancelled) return
        setTotalDuration(decoded.duration)
        const ch = decoded.getChannelData(0)
        const block = Math.floor(ch.length / NUM_BARS)
        const p: number[] = []
        for (let i = 0; i < NUM_BARS; i++) {
          let max = 0
          for (let j = i * block; j < i * block + block; j++) {
            if (Math.abs(ch[j]) > max) max = Math.abs(ch[j])
          }
          p.push(max)
        }
        setPeaks(p); setLoading(false); ctx.close()
      } catch { if (!cancelled) { setLoadError(true); setLoading(false) } }
    })()
    return () => { cancelled = true }
  }, [audioUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !peaks.length) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const effective = totalDuration || 1
    const wS = startTime / effective
    const wE = (endTime > 0 ? endTime : effective) / effective
    const barW = W / NUM_BARS
    peaks.forEach((peak, i) => {
      const ratio = i / NUM_BARS
      const inWin = ratio >= wS && ratio < wE
      ctx.fillStyle = inWin ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)'
      const bH = Math.max(3, peak * H * 0.92)
      ctx.beginPath()
      ctx.roundRect(i * barW + 1, (H - bH) / 2, Math.max(barW - 2, 1), bH, 1.5)
      ctx.fill()
    })
  }, [peaks, startTime, endTime, totalDuration])

  const winLeft = `${(startTime / (totalDuration || 1)) * 100}%`
  const winEnd = endTime > 0 ? endTime : totalDuration
  const winWidth = `${Math.max(((winEnd - startTime) / (totalDuration || 1)) * 100, 3)}%`

  useEffect(() => {
    if (!isDragging && !isResizing) return
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current
      if (!el || !totalDuration) return
      const rect = el.getBoundingClientRect()
      const dr = (e.clientX - dragStartX.current) / rect.width
      if (isDragging) {
        const winDur = (endTime > 0 ? endTime : totalDuration) - startTime
        const ns = Math.max(0, Math.min(totalDuration - winDur, dragStartTime.current + dr * totalDuration))
        onStartTimeChange(Math.round(ns))
        if (endTime > 0) onEndTimeChange(Math.round(ns + winDur))
      }
      if (isResizing) {
        const dr2 = (e.clientX - resizeStartX.current) / rect.width
        const ne = Math.max(startTime + 1, Math.min(totalDuration, resizeStartEnd.current + dr2 * totalDuration))
        onEndTimeChange(Math.round(ne))
      }
    }
    const onUp = () => { setIsDragging(false); setIsResizing(false) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [isDragging, isResizing, startTime, endTime, totalDuration, onStartTimeChange, onEndTimeChange])

  useEffect(() => {
    const audio = previewRef.current
    if (!audio) return
    const onUpdate = () => {
      if (endTime > 0 && audio.currentTime >= endTime) { audio.pause(); audio.currentTime = startTime }
    }
    audio.addEventListener('timeupdate', onUpdate)
    return () => audio.removeEventListener('timeupdate', onUpdate)
  }, [startTime, endTime])

  if (loadError) return null

  return (
    <div>
      <audio ref={previewRef} src={audioUrl}
        onPlay={() => setIsPreviewing(true)}
        onPause={() => setIsPreviewing(false)}
        onEnded={() => setIsPreviewing(false)}
      />

      {/* Canvas */}
      <div ref={containerRef} style={{ position: 'relative', height: 56, background: '#1a1a1a', borderRadius: 8, overflow: 'hidden', userSelect: 'none' }}>
        {loading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Cargando…</span>
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} width={560} height={56} style={{ width: '100%', height: '100%', display: 'block' }} />
            {/* Dim overlay */}
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none',
              WebkitMaskImage: `linear-gradient(to right, black 0%, black ${winLeft}, transparent ${winLeft}, transparent calc(${winLeft} + ${winWidth}), black calc(${winLeft} + ${winWidth}), black 100%)`,
              maskImage: `linear-gradient(to right, black 0%, black ${winLeft}, transparent ${winLeft}, transparent calc(${winLeft} + ${winWidth}), black calc(${winLeft} + ${winWidth}), black 100%)`,
            }} />
            {/* Selection window */}
            <div
              onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); dragStartX.current = e.clientX; dragStartTime.current = startTime }}
              style={{ position: 'absolute', top: 0, bottom: 0, left: winLeft, width: winWidth, border: '2px solid rgba(255,255,255,0.8)', borderRadius: 4, cursor: isDragging ? 'grabbing' : 'grab', boxSizing: 'border-box' }}
            >
              {/* Resize handle */}
              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsResizing(true); resizeStartX.current = e.clientX; resizeStartEnd.current = endTime > 0 ? endTime : totalDuration }}
                style={{ position: 'absolute', top: 0, bottom: 0, right: -5, width: 10, cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <div style={{ width: 3, height: 20, background: 'rgba(255,255,255,0.75)', borderRadius: 2 }} />
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
          {fmtTime(startTime)} — {fmtTime(endTime > 0 ? endTime : totalDuration)}
        </span>
        <button
          onClick={() => {
            const audio = previewRef.current
            if (!audio) return
            if (isPreviewing) { audio.pause() }
            else { audio.currentTime = startTime; audio.play().catch(() => {}) }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 99, fontSize: 11, color: '#374151', cursor: 'pointer' }}
        >
          {isPreviewing ? <><Pause style={{ width: 10, height: 10 }} /> Pausar</> : <><Play style={{ width: 10, height: 10 }} /> Escuchar</>}
        </button>
      </div>
      <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
        Arrastra para elegir inicio · Ajusta el borde derecho para cambiar la duración
      </p>
    </div>
  )
}

// ─── MusicConfigForm ─────────────────────────────────────────────────────────

interface MusicConfigFormProps {
  config: {
    variant?: string
    sectionTitle?: string
    sectionSubtitle?: string
    songTitle?: string
    artistName?: string
    audioUrl?: string
    startTime?: number
    endTime?: number
    showControls?: boolean
    showTimes?: boolean
    autoPlay?: boolean
    playerStyle?: 'card' | 'strip'
    backgroundColorChoice?: BackgroundColorChoice
    sectionHeight?: SectionHeight
  }
  onChange: (key: string, value: any) => void
}

export function MusicConfigForm({ config, onChange }: MusicConfigFormProps) {
  const { config: pageConfig } = usePageConfig()
  const { uploadAudio, uploading, error: uploadError } = useAudioUpload()
  const [startInput, setStartInput] = useState(fmtTime(config.startTime ?? 0))
  const [endInput, setEndInput] = useState(config.endTime ? fmtTime(config.endTime) : '')

  const themeColors = pageConfig.siteSettings.theme?.colors
  const primaryColor = themeColors?.primary || '#d4a574'
  const secondaryColor = themeColors?.secondary || '#9ba082'
  const accentColor = themeColors?.accent || '#e6b5a3'

  const colorGroups: { label: string; colors: { value: BackgroundColorChoice; color: string | null }[] }[] = [
    { label: 'Ninguno', colors: [{ value: 'none', color: null }] },
    { label: 'Principal', colors: [
      { value: 'primary', color: primaryColor },
      { value: 'primary-light', color: getLightTint(primaryColor, 0.5) },
      { value: 'primary-lighter', color: getLightTint(primaryColor, 0.88) },
    ]},
    { label: 'Secundario', colors: [
      { value: 'secondary', color: secondaryColor },
      { value: 'secondary-light', color: getLightTint(secondaryColor, 0.5) },
      { value: 'secondary-lighter', color: getLightTint(secondaryColor, 0.88) },
    ]},
    { label: 'Acento', colors: [
      { value: 'accent', color: accentColor },
      { value: 'accent-light', color: getLightTint(accentColor, 0.5) },
      { value: 'accent-lighter', color: getLightTint(accentColor, 0.88) },
    ]},
  ]

  const currentChoice = config.backgroundColorChoice || 'none'

  const heightOptions: { value: SectionHeight; label: string }[] = [
    { value: 'compact', label: 'Compacto' },
    { value: 'normal', label: 'Normal' },
    { value: 'tall', label: 'Alto' },
    { value: 'full', label: 'Extra' },
  ]

  useEffect(() => { setStartInput(fmtTime(config.startTime ?? 0)) }, [config.startTime])
  useEffect(() => { setEndInput(config.endTime ? fmtTime(config.endTime) : '') }, [config.endTime])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await uploadAudio(file)
    if (result?.url) {
      onChange('audioUrl', result.url)
      onChange('startTime', 0)
      onChange('endTime', 0)
    }
    e.target.value = ''
  }

  const fileName = config.audioUrl
    ? decodeURIComponent(config.audioUrl.split('/').pop()?.split('?')[0] || 'audio')
    : null

  const variants = [
    { value: 'minimal', label: 'Minimal', description: 'Clean player card with circular progress' },
    { value: 'old-money', label: 'Old Money', description: 'Dark editorial waveform player' },
  ]

  return (
    <div className="space-y-6">
      {/* Variant */}
      <VariantDropdown
        label="Estilo"
        value={config.variant || 'minimal'}
        options={variants}
        onChange={(value) => onChange('variant', value)}
        placeholder="Elige un estilo"
      />

      {/* Background color */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Color de fondo</label>
        <div className="space-y-3">
          {colorGroups.map((group) => (
            <div key={group.label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 shrink-0">{group.label}</span>
              <div className="flex gap-2">
                {group.colors.map((option) => {
                  const isSelected = currentChoice === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange('backgroundColorChoice', option.value)}
                    >
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{
                          backgroundColor: option.color || '#ffffff',
                          backgroundImage: option.color ? undefined : 'linear-gradient(45deg,#f3f4f6 25%,transparent 25%),linear-gradient(-45deg,#f3f4f6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f3f4f6 75%),linear-gradient(-45deg,transparent 75%,#f3f4f6 75%)',
                          backgroundSize: option.color ? undefined : '8px 8px',
                          backgroundPosition: option.color ? undefined : '0 0,0 4px,4px -4px,-4px 0px',
                        }}
                      >
                        {isSelected && (
                          <Check className="w-4 h-4" style={{ color: option.color ? (isLightColor(option.color) ? '#374151' : '#ffffff') : '#374151' }} />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Estilo del reproductor</label>
        <div className="flex gap-2">
          {([
            { value: 'card',  label: 'Tarjeta' },
            { value: 'strip', label: 'Tira' },
          ] as const).map(({ value, label }) => (
            <Button
              key={value}
              variant={(config.playerStyle || 'card') === value ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => onChange('playerStyle', value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Section height */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Altura de la sección</label>
        <div className="flex gap-2">
          {heightOptions.map((h) => (
            <Button
              key={h.value}
              variant={(config.sectionHeight || 'normal') === h.value ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => onChange('sectionHeight', h.value)}
            >
              {h.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Section labels */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-900 text-sm">Encabezado de sección</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
          <Input
            value={config.sectionTitle || ''}
            onChange={(e) => onChange('sectionTitle', e.target.value)}
            placeholder="Nuestra canción"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
          <Input
            value={config.sectionSubtitle || ''}
            onChange={(e) => onChange('sectionSubtitle', e.target.value)}
            placeholder="La canción que nos une"
          />
        </div>
      </div>

      {/* Song metadata */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-900 text-sm">Información de la canción</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la canción</label>
          <Input
            value={config.songTitle || ''}
            onChange={(e) => onChange('songTitle', e.target.value)}
            placeholder="Nuestra Canción"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Artista</label>
          <Input
            value={config.artistName || ''}
            onChange={(e) => onChange('artistName', e.target.value)}
            placeholder="Nombre del artista"
          />
        </div>
      </div>

      {/* Audio file */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-gray-500" />
          <h4 className="font-medium text-gray-900 text-sm">Archivo de audio</h4>
        </div>

        {config.audioUrl ? (
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <Music className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate flex-1 min-w-0">{fileName}</span>
            <label className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer flex-shrink-0">
              Cambiar
              <input type="file" accept="audio/*" className="hidden" disabled={uploading} onChange={handleFileChange} />
            </label>
            <button onClick={() => { onChange('audioUrl', undefined); onChange('startTime', 0); onChange('endTime', 0) }} className="text-gray-400 hover:text-red-500 flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 px-3 py-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
            <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600">{uploading ? 'Subiendo…' : 'Subir canción'}</p>
              <p className="text-[10px] text-gray-400">MP3, WAV, OGG, M4A — máx. 50 MB</p>
            </div>
            <input type="file" accept="audio/*" className="hidden" disabled={uploading} onChange={handleFileChange} />
          </label>
        )}

        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

        {/* Waveform scrubber */}
        {config.audioUrl && (
          <WaveformScrubber
            audioUrl={config.audioUrl}
            startTime={config.startTime ?? 0}
            endTime={config.endTime ?? 0}
            onStartTimeChange={(t) => onChange('startTime', t)}
            onEndTimeChange={(t) => onChange('endTime', t)}
          />
        )}

        {/* Manual time inputs */}
        {config.audioUrl && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Inicio (m:ss)</label>
              <input
                type="text"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                onBlur={() => onChange('startTime', parseTime(startInput))}
                onKeyDown={(e) => e.key === 'Enter' && onChange('startTime', parseTime(startInput))}
                placeholder="0:00"
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Fin (m:ss)</label>
              <input
                type="text"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                onBlur={() => onChange('endTime', endInput.trim() ? parseTime(endInput) : 0)}
                onKeyDown={(e) => e.key === 'Enter' && onChange('endTime', endInput.trim() ? parseTime(endInput) : 0)}
                placeholder="Al final"
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Playback options */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 text-sm">Opciones de reproducción</h4>
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'autoPlay',     defaultVal: true, label: 'Auto-reproducir' },
            { key: 'showControls', defaultVal: true, label: 'Controles' },
            { key: 'showTimes',    defaultVal: true, label: 'Tiempos' },
          ] as const).map(({ key, defaultVal, label }) => {
            const active = config[key] ?? defaultVal
            return (
              <Button
                key={key}
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange(key, !active)}
              >
                {label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

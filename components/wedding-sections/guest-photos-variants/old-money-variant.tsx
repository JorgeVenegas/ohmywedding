"use client"

import { useRef } from "react"
import { Camera, ArrowUpFromLine, X, Check, AlertCircle, Loader2, ImageIcon } from "lucide-react"
import type { BaseVariantProps, GuestPhoto, UploadItem, GalleryLayout } from "./types"
import { resolveBackground } from "./types"
import { GalleryArea } from "./gallery-area"

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
  .album-photo { animation: albumFadeIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
  .album-pop   { animation: albumPop   0.3s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .album-shimmer {
    background: linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.07) 50%, rgba(0,0,0,0.04) 75%);
    background-size: 200% 100%;
    animation: albumShimmer 1.6s ease-in-out infinite;
  }
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

// ─── Gallery ─────────────────────────────────────────────────────────────────

function AlbumSkeleton() {
  return (
    <div className="columns-2 sm:columns-3 gap-4 space-y-4">
      {[140, 100, 170, 120, 155, 110].map((h, i) => (
        <div key={i} className="break-inside-avoid album-shimmer" style={{ height: h }} />
      ))}
    </div>
  )
}

function AlbumEmpty({ accent, submitted, moderationEnabled }: { accent: string; submitted?: boolean; moderationEnabled?: boolean }) {
  const pendingReview = submitted && (moderationEnabled !== false)
  return (
    <div className="py-20 flex flex-col items-center gap-4">
      <div className="relative w-16 h-20" style={{ border: `1px solid ${INK}18` }}>
        <PhotoCorners accent={accent} />
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-6 h-6" style={{ color: `${INK}25` }} />
        </div>
      </div>
      <p className="text-[11px] tracking-[0.35em] uppercase" style={{ color: MUTED }}>
        {pendingReview ? 'Awaiting review' : 'No photographs yet'}
      </p>
      {pendingReview && (
        <p className="text-[10px] tracking-[0.2em]" style={{ color: `${MUTED}80` }}>
          Your photos will appear once approved
        </p>
      )}
    </div>
  )
}

function AlbumGallery({ photos, accent, galleryLayout }: { photos: GuestPhoto[]; accent: string; galleryLayout: GalleryLayout }) {
  if (galleryLayout === 'film-strip') {
    return (
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-4 pb-2">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="relative flex-shrink-0 group album-photo"
              style={{ width: 200, animationDelay: `${i * 0.06}s` }}
            >
              <img src={photo.url} alt={photo.file_name ?? 'Guest photo'} className="w-full object-cover" style={{ height: 180 }} />
              <PhotoCorners accent={accent} />
              {photo.uploader_name && (
                <p className="mt-1.5 text-[9px] tracking-[0.25em] uppercase truncate" style={{ color: MUTED }}>
                  {photo.uploader_name}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (galleryLayout === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="relative group album-photo"
            style={{ animationDelay: `${i * 0.055}s` }}
          >
            <div className="relative overflow-hidden aspect-square">
              <img src={photo.url} alt={photo.file_name ?? 'Guest photo'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <PhotoCorners accent={accent} />
            </div>
            {photo.uploader_name && (
              <p className="mt-1.5 text-[9px] tracking-[0.25em] uppercase truncate" style={{ color: MUTED }}>
                {photo.uploader_name}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (galleryLayout === 'scattered') {
    const rotations = [-3, 2, -1.5, 3.5, -2.5, 1]
    const chunks: GuestPhoto[][] = []
    for (let i = 0; i < photos.length; i += 3) chunks.push(photos.slice(i, i + 3))

    return (
      <div className="space-y-12">
        {chunks.map((chunk, ci) => (
          <div key={ci} className="flex flex-wrap justify-center gap-6 py-4">
            {chunk.map((photo, pi) => {
              const rot = rotations[(ci * 3 + pi) % rotations.length]
              const large = pi === 1
              return (
                <div
                  key={photo.id}
                  className="relative flex-shrink-0 group album-photo"
                  style={{
                    transform: `rotate(${rot}deg)`,
                    width: large ? 180 : 148,
                    marginTop: pi % 2 === 0 ? '1.5rem' : '0',
                    animationDelay: `${(ci * 3 + pi) * 0.07}s`,
                  }}
                >
                  <div
                    className="transition-all duration-400 group-hover:shadow-xl group-hover:-translate-y-2"
                    style={{ background: '#fff', padding: '8px 8px 28px 8px' }}
                  >
                    <img
                      src={photo.url}
                      alt={photo.file_name ?? 'Guest photo'}
                      className="w-full object-cover block"
                      style={{ height: large ? 160 : 130 }}
                    />
                    <PhotoCorners accent={accent} />
                    {photo.uploader_name && (
                      <p className="text-[9px] text-center mt-2 tracking-[0.2em] uppercase truncate" style={{ color: MUTED }}>
                        {photo.uploader_name}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // Default: masonry
  return (
    <div className="columns-2 sm:columns-3 gap-4 space-y-4">
      {photos.map((photo, i) => (
        <div
          key={photo.id}
          className="break-inside-avoid relative group album-photo"
          style={{ animationDelay: `${i * 0.055}s` }}
        >
          <div className="relative overflow-hidden">
            <img src={photo.url} alt={photo.file_name ?? 'Guest photo'} className="w-full object-cover block transition-transform duration-500 group-hover:scale-[1.03]" />
            <PhotoCorners accent={accent} />
          </div>
          {photo.uploader_name && (
            <p className="mt-1.5 text-[9px] tracking-[0.25em] uppercase truncate" style={{ color: MUTED }}>
              {photo.uploader_name}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Upload queue thumbnail ───────────────────────────────────────────────────

function QueueThumb({ item, onRemove, accent }: { item: UploadItem; onRemove: () => void; accent: string }) {
  return (
    <div className="relative flex-shrink-0 group" style={{ width: 64, height: 64 }}>
      <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
      <PhotoCorners accent={accent} />

      {item.progress === 'uploading' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="relative w-7 h-7">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
              <circle
                cx="14" cy="14" r="11" fill="none" stroke="white" strokeWidth="2"
                strokeDasharray={2 * Math.PI * 11}
                strokeDashoffset={2 * Math.PI * 11 * (1 - (item.uploadProgress ?? 0))}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.15s linear' }}
              />
            </svg>
          </div>
        </div>
      )}
      {item.progress === 'done' && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center album-pop">
          <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
      )}
      {item.progress === 'error' && (
        <div className="absolute inset-0 bg-red-600/50 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-white" />
        </div>
      )}
      {(item.progress === 'idle' || item.progress === 'error') && (
        <button
          onClick={onRemove}
          className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
    onFileChange, onRemoveUpload, onSubmitAll, submitted, moderationEnabled,
  } = props

  const idleUploads = uploads.filter(u => u.progress === 'idle')
  const allDone = uploads.length > 0 && uploads.every(u => u.progress === 'done')

  if (submitted) {
    return (
      <div className="mb-12">
        <p className="text-[9px] tracking-[0.5em] uppercase mb-5" style={{ color: MUTED }}>
          Contribution received
        </p>
        <div className="py-8 px-4 text-center" style={{ border: `1px solid ${INK}12` }}>
          <p className="text-sm italic mb-1" style={{ color: ink, fontFamily: 'var(--font-display, Georgia, serif)' }}>
            Thank you.
          </p>
          <p className="text-[11px] tracking-[0.2em]" style={{ color: MUTED }}>
            {moderationEnabled !== false ? 'Your photographs are pending review.' : 'Your photographs have been added to the album.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-12">
      {/* Eyebrow */}
      <p className="text-[9px] tracking-[0.5em] uppercase mb-5" style={{ color: MUTED }}>
        Contribute to the album
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

      {/* Drop zone — minimal single-border rectangle */}
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
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => onFileChange(e.target.files)} />
        <div style={{ color: isDragging ? accent : `${INK}35` }}>
          {isDragging
            ? <ArrowUpFromLine className="w-5 h-5 transition-all" />
            : <Camera className="w-5 h-5" />
          }
        </div>
        <p className="text-[11px] tracking-[0.3em] uppercase" style={{ color: isDragging ? accent : MUTED }}>
          {isDragging ? 'Release to add' : 'Drag photographs here'}
        </p>
        <p className="text-[10px]" style={{ color: `${INK}35` }}>
          or tap to browse · JPG, PNG, WEBP · up to 50 MB
        </p>
      </div>

      {/* Queue */}
      {uploads.length > 0 && (
        <div className="mt-5">
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {uploads.map(item => (
              <QueueThumb
                key={item.id}
                item={item}
                accent={accent}
                onRemove={() => onRemoveUpload(item.id)}
              />
            ))}
          </div>

          {allDone && (
            <p className="mt-3 text-[10px] tracking-[0.3em] uppercase" style={{ color: accent }}>
              Photographs added to the album.
            </p>
          )}

          {idleUploads.length > 0 && (
            <button
              onClick={onSubmitAll}
              className="mt-5 px-8 py-2.5 text-[11px] tracking-[0.35em] uppercase transition-all duration-200 hover:opacity-80 active:scale-[0.98]"
              style={{ background: ink, color: bg }}
            >
              Contribute {idleUploads.length === 1 ? 'photograph' : `${idleUploads.length} photographs`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main variant ─────────────────────────────────────────────────────────────

export function OldMoneyVariant(props: BaseVariantProps) {
  const { theme, primary, title, subtitle, galleryLayout, useColorBackground, backgroundColorChoice, photos, photosLoading, uploadsEnabled, submitted, moderationEnabled } = props
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

        {/* Gallery — native album treatment for film-strip / grid / scattered;
            delegate everything else to GalleryArea so all layouts work */}
        {['film-strip', 'grid', 'scattered'].includes(galleryLayout) ? (
          photosLoading ? (
            <AlbumSkeleton />
          ) : photos.length === 0 ? (
            <AlbumEmpty accent={accent} submitted={submitted} moderationEnabled={moderationEnabled} />
          ) : (
            <AlbumGallery photos={photos} accent={accent} galleryLayout={galleryLayout} />
          )
        ) : (
          <GalleryArea
            photos={photos}
            photosLoading={photosLoading}
            galleryLayout={galleryLayout}
            primary={accent}
            emptyColor={muted}
            emptyBg={`${ink}08`}
            submitted={submitted}
            moderationEnabled={moderationEnabled}
          />
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

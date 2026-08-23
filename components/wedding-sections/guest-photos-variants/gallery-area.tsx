"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { X, ImageIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import type { GuestPhoto, GalleryLayout } from "./types"

const GALLERY_ANIMATIONS = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmerSlide {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes lbIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes lbScale {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }
  .photo-enter {
    opacity: 0;
    animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
  }
  .shimmer {
    background: linear-gradient(90deg,
      rgba(0,0,0,0.06) 25%,
      rgba(0,0,0,0.10) 50%,
      rgba(0,0,0,0.06) 75%);
    background-size: 200% 100%;
    animation: shimmerSlide 1.5s ease-in-out infinite;
  }
  .lb-overlay { animation: lbIn 0.18s ease forwards; }
  .lb-image   { animation: lbScale 0.22s cubic-bezier(0.22,1,0.36,1) forwards; }
`

function idHash(id: string): number {
  let h = 397
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

export interface GalleryAreaProps {
  photos: GuestPhoto[]
  photosLoading: boolean
  galleryLayout: GalleryLayout
  frameStyle?: 'none' | 'white' | 'dark' | 'hairline'
  primary?: string
  emptyColor?: string
  emptyBg?: string
  submitted?: boolean
  moderationEnabled?: boolean
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ photo, onClose }: { photo: GuestPhoto; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center lb-overlay"
      style={{ background: 'rgba(0,0,0,0.93)' }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white"
        style={{ background: 'rgba(255,255,255,0.12)', zIndex: 1 }}
        onClick={onClose}
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      <div
        className="relative lb-image flex items-center justify-center"
        style={{ maxWidth: '92vw', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={photo.display_url ?? ''}
          alt={photo.file_name ?? 'Guest photo'}
          className="block select-none"
          style={{ maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain', boxShadow: '0 32px 96px rgba(0,0,0,0.8)' }}
        />
        {photo.uploader_name && (
          <div className="absolute bottom-0 inset-x-0 py-3 px-4 text-center"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
            <p className="text-sm text-white/80">{photo.uploader_name}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function HoverOverlay({ name }: { name?: string | null }) {
  return (
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.08) 50%, transparent 100%)' }}>
      {name && (
        <span className="absolute bottom-2.5 left-3 text-[11px] font-medium text-white/90 truncate"
          style={{ maxWidth: 'calc(100% - 1.5rem)' }}>
          {name}
        </span>
      )}
    </div>
  )
}

function EmptyState({ primary = '#d4a574', emptyColor, emptyBg, pendingReview = false }: {
  primary?: string; emptyColor?: string; emptyBg?: string; pendingReview?: boolean
}) {
  return (
    <div className="text-center py-20 px-4">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: emptyBg ?? `${primary}12` }}>
        {pendingReview
          ? <Clock className="w-6 h-6" style={{ color: emptyColor ?? primary }} />
          : <ImageIcon className="w-6 h-6" style={{ color: emptyColor ?? primary }} />
        }
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: emptyColor ?? `${primary}80` }}>
        {pendingReview ? 'Your photos are under review' : 'No photos yet — be the first to share one!'}
      </p>
      {pendingReview && (
        <p className="text-xs" style={{ color: emptyColor ? `${emptyColor}70` : `${primary}50` }}>
          They'll appear here once approved.
        </p>
      )}
    </div>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonMasonry() {
  const heights = [200, 280, 160, 240, 185, 215, 150, 260, 195, 170, 230, 165]
  return (
    <div className="columns-2 sm:columns-3" style={{ columnGap: 0 }}>
      {heights.map((h, i) => (
        <div key={i} className="break-inside-avoid shimmer" style={{ height: h, display: 'block' }} />
      ))}
    </div>
  )
}

function SkeletonRows() {
  return (
    <div>
      {[0, 1, 2].map(row => (
        <div key={row} style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
          {[55, 30, 45].map((w, i) => (
            <div key={i} className="shimmer" style={{ flex: `${w} 0 0`, height: 220 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonCollage() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '240px 200px', gap: 3 }}>
      <div className="shimmer" style={{ gridRow: '1 / 3' }} />
      <div className="shimmer" />
      <div className="shimmer" />
      <div className="shimmer" />
      <div className="shimmer" />
    </div>
  )
}

function SkeletonMosaic() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: 200, gap: 0 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="shimmer" style={{ gridColumn: `span ${i % 5 === 2 ? 2 : 1}` }} />
      ))}
    </div>
  )
}

function SkeletonFilmStrip() {
  const holes = Array.from({ length: 40 })
  return (
    <div style={{ background: '#0e0e0e', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 5, padding: '6px 8px', overflow: 'hidden' }}>
        {holes.map((_, i) => <div key={i} style={{ width: 14, height: 9, borderRadius: 2, background: '#272727', flexShrink: 0 }} />)}
      </div>
      <div style={{ display: 'flex', height: 220, gap: 2, overflow: 'hidden' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shimmer" style={{ width: i % 3 === 1 ? 280 : 190, height: '100%', flexShrink: 0, opacity: 0.35 }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, padding: '6px 8px', overflow: 'hidden' }}>
        {holes.map((_, i) => <div key={i} style={{ width: 14, height: 9, borderRadius: 2, background: '#272727', flexShrink: 0 }} />)}
      </div>
    </div>
  )
}

function SkeletonScattered() {
  return (
    <div style={{ background: '#f5f1eb', padding: '40px 20px', minHeight: 360 }}>
      {[[-8, 140, 90], [5, 60, 50], [-3, 220, 70]].map(([rot, left, top], i) => (
        <div key={i} className="shimmer" style={{
          position: 'absolute', width: 160, height: 185,
          transform: `rotate(${rot}deg)`,
          left: `${left}px`, top: `${top}px`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }} />
      ))}
    </div>
  )
}

function SkeletonCarousel() {
  return (
    <div>
      <div className="shimmer" style={{ height: 'clamp(320px, 56vh, 640px)' }} />
      <div style={{ display: 'flex', gap: 2, background: '#0a0a0a', padding: '2px 0' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="shimmer" style={{ width: 72, height: 52, flexShrink: 0, opacity: 0.35 }} />
        ))}
      </div>
    </div>
  )
}

// ─── Masonry (Pinterest) ──────────────────────────────────────────────────────

function MasonryGallery({ photos, onPhotoClick }: { photos: GuestPhoto[]; onPhotoClick: (p: GuestPhoto) => void }) {
  return (
    <div className="columns-2 sm:columns-3" style={{ columnGap: 0 }}>
      {photos.map((photo, i) => (
        <div key={photo.id} className="break-inside-avoid relative group cursor-pointer photo-enter overflow-hidden"
          style={{ display: 'block', animationDelay: `${i * 0.04}s` }}
          onClick={() => onPhotoClick(photo)}>
          <img src={photo.display_url ?? ''} alt={photo.file_name ?? 'Guest photo'}
            className="w-full block transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ display: 'block' }} loading="lazy" />
          <HoverOverlay name={photo.uploader_name} />
        </div>
      ))}
    </div>
  )
}

// ─── Rows (Justified) ─────────────────────────────────────────────────────────
// Photos grouped into visual rows of 3–4; each row = same height, variable widths.
// Distinct from masonry: horizontal rhythm, visible separators, row counter.

function RowsGallery({ photos, onPhotoClick }: { photos: GuestPhoto[]; onPhotoClick: (p: GuestPhoto) => void }) {
  // Group into rows of 3 (desktop) or 2 (mobile)
  const rowSize = 3
  const rows: GuestPhoto[][] = []
  for (let i = 0; i < photos.length; i += rowSize) rows.push(photos.slice(i, i + rowSize))

  return (
    <div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ borderTop: ri === 0 ? 'none' : '3px solid #f0ece4' }}>
          {/* Row label */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 0', gap: 8 }}>
            <span style={{
              fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase',
              color: 'rgba(0,0,0,0.18)', fontVariantNumeric: 'tabular-nums',
            }}>
              {String(ri + 1).padStart(2, '0')}
            </span>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,0,0,0.08)' }} />
          </div>
          {/* Photos in row */}
          <div style={{ display: 'flex', gap: 3, padding: '6px 0 0' }}>
            {row.map((photo, pi) => (
              <div key={photo.id}
                className="relative group cursor-pointer overflow-hidden photo-enter"
                style={{ flex: 1, height: 'clamp(180px, 28vw, 300px)', animationDelay: `${(ri * rowSize + pi) * 0.04}s` }}
                onClick={() => onPhotoClick(photo)}
              >
                <img src={photo.display_url ?? ''} alt={photo.file_name ?? 'Guest photo'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy" />
                <HoverOverlay name={photo.uploader_name} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Mosaic Grid ──────────────────────────────────────────────────────────────

function MosaicGrid({ photos, onPhotoClick }: { photos: GuestPhoto[]; onPhotoClick: (p: GuestPhoto) => void }) {
  return (
    <>
      <div className="hidden sm:grid"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '210px', gap: 0, gridAutoFlow: 'dense' }}>
        {photos.map((photo, i) => (
          <div key={photo.id} className="relative group overflow-hidden cursor-pointer photo-enter"
            style={{ gridColumn: `span ${i % 5 === 2 ? 2 : 1}`, animationDelay: `${i * 0.04}s` }}
            onClick={() => onPhotoClick(photo)}>
            <img src={photo.display_url ?? ''} alt={photo.file_name ?? 'Guest photo'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy" />
            <HoverOverlay name={photo.uploader_name} />
          </div>
        ))}
      </div>
      <div className="sm:hidden grid grid-cols-2" style={{ gap: 0 }}>
        {photos.map((photo, i) => (
          <div key={photo.id} className="relative aspect-square group overflow-hidden cursor-pointer photo-enter"
            style={{ animationDelay: `${i * 0.04}s` }} onClick={() => onPhotoClick(photo)}>
            <img src={photo.display_url ?? ''} alt={photo.file_name ?? 'Guest photo'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy" />
            <HoverOverlay name={photo.uploader_name} />
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Film Strip ───────────────────────────────────────────────────────────────

function FilmStripGallery({ photos, onPhotoClick }: { photos: GuestPhoto[]; onPhotoClick: (p: GuestPhoto) => void }) {
  const holes = Array.from({ length: 44 })
  const STRIP_H = 220
  return (
    <div style={{ background: '#0e0e0e', userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px', overflow: 'hidden' }}>
        {holes.map((_, i) => <div key={i} style={{ width: 14, height: 9, borderRadius: 2, background: '#272727', flexShrink: 0 }} />)}
      </div>
      <div style={{ display: 'flex', overflowX: 'auto', height: STRIP_H, gap: 0, scrollbarWidth: 'none' }}>
        {photos.map((photo, i) => (
          <div key={photo.id} className="relative group flex-shrink-0 cursor-pointer photo-enter"
            style={{ height: '100%', animationDelay: `${i * 0.06}s` }} onClick={() => onPhotoClick(photo)}>
            <img src={photo.display_url ?? ''} alt={photo.file_name ?? 'Guest photo'}
              className="h-full w-auto block transition-opacity duration-200 group-hover:opacity-85" loading="lazy" />
            <HoverOverlay name={photo.uploader_name} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px', overflow: 'hidden' }}>
        {holes.map((_, i) => <div key={i} style={{ width: 14, height: 9, borderRadius: 2, background: '#272727', flexShrink: 0 }} />)}
      </div>
      {photos.length > 3 && (
        <p style={{ textAlign: 'center', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#444', paddingBottom: 8 }}>
          scroll →
        </p>
      )}
    </div>
  )
}

// ─── Collage (Editorial Magazine) ─────────────────────────────────────────────
// Unmistakably editorial: large feature photo (2/3 width) anchors the left;
// smaller photos tile the right column. Groups of 5 repeat this pattern.

function CollageGallery({ photos, onPhotoClick }: { photos: GuestPhoto[]; onPhotoClick: (p: GuestPhoto) => void }) {
  // Group photos into blocks of 5 (1 hero + 4 small), then remaining as grid
  const blocks: Array<{ hero: GuestPhoto; support: GuestPhoto[] }> = []
  let i = 0
  while (i < photos.length) {
    const hero = photos[i]
    const support = photos.slice(i + 1, i + 5)
    blocks.push({ hero, support })
    i += 5
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {blocks.map((block, bi) => {
        const isFlipped = bi % 2 === 1 // alternate hero left/right for variety
        return (
          <div key={bi} style={{ display: 'flex', gap: 3, height: 'clamp(280px, 38vw, 480px)' }}>
            {/* Hero: takes 58% of width */}
            <div className={`relative group cursor-pointer overflow-hidden photo-enter flex-shrink-0 ${isFlipped ? 'order-last' : ''}`}
              style={{ flex: '58 0 0%', animationDelay: `${bi * 0.12}s` }}
              onClick={() => onPhotoClick(block.hero)}
            >
              <img src={block.hero.display_url ?? ''} alt={block.hero.file_name ?? 'Guest photo'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="lazy" />
              {/* Feature label */}
              <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}>
                {block.hero.uploader_name && (
                  <p className="text-sm text-white/85 font-medium">{block.hero.uploader_name}</p>
                )}
                <p style={{ fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                  Featured
                </p>
              </div>
            </div>

            {/* Support grid: 2×2 of smaller photos */}
            {block.support.length > 0 && (
              <div style={{ flex: '42 0 0%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 3 }}>
                {block.support.map((photo, si) => (
                  <div key={photo.id} className="relative group cursor-pointer overflow-hidden photo-enter"
                    style={{ animationDelay: `${bi * 0.12 + (si + 1) * 0.04}s` }}
                    onClick={() => onPhotoClick(photo)}
                  >
                    <img src={photo.display_url ?? ''} alt={photo.file_name ?? 'Guest photo'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                      loading="lazy" />
                    <HoverOverlay name={photo.uploader_name} />
                  </div>
                ))}
                {/* Fill empty slots with placeholder tint */}
                {Array.from({ length: Math.max(0, 4 - block.support.length) }).map((_, fi) => (
                  <div key={`fill-${fi}`} style={{ background: 'rgba(0,0,0,0.04)' }} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Scattered (Physical Prints) ─────────────────────────────────────────────
// Polaroid prints scattered on a linen surface — rotation, overlap, elevation.
// Each print has a white matte border with the name below.

function ScatteredGallery({
  photos, frameStyle = 'white', onPhotoClick,
}: { photos: GuestPhoto[]; frameStyle?: GalleryAreaProps['frameStyle']; onPhotoClick: (p: GuestPhoto) => void }) {
  const isDark = frameStyle === 'dark'

  // Stable rotation per photo — deterministic from id
  const getRotation = (id: string, idx: number) => {
    const h = idHash(id + idx)
    const angle = ((h % 28) - 14) * 0.9
    // Push adjacent photos in opposite directions for natural scatter
    return idx % 2 === 0 ? angle : -angle * 0.8
  }

  const getOffset = (id: string, idx: number) => {
    const h = idHash(id + idx + 99)
    return ((h % 20) - 10) // vertical offset in px
  }

  const chunks: GuestPhoto[][] = []
  for (let i = 0; i < photos.length; i += 3) chunks.push(photos.slice(i, i + 3))

  return (
    <div style={{
      background: isDark ? '#1a1a1a' : '#f2ede6',
      backgroundImage: isDark
        ? 'none'
        : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23ede8e0'/%3E%3Crect x='0' y='0' width='2' height='2' fill='%23e8e3dc' opacity='.4'/%3E%3C/svg%3E")`,
      padding: '32px 16px 48px',
    }}>
      {chunks.map((chunk, ci) => (
        <div key={ci} style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 0', position: 'relative' }}>
          {chunk.map((photo, pi) => {
            const rot = getRotation(photo.id, ci * 3 + pi)
            const offsetY = getOffset(photo.id, ci * 3 + pi)
            const isFeatured = pi === 1
            const printW = isFeatured ? 200 : 164
            const imgH = isFeatured ? 180 : 148

            return (
              <div
                key={photo.id}
                className="relative flex-shrink-0 cursor-pointer photo-enter"
                style={{
                  width: printW,
                  transform: `rotate(${rot}deg) translateY(${offsetY}px)`,
                  zIndex: pi === 1 ? 3 : pi === 0 ? 2 : 1,
                  animationDelay: `${(ci * 3 + pi) * 0.07}s`,
                  transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = `rotate(${rot * 0.3}deg) translateY(-14px) scale(1.04)`
                  el.style.zIndex = '10'
                  el.style.boxShadow = '0 24px 64px rgba(0,0,0,0.32)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = `rotate(${rot}deg) translateY(${offsetY}px)`
                  el.style.zIndex = String(pi === 1 ? 3 : pi === 0 ? 2 : 1)
                  el.style.boxShadow = ''
                }}
                onClick={() => onPhotoClick(photo)}
              >
                <div style={{
                  background: isDark ? '#111' : '#fff',
                  padding: '9px 9px 32px 9px',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.10)',
                }}>
                  <img
                    src={photo.display_url ?? ''} alt={photo.file_name ?? 'Guest photo'}
                    style={{ width: '100%', height: imgH, objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                  <p style={{
                    textAlign: 'center', marginTop: 8, fontSize: 10,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: isDark ? '#666' : '#aaa',
                    minHeight: 14,
                    fontStyle: 'italic',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {photo.uploader_name ?? ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Carousel (Focus) ─────────────────────────────────────────────────────────
// One photo at a time — nothing else looks like this.
// Nav arrows always visible on desktop. Swipeable. Progress bar.

function CarouselGallery({ photos, onPhotoClick }: { photos: GuestPhoto[]; onPhotoClick: (p: GuestPhoto) => void }) {
  const [index, setIndex] = useState(0)
  const total = photos.length
  const current = photos[index]
  const prev = () => setIndex(i => (i - 1 + total) % total)
  const next = () => setIndex(i => (i + 1) % total)

  // Touch swipe
  const touchStart = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd  = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart.current
    if (Math.abs(dx) > 50) dx > 0 ? prev() : next()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [total])

  const progress = ((index + 1) / total) * 100

  return (
    <div style={{ background: '#0c0c0c', userSelect: 'none' }}>
      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'rgba(255,255,255,0.55)', transition: 'width 0.35s ease' }} />
      </div>

      {/* Main photo */}
      <div className="relative overflow-hidden" style={{ height: 'clamp(300px, 56vh, 640px)' }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img
          key={current.id}
          src={current.display_url ?? ''}
          alt={current.file_name ?? 'Guest photo'}
          className="w-full h-full object-contain photo-enter cursor-zoom-in"
          style={{ background: '#111' }}
          onClick={() => onPhotoClick(current)}
          loading="lazy"
        />

        {/* Always-visible nav arrows */}
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            color: '#fff', transition: 'background 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.24)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
          onClick={prev}
          aria-label="Previous"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            color: '#fff', transition: 'background 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.24)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
          onClick={next}
          aria-label="Next"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Counter + uploader */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)', padding: '40px 20px 16px' }}>
          <div className="flex items-end justify-between">
            <span className="text-sm text-white/90 font-medium">{current.uploader_name ?? ''}</span>
            <span className="text-xs text-white/50 tabular-nums font-mono">{index + 1} / {total}</span>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 2, background: '#0a0a0a', scrollbarWidth: 'none', padding: '4px 4px' }}>
        {photos.map((photo, i) => (
          <button key={photo.id} onClick={() => setIndex(i)} style={{
            flexShrink: 0, width: 72, height: 52, padding: 0, border: 'none', cursor: 'pointer',
            overflow: 'hidden',
            outline: i === index ? '2px solid rgba(255,255,255,0.8)' : '2px solid transparent',
            outlineOffset: '-2px',
            opacity: i === index ? 1 : 0.38,
            transition: 'opacity 0.15s, outline-color 0.15s',
          }} aria-label={`Photo ${i + 1}`}>
            <img src={photo.display_url ?? ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function GalleryArea({
  photos, photosLoading, galleryLayout, frameStyle = 'none', primary, emptyColor, emptyBg,
  submitted, moderationEnabled,
}: GalleryAreaProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<GuestPhoto | null>(null)
  const handlePhotoClick = useCallback((photo: GuestPhoto) => setLightboxPhoto(photo), [])
  const handleClose = useCallback(() => setLightboxPhoto(null), [])

  const isEmpty = !photosLoading && photos.length === 0
  const pendingReview = isEmpty && !!submitted && (moderationEnabled !== false)

  function renderSkeleton() {
    if (galleryLayout === 'grid')       return <SkeletonMosaic />
    if (galleryLayout === 'film-strip') return <SkeletonFilmStrip />
    if (galleryLayout === 'rows')       return <SkeletonRows />
    if (galleryLayout === 'collage')    return <SkeletonCollage />
    if (galleryLayout === 'carousel')   return <SkeletonCarousel />
    if (galleryLayout === 'scattered')  return <SkeletonScattered />
    return <SkeletonMasonry />
  }

  function renderGallery() {
    if (galleryLayout === 'grid')       return <MosaicGrid       photos={photos} onPhotoClick={handlePhotoClick} />
    if (galleryLayout === 'film-strip') return <FilmStripGallery photos={photos} onPhotoClick={handlePhotoClick} />
    if (galleryLayout === 'scattered')  return <ScatteredGallery photos={photos} frameStyle={frameStyle} onPhotoClick={handlePhotoClick} />
    if (galleryLayout === 'rows')       return <RowsGallery      photos={photos} onPhotoClick={handlePhotoClick} />
    if (galleryLayout === 'collage')    return <CollageGallery   photos={photos} onPhotoClick={handlePhotoClick} />
    if (galleryLayout === 'carousel')   return <CarouselGallery  photos={photos} onPhotoClick={handlePhotoClick} />
    return <MasonryGallery photos={photos} onPhotoClick={handlePhotoClick} />
  }

  return (
    <>
      <style>{GALLERY_ANIMATIONS}</style>

      {/* key forces remount when layout changes — ensures clean state */}
      <div key={galleryLayout}>
        {photosLoading ? (
          renderSkeleton()
        ) : isEmpty ? (
          <EmptyState primary={primary} emptyColor={emptyColor} emptyBg={emptyBg} pendingReview={pendingReview} />
        ) : (
          renderGallery()
        )}
      </div>

      {lightboxPhoto && <Lightbox photo={lightboxPhoto} onClose={handleClose} />}
    </>
  )
}

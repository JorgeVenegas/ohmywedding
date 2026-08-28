"use client"

import { useMemo, useState } from "react"
import { X, Camera, Clock } from "lucide-react"
import { useTranslation } from "@/components/contexts/i18n-context"

interface GuestPhoto {
  id: string
  uploader_name: string | null
  display_url: string | null
  mime_type: string | null
  file_name: string | null
  created_at: string
  status: "pending" | "approved" | "rejected"
  metadata?: { taken_at?: string | null } | null
}

type SortMode = "taken" | "uploaded"

interface ContributionTimelineProps {
  photos: GuestPhoto[]
  isOpen: boolean
  onClose: () => void
  onPhotoClick: (photoId: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "rgba(66,12,20,0.12)",  text: "#420c14" },
  { bg: "rgba(180,83,9,0.12)",  text: "#92400e" },
  { bg: "rgba(120,53,15,0.12)", text: "#78350f" },
  { bg: "rgba(101,44,17,0.12)", text: "#7c2d12" },
  { bg: "rgba(133,77,14,0.12)", text: "#713f12" },
  { bg: "rgba(88,28,44,0.12)",  text: "#881337" },
]

function nameToColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length]
}

function useRelativeTime() {
  const { t } = useTranslation()
  return (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return t("activity.justNow")
    if (m < 60) return t("activity.minutesAgo", { count: m })
    const h = Math.floor(m / 60)
    if (h < 24) return t("activity.hoursAgo", { count: h })
    const d = Math.floor(h / 24)
    if (d === 1) return t("admin.settings.gallery.contributions.yesterday")
    if (d < 7)  return t("activity.daysAgo", { count: d })
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }
}

function exactTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function isVideo(photo: GuestPhoto) {
  return (
    photo.mime_type?.startsWith("video/") ||
    /\.(mp4|mov|webm|avi|mkv)$/i.test(photo.file_name ?? "")
  )
}

// ─── Contribution group ───────────────────────────────────────────────────────

interface ContributionGroup {
  name: string
  photos: GuestPhoto[]
  firstAt: string
  lastAt: string
}

function sortKey(photo: GuestPhoto, mode: SortMode): number {
  if (mode === "taken") {
    const taken = photo.metadata?.taken_at
    if (taken) return new Date(taken).getTime()
  }
  return new Date(photo.created_at).getTime()
}

function buildGroups(photos: GuestPhoto[], sort: SortMode): ContributionGroup[] {
  const map = new Map<string, GuestPhoto[]>()
  for (const p of photos) {
    const key = (p.uploader_name ?? "Anonymous").trim().toLowerCase()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  const groups: ContributionGroup[] = []
  for (const [, groupPhotos] of map) {
    const sorted = [...groupPhotos].sort((a, b) => sortKey(a, sort) - sortKey(b, sort))
    groups.push({
      name: sorted[0].uploader_name ?? "Anonymous",
      photos: sorted,
      firstAt: sorted[0].created_at,
      lastAt: sorted[sorted.length - 1].created_at,
    })
  }
  // Groups themselves ordered by their latest photo's sort key (newest first)
  return groups.sort((a, b) =>
    sortKey(b.photos[b.photos.length - 1], sort) - sortKey(a.photos[a.photos.length - 1], sort)
  )
}

const PAGE_SIZE = 10

// ─── PhotoGrid ────────────────────────────────────────────────────────────────

function PhotoGrid({ photos, onPhotoClick }: {
  photos: GuestPhoto[]
  onPhotoClick: (id: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const visible  = showAll ? photos : photos.slice(0, PAGE_SIZE)
  const hidden   = photos.length - PAGE_SIZE

  return (
    <div className="mt-2.5">
      <div className="flex flex-wrap gap-1">
        {visible.map(photo => (
          <button
            key={photo.id}
            type="button"
            onClick={() => onPhotoClick(photo.id)}
            title={exactTime(photo.created_at)}
            className="relative rounded-lg overflow-hidden group transition-transform duration-150 active:scale-95"
            style={{ width: 56, height: 56, background: "rgba(66,12,20,0.06)", flexShrink: 0 }}
          >
            {isVideo(photo) ? (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(66,12,20,0.06)" }}>
                <span className="text-[#420c14]/30 text-sm">▶</span>
              </div>
            ) : photo.display_url ? (
              <img
                src={photo.display_url}
                alt=""
                draggable={false}
                className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-150"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-3.5 h-3.5" style={{ color: "rgba(66,12,20,0.2)" }} />
              </div>
            )}
            <span
              className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  photo.status === "approved" ? "#22c55e" :
                  photo.status === "rejected" ? "#ef4444" : "#f59e0b",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
              }}
            />
          </button>
        ))}
      </div>

      {/* Show all / collapse toggle */}
      {hidden > 0 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 text-[12px] font-medium transition-colors"
          style={{ color: "rgba(66,12,20,0.45)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#420c14" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(66,12,20,0.45)" }}
        >
          +{hidden} more
        </button>
      )}
      {showAll && photos.length > PAGE_SIZE && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mt-2 text-[12px] font-medium transition-colors"
          style={{ color: "rgba(66,12,20,0.45)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#420c14" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(66,12,20,0.45)" }}
        >
          Show less
        </button>
      )}
    </div>
  )
}

// ─── ContributionEntry ────────────────────────────────────────────────────────

function ContributionEntry({ group, onPhotoClick, isLast }: {
  group: ContributionGroup
  onPhotoClick: (id: string) => void
  isLast: boolean
}) {
  const { t } = useTranslation()
  const relativeTime = useRelativeTime()
  const palette  = nameToColor(group.name)
  const initial  = group.name.charAt(0).toUpperCase()
  const videoCount = group.photos.filter(isVideo).length
  const photoCount = group.photos.length - videoCount

  const countLabel = (() => {
    const parts: string[] = []
    if (photoCount > 0) parts.push(`${photoCount} ${photoCount === 1 ? t("admin.settings.gallery.contributions.photo") : t("admin.settings.gallery.contributions.photos")}`)
    if (videoCount > 0) parts.push(`${videoCount} ${videoCount === 1 ? t("admin.settings.gallery.contributions.video") : t("admin.settings.gallery.contributions.videos")}`)
    return parts.join(" · ")
  })()

  return (
    <div className="relative flex gap-3 pb-6">
      {/* Timeline connector line */}
      {!isLast && (
        <div
          className="absolute left-[17px] top-[38px] bottom-0 w-px"
          style={{
            background: "repeating-linear-gradient(to bottom, rgba(66,12,20,0.12) 0px, rgba(66,12,20,0.12) 4px, transparent 4px, transparent 10px)",
          }}
        />
      )}

      {/* Avatar */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-semibold"
        style={{ background: palette.bg, color: palette.text, fontSize: 14 }}
      >
        {initial}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold truncate leading-tight" style={{ color: "#1c1917", fontSize: 14 }}>
            {group.name}
          </span>
          <span
            className="flex-shrink-0 text-[11px]"
            style={{ color: "rgba(66,12,20,0.38)" }}
            title={exactTime(group.lastAt)}
          >
            {relativeTime(group.lastAt)}
          </span>
        </div>

        <p className="text-[12px] mt-0.5" style={{ color: "rgba(66,12,20,0.5)" }}>
          {countLabel}
        </p>

        <PhotoGrid photos={group.photos} onPhotoClick={onPhotoClick} />
      </div>
    </div>
  )
}

// ─── ContributionTimeline ─────────────────────────────────────────────────────

export function ContributionTimeline({
  photos,
  isOpen,
  onClose,
  onPhotoClick,
}: ContributionTimelineProps) {
  const { t } = useTranslation()
  const groups = useMemo(() => buildGroups(photos, "taken"), [photos])

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className="md:hidden fixed inset-0 z-[59] transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.35)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[60] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          width: "min(360px, 100vw)",
          background: "#faf9f7",
          borderLeft: "1px solid rgba(66,12,20,0.08)",
          boxShadow: "-12px 0 48px rgba(0,0,0,0.09)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 py-4"
          style={{ borderBottom: "1px solid rgba(66,12,20,0.07)" }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold" style={{ color: "#420c14" }}>
                {t("admin.settings.gallery.contributions.title")}
              </h2>
              {groups.length > 0 && (
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(66,12,20,0.4)" }}>
                  {groups.length} {groups.length === 1
                    ? t("admin.settings.gallery.contributions.contributor")
                    : t("admin.settings.gallery.contributions.contributors")
                  } · {photos.length} {photos.length === 1
                    ? t("admin.settings.gallery.contributions.item")
                    : t("admin.settings.gallery.contributions.items")
                  }
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ color: "rgba(66,12,20,0.45)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(66,12,20,0.06)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pt-5">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(66,12,20,0.05)" }}
              >
                <Clock className="w-5 h-5" style={{ color: "rgba(66,12,20,0.2)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "rgba(66,12,20,0.45)" }}>
                {t("admin.settings.gallery.contributions.noContributions")}
              </p>
              <p className="text-[12px] mt-1.5 max-w-[200px] leading-relaxed" style={{ color: "rgba(66,12,20,0.3)" }}>
                {t("admin.settings.gallery.contributions.noContributionsHint")}
              </p>
            </div>
          ) : (
            <div>
              {groups.map((group, i) => (
                <ContributionEntry
                  key={group.name + group.firstAt}
                  group={group}
                  onPhotoClick={onPhotoClick}
                  isLast={i === groups.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

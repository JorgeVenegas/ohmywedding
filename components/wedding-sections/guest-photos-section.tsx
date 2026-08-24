"use client"

import { useState, useEffect, useRef } from "react"
import type { ThemeConfig } from "@/lib/wedding-config"
import { Loader2, Lock } from "lucide-react"
import { useEditingModeSafe } from "@/components/contexts/editing-mode-context"
import { useI18n } from "@/components/contexts/i18n-context"
import {
  MinimalVariant,
  HeroVariant,
  PolaroidVariant,
  HaciendaVariant,
  OldMoneyVariant,
} from "./guest-photos-variants"
import type {
  GuestPhotosVariant,
  GalleryLayout,
  BackgroundColorChoice,
  GuestPhotoMetadata,
  UploadItem,
  BaseVariantProps,
} from "./guest-photos-variants"
import { MAX_CONTRIBUTION_BYTES } from "./guest-photos-variants/types"

export type { GuestPhotosVariant, GalleryLayout, BackgroundColorChoice }

export interface GuestPhotosSectionProps {
  weddingNameId: string
  theme?: Partial<ThemeConfig>
  title?: string
  subtitle?: string
  uploaderPlaceholder?: string
  variant?: GuestPhotosVariant
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
  galleryLayout?: GalleryLayout
  initialUploadsEnabled?: boolean
  initialModerationEnabled?: boolean
}

interface UploadResult {
  url: string
  name: string | null
  uid: string
}

export function GuestPhotosSection({
  weddingNameId,
  theme,
  title,
  subtitle,
  uploaderPlaceholder,
  variant = 'minimal',
  useColorBackground,
  backgroundColorChoice,
  galleryLayout = 'masonry',
  initialUploadsEnabled,
  initialModerationEnabled,
}: GuestPhotosSectionProps) {
  const primary = theme?.colors?.primary || "#d4a574"
  const editingMode = useEditingModeSafe()
  const canEditDesign = editingMode?.canEditDesign ?? false
  const { t } = useI18n()

  const resolvedTitle = title || t('guestPhotos.title')
  const resolvedSubtitle = subtitle || t('guestPhotos.description')
  const resolvedUploaderPlaceholder = uploaderPlaceholder || t('guestPhotos.nameLabel')

  const hasInitial = initialUploadsEnabled !== undefined
  const [uploadsEnabled, setUploadsEnabled] = useState<boolean | null>(hasInitial ? initialUploadsEnabled! : null)
  const [moderationEnabled, setModerationEnabled] = useState(hasInitial ? (initialModerationEnabled ?? true) : true)
  const [submitted, setSubmitted] = useState(false)
  const [submittedUploads, setSubmittedUploads] = useState<UploadItem[]>([])
  const [settingsLoading, setSettingsLoading] = useState(!hasInitial)
  const [uploaderName, setUploaderName] = useState("")
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)


  useEffect(() => {
    if (hasInitial) return
    fetch(`/api/weddings/settings/public?weddingNameId=${encodeURIComponent(weddingNameId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setUploadsEnabled(!!data?.settings?.gallery_allow_guest_uploads)
        setModerationEnabled(data?.settings?.gallery_moderation_enabled !== false)
      })
      .catch(() => setUploadsEnabled(false))
      .finally(() => setSettingsLoading(false))
  }, [weddingNameId])

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith("image/"))
    const currentBytes = uploads.reduce((sum, u) => sum + u.file.size, 0)
    const remaining = MAX_CONTRIBUTION_BYTES - currentBytes

    const accepted: File[] = []
    let cumulative = 0
    let rejected = 0

    for (const file of imageFiles) {
      if (cumulative + file.size <= remaining) {
        accepted.push(file)
        cumulative += file.size
      } else {
        rejected++
      }
    }

    if (rejected > 0) {
      setUploadError(t('guestPhotos.uploadLimitReached'))
    } else {
      setUploadError(undefined)
    }

    if (accepted.length === 0) return

    const items: UploadItem[] = accepted.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      progress: "idle",
    }))
    setUploads(prev => [...prev, ...items])
  }

  const removeUpload = (id: string) => {
    setUploads(prev => {
      const item = prev.find(u => u.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter(u => u.id !== id)
    })
  }

  const extractMetadata = async (file: File): Promise<GuestPhotoMetadata> => {
    const meta: GuestPhotoMetadata = {}
    try {
      const exifr = (await import("exifr")).default
      const exif = await exifr.parse(file, {
        pick: ["DateTimeOriginal", "GPSLatitude", "GPSLongitude", "Make", "Model",
               "ExifImageWidth", "ExifImageHeight", "PixelXDimension", "PixelYDimension"],
        reviveValues: true,
      })
      if (!exif) return meta

      if (exif.DateTimeOriginal instanceof Date) {
        meta.taken_at = exif.DateTimeOriginal.toISOString()
      }

      const lat = exif.GPSLatitude
      const lon = exif.GPSLongitude
      if (typeof lat === "number" && typeof lon === "number") {
        meta.location = { lat, lon }
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
            { headers: { "Accept-Language": "en", "User-Agent": "OhMyWedding/1.0" } }
          )
          if (geoRes.ok) {
            const geo = await geoRes.json()
            const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county
            if (city) meta.location.city = city
          }
        } catch { /* geocoding is best-effort */ }
      }

      if (exif.Make || exif.Model) {
        meta.camera = { make: exif.Make ?? null, model: exif.Model ?? null }
      }

      const w = exif.ExifImageWidth || exif.PixelXDimension
      const h = exif.ExifImageHeight || exif.PixelYDimension
      if (w || h) meta.dimensions = { width: w ?? null, height: h ?? null }
    } catch { /* EXIF extraction is best-effort */ }
    return meta
  }

  // Uses XHR so we can track real upload progress
  const uploadFile = async (item: UploadItem): Promise<UploadResult | null> => {
    setUploads(prev => prev.map(u => u.id === item.id ? { ...u, progress: "uploading", uploadProgress: 0 } : u))
    let photoId: string | undefined
    let createdS3Key: string | undefined
    try {
      const metadata = await extractMetadata(item.file)
      const res = await fetch("/api/guest-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingNameId,
          contentType: item.file.type,
          fileSize: item.file.size,
          fileName: item.file.name,
          uploaderName: uploaderName.trim() || undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        }),
      })
      const data = await res.json()
      const { presignedUrl, key, error } = data
      photoId = data.photoId
      createdS3Key = key
      if (error || !presignedUrl) throw new Error(error || "Failed to get upload URL")

      // XHR PUT with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            setUploads(prev => prev.map(u => u.id === item.id ? { ...u, uploadProgress: e.loaded / e.total } : u))
          }
        }
        xhr.onload = () => xhr.status < 400 ? resolve() : reject(new Error(`S3 upload failed (HTTP ${xhr.status})`))
        xhr.onerror = () => reject(new Error("Network error — photo was not uploaded"))
        xhr.open("PUT", presignedUrl)
        xhr.setRequestHeader("Content-Type", item.file.type)
        xhr.send(item.file)
      })

      // File is confirmed in S3 — trigger preview generation
      if (photoId && key && item.file.type.startsWith("image/")) {
        void fetch("/api/guest-photos/trigger-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId, s3Key: key }),
        })
      }

      setUploads(prev => prev.map(u => u.id === item.id ? { ...u, progress: "done", uploadProgress: 1 } : u))
      return { url: key, name: uploaderName.trim() || null, uid: `opt-${item.id}` }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed. Please try again."
      setUploads(prev => prev.map(u => u.id === item.id ? { ...u, progress: "error", error: message } : u))
      // Delete the orphaned DB record — file never reached S3
      if (photoId && createdS3Key) {
        void fetch("/api/guest-photos/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId, s3Key: createdS3Key }),
        }).catch(() => {})
      }
      return null
    }
  }

  const runUpload = async (itemsToUpload: UploadItem[]) => {
    const toUpload = itemsToUpload.filter(u => u.progress === "idle")
    if (toUpload.length === 0) return
    const results = await Promise.all(toUpload.map(uploadFile))
    const succeeded = results.filter(Boolean) as UploadResult[]
    if (succeeded.length === toUpload.length) {
      // All items in this batch succeeded — check if anything is still error overall
      setUploads(prev => {
        const anyError = prev.some(u => u.progress === 'error')
        if (!anyError) {
          setSubmittedUploads(prev.filter(u => u.progress === 'done'))
          setSubmitted(true)
          return []
        }
        return prev
      })
    }
  }

  const submitAll = () => runUpload(uploads)

  const retryFailed = async () => {
    const reset = uploads.map(u =>
      u.progress === 'error' ? { ...u, progress: 'idle' as const, error: undefined, uploadProgress: 0 } : u
    )
    setUploads(reset)
    await runUpload(reset)
  }

  const variantProps: BaseVariantProps = {
    theme,
    primary,
    title: resolvedTitle,
    subtitle: resolvedSubtitle,
    uploaderPlaceholder: resolvedUploaderPlaceholder,
    galleryLayout,
    useColorBackground,
    backgroundColorChoice,
    uploads,
    uploaderName,
    isDragging,
    uploadsEnabled: !!uploadsEnabled,
    submitted,
    submittedUploads,
    moderationEnabled,
    fileInputRef,
    onUploaderNameChange: setUploaderName,
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) },
    onDragLeave: () => setIsDragging(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)) },
    onDropZoneClick: () => fileInputRef.current?.click(),
    onFileChange: (files: FileList | null) => { if (files) addFiles(Array.from(files)) },
    onRemoveUpload: removeUpload,
    onSubmitAll: submitAll,
    onRetryFailed: retryFailed,
    uploadError,
  }

  if (settingsLoading) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primary }} />
      </section>
    )
  }

  if (!uploadsEnabled && !canEditDesign) {
    return (
      <section className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${primary}20` }}>
          <Lock className="w-7 h-7" style={{ color: primary }} />
        </div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: primary }}>{t('guestPhotos.notAvailable')}</h2>
        <p className="text-sm max-w-sm" style={{ color: `${primary}80` }}>{t('guestPhotos.notAvailableDesc')}</p>
      </section>
    )
  }

  const editBanner = canEditDesign && !uploadsEnabled ? (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
      <p className="text-sm text-amber-700 font-medium">Uploads disabled for guests. Enable in Wedding Settings → Gallery.</p>
    </div>
  ) : null

  switch (variant) {
    case 'hero':      return <>{editBanner}<HeroVariant     {...variantProps} /></>
    case 'polaroid':  return <>{editBanner}<PolaroidVariant {...variantProps} /></>
    case 'hacienda':  return <>{editBanner}<HaciendaVariant {...variantProps} /></>
    case 'old-money': return <>{editBanner}<OldMoneyVariant {...variantProps} /></>
    default:          return <>{editBanner}<MinimalVariant  {...variantProps} /></>
  }
}

import type { ThemeConfig } from "@/lib/wedding-config"

export type GuestPhotosVariant = 'minimal' | 'hero' | 'polaroid' | 'hacienda' | 'old-money'
export type GalleryLayout = 'masonry' | 'grid' | 'film-strip' | 'scattered' | 'rows' | 'collage' | 'carousel'
export type BackgroundColorChoice =
  | 'none' | 'primary' | 'secondary' | 'accent'
  | 'primary-light' | 'secondary-light' | 'accent-light'
  | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

export interface GuestPhotoMetadata {
  taken_at?: string | null
  location?: { lat: number; lon: number; city?: string | null } | null
  camera?: { make?: string | null; model?: string | null } | null
  dimensions?: { width?: number | null; height?: number | null } | null
}

export interface GuestPhoto {
  id: string
  display_url: string | null
  uploader_name: string | null
  status: "pending" | "approved" | "rejected"
  file_name: string | null
  metadata?: GuestPhotoMetadata | null
}

export interface UploadItem {
  id: string
  file: File
  preview: string
  progress: "idle" | "uploading" | "done" | "error"
  uploadProgress?: number // 0–1, tracked via XHR
  error?: string
}

export interface BaseVariantProps {
  theme?: Partial<ThemeConfig>
  primary: string
  title: string
  subtitle: string
  uploaderPlaceholder: string
  galleryLayout: GalleryLayout
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
  // Data
  uploads: UploadItem[]
  uploaderName: string
  isDragging: boolean
  uploadsEnabled: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  submitted?: boolean
  submittedUploads?: UploadItem[]
  moderationEnabled?: boolean
  uploadError?: string
  // Handlers
  onUploaderNameChange: (v: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onDropZoneClick: () => void
  onFileChange: (files: FileList | null) => void
  onRemoveUpload: (id: string) => void
  onSubmitAll: () => void
  onRetryFailed?: () => void
}

// Centralised contrast helper — three states:
//   no bg  → use primary for title, standard grays
//   dark bg (needsLightText) → cream/white text everywhere
//   light colored bg (bgColor set but lum > 0.4) → deep warm ink, NOT primary
//   (same-hue text on same-hue bg fails WCAG AA regardless of shade)
export const MAX_CONTRIBUTION_BYTES = 1_073_741_824 // 1 GB per contribution

export interface ContrastSet {
  bgColor: string | null
  needsLightText: boolean
  titleColor: string
  subColor: string
  textColor: string
  mutedColor: string
  iconBg: string
  iconColor: string
  zoneBg: string
  zoneBorder: string
  inputBg: string
  inputBorder: string
  buttonBg: string
  buttonText: string
}

export function getContrastSet(
  theme: Partial<ThemeConfig> | undefined,
  useColorBackground: boolean | undefined,
  backgroundColorChoice: BackgroundColorChoice | undefined,
  primary: string
): ContrastSet {
  const { bgColor, needsLightText } = resolveBackground(theme, useColorBackground, backgroundColorChoice)

  if (!bgColor) {
    return {
      bgColor: null, needsLightText: false,
      titleColor: primary,
      subColor: 'rgba(66,12,20,0.45)',
      textColor: '#374151',
      mutedColor: '#9ca3af',
      iconBg: `${primary}14`,
      iconColor: primary,
      zoneBg: '#fafaf9',
      zoneBorder: 'rgba(0,0,0,0.1)',
      inputBg: '#fff',
      inputBorder: 'rgba(0,0,0,0.1)',
      buttonBg: primary,
      buttonText: '#fff',
    }
  }

  if (needsLightText) {
    // Dark saturated background
    return {
      bgColor, needsLightText: true,
      titleColor: '#f5f2eb',
      subColor: 'rgba(245,242,235,0.65)',
      textColor: '#f5f2eb',
      mutedColor: 'rgba(245,242,235,0.55)',
      iconBg: 'rgba(255,255,255,0.18)',
      iconColor: '#f5f2eb',
      zoneBg: 'rgba(255,255,255,0.1)',
      zoneBorder: 'rgba(255,255,255,0.25)',
      inputBg: 'rgba(255,255,255,0.12)',
      inputBorder: 'rgba(255,255,255,0.25)',
      buttonBg: '#f5f2eb',
      buttonText: bgColor,
    }
  }

  // Light / mid-tint colored background — use deep warm ink, never primary
  // (primary-on-primary-tint fails contrast regardless of lightness difference)
  return {
    bgColor, needsLightText: false,
    titleColor: '#1e140e',
    subColor: 'rgba(30,20,14,0.55)',
    textColor: '#1e140e',
    mutedColor: 'rgba(30,20,14,0.45)',
    iconBg: 'rgba(255,255,255,0.55)',
    iconColor: '#1e140e',
    zoneBg: 'rgba(255,255,255,0.38)',
    zoneBorder: 'rgba(30,20,14,0.14)',
    inputBg: 'rgba(255,255,255,0.48)',
    inputBorder: 'rgba(30,20,14,0.14)',
    buttonBg: '#1e140e',
    buttonText: '#f5f2eb',
  }
}

export function getLightTint(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgb(${Math.round(r + (255 - r) * amount)}, ${Math.round(g + (255 - g) * amount)}, ${Math.round(b + (255 - b) * amount)})`
}

export function getLuminance(hex: string): number {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function resolveBackground(
  theme: Partial<ThemeConfig> | undefined,
  useColorBackground: boolean | undefined,
  backgroundColorChoice: BackgroundColorChoice | undefined
): { bgColor: string | null; needsLightText: boolean } {
  const primary = theme?.colors?.primary || '#d4a574'
  const secondary = theme?.colors?.secondary || '#9ba082'
  const accent = theme?.colors?.accent || '#e6b5a3'

  if (!useColorBackground || !backgroundColorChoice || backgroundColorChoice === 'none') {
    return { bgColor: null, needsLightText: false }
  }

  let bgColor = primary
  switch (backgroundColorChoice) {
    case 'primary': bgColor = primary; break
    case 'secondary': bgColor = secondary; break
    case 'accent': bgColor = accent; break
    case 'primary-light': bgColor = getLightTint(primary, 0.5); break
    case 'secondary-light': bgColor = getLightTint(secondary, 0.5); break
    case 'accent-light': bgColor = getLightTint(accent, 0.5); break
    case 'primary-lighter': bgColor = getLightTint(primary, 0.88); break
    case 'secondary-lighter': bgColor = getLightTint(secondary, 0.88); break
    case 'accent-lighter': bgColor = getLightTint(accent, 0.88); break
  }

  const lum = bgColor.startsWith('rgb')
    ? (() => {
        const m = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)/)
        if (!m) return 1
        return 0.2126 * parseInt(m[1]) / 255 + 0.7152 * parseInt(m[2]) / 255 + 0.0722 * parseInt(m[3]) / 255
      })()
    : getLuminance(bgColor)

  return { bgColor, needsLightText: lum < 0.4 }
}

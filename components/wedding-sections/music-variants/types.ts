import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'
export type SectionHeight = 'compact' | 'normal' | 'tall' | 'full'
export type PlayerStyle = 'card' | 'strip'

export interface BaseMusicProps {
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
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
  playerStyle?: PlayerStyle
  sectionHeight?: SectionHeight
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
  // Playback state injected by MusicSection
  isPlaying: boolean
  currentTime: number
  duration: number
  onPlayPause: () => void
  onSeek: (ratio: number) => void
}

// Height → padding map shared by all variants
export const HEIGHT_PADDING: Record<SectionHeight, string> = {
  compact: 'clamp(1.25rem, 3vw, 1.75rem)',
  normal:  'clamp(4rem, 8vw, 6rem)',
  tall:    'clamp(6rem, 12vw, 9rem)',
  full:    'clamp(8rem, 16vw, 12rem)',
}

// Minimal colour-scheme helper (same pattern as other section variant files)
function getLightTint(hex: string, t: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return `rgb(${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)})`
}

function getLuminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  const toL = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  return 0.2126 * toL((n >> 16) & 255) + 0.7152 * toL((n >> 8) & 255) + 0.0722 * toL(n & 255)
}

export function getColorScheme(
  theme: Partial<ThemeConfig> | undefined,
  backgroundColorChoice: BackgroundColorChoice | undefined,
) {
  const primary   = theme?.colors?.primary    || '#d4a574'
  const secondary = theme?.colors?.secondary  || '#9ba082'
  const accent    = theme?.colors?.accent     || '#e6b5a3'
  const foreground = theme?.colors?.foreground || '#1f2937'
  const muted     = theme?.colors?.muted      || '#6b7280'
  const background = theme?.colors?.background || '#ffffff'

  const isColored = !!backgroundColorChoice && backgroundColorChoice !== 'none'

  let bgColor = background
  if (isColored) {
    switch (backgroundColorChoice) {
      case 'primary':         bgColor = primary; break
      case 'primary-light':   bgColor = getLightTint(primary, 0.5); break
      case 'primary-lighter': bgColor = getLightTint(primary, 0.88); break
      case 'secondary':       bgColor = secondary; break
      case 'secondary-light': bgColor = getLightTint(secondary, 0.5); break
      case 'secondary-lighter': bgColor = getLightTint(secondary, 0.88); break
      case 'accent':          bgColor = accent; break
      case 'accent-light':    bgColor = getLightTint(accent, 0.5); break
      case 'accent-lighter':  bgColor = getLightTint(accent, 0.88); break
    }
  }

  const lum = bgColor.startsWith('rgb')
    ? (() => {
        const m = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)/)
        if (!m) return 0.9
        const toL = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
        return 0.2126 * toL(+m[1]) + 0.7152 * toL(+m[2]) + 0.0722 * toL(+m[3])
      })()
    : getLuminance(bgColor)

  const isLight = lum > 0.5

  return {
    bgColor,
    ink:    isColored ? (isLight ? foreground : '#ffffff')              : foreground,
    muted:  isColored ? (isLight ? muted      : 'rgba(255,255,255,0.65)') : muted,
    hairline: isColored ? (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)') : '#f0ede9',
    primary,
    accent,
    isColored,
    isLight,
  }
}

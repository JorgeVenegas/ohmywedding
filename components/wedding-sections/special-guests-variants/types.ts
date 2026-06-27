import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

export interface GuestPerson {
  id: string
  name: string
  role?: string
}

export interface PartyGroup {
  id: string
  title: string
  people: GuestPerson[]
  show: boolean
}

export interface BaseSpecialGuestsProps {
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  // Header
  sectionTitle?: string
  sectionSubtitle?: string
  showTitle?: boolean
  showSubtitle?: boolean
  // Intro
  introText?: string
  showIntroText?: boolean
  // Parents
  showParents?: boolean
  brideParentsTitle?: string
  brideParents?: GuestPerson[]
  showBrideParents?: boolean
  groomParentsTitle?: string
  groomParents?: GuestPerson[]
  showGroomParents?: boolean
  // Party groups (bridesmaids, groomsmen, etc.)
  partyGroups?: PartyGroup[]
  // Background
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
}

function getLightTint(hex: string, tintAmount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgb(${Math.round(r + (255 - r) * tintAmount)}, ${Math.round(g + (255 - g) * tintAmount)}, ${Math.round(b + (255 - b) * tintAmount)})`
}

function getLuminance(hex: string): number {
  const num = parseInt(hex.replace('#', ''), 16)
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * toLinear(((num >> 16) & 255) / 255) + 0.7152 * toLinear(((num >> 8) & 255) / 255) + 0.0722 * toLinear((num & 255) / 255)
}

function contrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2)
  const darker  = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function getColorScheme(
  theme: Partial<ThemeConfig> | undefined,
  backgroundColorChoice: BackgroundColorChoice | undefined,
  useColorBackground: boolean | undefined
) {
  const primary = theme?.colors?.primary || '#d4a574'
  const secondary = theme?.colors?.secondary || '#9ba082'
  const accent = theme?.colors?.accent || '#e6b5a3'
  const foreground = theme?.colors?.foreground || '#1f2937'
  const muted = theme?.colors?.muted || '#6b7280'

  const isColored = !!(backgroundColorChoice && backgroundColorChoice !== 'none' && useColorBackground)

  let bgColor = theme?.colors?.background || '#ffffff'
  if (isColored) {
    switch (backgroundColorChoice) {
      case 'primary':         bgColor = primary; break
      case 'primary-light':   bgColor = getLightTint(primary, 0.5); break
      case 'primary-lighter': bgColor = getLightTint(primary, 0.88); break
      case 'secondary':         bgColor = secondary; break
      case 'secondary-light':   bgColor = getLightTint(secondary, 0.5); break
      case 'secondary-lighter': bgColor = getLightTint(secondary, 0.88); break
      case 'accent':         bgColor = accent; break
      case 'accent-light':   bgColor = getLightTint(accent, 0.5); break
      case 'accent-lighter': bgColor = getLightTint(accent, 0.88); break
    }
  }

  let bgLuminance = 0.9
  if (isColored) {
    if (bgColor.startsWith('rgb')) {
      const m = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)/)
      if (m) {
        const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        bgLuminance = 0.2126 * toLinear(parseInt(m[1]) / 255) + 0.7152 * toLinear(parseInt(m[2]) / 255) + 0.0722 * toLinear(parseInt(m[3]) / 255)
      }
    } else if (bgColor.startsWith('#')) {
      bgLuminance = getLuminance(bgColor)
    }
  }
  const isLightBg = bgLuminance > 0.5

  // On a light colored bg, prefer the theme primary if it has enough contrast (≥ 3.5:1).
  // Fall back to foreground (dark) when contrast is insufficient.
  const primaryLum = getLuminance(primary.startsWith('#') ? primary : '#d4a574')
  const primaryOnBgContrast = isColored && isLightBg ? contrastRatio(bgLuminance, primaryLum) : 0
  const primaryOnLight = primaryOnBgContrast >= 3.5 ? primary : foreground

  return {
    bgColor,
    isColored,
    isLightBg,
    ink: isColored ? (isLightBg ? foreground : '#ffffff') : foreground,
    muted: isColored ? (isLightBg ? muted : 'rgba(255,255,255,0.7)') : muted,
    hairline: isColored ? (isLightBg ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)') : 'rgba(33,29,26,0.12)',
    primary: isColored ? (isLightBg ? primaryOnLight : '#ffffff') : (theme?.colors?.primary || foreground),
  }
}

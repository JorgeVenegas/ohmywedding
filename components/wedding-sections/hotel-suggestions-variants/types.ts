import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

export interface HotelItem {
  name: string
  description?: string
  imageUrl?: string
  websiteUrl?: string
  phone?: string
  address?: string
  priceRange?: string
  distanceToVenue?: string
  bookingCode?: string
}

export interface BaseHotelSuggestionsProps {
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  sectionTitle?: string
  sectionSubtitle?: string
  hotels?: HotelItem[]
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
}

// Helper to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent / 100)))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(255 * percent / 100)))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(255 * percent / 100)))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

function getLightTint(hex: string, tintAmount: number = 0.95): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const newR = Math.round(r + (255 - r) * tintAmount)
  const newG = Math.round(g + (255 - g) * tintAmount)
  const newB = Math.round(b + (255 - b) * tintAmount)
  return `rgb(${newR}, ${newG}, ${newB})`
}

function getLuminance(hex: string): number {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

export function getColorScheme(theme: Partial<ThemeConfig> | undefined, backgroundColorChoice?: BackgroundColorChoice, useColorBackground?: boolean) {
  const primary = theme?.colors?.primary || '#2D4A32'
  const secondary = theme?.colors?.secondary || '#FAF6EF'
  const accent = theme?.colors?.accent || '#C0A882'
  const isColored = useColorBackground && backgroundColorChoice && backgroundColorChoice !== 'none'

  let bgColor = secondary
  if (isColored) {
    switch (backgroundColorChoice) {
      case 'primary': bgColor = primary; break
      case 'secondary': bgColor = secondary; break
      case 'accent': bgColor = accent; break
      case 'primary-light': bgColor = adjustColorBrightness(primary, 20); break
      case 'secondary-light': bgColor = adjustColorBrightness(secondary, -5); break
      case 'accent-light': bgColor = adjustColorBrightness(accent, 20); break
      case 'primary-lighter': bgColor = getLightTint(primary, 0.92); break
      case 'secondary-lighter': bgColor = getLightTint(secondary, 0.95); break
      case 'accent-lighter': bgColor = getLightTint(accent, 0.92); break
    }
  }

  const bgLuminance = isColored ? getLuminance(bgColor.startsWith('rgb') ? '#FFFFFF' : bgColor) : getLuminance(secondary)
  const needsLightText = bgLuminance < 0.4

  return {
    bgColor,
    primary,
    secondary,
    accent,
    isColored: !!isColored,
    titleColor: needsLightText ? secondary : primary,
    subtitleColor: needsLightText ? `${secondary}99` : `${primary}80`,
    bodyTextColor: needsLightText ? `${secondary}DD` : primary,
    mutedTextColor: needsLightText ? `${secondary}80` : `${primary}60`,
  }
}

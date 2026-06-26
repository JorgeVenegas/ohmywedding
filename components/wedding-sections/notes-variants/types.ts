import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

export type SectionHeight = 'compact' | 'normal' | 'large' | 'full'

export interface BaseNotesProps {
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  sectionTitle?: string
  sectionSubtitle?: string
  bodyText?: string
  showTitle?: boolean
  showSubtitle?: boolean
  showBodyText?: boolean
  sectionHeight?: SectionHeight
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
      case 'primary': bgColor = primary; break
      case 'primary-light': bgColor = getLightTint(primary, 0.5); break
      case 'primary-lighter': bgColor = getLightTint(primary, 0.88); break
      case 'secondary': bgColor = secondary; break
      case 'secondary-light': bgColor = getLightTint(secondary, 0.5); break
      case 'secondary-lighter': bgColor = getLightTint(secondary, 0.88); break
      case 'accent': bgColor = accent; break
      case 'accent-light': bgColor = getLightTint(accent, 0.5); break
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

  const titleColor = isColored ? (isLightBg ? foreground : '#ffffff') : foreground
  const mutedTextColor = isColored ? (isLightBg ? muted : 'rgba(255,255,255,0.7)') : muted

  return { bgColor, titleColor, mutedTextColor, isColored, isLightBg, primary }
}

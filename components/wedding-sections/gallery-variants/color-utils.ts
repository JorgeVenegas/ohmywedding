import { ThemeConfig } from '@/lib/wedding-config'

type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

function isLightColor(color: string): boolean {
  if (color.startsWith('rgb')) {
    const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      const r = parseInt(match[1])
      const g = parseInt(match[2])
      const b = parseInt(match[3])
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance > 0.5
    }
  }
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

function getLightTint(hex: string, tintAmount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const newR = Math.round(r + (255 - r) * tintAmount)
  const newG = Math.round(g + (255 - g) * tintAmount)
  const newB = Math.round(b + (255 - b) * tintAmount)
  return `rgb(${newR}, ${newG}, ${newB})`
}

export function getGalleryColorScheme(
  theme: Partial<ThemeConfig> | undefined,
  backgroundColorChoice: BackgroundColorChoice
) {
  const primaryColor = theme?.colors?.primary || '#d4a574'
  const secondaryColor = theme?.colors?.secondary || '#9ba082'
  const accentColor = theme?.colors?.accent || '#e6b5a3'
  
  let bgColor = '#f9fafb' // default muted background
  
  if (backgroundColorChoice !== 'none') {
    switch (backgroundColorChoice) {
      case 'primary':
        bgColor = primaryColor
        break
      case 'secondary':
        bgColor = secondaryColor
        break
      case 'accent':
        bgColor = accentColor
        break
      case 'primary-light':
        bgColor = getLightTint(primaryColor, 0.5)
        break
      case 'secondary-light':
        bgColor = getLightTint(secondaryColor, 0.5)
        break
      case 'accent-light':
        bgColor = getLightTint(accentColor, 0.5)
        break
      case 'primary-lighter':
        bgColor = getLightTint(primaryColor, 0.88)
        break
      case 'secondary-lighter':
        bgColor = getLightTint(secondaryColor, 0.88)
        break
      case 'accent-lighter':
        bgColor = getLightTint(accentColor, 0.88)
        break
    }
  }
  
  const isColored = backgroundColorChoice !== 'none'
  const isLightBg = isLightColor(bgColor)
  const textColor = isLightBg ? '#1f2937' : '#ffffff'
  const mutedTextColor = isLightBg ? '#6b7280' : 'rgba(255, 255, 255, 0.8)'
  
  // Divider color: use a contrasting palette color
  // Pick a different color from the palette that contrasts with the background
  let dividerColor = accentColor // default
  if (backgroundColorChoice.startsWith('primary')) {
    // Background is primary-based, use secondary or accent
    dividerColor = secondaryColor
  } else if (backgroundColorChoice.startsWith('secondary')) {
    // Background is secondary-based, use primary or accent
    dividerColor = primaryColor
  } else if (backgroundColorChoice.startsWith('accent')) {
    // Background is accent-based, use primary or secondary
    dividerColor = primaryColor
  }
  
  return {
    bgColor,
    textColor,
    mutedTextColor,
    dividerColor,
    isColored,
    isLightBg
  }
}

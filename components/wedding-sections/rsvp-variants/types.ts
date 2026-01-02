import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

export interface CustomQuestion {
  id: string
  question: string
  type: 'text' | 'textarea' | 'select' | 'number'
  options?: string[]
  required?: boolean
}

export interface BaseRSVPProps {
  dateId: string
  weddingNameId: string
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  sectionTitle?: string
  sectionSubtitle?: string
  showMealPreferences?: boolean
  showCustomQuestions?: boolean
  customQuestions?: CustomQuestion[]
  embedForm?: boolean
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
  groupId?: string | null
}

// Helper to add opacity to hex color
function withOpacity(hex: string, opacity: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Helper to create a light tint by mixing with white
function getLightTint(hex: string, tintAmount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const newR = Math.round(r + (255 - r) * tintAmount)
  const newG = Math.round(g + (255 - g) * tintAmount)
  const newB = Math.round(b + (255 - b) * tintAmount)
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`
}

// Helper to get color scheme based on background choice
export function getColorScheme(
  theme: Partial<ThemeConfig> | undefined,
  backgroundColorChoice: BackgroundColorChoice = 'none',
  useColorBackground: boolean = false
) {
  const primaryColor = theme?.colors?.primary || '#000000'
  const secondaryColor = theme?.colors?.secondary || '#666666'
  const accentColor = theme?.colors?.accent || '#999999'

  const isColored = useColorBackground && backgroundColorChoice !== 'none'
  
  let bgColor = 'transparent'
  let titleColor = primaryColor
  let subtitleColor = secondaryColor
  let textColor = theme?.colors?.foreground || '#000000'
  let cardBg = '#ffffff'
  let isLightBg = false

  if (isColored) {
    const colorMap: Record<string, string> = {
      'primary': primaryColor,
      'secondary': secondaryColor,
      'accent': accentColor,
      'primary-light': getLightTint(primaryColor, 0.5),
      'secondary-light': getLightTint(secondaryColor, 0.5),
      'accent-light': getLightTint(accentColor, 0.5),
      'primary-lighter': getLightTint(primaryColor, 0.88),
      'secondary-lighter': getLightTint(secondaryColor, 0.88),
      'accent-lighter': getLightTint(accentColor, 0.88),
    }
    
    bgColor = colorMap[backgroundColorChoice] || 'transparent'
    
    // For lighter backgrounds, use dark text
    if (backgroundColorChoice.includes('light')) {
      isLightBg = true
      titleColor = primaryColor
      subtitleColor = secondaryColor
      textColor = theme?.colors?.foreground || '#000000'
      cardBg = '#ffffff'
    } else {
      // For solid color backgrounds, use light text
      titleColor = '#ffffff'
      subtitleColor = withOpacity('#ffffff', 0.9)
      textColor = '#ffffff'
      cardBg = withOpacity('#ffffff', 0.1)
    }
  }

  return {
    bgColor,
    titleColor,
    subtitleColor,
    textColor,
    cardBg,
    isColored,
    isLightBg,
    accentColor: primaryColor
  }
}
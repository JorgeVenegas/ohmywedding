import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

export interface FAQItem {
  id?: string
  question: string
  answer: string
  images?: string[]
}

export interface BaseFAQProps {
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  questions?: FAQItem[]
  allowMultipleOpen?: boolean
  sectionTitle?: string
  sectionSubtitle?: string
  showContactNote?: boolean
  contactNoteText?: string
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
}

// Default FAQ questions
export const defaultQuestions: FAQItem[] = [
  {
    question: "What is the dress code?",
    answer: "Black tie optional. We want you to feel comfortable and look your best! Ladies can wear cocktail dresses or formal gowns, and gentlemen can wear suits or tuxedos."
  },
  {
    question: "Can I bring a plus one?",
    answer: "Please refer to your invitation. If a plus one is invited, their name will be listed. Due to venue capacity, we're unable to accommodate additional guests."
  },
  {
    question: "Is there parking available?",
    answer: "Yes, complimentary parking is available at both venues. Valet service will be provided at the reception venue for your convenience."
  },
  {
    question: "What about dietary restrictions?",
    answer: "Please indicate any dietary restrictions in your RSVP. We'll make sure to accommodate vegetarian, vegan, gluten-free, and other dietary needs."
  },
  {
    question: "Will there be a vegetarian option?",
    answer: "Yes, vegetarian and vegan options will be available. Please let us know your preference when you RSVP."
  },
  {
    question: "Can I take photos during the ceremony?",
    answer: "We ask that you refrain from taking photos during the ceremony to preserve the moment for our professional photographer. Feel free to take photos during the reception!"
  },
  {
    question: "What time should I arrive?",
    answer: "Please arrive 15-30 minutes before the ceremony begins to allow time for seating. The ceremony will begin promptly at the scheduled time."
  },
  {
    question: "Is the venue accessible?",
    answer: "Yes, both venues are wheelchair accessible and have accessible parking and restroom facilities."
  }
]

// Helper to create a very light tint of a color
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

// Helper to get relative luminance
function getLuminance(hex: string): number {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255
  
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

// Helper to determine if background is light
function isLightBackground(luminance: number): boolean {
  return luminance > 0.5
}

// Get color scheme based on background choice
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
  const background = theme?.colors?.background || '#ffffff'

  // Determine if we should use colored background
  const isColored = backgroundColorChoice && backgroundColorChoice !== 'none'

  let bgColor = background
  let isLightBg = true

  if (isColored) {
    switch (backgroundColorChoice) {
      case 'primary':
        bgColor = primary
        break
      case 'primary-light':
        bgColor = getLightTint(primary, 0.5)
        break
      case 'primary-lighter':
        bgColor = getLightTint(primary, 0.88)
        break
      case 'secondary':
        bgColor = secondary
        break
      case 'secondary-light':
        bgColor = getLightTint(secondary, 0.5)
        break
      case 'secondary-lighter':
        bgColor = getLightTint(secondary, 0.88)
        break
      case 'accent':
        bgColor = accent
        break
      case 'accent-light':
        bgColor = getLightTint(accent, 0.5)
        break
      case 'accent-lighter':
        bgColor = getLightTint(accent, 0.88)
        break
    }

    // Calculate luminance of bgColor
    let bgLuminance: number
    if (bgColor.startsWith('rgb')) {
      const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)/)
      if (match) {
        const r = parseInt(match[1]) / 255
        const g = parseInt(match[2]) / 255
        const b = parseInt(match[3]) / 255
        const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        bgLuminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
      } else {
        bgLuminance = 0.9
      }
    } else {
      bgLuminance = getLuminance(bgColor)
    }

    isLightBg = isLightBackground(bgLuminance)
  }

  // Text colors based on background
  const titleColor = isColored 
    ? (isLightBg ? foreground : '#ffffff')
    : foreground
  
  const subtitleColor = isColored
    ? (isLightBg ? muted : 'rgba(255,255,255,0.8)')
    : muted

  const bodyTextColor = isColored
    ? (isLightBg ? foreground : '#ffffff')
    : foreground

  const mutedTextColor = isColored
    ? (isLightBg ? muted : 'rgba(255,255,255,0.7)')
    : muted

  const accentColor = isColored
    ? (isLightBg ? primary : 'rgba(255,255,255,0.6)')
    : accent

  const cardBg = isColored
    ? (isLightBg ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.1)')
    : '#ffffff'

  const cardBorder = isColored
    ? (isLightBg ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)')
    : '#e5e7eb'

  return {
    bgColor,
    titleColor,
    subtitleColor,
    bodyTextColor,
    mutedTextColor,
    accentColor,
    cardBg,
    cardBorder,
    isColored,
    isLightBg,
    primary,
    secondary,
    accent
  }
}

import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

export interface BaseCountdownProps {
  weddingDate: string
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  showYears?: boolean
  showMonths?: boolean
  showDays?: boolean
  showHours?: boolean
  showMinutes?: boolean
  showSeconds?: boolean
  sectionTitle?: string
  sectionSubtitle?: string
  message?: string
  useColorBackground?: boolean // deprecated, use backgroundColorChoice
  backgroundColorChoice?: BackgroundColorChoice
}

export interface TimeLeft {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

// Helper to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent / 100)))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(255 * percent / 100)))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(255 * percent / 100)))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Helper to add transparency to a color
function withOpacity(hex: string, opacity: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Helper to create a very light tint of a color (close to white)
function getLightTint(hex: string, tintAmount: number = 0.95): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  // Mix with white based on tintAmount (0.95 = 95% white, 5% color)
  const newR = Math.round(r + (255 - r) * tintAmount)
  const newG = Math.round(g + (255 - g) * tintAmount)
  const newB = Math.round(b + (255 - b) * tintAmount)
  return `rgb(${newR}, ${newG}, ${newB})`
}

// Helper to get relative luminance (for contrast calculations)
function getLuminance(hex: string): number {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255
  
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

// Helper to find the darkest color (best for high-contrast titles)
function getDarkestColor(...colors: string[]): string {
  let darkest = colors[0]
  let lowestLuminance = getLuminance(colors[0])
  
  for (const color of colors) {
    const luminance = getLuminance(color)
    if (luminance < lowestLuminance) {
      lowestLuminance = luminance
      darkest = color
    }
  }
  return darkest
}

// Helper to get second darkest color
function getSecondDarkestColor(...colors: string[]): string {
  const sorted = [...colors].sort((a, b) => getLuminance(a) - getLuminance(b))
  return sorted[1] || sorted[0]
}

// Helper to check if a color is light (for choosing text color)
function isLightColor(hex: string): boolean {
  const luminance = getLuminance(hex)
  return luminance > 0.5 // If luminance > 0.5, it's a light color
}

// Helper to find the lightest color from the palette
function getLightestColor(...colors: string[]): string {
  let lightest = colors[0]
  let highestLuminance = getLuminance(colors[0])
  
  for (const color of colors) {
    const luminance = getLuminance(color)
    if (luminance > highestLuminance) {
      highestLuminance = luminance
      lightest = color
    }
  }
  return lightest
}

// Helper to get second lightest color
function getSecondLightestColor(...colors: string[]): string {
  const sorted = [...colors].sort((a, b) => getLuminance(b) - getLuminance(a))
  return sorted[1] || sorted[0]
}

// Helper to get colors based on background choice
// Returns the selected color as background, plus complementary colors for rich styling
export function getColorScheme(
  theme: Partial<ThemeConfig> | undefined,
  backgroundColorChoice: BackgroundColorChoice | undefined,
  useColorBackground: boolean | undefined
): { 
  bgColor: string | undefined
  // High contrast colors for important readable elements (titles, headings)
  titleColor: string | undefined     // Darkest palette color - best for titles on light cards
  subtitleColor: string | undefined  // Second darkest - good for subtitles/secondary headings
  // Text colors for section headers (adapts based on bg brightness)
  sectionTextColor: string | undefined  // Primary text color for section (light on dark, dark on light)
  sectionTextColorAlt: string | undefined  // Alternative/secondary text color
  // Complementary colors from the palette for rich, harmonious design
  accentColor: string | undefined    // A different palette color for accents/highlights
  contrastColor: string | undefined  // Another palette color for variety
  // Variations of the background color
  colorLight: string | undefined     // Lighter variation (for subtle elements)
  colorDark: string | undefined      // Darker variation (for emphasis)
  colorMuted: string | undefined     // Semi-transparent (for card backgrounds)
  cardBg: string | undefined         // Card background with good contrast
  bodyTextColor: string              // Text color for body content
  isColored: boolean
  isLightBg: boolean                 // Whether the background is light (for text color decisions)
} {
  // Backwards compatibility: if no choice but useColorBackground is true, default to primary
  const choice = backgroundColorChoice || (useColorBackground ? 'primary' : 'none')
  
  if (choice === 'none' || !theme?.colors) {
    return { 
      bgColor: undefined, 
      titleColor: theme?.colors?.primary,
      subtitleColor: theme?.colors?.secondary,
      sectionTextColor: theme?.colors?.foreground,
      sectionTextColorAlt: theme?.colors?.accent,
      accentColor: theme?.colors?.accent,
      contrastColor: undefined,
      colorLight: undefined, 
      colorDark: undefined, 
      colorMuted: undefined,
      cardBg: undefined,
      bodyTextColor: '#4B5563',  // Dark gray for readability
      isColored: false,
      isLightBg: false
    }
  }
  
  const { primary, secondary, accent } = theme.colors
  
  // Find high-contrast colors for readable elements
  const darkestColor = getDarkestColor(primary, secondary, accent)
  const secondDarkest = getSecondDarkestColor(primary, secondary, accent)
  
  let baseColor: string
  let accentColor: string
  let contrastColor: string
  
  // Helper to get the base color from a choice that may include -light or -lighter suffix
  const getBaseColorChoice = (c: string) => c.replace('-lighter', '').replace('-light', '') as 'primary' | 'secondary' | 'accent'
  const isLightVariant = choice.endsWith('-light') && !choice.endsWith('-lighter')
  const isLighterVariant = choice.endsWith('-lighter')
  
  // Get base color choice
  const baseChoice = getBaseColorChoice(choice)
  
  // Select background and assign complementary colors from the palette
  switch (baseChoice) {
    case 'primary':
      baseColor = primary
      accentColor = accent      // Use accent for highlights
      contrastColor = secondary // Use secondary for variety
      break
    case 'secondary':
      baseColor = secondary
      accentColor = primary     // Use primary for highlights
      contrastColor = accent    // Use accent for variety
      break
    case 'accent':
      baseColor = accent
      accentColor = primary     // Use primary for highlights
      contrastColor = secondary // Use secondary for variety
      break
    default:
      return { 
        bgColor: undefined, 
        titleColor: theme?.colors?.primary,
        subtitleColor: theme?.colors?.secondary,
        sectionTextColor: theme?.colors?.foreground,
        sectionTextColorAlt: theme?.colors?.accent,
        accentColor: undefined,
        contrastColor: undefined,
        colorLight: undefined, 
        colorDark: undefined, 
        colorMuted: undefined,
        cardBg: undefined,
        bodyTextColor: '#4B5563',
        isColored: false,
        isLightBg: false
      }
  }
  
  // Apply light or lighter tint if needed
  let finalBgColor = baseColor
  if (isLightVariant) {
    // Light variant: 50% towards white
    finalBgColor = getLightTint(baseColor, 0.5)
  } else if (isLighterVariant) {
    // Lighter variant: 88% towards white (very light pastel)
    finalBgColor = getLightTint(baseColor, 0.88)
  }
  
  // Determine if background is light
  const bgIsLight = isLightColor(baseColor) || isLightVariant || isLighterVariant
  
  // Find light colors from palette for text on dark backgrounds
  const lightestColor = getLightestColor(primary, secondary, accent)
  const secondLightest = getSecondLightestColor(primary, secondary, accent)
  
  // Create creamy light tints of the lightest palette color for text
  const creamyLight = getLightTint(lightestColor, 0.7)  // 70% towards white - creamy
  const creamyLightAlt = getLightTint(secondLightest, 0.6)  // Slightly darker cream
  
  // For section text: use creamy light colors on dark bg, darkest color on light bg
  const sectionText = bgIsLight ? darkestColor : creamyLight
  const sectionTextAlt = bgIsLight ? secondDarkest : creamyLightAlt
  
  return { 
    bgColor: finalBgColor,
    titleColor: darkestColor,         // Darkest color for main titles (high contrast)
    subtitleColor: secondDarkest,     // Second darkest for subtitles
    sectionTextColor: sectionText,    // Adaptive text color based on bg brightness
    sectionTextColorAlt: sectionTextAlt, // Alternative text color
    accentColor: accentColor,
    contrastColor: contrastColor,
    colorLight: adjustColorBrightness(baseColor, 20),   // 20% lighter
    colorDark: adjustColorBrightness(baseColor, -20),   // 20% darker
    colorMuted: withOpacity(baseColor, 0.25),           // 25% opacity for overlays
    cardBg: getLightTint(baseColor, 0.97),              // Very light tint (97% white)
    bodyTextColor: '#4B5563',                           // Dark gray for body text readability
    isColored: true,
    isLightBg: bgIsLight
  }
}
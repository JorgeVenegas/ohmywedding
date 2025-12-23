import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export type BackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

// Default registry providers with their logos and info
export interface DefaultProvider {
  id: string
  name: string
  logoUrl: string
  websiteUrl: string
  descriptionKey?: string
}

// Registry provider (can be default or custom)
export interface RegistryProvider {
  id: string
  name: string
  logoUrl?: string
  url: string
  description?: string
  isCustom?: boolean
}

// Custom registry item (managed via admin)
export interface CustomRegistryItem {
  id: string
  name: string
  description?: string
  imageUrl?: string
  price?: number
  quantity?: number
  quantityNeeded?: number
  quantityFulfilled?: number
  isFulfilled?: boolean
  category?: string
}

export interface BaseRegistryProps {
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  sectionTitle?: string
  sectionSubtitle?: string
  message?: string
  registries?: RegistryProvider[]
  customItems?: CustomRegistryItem[]
  showCustomRegistry?: boolean
  showDescription?: boolean
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
  weddingNameId?: string
}

// Default providers with their information
export const DEFAULT_PROVIDERS: DefaultProvider[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    logoUrl: '/images/registries/amazon.png',
    websiteUrl: 'https://www.amazon.com/wedding',
    descriptionKey: 'registry.providers.amazon'
  },
  {
    id: 'liverpool',
    name: 'Liverpool',
    logoUrl: '/images/registries/liverpool.png',
    websiteUrl: 'https://www.liverpool.com.mx/tienda/mesa-de-regalos',
    descriptionKey: 'registry.providers.liverpool'
  },
  {
    id: 'palacio',
    name: 'El Palacio de Hierro',
    logoUrl: '/images/registries/palacio.png',
    websiteUrl: 'https://www.elpalaciodehierro.com/mesa-de-regalos',
    descriptionKey: 'registry.providers.palacio'
  },
  {
    id: 'target',
    name: 'Target',
    logoUrl: '/images/registries/target.png',
    websiteUrl: 'https://www.target.com/gift-registry/wedding',
    descriptionKey: 'registry.providers.target'
  },
  {
    id: 'crate-barrel',
    name: 'Crate & Barrel',
    logoUrl: '/images/registries/crate-barrel.png',
    websiteUrl: 'https://www.crateandbarrel.com/gift-registry',
    descriptionKey: 'registry.providers.crateBarrel'
  },
  {
    id: 'williams-sonoma',
    name: 'Williams Sonoma',
    logoUrl: '/images/registries/williams-sonoma.png',
    websiteUrl: 'https://www.williams-sonoma.com/registry',
    descriptionKey: 'registry.providers.williamsSonoma'
  },
  {
    id: 'zola',
    name: 'Zola',
    logoUrl: '/images/registries/zola.png',
    websiteUrl: 'https://www.zola.com',
    descriptionKey: 'registry.providers.zola'
  },
  {
    id: 'honeyfund',
    name: 'Honeyfund',
    logoUrl: '/images/registries/honeyfund.png',
    websiteUrl: 'https://www.honeyfund.com',
    descriptionKey: 'registry.providers.honeyfund'
  },
  {
    id: 'bed-bath',
    name: 'Bed Bath & Beyond',
    logoUrl: '/images/registries/bed-bath.png',
    websiteUrl: 'https://www.bedbathandbeyond.com/store/registry/wedding',
    descriptionKey: 'registry.providers.bedBath'
  },
  {
    id: 'custom',
    name: 'Other',
    logoUrl: '/images/registries/custom.png',
    websiteUrl: '',
    descriptionKey: 'registry.providers.custom'
  }
]

// Helper function to get provider info by ID
export function getProviderById(id: string): DefaultProvider | undefined {
  return DEFAULT_PROVIDERS.find(p => p.id === id)
}

// Helper function to get provider logo URL (returns placeholder if not found)
export function getProviderLogoUrl(provider: RegistryProvider): string {
  if (provider.logoUrl) return provider.logoUrl
  const defaultProvider = getProviderById(provider.id)
  if (defaultProvider) return defaultProvider.logoUrl
  return '/images/registries/custom.svg'
}

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

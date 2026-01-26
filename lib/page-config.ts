import { Wedding } from './wedding-data'

export type SupportedLocale = 'en' | 'es'

export interface SectionConfig {
  [key: string]: any
}

export interface PageConfiguration {
  // Section-specific configurations
  sectionConfigs: Record<string, SectionConfig>
  
  // Site-wide settings
  siteSettings: {
    // Internationalization settings
    locale?: SupportedLocale
    showLanguageSwitcher?: boolean
    
    theme?: {
      colors?: {
        primary?: string
        secondary?: string
        accent?: string
        foreground?: string
        background?: string
        muted?: string
      }
      fonts?: {
        display?: string
        heading?: string
        body?: string
        displayFamily?: string
        headingFamily?: string
        bodyFamily?: string
        googleFonts?: string
      }
    }
    layout?: {
      maxWidth?: string
      spacing?: string
    }
    navigation?: {
      showNavLinks?: boolean
      useColorBackground?: boolean
      backgroundColorChoice?: 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'
    }
    envelope?: {
      colorChoice?: 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'
    }
  }
  
  // All components - single source of truth for ordering, visibility, and configuration
  components: Array<{
    id: string
    type: string
    enabled: boolean
    order: number
    props?: Record<string, any>
  }>
  
  // Metadata
  version: string
  lastModified: string
}

// Default configuration structure
export const createDefaultPageConfig = (): PageConfiguration => ({
  sectionConfigs: {},
  siteSettings: {
    locale: 'en',
    showLanguageSwitcher: true,
    theme: {
      colors: {
        primary: '#d4a574',
        secondary: '#9ba082',
        accent: '#e6b5a3',
        foreground: '#1f2937',
        background: '#ffffff',
        muted: '#6b7280'
      },
      fonts: {
        display: 'Playfair Display',
        heading: 'Cormorant Garamond',
        body: 'Lato',
        displayFamily: '"Playfair Display", serif',
        headingFamily: '"Cormorant Garamond", serif',
        bodyFamily: '"Lato", sans-serif',
        googleFonts: 'Playfair+Display:wght@400;700&family=Cormorant+Garamond:wght@400;600&family=Lato:wght@300;400;700'
      }
    },
    layout: {
      maxWidth: '1200px',
      spacing: 'normal'
    },
    navigation: {
      showNavLinks: true
    }
  },
  components: [
    { id: 'hero', type: 'hero', enabled: true, order: 0 },
    { 
      id: 'our-story', 
      type: 'our-story', 
      enabled: false, 
      order: 1,
      props: {
        variant: 'cards',
        showHowWeMet: true,
        showProposal: true,
        showPhotos: false,
        photos: []
      }
    },
    { 
      id: 'event-details', 
      type: 'event-details', 
      enabled: true, 
      order: 2,
      props: {
        variant: 'classic',
        showCeremony: true,
        showReception: true,
        showMapLinks: true,
        showMap: true
      }
    },
    { id: 'countdown', type: 'countdown', enabled: true, order: 3 },
    { id: 'gallery', type: 'gallery', enabled: true, order: 4 },
    { id: 'rsvp', type: 'rsvp', enabled: true, order: 5 },
    { id: 'faq', type: 'faq', enabled: false, order: 6 }
  ],
  version: '1.0.0',
  lastModified: new Date().toISOString()
})

// Merge default config with saved config
export const mergeWithDefaultConfig = (savedConfig: Partial<PageConfiguration>): PageConfiguration => {
  const defaultConfig = createDefaultPageConfig()
  
  return {
    ...defaultConfig,
    ...savedConfig,
    sectionConfigs: {
      ...defaultConfig.sectionConfigs,
      ...savedConfig.sectionConfigs
    },
    siteSettings: {
      ...defaultConfig.siteSettings,
      ...savedConfig.siteSettings,
      theme: {
        ...defaultConfig.siteSettings.theme,
        ...savedConfig.siteSettings?.theme,
        colors: {
          ...defaultConfig.siteSettings.theme?.colors,
          ...savedConfig.siteSettings?.theme?.colors
        },
        fonts: {
          ...defaultConfig.siteSettings.theme?.fonts,
          ...savedConfig.siteSettings?.theme?.fonts
        }
      }
    },
    components: savedConfig.components || defaultConfig.components
  }
}

// API functions for configuration management
export const loadPageConfiguration = async (weddingNameId: string): Promise<PageConfiguration> => {
  try {
    const response = await fetch(`/api/weddings/${weddingNameId}/config`)
    
    if (!response.ok) {
      throw new Error('Failed to load configuration')
    }
    
    const data = await response.json()
    const mergedConfig = mergeWithDefaultConfig(data.config || {})
    return mergedConfig
  } catch (error) {
    return createDefaultPageConfig()
  }
}

export const savePageConfiguration = async (
  weddingNameId: string, 
  config: PageConfiguration
): Promise<{ success: boolean; message?: string }> => {
  try {
    const configToSave = {
      ...config,
      lastModified: new Date().toISOString()
    }
    
    const response = await fetch(`/api/weddings/${weddingNameId}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ config: configToSave })
    })
    
    if (!response.ok) {
      throw new Error('Failed to save configuration')
    }
    
    const data = await response.json()
    return { success: true, message: data.message }
  } catch (error) {
    return { success: false, message: 'Failed to save configuration' }
  }
}

// Helper function to create config from wedding data (for backward compatibility)
export const createConfigFromWedding = (wedding: Wedding): Partial<PageConfiguration> => {
  return {
    siteSettings: {
      theme: {
        colors: {
          primary: wedding.primary_color || '#d4a574',
          secondary: wedding.secondary_color || '#9ba082',
          accent: wedding.accent_color || '#e6b5a3'
        }
      }
    }
  }
}
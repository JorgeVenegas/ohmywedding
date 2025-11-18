import { Wedding } from './wedding-data'

export interface SectionConfig {
  [key: string]: any
}

export interface PageConfiguration {
  // Section-specific configurations
  sectionConfigs: Record<string, SectionConfig>
  
  // Site-wide settings
  siteSettings: {
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
        heading?: 'serif' | 'sans-serif' | 'script'
        body?: 'serif' | 'sans-serif'
      }
    }
    layout?: {
      maxWidth?: string
      spacing?: string
    }
  }
  
  // Component ordering and visibility
  components: Array<{
    id: string
    type: string
    enabled: boolean
    order: number
    props?: Record<string, any>
  }>
  
  // Dynamic components added by user
  dynamicComponents: Array<{
    id: string
    type: string
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
        heading: 'serif',
        body: 'sans-serif'
      }
    },
    layout: {
      maxWidth: '1200px',
      spacing: 'normal'
    }
  },
  components: [
    { id: 'hero', type: 'hero', enabled: true, order: 0 },
    { id: 'our-story', type: 'our-story', enabled: true, order: 1 },
    { id: 'event-details', type: 'event-details', enabled: true, order: 2 },
    { id: 'countdown', type: 'countdown', enabled: true, order: 3 },
    { id: 'gallery', type: 'gallery', enabled: true, order: 4 },
    { id: 'rsvp', type: 'rsvp', enabled: true, order: 5 },
    { id: 'faq', type: 'faq', enabled: false, order: 6 }
  ],
  dynamicComponents: [],
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
    components: savedConfig.components || defaultConfig.components,
    dynamicComponents: savedConfig.dynamicComponents || defaultConfig.dynamicComponents
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
    return mergeWithDefaultConfig(data.config || {})
  } catch (error) {
    console.error('Error loading page configuration:', error)
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
    console.error('Error saving page configuration:', error)
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
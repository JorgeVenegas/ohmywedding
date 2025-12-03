"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { PageConfiguration, createDefaultPageConfig, loadPageConfiguration, savePageConfiguration } from '@/lib/page-config'

// Wedding details type for real-time updates
export interface WeddingDetails {
  partner1_first_name: string
  partner1_last_name: string
  partner2_first_name: string
  partner2_last_name: string
  wedding_date: string | null
  wedding_time: string | null
  ceremony_venue_name: string | null
  ceremony_venue_address: string | null
  reception_venue_name: string | null
  reception_venue_address: string | null
}

// Deep equality check helper with smart undefined handling
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true
  
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false
  }
  
  // Get all unique keys from both objects
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])
  
  // Known default values for common config fields
  const defaultValues: Record<string, any> = {
    showDecorations: true,
    showTagline: true,
    showCountdown: true,
    showRSVPButton: true,
  }
  
  for (const key of allKeys) {
    let val1 = obj1[key]
    let val2 = obj2[key]
    
    // Apply default values if undefined
    if (val1 === undefined && key in defaultValues) {
      val1 = defaultValues[key]
    }
    if (val2 === undefined && key in defaultValues) {
      val2 = defaultValues[key]
    }
    
    // If both are still undefined, consider them equal
    if (val1 === undefined && val2 === undefined) continue
    
    // If one is undefined and the other isn't (after defaults), they're different
    if (val1 === undefined || val2 === undefined) return false
    
    // Recursively check equality
    if (!deepEqual(val1, val2)) return false
  }
  
  return true
}

interface PageConfigContextType {
  config: PageConfiguration
  isLoading: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  
  // Wedding details for real-time updates
  weddingDetails: WeddingDetails | null
  updateWeddingDetails: (details: Partial<WeddingDetails>) => void
  setWeddingDetails: (details: WeddingDetails) => void
  
  // Configuration methods
  updateSectionConfig: (sectionId: string, sectionConfig: Record<string, any>) => void
  getSectionConfig: (sectionId: string) => Record<string, any>
  updateSiteSettings: (settings: Partial<PageConfiguration['siteSettings']>) => void
  updateComponents: (components: PageConfiguration['components']) => void
  updateFonts: (fonts: { display: string; heading: string; body: string; displayFamily: string; headingFamily: string; bodyFamily: string; googleFonts: string }) => void
  updateCustomFont: (fontType: 'display' | 'heading' | 'body', font: string, fontFamily: string) => void
  updateColors: (colors: { primary: string; secondary: string; accent: string }) => void
  updateCustomColor: (colorType: 'primary' | 'secondary' | 'accent', color: string) => void
  updateNavigation: (navigation: { showNavLinks?: boolean; useColorBackground?: boolean; backgroundColorChoice?: 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter' }) => void
  updateLocale: (locale: 'en' | 'es') => void
  
  // Save functionality
  saveConfiguration: () => Promise<{ success: boolean; message?: string }>
  loadConfiguration: () => Promise<void>
  resetToDefaults: () => void
  discardChanges: () => void
}

const PageConfigContext = createContext<PageConfigContextType | undefined>(undefined)

interface PageConfigProviderProps {
  children: ReactNode
  weddingNameId: string
}

export function PageConfigProvider({ children, weddingNameId }: PageConfigProviderProps) {
  const [config, setConfig] = useState<PageConfiguration>(createDefaultPageConfig())
  const [originalConfig, setOriginalConfig] = useState<PageConfiguration>(createDefaultPageConfig())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [weddingDetails, setWeddingDetailsState] = useState<WeddingDetails | null>(null)
  
  // Check if there are unsaved changes using useMemo to avoid unnecessary recalculations
  const hasUnsavedChanges = useMemo(() => {
    // Don't show unsaved changes while loading
    if (isLoading) return false
    
    // Use deep equality check instead of JSON.stringify for more reliable comparison
    const hasChanges = !deepEqual(config, originalConfig)
    
    return hasChanges
  }, [config, originalConfig, isLoading])

  // Load configuration on mount
  useEffect(() => {
    loadConfigurationData()
  }, [weddingNameId])

  const loadConfigurationData = async () => {
    setIsLoading(true)
    try {
      const loadedConfig = await loadPageConfiguration(weddingNameId)
      setConfig(loadedConfig)
      setOriginalConfig(JSON.parse(JSON.stringify(loadedConfig))) // Deep copy
    } catch (error) {
      console.error('Failed to load configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSectionConfig = (sectionId: string, sectionConfig: Record<string, any>) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        sectionConfigs: {
          ...prev.sectionConfigs,
          [sectionId]: { ...sectionConfig }
        }
      }
      return newConfig
    })
  }

  const getSectionConfig = (sectionId: string): Record<string, any> => {
    const sectionConfig = config.sectionConfigs[sectionId] || {}
    return sectionConfig
  }

  const updateSiteSettings = (settings: Partial<PageConfiguration['siteSettings']>) => {
    setConfig(prev => ({
      ...prev,
      siteSettings: {
        ...prev.siteSettings,
        ...settings,
        theme: {
          ...prev.siteSettings.theme,
          ...settings.theme,
          colors: {
            ...prev.siteSettings.theme?.colors,
            ...settings.theme?.colors
          },
          fonts: {
            ...prev.siteSettings.theme?.fonts,
            ...settings.theme?.fonts
          }
        }
      }
    }))
  }

  const updateComponents = (components: PageConfiguration['components']) => {
    setConfig(prev => ({
      ...prev,
      components
    }))
  }

  const updateFonts = (fonts: { display: string; heading: string; body: string; displayFamily: string; headingFamily: string; bodyFamily: string; googleFonts: string }) => {
    setConfig(prev => ({
      ...prev,
      siteSettings: {
        ...prev.siteSettings,
        theme: {
          ...prev.siteSettings.theme,
          fonts: fonts,
          colors: prev.siteSettings.theme?.colors
        }
      }
    }))
  }

  const updateCustomFont = (fontType: 'display' | 'heading' | 'body', font: string, fontFamily: string) => {
    setConfig(prev => ({
      ...prev,
      siteSettings: {
        ...prev.siteSettings,
        theme: {
          ...prev.siteSettings.theme,
          fonts: {
            ...prev.siteSettings.theme?.fonts,
            [fontType]: font,
            [`${fontType}Family`]: fontFamily
          },
          colors: prev.siteSettings.theme?.colors
        }
      }
    }))
  }

  const updateColors = (colors: { primary: string; secondary: string; accent: string }) => {
    setConfig(prev => ({
      ...prev,
      siteSettings: {
        ...prev.siteSettings,
        theme: {
          ...prev.siteSettings.theme,
          colors: {
            ...prev.siteSettings.theme?.colors,
            ...colors
          },
          fonts: prev.siteSettings.theme?.fonts
        }
      }
    }))
  }

  const updateCustomColor = (colorType: 'primary' | 'secondary' | 'accent', color: string) => {
    setConfig(prev => ({
      ...prev,
      siteSettings: {
        ...prev.siteSettings,
        theme: {
          ...prev.siteSettings.theme,
          colors: {
            ...prev.siteSettings.theme?.colors,
            [colorType]: color
          },
          fonts: prev.siteSettings.theme?.fonts
        }
      }
    }))
  }

  const updateNavigation = (navigation: { showNavLinks?: boolean; useColorBackground?: boolean; backgroundColorChoice?: 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter' }) => {
    setConfig(prev => ({
      ...prev,
      siteSettings: {
        ...prev.siteSettings,
        navigation: {
          ...prev.siteSettings.navigation,
          ...navigation
        }
      }
    }))
  }

  const updateLocale = (locale: 'en' | 'es') => {
    setConfig(prev => ({
      ...prev,
      siteSettings: {
        ...prev.siteSettings,
        locale
      }
    }))
  }

  // Wedding details update functions
  const updateWeddingDetails = (details: Partial<WeddingDetails>) => {
    setWeddingDetailsState(prev => prev ? { ...prev, ...details } : null)
  }

  const setWeddingDetails = (details: WeddingDetails) => {
    setWeddingDetailsState(details)
  }

  const saveConfiguration = async (): Promise<{ success: boolean; message?: string }> => {
    setIsSaving(true)
    try {
      const result = await savePageConfiguration(weddingNameId, config)
      if (result.success) {
        setOriginalConfig(JSON.parse(JSON.stringify(config))) // Update original config
      }
      return result
    } finally {
      setIsSaving(false)
    }
  }

  const loadConfiguration = async () => {
    await loadConfigurationData()
  }

  const resetToDefaults = () => {
    const defaultConfig = createDefaultPageConfig()
    setConfig(defaultConfig)
  }

  const discardChanges = () => {
    const restoredConfig = JSON.parse(JSON.stringify(originalConfig)) // Restore from original
    setConfig(restoredConfig)
  }

  return (
    <PageConfigContext.Provider value={{
      config,
      isLoading,
      isSaving,
      hasUnsavedChanges,
      weddingDetails,
      updateWeddingDetails,
      setWeddingDetails,
      updateSectionConfig,
      getSectionConfig,
      updateSiteSettings,
      updateComponents,
      updateFonts,
      updateCustomFont,
      updateColors,
      updateCustomColor,
      updateNavigation,
      updateLocale,
      saveConfiguration,
      loadConfiguration,
      resetToDefaults,
      discardChanges
    }}>
      {children}
    </PageConfigContext.Provider>
  )
}

export function usePageConfig() {
  const context = useContext(PageConfigContext)
  if (context === undefined) {
    throw new Error('usePageConfig must be used within a PageConfigProvider')
  }
  return context
}

// Safe hook that doesn't throw if no provider
export function usePageConfigSafe() {
  const context = useContext(PageConfigContext)
  return context // Returns undefined if no provider
}
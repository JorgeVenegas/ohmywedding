"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { PageConfiguration, createDefaultPageConfig, loadPageConfiguration, savePageConfiguration } from '@/lib/page-config'

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
  
  // Configuration methods
  updateSectionConfig: (sectionId: string, sectionConfig: Record<string, any>) => void
  getSectionConfig: (sectionId: string) => Record<string, any>
  updateSiteSettings: (settings: Partial<PageConfiguration['siteSettings']>) => void
  updateComponents: (components: PageConfiguration['components']) => void
  updateFonts: (fonts: { display: string; heading: string; body: string; displayFamily: string; headingFamily: string; bodyFamily: string; googleFonts: string }) => void
  updateCustomFont: (fontType: 'display' | 'heading' | 'body', font: string, fontFamily: string) => void
  updateColors: (colors: { primary: string; secondary: string; accent: string }) => void
  updateCustomColor: (colorType: 'primary' | 'secondary' | 'accent', color: string) => void
  
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
  
  // Check if there are unsaved changes using useMemo to avoid unnecessary recalculations
  const hasUnsavedChanges = useMemo(() => {
    // Don't show unsaved changes while loading
    if (isLoading) return false
    
    // Use deep equality check instead of JSON.stringify for more reliable comparison
    const hasChanges = !deepEqual(config, originalConfig)
    
    // Debug logging
    if (hasChanges) {
      console.log('Config has unsaved changes detected')
      // Uncomment to debug what's different:
      // console.log('Current config:', JSON.stringify(config, null, 2))
      // console.log('Original config:', JSON.stringify(originalConfig, null, 2))
    }
    
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
    setConfig(prev => ({
      ...prev,
      sectionConfigs: {
        ...prev.sectionConfigs,
        [sectionId]: { ...sectionConfig }
      }
    }))
  }

  const getSectionConfig = (sectionId: string): Record<string, any> => {
    const sectionConfig = config.sectionConfigs[sectionId] || {}
    console.log(`Getting config for section ${sectionId}:`, sectionConfig)
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
    console.log('Discarding changes, restoring config:', restoredConfig)
    console.log('Original config was:', originalConfig)
    console.log('Section configs being restored:', restoredConfig.sectionConfigs)
    console.log('Components being restored:', restoredConfig.components.map((c: any) => ({ id: c.id, type: c.type, enabled: c.enabled })))
    setConfig(restoredConfig)
  }

  return (
    <PageConfigContext.Provider value={{
      config,
      isLoading,
      isSaving,
      hasUnsavedChanges,
      updateSectionConfig,
      getSectionConfig,
      updateSiteSettings,
      updateComponents,
      updateFonts,
      updateCustomFont,
      updateColors,
      updateCustomColor,
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
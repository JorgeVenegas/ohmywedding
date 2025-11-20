"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { PageConfiguration, createDefaultPageConfig, loadPageConfiguration, savePageConfiguration } from '@/lib/page-config'

// Deep equality check helper
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true
  
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false
  }
  
  const keys1 = Object.keys(obj1).sort()
  const keys2 = Object.keys(obj2).sort()
  
  if (keys1.length !== keys2.length) return false
  if (keys1.join(',') !== keys2.join(',')) return false
  
  for (const key of keys1) {
    if (!deepEqual(obj1[key], obj2[key])) return false
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
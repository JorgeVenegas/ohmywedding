"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { PageConfiguration, createDefaultPageConfig, loadPageConfiguration, savePageConfiguration } from '@/lib/page-config'

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
  updateDynamicComponents: (components: PageConfiguration['dynamicComponents']) => void
  
  // Save functionality
  saveConfiguration: () => Promise<{ success: boolean; message?: string }>
  loadConfiguration: () => Promise<void>
  resetToDefaults: () => void
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
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(config) !== JSON.stringify(originalConfig)

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
    return config.sectionConfigs[sectionId] || {}
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

  const updateDynamicComponents = (dynamicComponents: PageConfiguration['dynamicComponents']) => {
    setConfig(prev => ({
      ...prev,
      dynamicComponents
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
      updateDynamicComponents,
      saveConfiguration,
      loadConfiguration,
      resetToDefaults
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
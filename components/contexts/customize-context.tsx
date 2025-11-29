"use client"

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { usePageConfigSafe } from './page-config-context'

interface CustomizeState {
  isOpen: boolean
  sectionId: string | null
  sectionType: string | null
  sectionConfig: Record<string, any>
}

interface CustomizeContextType {
  state: CustomizeState
  sectionConfigs: Record<string, Record<string, any>> // Persistent section configurations
  openCustomizer: (sectionId: string, sectionType: string, config: Record<string, any>) => void
  closeCustomizer: () => void
  updateConfig: (key: string, value: any) => void
  resetConfig: () => void
  applySectionConfig: () => void
  getSectionConfig: (sectionId: string) => Record<string, any> | null
  weddingDate?: string | null
  weddingNameId?: string
  // Settings panel state
  isSettingsPanelOpen: boolean
  openSettingsPanel: () => void
  closeSettingsPanel: () => void
}

const CustomizeContext = createContext<CustomizeContextType | undefined>(undefined)

interface CustomizeProviderProps {
  children: ReactNode
  weddingDate?: string | null
  weddingNameId?: string
}

export function CustomizeProvider({ children, weddingDate, weddingNameId }: CustomizeProviderProps) {
  const [state, setState] = useState<CustomizeState>({
    isOpen: false,
    sectionId: null,
    sectionType: null,
    sectionConfig: {}
  })
  
  // Settings panel state
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false)
  
  // Get page config context
  const pageConfig = usePageConfigSafe()
  
  // Persistent section configurations
  const [sectionConfigs, setSectionConfigs] = useState<Record<string, Record<string, any>>>({})
  
  // Use ref to track the latest sectionId to avoid stale closures
  const currentSectionIdRef = useRef<string | null>(null)
  
  // Update ref when sectionId changes
  useEffect(() => {
    currentSectionIdRef.current = state.sectionId
  }, [state.sectionId])
  
  // Sync sectionConfigs with page config when it changes (e.g., after discarding)
  useEffect(() => {
    if (pageConfig?.config) {
      console.log('Syncing customize context with page config:', pageConfig.config.sectionConfigs)
      setSectionConfigs(pageConfig.config.sectionConfigs || {})
    }
  }, [pageConfig?.config])

  const openCustomizer = (sectionId: string, sectionType: string, config: Record<string, any>) => {
    // Close settings panel if open
    setIsSettingsPanelOpen(false)
    setState({
      isOpen: true,
      sectionId,
      sectionType,
      sectionConfig: { ...config }
    })
  }

  const closeCustomizer = () => {
    setState({
      isOpen: false,
      sectionId: null,
      sectionType: null,
      sectionConfig: {}
    })
  }

  const openSettingsPanel = () => {
    // Close section customizer if open
    closeCustomizer()
    setIsSettingsPanelOpen(true)
  }

  const closeSettingsPanel = () => {
    setIsSettingsPanelOpen(false)
  }

  const updateConfig = (key: string, value: any) => {
    const currentSectionId = state.sectionId
    
    // Update local state
    setState(prev => ({
      ...prev,
      sectionConfig: {
        ...prev.sectionConfig,
        [key]: value
      }
    }))
    
    // Update persistent configs and page config
    if (currentSectionId) {
      setSectionConfigs(prevConfigs => {
        const updatedConfig = {
          ...prevConfigs[currentSectionId],
          [key]: value 
        }
        
        return {
          ...prevConfigs,
          [currentSectionId]: updatedConfig
        }
      })
      
      // Apply to page config - use setTimeout to avoid calling during render
      if (pageConfig) {
        // Use queueMicrotask to schedule after current render
        queueMicrotask(() => {
          const currentConfig = pageConfig.getSectionConfig(currentSectionId)
          pageConfig.updateSectionConfig(currentSectionId, {
            ...currentConfig,
            [key]: value
          })
        })
      }
    }
  }

  const resetConfig = () => {
    setState(prev => {
      // Apply reset immediately to persistent config (live updates)
      if (prev.sectionId) {
        setSectionConfigs(prevConfigs => ({
          ...prevConfigs,
          [prev.sectionId!]: {}
        }))
      }
      
      return {
        ...prev,
        sectionConfig: {}
      }
    })
  }

  const applySectionConfig = () => {
    if (state.sectionId) {
      setSectionConfigs(prev => ({
        ...prev,
        [state.sectionId!]: { ...state.sectionConfig }
      }))
    }
  }

  const getSectionConfig = (sectionId: string): Record<string, any> | null => {
    // Check local config first, then page config
    const localConfig = sectionConfigs[sectionId]
    const pageConfigData = pageConfig?.getSectionConfig(sectionId)
    
    return localConfig || pageConfigData || null
  }

  return (
    <CustomizeContext.Provider value={{
      state,
      sectionConfigs,
      openCustomizer,
      closeCustomizer,
      updateConfig,
      resetConfig,
      applySectionConfig,
      getSectionConfig,
      weddingDate,
      weddingNameId,
      isSettingsPanelOpen,
      openSettingsPanel,
      closeSettingsPanel
    }}>
      {children}
    </CustomizeContext.Provider>
  )
}

export function useCustomize() {
  const context = useContext(CustomizeContext)
  if (context === undefined) {
    throw new Error('useCustomize must be used within a CustomizeProvider')
  }
  return context
}

// Safe hook that doesn't throw if no provider
export function useCustomizeSafe() {
  const context = useContext(CustomizeContext)
  return context // Returns undefined if no provider
}
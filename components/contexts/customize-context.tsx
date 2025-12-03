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

  // Track pending updates that need to be synced to pageConfig
  const pendingUpdateRef = useRef<{ sectionId: string; config: Record<string, any> } | null>(null)
  
  // Sync pending updates to page config after state updates
  useEffect(() => {
    if (pendingUpdateRef.current && pageConfig) {
      const { sectionId, config } = pendingUpdateRef.current
      pageConfig.updateSectionConfig(sectionId, config)
      pendingUpdateRef.current = null
    }
  })

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
    
    // Update persistent configs and schedule page config update
    if (currentSectionId) {
      setSectionConfigs(prevConfigs => {
        const updatedConfig = {
          ...prevConfigs[currentSectionId],
          [key]: value 
        }
        
        // Schedule the pageConfig update for after this render
        pendingUpdateRef.current = { sectionId: currentSectionId, config: updatedConfig }
        
        return {
          ...prevConfigs,
          [currentSectionId]: updatedConfig
        }
      })
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
    // Merge page config with local config, with current editing state taking highest precedence
    const pageConfigData = pageConfig?.getSectionConfig(sectionId) || {}
    const localConfig = sectionConfigs[sectionId] || {}
    
    // If we're currently editing this section, include the live editing state
    const currentEditingConfig = state.sectionId === sectionId ? state.sectionConfig : {}
    
    // Return merged config: page config < local config < current editing state
    const mergedConfig = { ...pageConfigData, ...localConfig, ...currentEditingConfig }
    
    return Object.keys(mergedConfig).length > 0 ? mergedConfig : null
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
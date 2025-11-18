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
}

const CustomizeContext = createContext<CustomizeContextType | undefined>(undefined)

interface CustomizeProviderProps {
  children: ReactNode
  weddingDate?: string | null
}

export function CustomizeProvider({ children, weddingDate }: CustomizeProviderProps) {
  const [state, setState] = useState<CustomizeState>({
    isOpen: false,
    sectionId: null,
    sectionType: null,
    sectionConfig: {}
  })
  
  // Get page config context
  const pageConfig = usePageConfigSafe()
  
  // Persistent section configurations
  const [sectionConfigs, setSectionConfigs] = useState<Record<string, Record<string, any>>>({})
  
  // Ref to track pending page config updates
  const pendingPageConfigUpdates = useRef<Array<{ sectionId: string; config: Record<string, any> }>>([])
  
  // Effect to handle page config updates outside of render
  useEffect(() => {
    if (pendingPageConfigUpdates.current.length > 0 && pageConfig) {
      pendingPageConfigUpdates.current.forEach(({ sectionId, config }) => {
        pageConfig.updateSectionConfig(sectionId, config)
      })
      pendingPageConfigUpdates.current = []
    }
  }, [pageConfig, sectionConfigs]) // Dependency on sectionConfigs ensures updates are applied

  const openCustomizer = (sectionId: string, sectionType: string, config: Record<string, any>) => {
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

  const updateConfig = (key: string, value: any) => {
    setState(prev => {
      const newSectionConfig = {
        ...prev.sectionConfig,
        [key]: value
      }
      
      // Apply changes immediately to persistent config (live updates)
      if (prev.sectionId) {
        setSectionConfigs(prevConfigs => {
          const updatedConfig = {
            ...prevConfigs[prev.sectionId!],
            [key]: value 
          }
          
          // Queue page config update
          if (pageConfig) {
            pendingPageConfigUpdates.current.push({
              sectionId: prev.sectionId!,
              config: {
                ...pageConfig.getSectionConfig(prev.sectionId!),
                [key]: value
              }
            })
          }
          
          return {
            ...prevConfigs,
            [prev.sectionId!]: updatedConfig
          }
        })
      }
      
      return {
        ...prev,
        sectionConfig: newSectionConfig
      }
    })
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
      weddingDate
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
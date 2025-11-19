"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface SiteConfig {
  style: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  enabledComponents: string[]
}

interface SiteConfigContextType {
  config: SiteConfig
  updateStyle: (style: string) => void
  updateColors: (colors: { primary: string; secondary: string; accent: string }) => void
  updateCustomColor: (colorType: 'primary' | 'secondary' | 'accent', color: string) => void
  toggleComponent: (componentId: string, enabled: boolean) => void
  addComponent: (componentId: string, position: number, currentComponents?: any[]) => void
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined)

// All possible components available for any wedding style
const ALL_AVAILABLE_COMPONENTS = ['hero', 'our-story', 'countdown', 'event-details', 'gallery', 'rsvp', 'faq']

// Helper function to get available components for a style (now returns all components for any style)
function getAvailableComponentsForStyle(style: string) {
  return ALL_AVAILABLE_COMPONENTS
}

const DEFAULT_CONFIG: SiteConfig = {
  style: 'modern',
  colors: {
    primary: '#9CAF88',
    secondary: '#B8C5A6', 
    accent: '#8B9A7A'
  },
  enabledComponents: ['hero'] // Start with just the hero section enabled
}

interface SiteConfigProviderProps {
  children: ReactNode
  initialColors?: {
    primary: string
    secondary: string
    accent: string
  }
}

export function SiteConfigProvider({ children, initialColors }: SiteConfigProviderProps) {
  const [config, setConfig] = useState<SiteConfig>({
    ...DEFAULT_CONFIG,
    colors: initialColors || DEFAULT_CONFIG.colors
  })

  const updateStyle = (style: string) => {
    setConfig(prev => ({ 
      ...prev, 
      style
      // Keep current enabled components when switching styles
    }))
  }

  const updateColors = (colors: { primary: string; secondary: string; accent: string }) => {
    setConfig(prev => ({ ...prev, colors }))
  }

  const updateCustomColor = (colorType: 'primary' | 'secondary' | 'accent', color: string) => {
    setConfig(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorType]: color
      }
    }))
  }

  const toggleComponent = (componentId: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      enabledComponents: enabled
        ? [...prev.enabledComponents.filter(id => id !== componentId), componentId]
        : prev.enabledComponents.filter(id => id !== componentId)
    }))
  }

  const addComponent = (componentId: string, position: number, currentComponents: any[] = []) => {
    setConfig(prev => {
      // Check if component is already enabled
      if (prev.enabledComponents.includes(componentId)) {
        return prev // Don't add duplicates
      }

      return {
        ...prev,
        enabledComponents: [...prev.enabledComponents, componentId]
      }
    })
  }

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        updateStyle,
        updateColors,
        updateCustomColor,
        toggleComponent,
        addComponent
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  )
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext)
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider')
  }
  return context
}

// Safe hook that doesn't throw if no provider
export function useSiteConfigSafe() {
  const context = useContext(SiteConfigContext)
  return context // Returns undefined if no provider
}
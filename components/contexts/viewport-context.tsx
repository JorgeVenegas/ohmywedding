"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

type ViewportMode = 'desktop' | 'mobile'

interface ViewportContextType {
  viewportMode: ViewportMode
  setViewportMode: (mode: ViewportMode) => void
  toggleViewport: () => void
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined)

interface ViewportProviderProps {
  children: ReactNode
}

export function ViewportProvider({ children }: ViewportProviderProps) {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')

  const toggleViewport = () => {
    setViewportMode(prev => prev === 'desktop' ? 'mobile' : 'desktop')
  }

  return (
    <ViewportContext.Provider value={{ viewportMode, setViewportMode, toggleViewport }}>
      {children}
    </ViewportContext.Provider>
  )
}

export function useViewport() {
  const context = useContext(ViewportContext)
  if (context === undefined) {
    throw new Error('useViewport must be used within a ViewportProvider')
  }
  return context
}

export function useViewportSafe() {
  return useContext(ViewportContext)
}

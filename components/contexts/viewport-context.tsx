"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

type ViewportMode = 'desktop' | 'mobile'

export type MobileDeviceSize = 'iphone-13' | 'iphone-se' | 'pixel-5' | 'galaxy-s21'

export interface MobileDevice {
  id: MobileDeviceSize
  name: string
  width: number
  height: number
}

export const MOBILE_DEVICES: Record<MobileDeviceSize, MobileDevice> = {
  'iphone-13': { id: 'iphone-13', name: 'iPhone 13 Pro', width: 375, height: 812 },
  'iphone-se': { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667 },
  'pixel-5': { id: 'pixel-5', name: 'Google Pixel 5', width: 393, height: 851 },
  'galaxy-s21': { id: 'galaxy-s21', name: 'Galaxy S21', width: 360, height: 800 }
}

interface ViewportContextType {
  viewportMode: ViewportMode
  mobileDevice: MobileDeviceSize
  setViewportMode: (mode: ViewportMode) => void
  setMobileDevice: (device: MobileDeviceSize) => void
  toggleViewport: () => void
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined)

interface ViewportProviderProps {
  children: ReactNode
}

export function ViewportProvider({ children }: ViewportProviderProps) {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')
  const [mobileDevice, setMobileDevice] = useState<MobileDeviceSize>('iphone-13')

  const toggleViewport = () => {
    setViewportMode(prev => prev === 'desktop' ? 'mobile' : 'desktop')
  }

  return (
    <ViewportContext.Provider value={{ viewportMode, mobileDevice, setViewportMode, setMobileDevice, toggleViewport }}>
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

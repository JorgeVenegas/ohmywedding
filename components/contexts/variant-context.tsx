"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface VariantState {
  hero: string
  ourStory: string
  rsvp: string
  eventDetails: string
  gallery: string
  faq: string
  countdown: string
  registry: string
}

interface VariantContextType {
  variants: VariantState
  updateVariant: (component: keyof VariantState, variant: string) => void
  resetVariants: () => void
}

const defaultVariants: VariantState = {
  hero: 'background',
  ourStory: 'cards',
  rsvp: 'cta',
  eventDetails: 'default',
  gallery: 'grid',
  faq: 'accordion',
  countdown: 'default',
  registry: 'cards'
}

const VariantContext = createContext<VariantContextType | undefined>(undefined)

interface VariantProviderProps {
  children: ReactNode
  initialVariants?: Partial<VariantState>
}

export function VariantProvider({ children, initialVariants = {} }: VariantProviderProps) {
  const [variants, setVariants] = useState<VariantState>({
    ...defaultVariants,
    ...initialVariants
  })

  const updateVariant = (component: keyof VariantState, variant: string) => {
    setVariants(prev => ({
      ...prev,
      [component]: variant
    }))
  }

  const resetVariants = () => {
    setVariants(defaultVariants)
  }

  return (
    <VariantContext.Provider value={{ variants, updateVariant, resetVariants }}>
      {children}
    </VariantContext.Provider>
  )
}

export function useVariantContext() {
  const context = useContext(VariantContext)
  if (context === undefined) {
    throw new Error('useVariantContext must be used within a VariantProvider')
  }
  return context
}

// Safe hook that doesn't throw if no provider
export function useVariantContextSafe() {
  const context = useContext(VariantContext)
  return context // Returns undefined if no provider
}

// Hook for individual components
export function useComponentVariant(component: keyof VariantState) {
  const context = useVariantContextSafe()
  
  if (!context) {
    // Return defaults when no context available (server-side or no provider)
    return {
      currentVariant: 'background', // Default variant
      setVariant: () => {} // No-op function
    }
  }
  
  const { variants, updateVariant } = context
  
  return {
    currentVariant: variants[component],
    setVariant: (variant: string) => updateVariant(component, variant)
  }
}
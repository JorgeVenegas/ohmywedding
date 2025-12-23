"use client"

import React from 'react'
import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'
import { useComponentVariant } from '@/components/contexts/variant-context'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'

// Base interface that all wedding sections should extend
export interface BaseSectionProps {
  theme?: ThemeConfig
  alignment?: AlignmentConfig
  showVariantSwitcher?: boolean
}

// Variant option interface
export interface VariantOption {
  value: string
  label: string
  description: string
}

// Configuration interface for sections
export interface SectionConfig {
  variant: string
  [key: string]: any
}

// Hook for consistent section behavior
export function useSectionVariants<T extends string>(
  componentKey: 'hero' | 'ourStory' | 'countdown' | 'rsvp' | 'eventDetails' | 'gallery' | 'faq' | 'registry',
  sectionId: string, // e.g., 'hero', 'our-story', 'countdown', 'registry'
  defaultVariant: T,
  propVariant?: T,
  showVariantSwitcher?: boolean
) {
  const { currentVariant, setVariant } = useComponentVariant(componentKey)
  const editingContext = useEditingModeSafe()
  const customizeContext = useCustomizeSafe()
  
  // Get customized configuration if available
  const customConfig = customizeContext?.getSectionConfig(sectionId) || {}
  
  // Use editing context if available, otherwise fall back to prop
  const shouldShowVariantSwitcher = editingContext?.isEditingMode ?? showVariantSwitcher ?? true
  
  // Determine which variant to use - prioritize custom config over variant context
  let activeVariant: T
  
  if (customConfig.variant) {
    // Use customize context variant (highest priority)
    activeVariant = customConfig.variant as T
  } else if (shouldShowVariantSwitcher && currentVariant) {
    // Use variant context if no customize config and editing mode
    activeVariant = currentVariant as T
  } else {
    // Use prop variant or default
    activeVariant = (propVariant || defaultVariant) as T
  }

  const handleEditClick = (sectionType: string, currentSectionConfig: Record<string, any>) => {
    if (customizeContext) {
      const configToPass = {
        variant: activeVariant,
        ...currentSectionConfig
      }
      customizeContext.openCustomizer(sectionId, sectionType, configToPass)
    }
  }

  return {
    activeVariant,
    customConfig,
    shouldShowVariantSwitcher,
    setVariant,
    handleEditClick,
    customizeContext
  }
}

// Note: Inline variant switchers have been removed as per requirement
// All variant switching should be done through the config panel only

// Helper function to create consistent variant configurations
export function createVariantConfig(
  customConfig: Record<string, any>,
  props: Record<string, any>,
  overrides: Record<string, any> = {}
): Record<string, any> {
  const config: Record<string, any> = {}
  
  // Merge custom config over props, with overrides taking precedence
  Object.keys(props).forEach(key => {
    if (key !== 'variant' && key !== 'showVariantSwitcher') {
      config[key] = customConfig[key] ?? props[key]
    }
  })
  
  return { ...config, ...overrides }
}

// Type helper for section component props
export type SectionComponentProps<T = {}> = BaseSectionProps & T & {
  variant?: string
}
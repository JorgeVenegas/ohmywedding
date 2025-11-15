"use client"

import React from 'react'
import { Edit3, Eye, Settings } from 'lucide-react'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
import { useSiteConfigSafe } from '@/components/contexts/site-config-context'
import { usePageConfigSafe } from '@/components/contexts/page-config-context'
import { SiteSettingsMenu } from './site-settings-menu'
import { SaveConfigButton } from './save-config-button'

interface EditingTopBarProps {
  className?: string
}

export function EditingTopBar({ className = '' }: EditingTopBarProps) {
  const editingContext = useEditingModeSafe()
  const siteConfigContext = useSiteConfigSafe()
  const pageConfigContext = usePageConfigSafe()
  
  // Don't render if no editing context is available
  if (!editingContext) return null
  
  const { isEditingMode, toggleEditingMode } = editingContext

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 ${className}`}>
      {/* Save Configuration Button - only visible in editing mode */}
      {isEditingMode && pageConfigContext && (
        <SaveConfigButton size="sm" />
      )}
      
      {/* Site Settings Menu - only visible in editing mode */}
      {isEditingMode && siteConfigContext && (
        <SiteSettingsMenu
          currentStyle={siteConfigContext.config.style}
          currentColors={siteConfigContext.config.colors}
          onStyleChange={siteConfigContext.updateStyle}
          onColorsChange={siteConfigContext.updateColors}
          onCustomColorChange={siteConfigContext.updateCustomColor}
        />
      )}
      
      {/* Edit/Preview Toggle */}
      <div className="relative">
        <button
          onClick={toggleEditingMode}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-lg
            transition-all duration-200 hover:shadow-xl hover:scale-105
            ${isEditingMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }
          `}
          title={isEditingMode ? 'Exit editing mode' : 'Enter editing mode'}
        >
          {isEditingMode ? (
            <>
              <Eye className="w-4 h-4" />
              <span className="text-sm">Preview</span>
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4" />
              <span className="text-sm">Edit</span>
            </>
          )}
        </button>
        
        {/* Status indicator */}
        <div className={`
          absolute -top-1 -left-1 w-3 h-3 rounded-full animate-pulse
          ${isEditingMode ? 'bg-green-400' : 'bg-gray-400'}
        `} />
      </div>
    </div>
  )
}
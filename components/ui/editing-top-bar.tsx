"use client"

import React from 'react'
import { Edit3, Eye, Settings, Monitor, Smartphone } from 'lucide-react'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
import { useSiteConfigSafe } from '@/components/contexts/site-config-context'
import { usePageConfigSafe } from '@/components/contexts/page-config-context'
import { useViewportSafe } from '@/components/contexts/viewport-context'
import { SiteSettingsMenu } from './site-settings-menu'
import { SaveConfigButton } from './save-config-button'

interface EditingTopBarProps {
  className?: string
}

export function EditingTopBar({ className = '' }: EditingTopBarProps) {
  const editingContext = useEditingModeSafe()
  const siteConfigContext = useSiteConfigSafe()
  const pageConfigContext = usePageConfigSafe()
  const viewportContext = useViewportSafe()
  
  // Don't render if no editing context is available
  if (!editingContext) return null
  
  const { isEditingMode, toggleEditingMode } = editingContext
  const viewportMode = viewportContext?.viewportMode || 'desktop'
  const toggleViewport = viewportContext?.toggleViewport

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 ${className}`}>
      {/* Save Configuration Button - only visible in editing mode */}
      {isEditingMode && pageConfigContext && (
        <SaveConfigButton size="sm" />
      )}
      
      {/* Site Settings Menu - only visible in editing mode */}
      {isEditingMode && siteConfigContext && (
        <SiteSettingsMenu
          currentFonts={{ 
            display: siteConfigContext.config.fonts.display, 
            heading: siteConfigContext.config.fonts.heading, 
            body: siteConfigContext.config.fonts.body 
          }}
          currentColors={siteConfigContext.config.colors}
          onFontsChange={siteConfigContext.updateFonts}
          onColorsChange={siteConfigContext.updateColors}
          onCustomColorChange={siteConfigContext.updateCustomColor}
          onCustomFontChange={siteConfigContext.updateCustomFont}
        />
      )}
      
      {/* Edit/Preview Toggle */}
      <div className="relative">
        <button
          onClick={toggleEditingMode}
          className={`
            flex items-center gap-2 h-9 px-3 py-2 rounded-full font-medium shadow-lg
            transition-all duration-300 hover:shadow-xl hover:scale-105
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
              <span className="text-sm font-medium">Preview</span>
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-medium">Edit</span>
            </>
          )}
        </button>
        
        {/* Status indicator */}
        <div className={`
          absolute -top-1 -left-1 w-3 h-3 rounded-full animate-pulse
          ${isEditingMode ? 'bg-green-400' : 'bg-gray-400'}
        `} />
      </div>

      {/* Viewport Toggle - only visible in preview mode */}
      {!isEditingMode && toggleViewport && (
        <button
          onClick={toggleViewport}
          className="flex items-center gap-2 h-9 px-3 py-2 rounded-full font-medium shadow-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
          title={`Switch to ${viewportMode === 'desktop' ? 'mobile' : 'desktop'} preview`}
        >
          {viewportMode === 'desktop' ? (
            <>
              <Monitor className="w-4 h-4" />
              <span className="text-sm font-medium">Desktop</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4" />
              <span className="text-sm font-medium">Mobile</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
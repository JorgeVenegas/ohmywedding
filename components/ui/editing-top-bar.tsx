"use client"

import React, { useState } from 'react'
import { Edit3, Eye, Settings, Monitor, Smartphone, ChevronDown } from 'lucide-react'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
import { useSiteConfigSafe } from '@/components/contexts/site-config-context'
import { usePageConfigSafe } from '@/components/contexts/page-config-context'
import { useViewportSafe, MOBILE_DEVICES, type MobileDeviceSize } from '@/components/contexts/viewport-context'
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
  const [showDeviceMenu, setShowDeviceMenu] = useState(false)
  
  // Don't render if no editing context is available
  if (!editingContext) return null
  
  const { isEditingMode, toggleEditingMode } = editingContext
  const viewportMode = viewportContext?.viewportMode || 'desktop'
  const mobileDevice = viewportContext?.mobileDevice || 'iphone-13'
  const toggleViewport = viewportContext?.toggleViewport
  const setMobileDevice = viewportContext?.setMobileDevice

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 ${className}`}>
      {/* Save Configuration Button - only visible in editing mode */}
      {isEditingMode && pageConfigContext && (
        <SaveConfigButton size="sm" />
      )}
      
      {/* Site Settings Menu - only visible in editing mode */}
      {isEditingMode && pageConfigContext && (
        <SiteSettingsMenu
          currentFonts={{ 
            display: pageConfigContext.config.siteSettings.theme?.fonts?.display || 'Playfair Display',
            heading: pageConfigContext.config.siteSettings.theme?.fonts?.heading || 'Cormorant Garamond',
            body: pageConfigContext.config.siteSettings.theme?.fonts?.body || 'Lato'
          }}
          currentColors={{
            primary: pageConfigContext.config.siteSettings.theme?.colors?.primary || '#d4a574',
            secondary: pageConfigContext.config.siteSettings.theme?.colors?.secondary || '#9ba082',
            accent: pageConfigContext.config.siteSettings.theme?.colors?.accent || '#e6b5a3'
          }}
          onFontsChange={pageConfigContext.updateFonts}
          onColorsChange={pageConfigContext.updateColors}
          onCustomColorChange={pageConfigContext.updateCustomColor}
          onCustomFontChange={pageConfigContext.updateCustomFont}
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

      {/* Viewport Toggle - visible on larger screens */}
      {toggleViewport && (
        <div className="hidden lg:flex items-center gap-2">
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
          
          {/* Device selector - only visible in mobile mode */}
          {viewportMode === 'mobile' && setMobileDevice && (
            <div className="relative">
              <button
                onClick={() => setShowDeviceMenu(!showDeviceMenu)}
                className="flex items-center gap-2 h-9 px-3 py-2 rounded-full font-medium shadow-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <span className="text-sm font-medium">{MOBILE_DEVICES[mobileDevice].name}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showDeviceMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown menu */}
              {showDeviceMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDeviceMenu(false)}
                  />
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[200px] z-50">
                    {Object.values(MOBILE_DEVICES).map((device) => (
                      <button
                        key={device.id}
                        onClick={() => {
                          setMobileDevice(device.id)
                          setShowDeviceMenu(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          mobileDevice === device.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{device.name}</span>
                          <span className="text-xs text-gray-400">{device.width}×{device.height}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
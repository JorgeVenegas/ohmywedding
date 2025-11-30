"use client"

import React, { useState, useEffect } from 'react'
import { Edit3, Eye, Settings, Monitor, Smartphone, ChevronDown, LogIn, User } from 'lucide-react'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
import { useSiteConfigSafe } from '@/components/contexts/site-config-context'
import { usePageConfigSafe } from '@/components/contexts/page-config-context'
import { useViewportSafe, MOBILE_DEVICES, type MobileDeviceSize } from '@/components/contexts/viewport-context'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { useAuth } from '@/hooks/use-auth'
import { SaveConfigButton } from './save-config-button'
import { SettingsPanel } from './settings-panel'
import Link from 'next/link'

interface EditingTopBarProps {
  className?: string
  weddingNameId?: string
}

export function EditingTopBar({ className = '', weddingNameId }: EditingTopBarProps) {
  const editingContext = useEditingModeSafe()
  const siteConfigContext = useSiteConfigSafe()
  const pageConfigContext = usePageConfigSafe()
  const viewportContext = useViewportSafe()
  const customizeContext = useCustomizeSafe()
  const { user, loading: authLoading, signOut } = useAuth()
  const [showDeviceMenu, setShowDeviceMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [navIsVisible, setNavIsVisible] = useState(false)
  const [currentNavHeight, setCurrentNavHeight] = useState(56)
  
  const currentViewportMode = viewportContext?.viewportMode || 'desktop'
  
  // Listen for wedding nav visibility changes - only affects desktop view, not mobile preview
  useEffect(() => {
    const handleNavVisibilityChange = (event: CustomEvent<{ isVisible: boolean; navHeight?: number }>) => {
      // Only move buttons when in desktop viewport mode (nav is on same page)
      // In mobile viewport mode, the nav is inside the iframe so buttons don't need to move
      if (currentViewportMode === 'desktop') {
        setNavIsVisible(event.detail.isVisible)
        if (event.detail.navHeight) {
          setCurrentNavHeight(event.detail.navHeight)
        }
      } else {
        setNavIsVisible(false)
      }
    }
    
    window.addEventListener('weddingNavVisibilityChange', handleNavVisibilityChange as EventListener)
    return () => {
      window.removeEventListener('weddingNavVisibilityChange', handleNavVisibilityChange as EventListener)
    }
  }, [currentViewportMode])
  
  // Don't render if no editing context is available
  if (!editingContext) return null
  
  const { isEditingMode, toggleEditingMode, permissions, permissionsLoading, canEdit } = editingContext
  const viewportMode = currentViewportMode
  const mobileDevice = viewportContext?.mobileDevice || 'iphone-13'
  const toggleViewport = viewportContext?.toggleViewport
  const setMobileDevice = viewportContext?.setMobileDevice

  const handleOpenSettings = () => {
    if (customizeContext) {
      customizeContext.openSettingsPanel()
    }
  }

  const handleCloseSettings = () => {
    if (customizeContext) {
      customizeContext.closeSettingsPanel()
    }
  }

  const showSettingsPanel = customizeContext?.isSettingsPanelOpen ?? false
  
  // Calculate top position based on nav visibility and dynamic nav height
  const topOffset = navIsVisible ? currentNavHeight + 16 : 16 // 16px = top-4

  return (
    <>
      <div 
        className={`fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 transition-all duration-300 ${className}`}
        style={{ top: `${topOffset}px` }}
      >
        {/* Save Configuration Button - only visible in editing mode */}
        {isEditingMode && pageConfigContext && canEdit && (
          <SaveConfigButton size="sm" />
        )}
        
        {/* Settings Button - only visible in editing mode */}
        {isEditingMode && pageConfigContext && weddingNameId && canEdit && (
          <button
            onClick={handleOpenSettings}
            className="flex items-center gap-2 h-9 px-3 py-2 rounded-full font-medium shadow-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
            title="Wedding Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        )}
        
        {/* Edit/Preview Toggle - only if user can edit */}
        {canEdit && (
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
        )}

        {/* Login Button - show if user is not logged in and can't edit */}
        {!authLoading && !permissionsLoading && !canEdit && !user && (
          <Link
            href={`/login?redirect=${encodeURIComponent('/' + (weddingNameId || ''))}`}
            className="flex items-center gap-2 h-9 px-3 py-2 rounded-full font-medium shadow-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <LogIn className="w-4 h-4" />
            <span className="text-sm font-medium">Sign In to Edit</span>
          </Link>
        )}

        {/* User Menu - show if user is logged in */}
        {!authLoading && user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 h-9 px-3 py-2 rounded-full font-medium shadow-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <User className="w-4 h-4" />
              <ChevronDown className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[200px] z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium text-gray-700 truncate">{user.email}</p>
                    {permissions.role !== 'guest' && (
                      <p className="text-xs text-blue-600 mt-1 capitalize">{permissions.role}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      signOut()
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      {/* Viewport Toggle - visible on larger screens */}
      {toggleViewport && canEdit && (
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
    
    {/* Settings Panel */}
    {weddingNameId && pageConfigContext && (
      <SettingsPanel
        isOpen={showSettingsPanel}
        onClose={handleCloseSettings}
        weddingNameId={weddingNameId}
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
        showNavLinks={pageConfigContext.config.siteSettings.navigation?.showNavLinks !== false}
        onNavLinksChange={(showNavLinks) => pageConfigContext.updateNavigation({ showNavLinks })}
        navUseColorBackground={pageConfigContext.config.siteSettings.navigation?.useColorBackground || false}
        navBackgroundColorChoice={pageConfigContext.config.siteSettings.navigation?.backgroundColorChoice || 'none'}
        onNavColorBackgroundChange={(useColor, colorChoice) => pageConfigContext.updateNavigation({ 
          useColorBackground: useColor, 
          backgroundColorChoice: colorChoice 
        })}
      />
    )}
    </>
  )
}
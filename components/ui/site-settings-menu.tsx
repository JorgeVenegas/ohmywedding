"use client"

import React, { useState, useEffect } from 'react'
import { Settings, ChevronDown, Palette, Layout } from 'lucide-react'
import { Button } from './button'

// Available wedding styles
const WEDDING_STYLES = [
  { id: 'classic', name: 'Classic Elegance', description: 'Timeless and sophisticated' },
  { id: 'modern', name: 'Modern Minimalist', description: 'Clean and contemporary' },
  { id: 'romantic', name: 'Romantic Garden', description: 'Soft and dreamy' },
  { id: 'rustic', name: 'Rustic Charm', description: 'Natural and cozy' },
  { id: 'beach', name: 'Beach Bliss', description: 'Coastal and relaxed' }
]

// Color themes - Wedding-optimized color palettes
const COLOR_THEMES = [
  { 
    id: 'sage-blush', 
    name: 'Sage & Blush', 
    colors: { primary: '#9CAF88', secondary: '#F4C2C2', accent: '#D4A574' } 
  },
  { 
    id: 'dusty-rose', 
    name: 'Dusty Rose', 
    colors: { primary: '#D4A5A5', secondary: '#E8C5C5', accent: '#B8A5A5' } 
  },
  { 
    id: 'navy-gold', 
    name: 'Navy & Gold', 
    colors: { primary: '#1E3A5F', secondary: '#D4AF37', accent: '#2C5F8D' } 
  },
  { 
    id: 'lavender-sage', 
    name: 'Lavender & Sage', 
    colors: { primary: '#B8A5D1', secondary: '#9CAF88', accent: '#D1C4E9' } 
  },
  { 
    id: 'burgundy-ivory', 
    name: 'Burgundy & Ivory', 
    colors: { primary: '#800020', secondary: '#FFFFF0', accent: '#A0522D' } 
  },
  { 
    id: 'eucalyptus', 
    name: 'Eucalyptus Green', 
    colors: { primary: '#8B9A7A', secondary: '#B8C5A6', accent: '#6B7A5F' } 
  },
  { 
    id: 'terracotta', 
    name: 'Terracotta & Cream', 
    colors: { primary: '#C4715C', secondary: '#F5E6D3', accent: '#A55843' } 
  },
  { 
    id: 'mauve-taupe', 
    name: 'Mauve & Taupe', 
    colors: { primary: '#9F8189', secondary: '#B8A99A', accent: '#8B7E74' } 
  },
  { 
    id: 'forest-gold', 
    name: 'Forest & Gold', 
    colors: { primary: '#2C5530', secondary: '#D4AF37', accent: '#4A7C4E' } 
  },
  { 
    id: 'coral-mint', 
    name: 'Coral & Mint', 
    colors: { primary: '#FF7F7F', secondary: '#98D8C8', accent: '#FF6B6B' } 
  },
  { 
    id: 'midnight-rose', 
    name: 'Midnight & Rose', 
    colors: { primary: '#2C3E50', secondary: '#E8A5A5', accent: '#556B7A' } 
  },
  { 
    id: 'champagne', 
    name: 'Champagne Dreams', 
    colors: { primary: '#E8D5B7', secondary: '#F5E6D3', accent: '#C9A66B' } 
  }
]

interface SiteSettingsMenuProps {
  currentStyle: string
  currentColors: { primary: string; secondary: string; accent: string }
  onStyleChange: (style: string) => void
  onColorsChange: (colors: { primary: string; secondary: string; accent: string }) => void
  onCustomColorChange: (colorType: 'primary' | 'secondary' | 'accent', color: string) => void
}

export function SiteSettingsMenu({
  currentStyle,
  currentColors,
  onStyleChange,
  onColorsChange,
  onCustomColorChange
}: SiteSettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isCustomColorsOpen, setIsCustomColorsOpen] = useState(false)
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null)

  // Check if current colors match any palette and update selectedPaletteId
  useEffect(() => {
    const matchingPalette = COLOR_THEMES.find(theme => 
      theme.colors.primary.toLowerCase() === currentColors.primary.toLowerCase() &&
      theme.colors.secondary.toLowerCase() === currentColors.secondary.toLowerCase() &&
      theme.colors.accent.toLowerCase() === currentColors.accent.toLowerCase()
    )
    
    if (matchingPalette) {
      setSelectedPaletteId(matchingPalette.id)
    } else {
      setSelectedPaletteId(null)
    }
  }, [currentColors])

  const handleColorThemeChange = (themeId: string) => {
    const theme = COLOR_THEMES.find(t => t.id === themeId)
    if (theme) {
      onColorsChange(theme.colors)
      setSelectedPaletteId(themeId)
      setIsPaletteOpen(false)
    }
  }

  const selectedPalette = selectedPaletteId ? COLOR_THEMES.find(t => t.id === selectedPaletteId) : null

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 h-9 px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30 transition-all duration-300 hover:bg-white/30 hover:border-white/50 hover:shadow-lg hover:shadow-white/20 hover:scale-105 supports-[backdrop-filter]:bg-white/20 [@supports_not_(backdrop-filter)]:bg-white/90 [@supports_not_(backdrop-filter)]:text-gray-900 [@supports_not_(backdrop-filter)]:border-gray-300 [@supports_not_(backdrop-filter)]:hover:bg-white [@supports_not_(backdrop-filter)]:hover:shadow-md"
      >
        <Settings className="w-4 h-4 transition-transform duration-300 hover:rotate-90" />
        <span className="text-sm font-medium">Site Settings</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30 animate-in fade-in duration-200" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-40 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
              <Settings className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Site Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Style Selector */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layout className="w-4 h-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">Wedding Style</label>
                </div>
                <select
                  value={currentStyle}
                  onChange={(e) => onStyleChange(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {WEDDING_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {WEDDING_STYLES.find(s => s.id === currentStyle)?.description}
                </p>
              </div>

              {/* Color Theme Selector */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">Color Palettes</label>
                </div>
                <div className="relative">
                  {/* Custom Dropdown Button */}
                  <button
                    onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400 hover:shadow-sm"
                  >
                    {selectedPalette ? (
                      <div className="flex flex-col gap-2 w-full animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-700 text-left text-xs">{selectedPalette.name}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${isPaletteOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="flex gap-1 w-full">
                          <div 
                            className="flex-1 h-8 rounded"
                            style={{ backgroundColor: selectedPalette.colors.primary }}
                          />
                          <div 
                            className="flex-1 h-8 rounded"
                            style={{ backgroundColor: selectedPalette.colors.secondary }}
                          />
                          <div 
                            className="flex-1 h-8 rounded"
                            style={{ backgroundColor: selectedPalette.colors.accent }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-gray-500 text-xs">Choose Palette</span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${isPaletteOpen ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </button>
                  
                  {/* Dropdown Content */}
                  {isPaletteOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[45]" 
                        onClick={() => setIsPaletteOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[46] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {COLOR_THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => handleColorThemeChange(theme.id)}
                            className={`w-full flex flex-col gap-2 p-3 hover:bg-gray-50 transition-all duration-150 border-b border-gray-100 last:border-b-0 ${
                              selectedPaletteId === theme.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm text-gray-700">{theme.name}</span>
                              {selectedPaletteId === theme.id && (
                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1.5 w-full">
                              <div 
                                className="flex-1 h-10 rounded transition-transform hover:scale-105 duration-200"
                                style={{ backgroundColor: theme.colors.primary }}
                              />
                              <div 
                                className="flex-1 h-10 rounded transition-transform hover:scale-105 duration-200"
                                style={{ backgroundColor: theme.colors.secondary }}
                              />
                              <div 
                                className="flex-1 h-10 rounded transition-transform hover:scale-105 duration-200"
                                style={{ backgroundColor: theme.colors.accent }}
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Custom Colors - Collapsible */}
              <div>
                <button
                  onClick={() => setIsCustomColorsOpen(!isCustomColorsOpen)}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-3 hover:text-gray-900 transition-colors duration-150"
                >
                  <span>Custom Colors</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCustomColorsOpen ? 'rotate-180' : ''}`} />
                </button>
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isCustomColorsOpen 
                      ? 'grid-rows-[1fr] opacity-100' 
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-3 pb-1">
                      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200" style={{ animationDelay: '0ms' }}>
                        <label className="text-xs text-gray-600 w-16">Primary</label>
                        <input
                          type="color"
                          value={currentColors.primary}
                          onChange={(e) => {
                            onCustomColorChange('primary', e.target.value)
                            setSelectedPaletteId(null)
                          }}
                          className="w-10 h-8 rounded border border-gray-300 cursor-pointer transition-transform hover:scale-110 duration-200"
                        />
                        <input
                          type="text"
                          value={currentColors.primary}
                          onChange={(e) => {
                            onCustomColorChange('primary', e.target.value)
                            setSelectedPaletteId(null)
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
                          placeholder="#000000"
                        />
                      </div>
                      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200" style={{ animationDelay: '50ms' }}>
                        <label className="text-xs text-gray-600 w-16">Secondary</label>
                        <input
                          type="color"
                          value={currentColors.secondary}
                          onChange={(e) => {
                            onCustomColorChange('secondary', e.target.value)
                            setSelectedPaletteId(null)
                          }}
                          className="w-10 h-8 rounded border border-gray-300 cursor-pointer transition-transform hover:scale-110 duration-200"
                        />
                        <input
                          type="text"
                          value={currentColors.secondary}
                          onChange={(e) => {
                            onCustomColorChange('secondary', e.target.value)
                            setSelectedPaletteId(null)
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
                          placeholder="#000000"
                        />
                      </div>
                      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200" style={{ animationDelay: '100ms' }}>
                        <label className="text-xs text-gray-600 w-16">Accent</label>
                        <input
                          type="color"
                          value={currentColors.accent}
                          onChange={(e) => {
                            onCustomColorChange('accent', e.target.value)
                            setSelectedPaletteId(null)
                          }}
                          className="w-10 h-8 rounded border border-gray-300 cursor-pointer transition-transform hover:scale-110 duration-200"
                        />
                        <input
                          type="text"
                          value={currentColors.accent}
                          onChange={(e) => {
                            onCustomColorChange('accent', e.target.value)
                            setSelectedPaletteId(null)
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
"use client"

import React, { useState } from 'react'
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

// Color themes
const COLOR_THEMES = [
  { 
    id: 'rose-gold', 
    name: 'Rose Gold', 
    colors: { primary: '#E8A5A5', secondary: '#F4D1AE', accent: '#D4A574' } 
  },
  { 
    id: 'sage-green', 
    name: 'Sage Green', 
    colors: { primary: '#9CAF88', secondary: '#B8C5A6', accent: '#8B9A7A' } 
  },
  { 
    id: 'dusty-blue', 
    name: 'Dusty Blue', 
    colors: { primary: '#A8BFCE', secondary: '#C4D1D9', accent: '#8FA8B8' } 
  },
  { 
    id: 'lavender', 
    name: 'Lavender Dreams', 
    colors: { primary: '#B8A5D1', secondary: '#D1C4E9', accent: '#9C88C4' } 
  },
  { 
    id: 'burgundy', 
    name: 'Burgundy Gold', 
    colors: { primary: '#8B1538', secondary: '#B8860B', accent: '#CD853F' } 
  },
  { 
    id: 'navy-blush', 
    name: 'Navy & Blush', 
    colors: { primary: '#1F2937', secondary: '#F9A8D4', accent: '#EC4899' } 
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

  const handleColorThemeChange = (themeId: string) => {
    const theme = COLOR_THEMES.find(t => t.id === themeId)
    if (theme) {
      onColorsChange(theme.colors)
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="flex items-center gap-2 h-9 px-3 py-2"
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">Site Settings</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-40 p-6">
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
                  <label className="text-sm font-medium text-gray-700">Color Theme</label>
                </div>
                <select
                  onChange={(e) => handleColorThemeChange(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose Preset Theme</option>
                  {COLOR_THEMES.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Custom Colors
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-gray-600 w-16">Primary</label>
                    <input
                      type="color"
                      value={currentColors.primary}
                      onChange={(e) => onCustomColorChange('primary', e.target.value)}
                      className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentColors.primary}
                      onChange={(e) => onCustomColorChange('primary', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="#000000"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-gray-600 w-16">Secondary</label>
                    <input
                      type="color"
                      value={currentColors.secondary}
                      onChange={(e) => onCustomColorChange('secondary', e.target.value)}
                      className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentColors.secondary}
                      onChange={(e) => onCustomColorChange('secondary', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="#000000"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-gray-600 w-16">Accent</label>
                    <input
                      type="color"
                      value={currentColors.accent}
                      onChange={(e) => onCustomColorChange('accent', e.target.value)}
                      className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentColors.accent}
                      onChange={(e) => onCustomColorChange('accent', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="#000000"
                    />
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
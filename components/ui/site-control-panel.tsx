"use client"

import React from 'react'
import { ChevronDown } from 'lucide-react'

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

// Available components
// All possible components available for any wedding style - only hero is essential
const ALL_AVAILABLE_COMPONENTS = [
  { id: 'hero', name: 'Hero Section', essential: true },
  { id: 'our-story', name: 'Our Story', essential: false },
  { id: 'countdown', name: 'Countdown Timer', essential: false },
  { id: 'event-details', name: 'Event Details', essential: false },
  { id: 'gallery', name: 'Photo Gallery', essential: false },
  { id: 'rsvp', name: 'RSVP', essential: false },
  { id: 'faq', name: 'FAQ', essential: false }
]

// Helper function to get available components (now returns all components for any style)
function getAvailableComponents(style: string) {
  return ALL_AVAILABLE_COMPONENTS
}

interface SiteControlPanelProps {
  currentStyle: string
  currentColors: { primary: string; secondary: string; accent: string }
  enabledComponents: string[]
  onStyleChange: (style: string) => void
  onColorsChange: (colors: { primary: string; secondary: string; accent: string }) => void
  onComponentToggle: (componentId: string, enabled: boolean) => void
  onCustomColorChange: (colorType: 'primary' | 'secondary' | 'accent' | 'envelope', color: string) => void
}

export function SiteControlPanel({
  currentStyle,
  currentColors,
  enabledComponents,
  onStyleChange,
  onColorsChange,
  onComponentToggle,
  onCustomColorChange
}: SiteControlPanelProps) {
  const handleColorThemeChange = (themeId: string) => {
    const theme = COLOR_THEMES.find(t => t.id === themeId)
    if (theme) {
      onColorsChange(theme.colors)
    }
  }

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Site Editor Label */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-900">Site Editor</span>
          </div>

          {/* Style Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Style:</label>
            <div className="relative">
              <select
                value={currentStyle}
                onChange={(e) => onStyleChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              >
                {WEDDING_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Color Theme Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Colors:</label>
            <div className="relative">
              <select
                onChange={(e) => handleColorThemeChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              >
                <option value="">Choose Theme</option>
                {COLOR_THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Custom Color Inputs */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Custom:</span>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={currentColors.primary}
                onChange={(e) => onCustomColorChange('primary', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title="Primary Color"
              />
              <input
                type="color"
                value={currentColors.secondary}
                onChange={(e) => onCustomColorChange('secondary', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title="Secondary Color"
              />
              <input
                type="color"
                value={currentColors.accent}
                onChange={(e) => onCustomColorChange('accent', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title="Accent Color"
              />
            </div>
          </div>

          {/* Components Toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Components:</label>
            <div className="flex flex-wrap gap-2">
              {getAvailableComponents(currentStyle).map((component) => (
                <button
                  key={component.id}
                  onClick={() => onComponentToggle(component.id, !enabledComponents.includes(component.id))}
                  disabled={component.essential}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                    enabledComponents.includes(component.id)
                      ? 'bg-gray-100 border-gray-400 text-gray-800'
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  } ${
                    component.essential
                      ? 'opacity-75 cursor-not-allowed'
                      : 'hover:bg-gray-100 cursor-pointer'
                  }`}
                  title={component.essential ? 'Essential component' : 'Click to toggle'}
                >
                  {component.name}
                  {component.essential && ' *'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
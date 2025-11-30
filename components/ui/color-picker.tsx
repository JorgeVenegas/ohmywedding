"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  presetColors?: string[]
}

// Color categories for weddings
const COLOR_CATEGORIES = {
  'Pastels': {
    description: 'Soft & dreamy',
    colors: [
      { hex: '#fce4ec', name: 'Blush' },
      { hex: '#f3e5f5', name: 'Lavender Mist' },
      { hex: '#e8eaf6', name: 'Periwinkle' },
      { hex: '#e3f2fd', name: 'Baby Blue' },
      { hex: '#e0f7fa', name: 'Seafoam' },
      { hex: '#e8f5e9', name: 'Mint' },
      { hex: '#fff8e1', name: 'Cream' },
      { hex: '#fce4d6', name: 'Peach' },
    ]
  },
  'Romantic': {
    description: 'Love & elegance',
    colors: [
      { hex: '#d4a5a5', name: 'Dusty Rose' },
      { hex: '#e6b5a3', name: 'Blush Pink' },
      { hex: '#c9a0a0', name: 'Mauve' },
      { hex: '#b8a9c9', name: 'Wisteria' },
      { hex: '#dba8a1', name: 'Rose Quartz' },
      { hex: '#e8c4c4', name: 'Ballet Slipper' },
      { hex: '#d4b5b5', name: 'Champagne Rose' },
      { hex: '#c4a4a4', name: 'Antique Rose' },
    ]
  },
  'Earthy': {
    description: 'Natural & organic',
    colors: [
      { hex: '#9ba082', name: 'Sage' },
      { hex: '#a3b18a', name: 'Olive' },
      { hex: '#8b7355', name: 'Terracotta' },
      { hex: '#c4956a', name: 'Caramel' },
      { hex: '#a67c52', name: 'Sienna' },
      { hex: '#7d8b6a', name: 'Eucalyptus' },
      { hex: '#b5a489', name: 'Sand' },
      { hex: '#8b9d77', name: 'Moss' },
    ]
  },
  'Golden': {
    description: 'Warm & luxurious',
    colors: [
      { hex: '#d4a574', name: 'Gold' },
      { hex: '#c9a87c', name: 'Champagne' },
      { hex: '#e6c88c', name: 'Honey' },
      { hex: '#d4af37', name: 'Metallic Gold' },
      { hex: '#b8956f', name: 'Bronze' },
      { hex: '#c9b99a', name: 'Wheat' },
      { hex: '#daa520', name: 'Goldenrod' },
      { hex: '#f0d58c', name: 'Buttercup' },
    ]
  },
  'Vivid': {
    description: 'Bold & vibrant',
    colors: [
      { hex: '#e74c3c', name: 'Coral Red' },
      { hex: '#9b59b6', name: 'Amethyst' },
      { hex: '#3498db', name: 'Ocean Blue' },
      { hex: '#1abc9c', name: 'Teal' },
      { hex: '#f39c12', name: 'Sunflower' },
      { hex: '#e91e63', name: 'Fuchsia' },
      { hex: '#00bcd4', name: 'Turquoise' },
      { hex: '#ff7043', name: 'Tangerine' },
    ]
  },
  'Dusty': {
    description: 'Muted & vintage',
    colors: [
      { hex: '#87a7b3', name: 'Dusty Blue' },
      { hex: '#9d8bb8', name: 'Dusty Lavender' },
      { hex: '#a3c4d1', name: 'Powder Blue' },
      { hex: '#c4b7d4', name: 'Thistle' },
      { hex: '#6b9aad', name: 'Steel Blue' },
      { hex: '#a8b5a0', name: 'Dusty Sage' },
      { hex: '#c9b8a8', name: 'Dusty Taupe' },
      { hex: '#b8a8a8', name: 'Dusty Mauve' },
    ]
  },
  'Classic': {
    description: 'Timeless & elegant',
    colors: [
      { hex: '#1a1a2e', name: 'Midnight' },
      { hex: '#2c2c2c', name: 'Charcoal' },
      { hex: '#4a4a4a', name: 'Slate' },
      { hex: '#f5f5f5', name: 'Ivory' },
      { hex: '#fdfbf7', name: 'Cream White' },
      { hex: '#800020', name: 'Burgundy' },
      { hex: '#000080', name: 'Navy' },
      { hex: '#2f4f4f', name: 'Dark Slate' },
    ]
  },
  'Jewel Tones': {
    description: 'Rich & regal',
    colors: [
      { hex: '#722f37', name: 'Wine' },
      { hex: '#1e5631', name: 'Emerald' },
      { hex: '#1b4965', name: 'Sapphire' },
      { hex: '#5b2c6f', name: 'Royal Purple' },
      { hex: '#b7410e', name: 'Ruby' },
      { hex: '#1c7947', name: 'Jade' },
      { hex: '#3d5a80', name: 'Prussian Blue' },
      { hex: '#6b3a5b', name: 'Plum' },
    ]
  },
}

export function ColorPicker({ 
  label, 
  value, 
  onChange, 
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [customColor, setCustomColor] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update custom color when value changes externally
  useEffect(() => {
    setCustomColor(value)
  }, [value])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveCategory(null)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Get contrasting text color
  const getContrastColor = (hex: string) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance > 0.5 ? '#000000' : '#ffffff'
    } catch {
      return '#000000'
    }
  }

  // Find color name if it's a preset
  const findColorName = (hex: string): string | null => {
    for (const category of Object.values(COLOR_CATEGORIES)) {
      const found = category.colors.find(c => c.hex.toLowerCase() === hex.toLowerCase())
      if (found) return found.name
    }
    return null
  }

  const colorName = findColorName(value)

  const handleColorSelect = (color: string) => {
    onChange(color)
    setCustomColor(color)
  }

  const handleCustomColorChange = (hex: string) => {
    let formatted = hex.startsWith('#') ? hex : `#${hex}`
    if (/^#[0-9A-Fa-f]{0,6}$/.test(formatted)) {
      setCustomColor(formatted)
      if (/^#[0-9A-Fa-f]{6}$/.test(formatted)) {
        onChange(formatted)
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
      
      {/* Color Button - Aesthetic Preview */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full group"
      >
        <div 
          className="relative h-16 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
          style={{ 
            backgroundColor: value,
            boxShadow: `0 4px 20px ${value}30`
          }}
        >
          {/* Gradient overlay for depth */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, transparent 0%, ${value}40 100%)`
            }}
          />
          
          {/* Color info */}
          <div 
            className="absolute inset-0 flex items-center justify-between px-4"
            style={{ color: getContrastColor(value) }}
          >
            <div className="text-left">
              <div className="text-sm font-medium opacity-90">
                {colorName || 'Custom'}
              </div>
              <div className="text-xs opacity-60 font-mono uppercase">
                {value}
              </div>
            </div>
            <ChevronDown 
              className={`w-5 h-5 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Category Tabs */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(COLOR_CATEGORIES).map(([name, category]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === name ? null : name)}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200
                    ${activeCategory === name 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Grid */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {activeCategory ? (
              // Single category view
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">{activeCategory}</h4>
                    <p className="text-xs text-gray-500">{COLOR_CATEGORIES[activeCategory as keyof typeof COLOR_CATEGORIES].description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_CATEGORIES[activeCategory as keyof typeof COLOR_CATEGORIES].colors.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => {
                        handleColorSelect(color.hex)
                        setIsOpen(false)
                        setActiveCategory(null)
                      }}
                      className="group relative"
                    >
                      <div
                        className={`
                          aspect-square rounded-xl transition-all duration-200 
                          group-hover:scale-105 group-hover:shadow-lg
                          ${value.toLowerCase() === color.hex.toLowerCase() ? 'ring-2 ring-offset-2 ring-gray-900' : ''}
                        `}
                        style={{ 
                          backgroundColor: color.hex,
                          boxShadow: `0 2px 8px ${color.hex}40`
                        }}
                      >
                        {value.toLowerCase() === color.hex.toLowerCase() && (
                          <Check 
                            className="absolute inset-0 m-auto w-5 h-5" 
                            style={{ color: getContrastColor(color.hex) }}
                          />
                        )}
                      </div>
                      <span className="block mt-1.5 text-[10px] text-gray-600 truncate text-center">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // All categories overview
              <div className="space-y-4">
                {Object.entries(COLOR_CATEGORIES).map(([name, category]) => (
                  <div key={name}>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(name)}
                      className="w-full flex items-center justify-between mb-2 group"
                    >
                      <div className="text-left">
                        <h4 className="text-xs font-semibold text-gray-700 group-hover:text-gray-900">{name}</h4>
                        <p className="text-[10px] text-gray-400">{category.description}</p>
                      </div>
                      <ChevronDown className="w-3 h-3 text-gray-400 -rotate-90 group-hover:text-gray-600" />
                    </button>
                    <div className="flex gap-1.5">
                      {category.colors.slice(0, 8).map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => {
                            handleColorSelect(color.hex)
                            setIsOpen(false)
                          }}
                          className={`
                            relative w-7 h-7 rounded-lg transition-all duration-200 
                            hover:scale-110 hover:shadow-md flex-shrink-0
                            ${value.toLowerCase() === color.hex.toLowerCase() ? 'ring-2 ring-offset-1 ring-gray-900' : ''}
                          `}
                          style={{ 
                            backgroundColor: color.hex,
                          }}
                          title={color.name}
                        >
                          {value.toLowerCase() === color.hex.toLowerCase() && (
                            <Check 
                              className="absolute inset-0 m-auto w-3 h-3" 
                              style={{ color: getContrastColor(color.hex) }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Color Input */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex-shrink-0 shadow-inner"
                style={{ backgroundColor: customColor }}
              />
              <div className="flex-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Custom Color
                </label>
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-full px-0 py-1 text-sm font-mono border-0 border-b border-gray-200 bg-transparent focus:ring-0 focus:border-gray-400 uppercase"
                  placeholder="#000000"
                  maxLength={7}
                />
              </div>
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 overflow-hidden"
                title="Open color picker"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

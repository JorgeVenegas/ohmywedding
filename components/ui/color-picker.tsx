"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Pipette, Check } from 'lucide-react'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  presetColors?: string[]
}

// Beautiful preset colors for weddings
const DEFAULT_PRESETS = [
  '#d4a574', '#c9a87c', '#b8956f', // Warm golds
  '#9ba082', '#7d8b6a', '#a3b18a', // Sage greens
  '#e6b5a3', '#dba8a1', '#c9a0a0', // Blush pinks
  '#8b7355', '#a67c52', '#c4956a', // Warm browns
  '#b8a9c9', '#9d8bb8', '#c4b7d4', // Soft lavenders
  '#87a7b3', '#6b9aad', '#a3c4d1', // Dusty blues
  '#d4c4b0', '#c9b99a', '#e0d5c5', // Cream/ivory
  '#2c2c2c', '#4a4a4a', '#6b6b6b', // Elegant darks
]

export function ColorPicker({ 
  label, 
  value, 
  onChange, 
  presetColors = DEFAULT_PRESETS 
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempColor, setTempColor] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update temp color when value changes externally
  useEffect(() => {
    setTempColor(value)
  }, [value])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleColorChange = (color: string) => {
    setTempColor(color)
    onChange(color)
  }

  const handleHexInput = (hex: string) => {
    // Validate and format hex
    let formatted = hex.startsWith('#') ? hex : `#${hex}`
    if (/^#[0-9A-Fa-f]{0,6}$/.test(formatted)) {
      setTempColor(formatted)
      if (/^#[0-9A-Fa-f]{6}$/.test(formatted)) {
        onChange(formatted)
      }
    }
  }

  // Get contrasting text color
  const getContrastColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
      
      {/* Color Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 bg-white hover:shadow-sm group"
      >
        {/* Color Preview */}
        <div 
          className="w-10 h-10 rounded-lg shadow-inner flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ backgroundColor: value }}
        >
          <div 
            className="w-3 h-3 rounded-full opacity-30"
            style={{ backgroundColor: getContrastColor(value) }}
          />
        </div>
        
        {/* Color Info */}
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            {value}
          </div>
          <div className="text-xs text-gray-400">Click to change</div>
        </div>
        
        <Pipette className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Color Wheel Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="color"
                value={tempColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="w-full h-20 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${tempColor} 0%, ${tempColor}dd 100%)`,
                  boxShadow: `0 4px 20px ${tempColor}40`
                }}
              >
                <span 
                  className="text-sm font-medium opacity-80"
                  style={{ color: getContrastColor(tempColor) }}
                >
                  Click to open color picker
                </span>
              </div>
            </div>
          </div>

          {/* Hex Input */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex-shrink-0"
                style={{ backgroundColor: tempColor }}
              />
              <input
                type="text"
                value={tempColor}
                onChange={(e) => handleHexInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                placeholder="#000000"
                maxLength={7}
              />
            </div>
          </div>

          {/* Preset Colors */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Wedding Colors</div>
            <div className="grid grid-cols-8 gap-1.5">
              {presetColors.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  type="button"
                  onClick={() => {
                    handleColorChange(color)
                    setIsOpen(false)
                  }}
                  className="relative w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{ 
                    backgroundColor: color,
                    boxShadow: value.toLowerCase() === color.toLowerCase() ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined
                  }}
                  title={color}
                >
                  {value.toLowerCase() === color.toLowerCase() && (
                    <Check 
                      className="absolute inset-0 m-auto w-4 h-4" 
                      style={{ color: getContrastColor(color) }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Done Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

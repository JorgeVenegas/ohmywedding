"use client"

import React, { useState, useEffect } from 'react'
import { Settings, ChevronDown, Palette, Type } from 'lucide-react'
import { Button } from './button'
import { FONT_PAIRINGS, FONT_PAIRING_CATEGORIES, COLOR_THEMES, COLOR_THEME_CATEGORIES, AVAILABLE_FONTS } from '@/lib/theme-config'

// Helper to create a light tint of a color
function getLightTint(hex: string, tintAmount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const newR = Math.round(r + (255 - r) * tintAmount)
  const newG = Math.round(g + (255 - g) * tintAmount)
  const newB = Math.round(b + (255 - b) * tintAmount)
  return `rgb(${newR}, ${newG}, ${newB})`
}

interface SiteSettingsMenuProps {
  currentFonts?: { display?: string; heading?: string; body?: string }
  currentColors: { primary: string; secondary: string; accent: string }
  onFontsChange: (fonts: { display: string; heading: string; body: string; displayFamily: string; headingFamily: string; bodyFamily: string; googleFonts: string }) => void
  onColorsChange: (colors: { primary: string; secondary: string; accent: string }) => void
  onCustomColorChange: (colorType: 'primary' | 'secondary' | 'accent', color: string) => void
  onCustomFontChange?: (fontType: 'display' | 'heading' | 'body', font: string, fontFamily: string) => void
}

export function SiteSettingsMenu({
  currentFonts = { display: 'Playfair Display', heading: 'Cormorant Garamond', body: 'Lato' },
  currentColors,
  onFontsChange,
  onColorsChange,
  onCustomColorChange,
  onCustomFontChange
}: SiteSettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isFontsOpen, setIsFontsOpen] = useState(false)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isCustomColorsOpen, setIsCustomColorsOpen] = useState(false)
  const [isCustomFontsOpen, setIsCustomFontsOpen] = useState(false)
  const [isDisplayFontOpen, setIsDisplayFontOpen] = useState(false)
  const [isHeadingFontOpen, setIsHeadingFontOpen] = useState(false)
  const [isBodyFontOpen, setIsBodyFontOpen] = useState(false)
  const [selectedFontPairingId, setSelectedFontPairingId] = useState<string | null>(null)
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null)
  const [isCustomFontsAnimating, setIsCustomFontsAnimating] = useState(false)
  const [isCustomColorsAnimating, setIsCustomColorsAnimating] = useState(false)
  
  // Category filter state
  const [fontPairingCategoryFilter, setFontPairingCategoryFilter] = useState<string | null>(null)
  const [customFontCategoryFilter, setCustomFontCategoryFilter] = useState<string | null>(null)
  const [colorPaletteCategoryFilter, setColorPaletteCategoryFilter] = useState<string | null>(null)
  
  // Ensure fonts have default values
  const displayFont = currentFonts.display || 'Playfair Display'
  const headingFont = currentFonts.heading || 'Cormorant Garamond'
  const bodyFont = currentFonts.body || 'Lato'
  
  // Use current theme primary color for UI accents
  const primaryColor = currentColors.primary || '#d4a574'
  
  // Check if current fonts match any pairing
  useEffect(() => {
    const matchingFonts = FONT_PAIRINGS.find(pairing =>
      pairing.display === displayFont &&
      pairing.heading === headingFont &&
      pairing.body === bodyFont
    )
    
    if (matchingFonts) {
      setSelectedFontPairingId(matchingFonts.id)
    } else {
      setSelectedFontPairingId(null)
    }
  }, [displayFont, headingFont, bodyFont])

  const handleFontPairingChange = (pairingId: string) => {
    const pairing = FONT_PAIRINGS.find(p => p.id === pairingId)
    if (pairing) {
      onFontsChange({
        display: pairing.display,
        heading: pairing.heading,
        body: pairing.body,
        displayFamily: pairing.displayFamily,
        headingFamily: pairing.headingFamily,
        bodyFamily: pairing.bodyFamily,
        googleFonts: pairing.googleFonts
      })
      setSelectedFontPairingId(pairingId)
      setIsFontsOpen(false)
    }
  }
  
  const selectedFontPairing = selectedFontPairingId ? FONT_PAIRINGS.find(p => p.id === selectedFontPairingId) : null

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

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 200)
  }

  return (
    <div className="relative">
      <Button
        onClick={() => {
          if (isOpen) {
            handleClose()
          } else {
            setIsOpen(true)
          }
        }}
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
            className={`fixed inset-0 z-30 ${isClosing ? 'animate-out fade-out duration-200' : 'animate-in fade-in duration-200'}`}
            onClick={handleClose}
          />
          
          {/* Dropdown Menu */}
          <div 
            className={`absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-40 p-6 transition-all duration-200 ${
              isClosing 
                ? 'animate-out fade-out slide-out-to-top-4' 
                : 'animate-in fade-in slide-in-from-top-4'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
              <Settings className="w-5 h-5" style={{ color: primaryColor }} />
              <h3 className="font-semibold text-gray-900">Site Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Font Pairing Selector */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">Font Pairing</label>
                </div>
                <div className="relative">
                  {/* Custom Dropdown Button */}
                  <button
                    onClick={() => setIsFontsOpen(!isFontsOpen)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-150 hover:border-gray-400 hover:shadow-sm"
                  >
                    {selectedFontPairing ? (
                      <div className="flex flex-col gap-2 w-full animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-700 text-left text-xs">{selectedFontPairing.name}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${isFontsOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="flex flex-col gap-1 w-full text-left">
                          <div className="text-xl" style={{ fontFamily: selectedFontPairing.displayFamily }}>
                            {selectedFontPairing.display}
                          </div>
                          <div className="text-sm" style={{ fontFamily: selectedFontPairing.headingFamily }}>
                            {selectedFontPairing.heading}
                          </div>
                          <div className="text-xs text-gray-500" style={{ fontFamily: selectedFontPairing.bodyFamily }}>
                            {selectedFontPairing.body}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-gray-500 text-xs">Choose Font Pairing</span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${isFontsOpen ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </button>
                  
                  {/* Dropdown Content */}
                  {isFontsOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[52]" 
                        onClick={() => setIsFontsOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[53] max-h-80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                        {/* Category filter tabs */}
                        <div className="flex gap-1.5 p-2.5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-x-auto">
                          <button
                            onClick={() => setFontPairingCategoryFilter(null)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                              fontPairingCategoryFilter === null ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            All
                          </button>
                          {FONT_PAIRING_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setFontPairingCategoryFilter(cat.id)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                fontPairingCategoryFilter === cat.id ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {FONT_PAIRING_CATEGORIES
                            .filter(category => fontPairingCategoryFilter === null || category.id === fontPairingCategoryFilter)
                            .map((category) => (
                            <div key={category.id} className="border-b border-gray-100 last:border-b-0">
                              <div className="px-3 py-2 bg-gray-50/80 sticky top-0">
                                <h4 className="text-xs font-semibold text-gray-700">{category.name}</h4>
                                <p className="text-[10px] text-gray-500">{category.description}</p>
                              </div>
                              <div className="p-2 space-y-1">
                                {category.pairings.map((pairing) => (
                                  <button
                                    key={pairing.id}
                                    onClick={() => handleFontPairingChange(pairing.id)}
                                    className={`w-full flex flex-col gap-1.5 p-2.5 rounded-lg transition-all duration-150 hover:bg-gray-50 ${
                                      selectedFontPairingId === pairing.id ? 'bg-gray-100 ring-2 ring-gray-500' : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="text-xs font-medium text-gray-700">{pairing.name}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 w-full text-left">
                                      <div className="text-base truncate transition-transform hover:scale-105 duration-200" style={{ fontFamily: pairing.displayFamily }}>{pairing.display}</div>
                                      <div className="text-xs text-gray-600" style={{ fontFamily: pairing.headingFamily }}>{pairing.heading} / <span style={{ fontFamily: pairing.bodyFamily }}>{pairing.body}</span></div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Custom Fonts Section */}
              {onCustomFontChange && (
                <div>
                  <button
                    onClick={() => {
                      setIsCustomFontsOpen(!isCustomFontsOpen)
                      setIsCustomFontsAnimating(true)
                      setTimeout(() => setIsCustomFontsAnimating(false), 300)
                    }}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-3 hover:text-gray-900 transition-colors duration-150"
                  >
                    <span>Custom Fonts</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCustomFontsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div 
                    className={`grid transition-all duration-300 ${
                      isCustomFontsOpen 
                        ? 'grid-rows-[1fr] opacity-100' 
                        : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className={isCustomFontsOpen && !isCustomFontsAnimating ? '' : 'overflow-hidden'}>
                      <div className="space-y-3 pb-1 relative">
                        {/* Display Font Selector */}
                        <div className="flex flex-col gap-2" style={{ animationDelay: '0ms' }}>
                          <label className="text-xs text-gray-600">Display (Wedding Names, Section Titles)</label>
                          <div className="relative z-[49]">
                            <button
                              onClick={() => {
                                setIsDisplayFontOpen(!isDisplayFontOpen)
                                setIsHeadingFontOpen(false)
                                setIsBodyFontOpen(false)
                              }}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-150 hover:border-gray-400"
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate" style={{ fontFamily: AVAILABLE_FONTS.find(f => f.name === displayFont)?.family || 'inherit' }}>
                                  {displayFont}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ml-2 ${isDisplayFontOpen ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            {/* Dropdown for Display Font */}
                            {isDisplayFontOpen && (
                              <>
                                <div className="fixed inset-0 z-[50]" onClick={() => setIsDisplayFontOpen(false)} />
                                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-[51] max-h-60 overflow-hidden flex flex-col">
                                  {/* Category filter tabs */}
                                  <div className="flex gap-1.5 p-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-x-auto">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(null) }}
                                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                        customFontCategoryFilter === null ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                      }`}
                                    >
                                      All
                                    </button>
                                    {['Display', 'Calligraphic', 'Serif', 'Sans-Serif'].map((cat) => (
                                      <button
                                        key={cat}
                                        onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(cat) }}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                          customFontCategoryFilter === cat ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="overflow-y-auto flex-1">
                                    {['Display', 'Calligraphic', 'Serif', 'Sans-Serif']
                                      .filter(category => customFontCategoryFilter === null || category === customFontCategoryFilter)
                                      .map((category) => {
                                      const fontsInCategory = AVAILABLE_FONTS.filter(f => f.category === category)
                                      if (fontsInCategory.length === 0) return null
                                      return (
                                        <div key={category} className="border-b border-gray-100 last:border-b-0">
                                          <div className="px-3 py-1.5 bg-gray-50/80 sticky top-0">
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{category}</span>
                                          </div>
                                          {fontsInCategory.map((font) => (
                                            <button
                                              key={font.name}
                                              onClick={() => {
                                                if (onCustomFontChange) {
                                                  onCustomFontChange('display', font.name, font.family)
                                                }
                                                setSelectedFontPairingId(null)
                                                setIsDisplayFontOpen(false)
                                              }}
                                              className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                                                displayFont === font.name ? 'bg-gray-100' : ''
                                              }`}
                                              style={{ fontFamily: font.family }}
                                            >
                                              {font.name}
                                            </button>
                                          ))}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Heading Font Selector */}
                        <div className="flex flex-col gap-2" style={{ animationDelay: '50ms' }}>
                          <label className="text-xs text-gray-600">Heading (Subsection Headings)</label>
                          <div className="relative z-[48]">
                            <button
                              onClick={() => {
                                setIsHeadingFontOpen(!isHeadingFontOpen)
                                setIsDisplayFontOpen(false)
                                setIsBodyFontOpen(false)
                              }}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-150 hover:border-gray-400"
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate" style={{ fontFamily: AVAILABLE_FONTS.find(f => f.name === headingFont)?.family || 'inherit' }}>
                                  {headingFont}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ml-2 ${isHeadingFontOpen ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            {/* Dropdown for Heading Font */}
                            {isHeadingFontOpen && (
                              <>
                                <div className="fixed inset-0 z-[50]" onClick={() => setIsHeadingFontOpen(false)} />
                                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-[51] max-h-60 overflow-hidden flex flex-col">
                                  {/* Category filter tabs */}
                                  <div className="flex gap-1.5 p-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-x-auto">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(null) }}
                                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                        customFontCategoryFilter === null ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                      }`}
                                    >
                                      All
                                    </button>
                                    {['Display', 'Calligraphic', 'Serif', 'Sans-Serif'].map((cat) => (
                                      <button
                                        key={cat}
                                        onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(cat) }}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                          customFontCategoryFilter === cat ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="overflow-y-auto flex-1">
                                    {['Display', 'Calligraphic', 'Serif', 'Sans-Serif']
                                      .filter(category => customFontCategoryFilter === null || category === customFontCategoryFilter)
                                      .map((category) => {
                                      const fontsInCategory = AVAILABLE_FONTS.filter(f => f.category === category)
                                      if (fontsInCategory.length === 0) return null
                                      return (
                                        <div key={category} className="border-b border-gray-100 last:border-b-0">
                                          <div className="px-3 py-1.5 bg-gray-50/80 sticky top-0">
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{category}</span>
                                          </div>
                                          {fontsInCategory.map((font) => (
                                            <button
                                              key={font.name}
                                              onClick={() => {
                                                if (onCustomFontChange) {
                                                  onCustomFontChange('heading', font.name, font.family)
                                                }
                                                setSelectedFontPairingId(null)
                                                setIsHeadingFontOpen(false)
                                              }}
                                              className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                                                headingFont === font.name ? 'bg-gray-100' : ''
                                              }`}
                                              style={{ fontFamily: font.family }}
                                            >
                                              {font.name}
                                            </button>
                                          ))}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Body Font Selector */}
                        <div className="flex flex-col gap-2" style={{ animationDelay: '100ms' }}>
                          <label className="text-xs text-gray-600">Body (Content Text)</label>
                          <div className="relative z-[47]">
                            <button
                              onClick={() => {
                                setIsBodyFontOpen(!isBodyFontOpen)
                                setIsDisplayFontOpen(false)
                                setIsHeadingFontOpen(false)
                              }}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-150 hover:border-gray-400"
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate" style={{ fontFamily: AVAILABLE_FONTS.find(f => f.name === bodyFont)?.family || 'inherit' }}>
                                  {bodyFont}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ml-2 ${isBodyFontOpen ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            {/* Dropdown for Body Font */}
                            {isBodyFontOpen && (
                              <>
                                <div className="fixed inset-0 z-[50]" onClick={() => setIsBodyFontOpen(false)} />
                                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-[51] max-h-60 overflow-hidden flex flex-col">
                                  {/* Category filter tabs */}
                                  <div className="flex gap-1.5 p-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-x-auto">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(null) }}
                                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                        customFontCategoryFilter === null ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                      }`}
                                    >
                                      All
                                    </button>
                                    {['Display', 'Calligraphic', 'Serif', 'Sans-Serif'].map((cat) => (
                                      <button
                                        key={cat}
                                        onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(cat) }}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                          customFontCategoryFilter === cat ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="overflow-y-auto flex-1">
                                    {['Display', 'Calligraphic', 'Serif', 'Sans-Serif']
                                      .filter(category => customFontCategoryFilter === null || category === customFontCategoryFilter)
                                      .map((category) => {
                                      const fontsInCategory = AVAILABLE_FONTS.filter(f => f.category === category)
                                      if (fontsInCategory.length === 0) return null
                                      return (
                                        <div key={category} className="border-b border-gray-100 last:border-b-0">
                                          <div className="px-3 py-1.5 bg-gray-50/80 sticky top-0">
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{category}</span>
                                          </div>
                                          {fontsInCategory.map((font) => (
                                            <button
                                              key={font.name}
                                              onClick={() => {
                                                if (onCustomFontChange) {
                                                  onCustomFontChange('body', font.name, font.family)
                                                }
                                                setSelectedFontPairingId(null)
                                                setIsBodyFontOpen(false)
                                              }}
                                              className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                                                bodyFont === font.name ? 'bg-gray-100' : ''
                                              }`}
                                              style={{ fontFamily: font.family }}
                                            >
                                              {font.name}
                                            </button>
                                          ))}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-150 hover:border-gray-400 hover:shadow-sm"
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
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[46] max-h-80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                        {/* Category filter tabs */}
                        <div className="flex gap-1.5 p-2.5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-x-auto">
                          <button
                            onClick={() => setColorPaletteCategoryFilter(null)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                              colorPaletteCategoryFilter === null ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            All
                          </button>
                          {COLOR_THEME_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setColorPaletteCategoryFilter(cat.id)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                colorPaletteCategoryFilter === cat.id ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {COLOR_THEME_CATEGORIES
                            .filter(category => colorPaletteCategoryFilter === null || category.id === colorPaletteCategoryFilter)
                            .map((category) => (
                            <div key={category.id} className="border-b border-gray-100 last:border-b-0">
                              <div className="px-3 py-2 bg-gray-50/80 sticky top-0">
                                <h4 className="text-xs font-semibold text-gray-700">{category.name}</h4>
                                <p className="text-[10px] text-gray-500">{category.description}</p>
                              </div>
                              <div className="p-2 grid grid-cols-2 gap-2">
                                {category.themes.map((theme) => (
                                  <button
                                    key={theme.id}
                                    onClick={() => handleColorThemeChange(theme.id)}
                                    className={`flex flex-col gap-1.5 p-2 rounded-lg transition-all duration-150 hover:bg-gray-50 ${
                                      selectedPaletteId === theme.id ? 'bg-gray-100 ring-2 ring-gray-500' : ''
                                    }`}
                                  >
                                    <div className="flex gap-1 w-full">
                                      <div className="flex-1 h-8 rounded-md shadow-sm transition-transform hover:scale-105 duration-200" style={{ backgroundColor: theme.colors.primary }} />
                                      <div className="flex-1 h-8 rounded-md shadow-sm transition-transform hover:scale-105 duration-200" style={{ backgroundColor: theme.colors.secondary }} />
                                      <div className="flex-1 h-8 rounded-md shadow-sm transition-transform hover:scale-105 duration-200" style={{ backgroundColor: theme.colors.accent }} />
                                    </div>
                                    <span className="text-[10px] text-gray-600 truncate w-full text-center">{theme.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Custom Colors - Collapsible */}
              <div>
                <button
                  onClick={() => {
                    setIsCustomColorsOpen(!isCustomColorsOpen)
                    setIsCustomColorsAnimating(true)
                    setTimeout(() => setIsCustomColorsAnimating(false), 300)
                  }}
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
                  <div className={isCustomColorsOpen && !isCustomColorsAnimating ? '' : 'overflow-hidden'}>
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
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-150"
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
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-150"
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
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-150"
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
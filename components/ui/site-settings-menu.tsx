"use client"

import React, { useState, useEffect } from 'react'
import { Settings, ChevronDown, Palette, Type } from 'lucide-react'
import { Button } from './button'
import { FONT_PAIRINGS, COLOR_THEMES, AVAILABLE_FONTS } from '@/lib/theme-config'

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
  
  // Ensure fonts have default values
  const displayFont = currentFonts.display || 'Playfair Display'
  const headingFont = currentFonts.heading || 'Cormorant Garamond'
  const bodyFont = currentFonts.body || 'Lato'
  
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
              <Settings className="w-5 h-5 text-blue-600" />
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
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400 hover:shadow-sm"
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
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[53] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {FONT_PAIRINGS.map((pairing) => (
                          <button
                            key={pairing.id}
                            onClick={() => handleFontPairingChange(pairing.id)}
                            className={`w-full flex flex-col gap-2 p-3 hover:bg-gray-50 transition-all duration-150 border-b border-gray-100 last:border-b-0 ${
                              selectedFontPairingId === pairing.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm text-gray-700">{pairing.name}</span>
                              {selectedFontPairingId === pairing.id && (
                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 w-full text-left">
                              <div className="text-lg transition-transform hover:scale-105 duration-200" style={{ fontFamily: pairing.displayFamily }}>
                                {pairing.display}
                              </div>
                              <div className="text-sm" style={{ fontFamily: pairing.headingFamily }}>
                                {pairing.heading}
                              </div>
                              <div className="text-xs text-gray-500" style={{ fontFamily: pairing.bodyFamily }}>
                                {pairing.body}
                              </div>
                            </div>
                          </button>
                        ))}
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
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
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
                                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-[51] max-h-60 overflow-y-auto">
                                  {AVAILABLE_FONTS.map((font) => (
                                    <button
                                      key={font.name}
                                      onClick={() => {
                                        if (onCustomFontChange) {
                                          onCustomFontChange('display', font.name, font.family)
                                        }
                                        setSelectedFontPairingId(null)
                                        setIsDisplayFontOpen(false)
                                      }}
                                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm border-b border-gray-100 last:border-b-0 ${
                                        displayFont === font.name ? 'bg-blue-50' : ''
                                      }`}
                                      style={{ fontFamily: font.family }}
                                    >
                                      {font.name}
                                    </button>
                                  ))}
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
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
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
                                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-[51] max-h-60 overflow-y-auto">
                                  {AVAILABLE_FONTS.map((font) => (
                                    <button
                                      key={font.name}
                                      onClick={() => {
                                        if (onCustomFontChange) {
                                          onCustomFontChange('heading', font.name, font.family)
                                        }
                                        setSelectedFontPairingId(null)
                                        setIsHeadingFontOpen(false)
                                      }}
                                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm border-b border-gray-100 last:border-b-0 ${
                                        headingFont === font.name ? 'bg-blue-50' : ''
                                      }`}
                                      style={{ fontFamily: font.family }}
                                    >
                                      {font.name}
                                    </button>
                                  ))}
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
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
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
                                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-[51] max-h-60 overflow-y-auto">
                                  {AVAILABLE_FONTS.map((font) => (
                                    <button
                                      key={font.name}
                                      onClick={() => {
                                        if (onCustomFontChange) {
                                          onCustomFontChange('body', font.name, font.family)
                                        }
                                        setSelectedFontPairingId(null)
                                        setIsBodyFontOpen(false)
                                      }}
                                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm border-b border-gray-100 last:border-b-0 ${
                                        bodyFont === font.name ? 'bg-blue-50' : ''
                                      }`}
                                      style={{ fontFamily: font.family }}
                                    >
                                      {font.name}
                                    </button>
                                  ))}
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
"use client"

import React, { useState, useEffect } from 'react'
import { X, Settings, FileText, Palette, Type, ChevronDown, Users, UserPlus, Trash2, Globe } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { WeddingDetailsForm } from './config-forms/wedding-details-form'
import { UpdateWeddingNameId } from './update-wedding-name-id'
import { MetadataSettingsPanel } from './metadata-settings-panel'
import { ColorPicker } from './color-picker'
import { FONT_PAIRINGS, FONT_PAIRING_CATEGORIES, COLOR_THEMES, COLOR_THEME_CATEGORIES, AVAILABLE_FONTS } from '@/lib/theme-config'
import { useCollaborators } from '@/hooks/use-auth'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'

type NavBackgroundColorChoice = 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'
type EnvelopeColorChoice = 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

// Helper to create a light tint of a color for palette display
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

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  weddingNameId: string
  // Site settings props
  currentFonts?: { display?: string; heading?: string; body?: string }
  currentColors: { primary: string; secondary: string; accent: string }
  onFontsChange: (fonts: { display: string; heading: string; body: string; displayFamily: string; headingFamily: string; bodyFamily: string; googleFonts: string }) => void
  onColorsChange: (colors: { primary: string; secondary: string; accent: string }) => void
  onCustomColorChange: (colorType: 'primary' | 'secondary' | 'accent' | 'envelope', color: string) => void
  onCustomFontChange?: (fontType: 'display' | 'heading' | 'body', font: string, fontFamily: string) => void
  // Navigation settings
  showNavLinks?: boolean
  onNavLinksChange?: (showNavLinks: boolean) => void
  navUseColorBackground?: boolean
  navBackgroundColorChoice?: NavBackgroundColorChoice
  onNavColorBackgroundChange?: (useColor: boolean, colorChoice: NavBackgroundColorChoice) => void
  // Envelope settings
  envelopeColorChoice?: EnvelopeColorChoice
  onEnvelopeColorChange?: (colorChoice: EnvelopeColorChoice) => void
  // Language settings
  currentLocale?: 'en' | 'es'
  onLocaleChange?: (locale: 'en' | 'es') => void
}

interface WeddingDetails {
  partner1_first_name: string
  partner1_last_name: string
  partner2_first_name: string
  partner2_last_name: string
  wedding_date: string | null
  wedding_time: string | null
  reception_time: string | null
  ceremony_venue_name: string | null
  ceremony_venue_address: string | null
  reception_venue_name: string | null
  reception_venue_address: string | null
}

type TabType = 'details' | 'theme' | 'sharing'

export function SettingsPanel({
  isOpen,
  onClose,
  weddingNameId,
  currentFonts = { display: 'Playfair Display', heading: 'Cormorant Garamond', body: 'Lato' },
  currentColors,
  onFontsChange,
  onColorsChange,
  onCustomColorChange,
  onCustomFontChange,
  showNavLinks: showNavLinksProp = true,
  onNavLinksChange,
  navUseColorBackground: navUseColorBackgroundProp = false,
  navBackgroundColorChoice: navBackgroundColorChoiceProp = 'none',
  onNavColorBackgroundChange,
  envelopeColorChoice: envelopeColorChoiceProp = 'primary',
  onEnvelopeColorChange,
  currentLocale = 'en',
  onLocaleChange
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details')
  const [details, setDetails] = useState<WeddingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNavLinks, setShowNavLinks] = useState(showNavLinksProp)
  const [navUseColorBackground, setNavUseColorBackground] = useState(navUseColorBackgroundProp)
  const [navBackgroundColorChoice, setNavBackgroundColorChoice] = useState<NavBackgroundColorChoice>(navBackgroundColorChoiceProp)
  const [envelopeColorChoice, setEnvelopeColorChoice] = useState<EnvelopeColorChoice>(envelopeColorChoiceProp)
  const [locale, setLocale] = useState<'en' | 'es'>(currentLocale)
  
  // Sync showNavLinks state when prop changes
  useEffect(() => {
    setShowNavLinks(showNavLinksProp)
  }, [showNavLinksProp])
  
  // Sync nav color background state when props change
  useEffect(() => {
    setNavUseColorBackground(navUseColorBackgroundProp)
    setNavBackgroundColorChoice(navBackgroundColorChoiceProp)
  }, [navUseColorBackgroundProp, navBackgroundColorChoiceProp])
  
  // Sync locale state when props change
  useEffect(() => {
    setLocale(currentLocale)
  }, [currentLocale])
  
  // Collaborators state
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('')
  const [collaboratorError, setCollaboratorError] = useState<string | null>(null)
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false)
  
  // Metadata state
  const [ogMetadata, setOgMetadata] = useState<{
    ogTitle: string | null
    ogDescription: string | null
    ogImageUrl: string | null
  }>({
    ogTitle: null,
    ogDescription: null,
    ogImageUrl: null
  })
  
  // Get permissions from editing context
  const editingContext = useEditingModeSafe()
  const canManageCollaborators = editingContext?.permissions?.canManageCollaborators ?? false
  
  // Get collaborators
  const { 
    collaboratorEmails, 
    isOwner, 
    loading: collaboratorsLoading,
    addCollaborator,
    removeCollaborator
  } = useCollaborators(weddingNameId)
  
  // Font and color state
  const [isFontsOpen, setIsFontsOpen] = useState(false)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isCustomColorsOpen, setIsCustomColorsOpen] = useState(false)
  const [isCustomFontsOpen, setIsCustomFontsOpen] = useState(false)
  const [isDisplayFontOpen, setIsDisplayFontOpen] = useState(false)
  const [isHeadingFontOpen, setIsHeadingFontOpen] = useState(false)
  const [isBodyFontOpen, setIsBodyFontOpen] = useState(false)
  const [selectedFontPairingId, setSelectedFontPairingId] = useState<string | null>(null)
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null)
  
  // Category filter state
  const [fontPairingCategoryFilter, setFontPairingCategoryFilter] = useState<string | null>(null)
  const [customFontCategoryFilter, setCustomFontCategoryFilter] = useState<string | null>(null)
  const [colorPaletteCategoryFilter, setColorPaletteCategoryFilter] = useState<string | null>(null)

  // Font values with defaults
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
    setSelectedFontPairingId(matchingFonts?.id || null)
  }, [displayFont, headingFont, bodyFont])

  // Check if current colors match any palette
  useEffect(() => {
    const matchingPalette = COLOR_THEMES.find(theme => 
      theme.colors.primary.toLowerCase() === currentColors.primary.toLowerCase() &&
      theme.colors.secondary.toLowerCase() === currentColors.secondary.toLowerCase() &&
      theme.colors.accent.toLowerCase() === currentColors.accent.toLowerCase()
    )
    setSelectedPaletteId(matchingPalette?.id || null)
  }, [currentColors])

  // Load wedding details when panel opens
  useEffect(() => {
    if (isOpen && weddingNameId) {
      loadDetails()
    }
  }, [isOpen, weddingNameId])

  // Lock body scroll when panel is open
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

  const loadDetails = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/weddings/${weddingNameId}/details`)
      
      if (!response.ok) {
        throw new Error('Failed to load wedding details')
      }

      const data = await response.json()
      setDetails(data.details)
      
      // Also fetch OG metadata if available
      const metadataResponse = await fetch(`/api/weddings/${weddingNameId}/config`)
      if (metadataResponse.ok) {
        const configData = await metadataResponse.json()
        if (configData.wedding) {
          setOgMetadata({
            ogTitle: configData.wedding.og_title || null,
            ogDescription: configData.wedding.og_description || null,
            ogImageUrl: configData.wedding.og_image_url || null
          })
        }
      }
    } catch (err) {
      console.error('Error loading wedding details:', err)
      setError('Failed to load wedding details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDetailsSave = (updatedDetails: WeddingDetails) => {
    setDetails(updatedDetails)
  }

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

  const handleColorThemeChange = (themeId: string) => {
    const theme = COLOR_THEMES.find(t => t.id === themeId)
    if (theme) {
      onColorsChange(theme.colors)
      setSelectedPaletteId(themeId)
      setIsPaletteOpen(false)
    }
  }

  const selectedFontPairing = selectedFontPairingId ? FONT_PAIRINGS.find(p => p.id === selectedFontPairingId) : null
  const selectedPalette = selectedPaletteId ? COLOR_THEMES.find(t => t.id === selectedPaletteId) : null

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Panel - positioned on the right */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Wedding Settings</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'theme'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Palette className="w-4 h-4" />
            Theme
          </button>
          {canManageCollaborators && (
            <button
              onClick={() => setActiveTab('sharing')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'sharing'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Sharing
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' ? (
            // Wedding Details Tab
            isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Loading wedding details...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={loadDetails} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : details ? (
              <div className="space-y-6">
                {/* Wedding Name ID Update Section */}
                <UpdateWeddingNameId currentWeddingNameId={weddingNameId} />
                
                {/* Divider */}
                <div className="border-t border-gray-200" />
                
                <WeddingDetailsForm
                  weddingNameId={weddingNameId}
                  initialDetails={details}
                  onSave={handleDetailsSave}
                />
                
                {/* Language Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-700">Language Settings</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Default Language */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Default Language</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setLocale('en')
                            onLocaleChange?.('en')
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            locale === 'en'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          English
                        </button>
                        <button
                          onClick={() => {
                            setLocale('es')
                            onLocaleChange?.('es')
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            locale === 'es'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Español
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">
                        This sets the default language for your wedding website
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          ) : activeTab === 'theme' ? (
            // Theme Tab
            <div className="space-y-6">
              {/* Font Pairing Selector */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">Font Pairing</label>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsFontsOpen(!isFontsOpen)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400 hover:shadow-sm"
                  >
                    {selectedFontPairing ? (
                      <div className="flex flex-col gap-2 w-full">
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
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-700 text-left text-xs font-medium">Custom Font Pairing</span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${isFontsOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="flex flex-col gap-1 w-full text-left">
                          <div className="text-xl" style={{ fontFamily: AVAILABLE_FONTS.find(f => f.name === displayFont)?.family }}>
                            {displayFont}
                          </div>
                          <div className="text-sm" style={{ fontFamily: AVAILABLE_FONTS.find(f => f.name === headingFont)?.family }}>
                            {headingFont}
                          </div>
                          <div className="text-xs text-gray-500" style={{ fontFamily: AVAILABLE_FONTS.find(f => f.name === bodyFont)?.family }}>
                            {bodyFont}
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                  
                  {isFontsOpen && (
                    <>
                      <div className="fixed inset-0 z-[52]" onClick={() => setIsFontsOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[53] max-h-80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                        {/* Category filter tabs */}
                        <div className="flex gap-1.5 p-2.5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-x-auto">
                          <button
                            onClick={() => setFontPairingCategoryFilter(null)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                              fontPairingCategoryFilter === null ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            All
                          </button>
                          {FONT_PAIRING_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setFontPairingCategoryFilter(cat.id)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                fontPairingCategoryFilter === cat.id ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
                                      selectedFontPairingId === pairing.id ? 'bg-blue-50 ring-2 ring-blue-500' : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="text-xs font-medium text-gray-700">{pairing.name}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 w-full text-left">
                                      <div className="text-base truncate" style={{ fontFamily: pairing.displayFamily }}>{pairing.display}</div>
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
                    onClick={() => setIsCustomFontsOpen(!isCustomFontsOpen)}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-3 hover:text-gray-900 transition-colors duration-150"
                  >
                    <span>Custom Fonts</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCustomFontsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isCustomFontsOpen && (
                    <div className="space-y-3 pb-1">
                      {/* Display Font */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-600">Display (Wedding Names)</label>
                        <div className="relative">
                          <button
                            onClick={() => {
                              setIsDisplayFontOpen(!isDisplayFontOpen)
                              setIsHeadingFontOpen(false)
                              setIsBodyFontOpen(false)
                            }}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <div className="flex items-center justify-between">
                              <span style={{ fontFamily: AVAILABLE_FONTS.find(f => f.name === displayFont)?.family }}>{displayFont}</span>
                              <ChevronDown className={`w-4 h-4 text-gray-500 ${isDisplayFontOpen ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          {isDisplayFontOpen && (
                            <>
                              <div className="fixed inset-0 z-[50]" onClick={() => setIsDisplayFontOpen(false)} />
                              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-[51] max-h-60 overflow-hidden flex flex-col">
                                {/* Category filter tabs */}
                                <div className="flex gap-1.5 p-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-x-auto">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(null) }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                      customFontCategoryFilter === null ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                  >
                                    All
                                  </button>
                                  {['Display', 'Calligraphic', 'Serif', 'Sans-Serif'].map((cat) => (
                                    <button
                                      key={cat}
                                      onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(cat) }}
                                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                        customFontCategoryFilter === cat ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
                                              onCustomFontChange('display', font.name, font.family)
                                              setSelectedFontPairingId(null)
                                              setIsDisplayFontOpen(false)
                                            }}
                                            className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm ${displayFont === font.name ? 'bg-blue-50' : ''}`}
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

                      {/* Heading Font */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-600">Heading (Section Titles)</label>
                        <div className="relative">
                          <button
                            onClick={() => {
                              setIsHeadingFontOpen(!isHeadingFontOpen)
                              setIsDisplayFontOpen(false)
                              setIsBodyFontOpen(false)
                            }}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <div className="flex items-center justify-between">
                              <span style={{ fontFamily: AVAILABLE_FONTS.find(f => f.name === headingFont)?.family }}>{headingFont}</span>
                              <ChevronDown className={`w-4 h-4 text-gray-500 ${isHeadingFontOpen ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          {isHeadingFontOpen && (
                            <>
                              <div className="fixed inset-0 z-[50]" onClick={() => setIsHeadingFontOpen(false)} />
                              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-[51] max-h-60 overflow-hidden flex flex-col">
                                {/* Category filter tabs */}
                                <div className="flex gap-1.5 p-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-x-auto">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(null) }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                      customFontCategoryFilter === null ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                  >
                                    All
                                  </button>
                                  {['Display', 'Calligraphic', 'Serif', 'Sans-Serif'].map((cat) => (
                                    <button
                                      key={cat}
                                      onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(cat) }}
                                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                        customFontCategoryFilter === cat ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
                                              onCustomFontChange('heading', font.name, font.family)
                                              setSelectedFontPairingId(null)
                                              setIsHeadingFontOpen(false)
                                            }}
                                            className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm ${headingFont === font.name ? 'bg-blue-50' : ''}`}
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

                      {/* Body Font */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-600">Body (Content Text)</label>
                        <div className="relative">
                          <button
                            onClick={() => {
                              setIsBodyFontOpen(!isBodyFontOpen)
                              setIsDisplayFontOpen(false)
                              setIsHeadingFontOpen(false)
                            }}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <div className="flex items-center justify-between">
                              <span style={{ fontFamily: AVAILABLE_FONTS.find(f => f.name === bodyFont)?.family }}>{bodyFont}</span>
                              <ChevronDown className={`w-4 h-4 text-gray-500 ${isBodyFontOpen ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          {isBodyFontOpen && (
                            <>
                              <div className="fixed inset-0 z-[50]" onClick={() => setIsBodyFontOpen(false)} />
                              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-[51] max-h-60 overflow-hidden flex flex-col">
                                {/* Category filter tabs */}
                                <div className="flex gap-1.5 p-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-x-auto">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(null) }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                      customFontCategoryFilter === null ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                  >
                                    All
                                  </button>
                                  {['Display', 'Calligraphic', 'Serif', 'Sans-Serif'].map((cat) => (
                                    <button
                                      key={cat}
                                      onClick={(e) => { e.stopPropagation(); setCustomFontCategoryFilter(cat) }}
                                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                        customFontCategoryFilter === cat ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
                                              onCustomFontChange('body', font.name, font.family)
                                              setSelectedFontPairingId(null)
                                              setIsBodyFontOpen(false)
                                            }}
                                            className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm ${bodyFont === font.name ? 'bg-blue-50' : ''}`}
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
                  )}
                </div>
              )}

              {/* Color Palette Selector */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">Color Palette</label>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400 hover:shadow-sm"
                  >
                    {selectedPalette ? (
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-700 text-left text-xs">{selectedPalette.name}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${isPaletteOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {/* Full colors */}
                        <div className="flex gap-1 w-full">
                          <div className="flex-1 h-5 rounded-t" style={{ backgroundColor: selectedPalette.colors.primary }} />
                          <div className="flex-1 h-5 rounded-t" style={{ backgroundColor: selectedPalette.colors.secondary }} />
                          <div className="flex-1 h-5 rounded-t" style={{ backgroundColor: selectedPalette.colors.accent }} />
                        </div>
                        {/* Light variants */}
                        <div className="flex gap-1 w-full -mt-1">
                          <div className="flex-1 h-3" style={{ backgroundColor: getLightTint(selectedPalette.colors.primary, 0.5) }} />
                          <div className="flex-1 h-3" style={{ backgroundColor: getLightTint(selectedPalette.colors.secondary, 0.5) }} />
                          <div className="flex-1 h-3" style={{ backgroundColor: getLightTint(selectedPalette.colors.accent, 0.5) }} />
                        </div>
                        {/* Lighter variants */}
                        <div className="flex gap-1 w-full -mt-1">
                          <div className="flex-1 h-2 rounded-b" style={{ backgroundColor: getLightTint(selectedPalette.colors.primary, 0.88) }} />
                          <div className="flex-1 h-2 rounded-b" style={{ backgroundColor: getLightTint(selectedPalette.colors.secondary, 0.88) }} />
                          <div className="flex-1 h-2 rounded-b" style={{ backgroundColor: getLightTint(selectedPalette.colors.accent, 0.88) }} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-700 text-left text-xs font-medium">Custom Palette</span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${isPaletteOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {/* Full colors */}
                        <div className="flex gap-1 w-full">
                          <div className="flex-1 h-5 rounded-t" style={{ backgroundColor: currentColors.primary }} />
                          <div className="flex-1 h-5 rounded-t" style={{ backgroundColor: currentColors.secondary }} />
                          <div className="flex-1 h-5 rounded-t" style={{ backgroundColor: currentColors.accent }} />
                        </div>
                        {/* Light variants */}
                        <div className="flex gap-1 w-full -mt-1">
                          <div className="flex-1 h-3" style={{ backgroundColor: getLightTint(currentColors.primary, 0.5) }} />
                          <div className="flex-1 h-3" style={{ backgroundColor: getLightTint(currentColors.secondary, 0.5) }} />
                          <div className="flex-1 h-3" style={{ backgroundColor: getLightTint(currentColors.accent, 0.5) }} />
                        </div>
                        {/* Lighter variants */}
                        <div className="flex gap-1 w-full -mt-1">
                          <div className="flex-1 h-2 rounded-b" style={{ backgroundColor: getLightTint(currentColors.primary, 0.88) }} />
                          <div className="flex-1 h-2 rounded-b" style={{ backgroundColor: getLightTint(currentColors.secondary, 0.88) }} />
                          <div className="flex-1 h-2 rounded-b" style={{ backgroundColor: getLightTint(currentColors.accent, 0.88) }} />
                        </div>
                      </div>
                    )}
                  </button>
                  
                  {isPaletteOpen && (
                    <>
                      <div className="fixed inset-0 z-[45]" onClick={() => setIsPaletteOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[46] max-h-80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                        {/* Category filter tabs */}
                        <div className="flex gap-1.5 p-2.5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-x-auto">
                          <button
                            onClick={() => setColorPaletteCategoryFilter(null)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                              colorPaletteCategoryFilter === null ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            All
                          </button>
                          {COLOR_THEME_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setColorPaletteCategoryFilter(cat.id)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                colorPaletteCategoryFilter === cat.id ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
                                      selectedPaletteId === theme.id ? 'bg-blue-50 ring-2 ring-blue-500' : ''
                                    }`}
                                  >
                                    {/* Full colors */}
                                    <div className="flex gap-1 w-full">
                                      <div className="flex-1 h-6 rounded-t-md shadow-sm" style={{ backgroundColor: theme.colors.primary }} />
                                      <div className="flex-1 h-6 rounded-t-md shadow-sm" style={{ backgroundColor: theme.colors.secondary }} />
                                      <div className="flex-1 h-6 rounded-t-md shadow-sm" style={{ backgroundColor: theme.colors.accent }} />
                                    </div>
                                    {/* Light variants */}
                                    <div className="flex gap-1 w-full -mt-1">
                                      <div className="flex-1 h-4 shadow-sm" style={{ backgroundColor: getLightTint(theme.colors.primary, 0.5) }} />
                                      <div className="flex-1 h-4 shadow-sm" style={{ backgroundColor: getLightTint(theme.colors.secondary, 0.5) }} />
                                      <div className="flex-1 h-4 shadow-sm" style={{ backgroundColor: getLightTint(theme.colors.accent, 0.5) }} />
                                    </div>
                                    {/* Lighter variants */}
                                    <div className="flex gap-1 w-full -mt-1">
                                      <div className="flex-1 h-3 rounded-b-md shadow-sm" style={{ backgroundColor: getLightTint(theme.colors.primary, 0.88) }} />
                                      <div className="flex-1 h-3 rounded-b-md shadow-sm" style={{ backgroundColor: getLightTint(theme.colors.secondary, 0.88) }} />
                                      <div className="flex-1 h-3 rounded-b-md shadow-sm" style={{ backgroundColor: getLightTint(theme.colors.accent, 0.88) }} />
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

              {/* Custom Colors Section */}
              <div>
                <button
                  onClick={() => setIsCustomColorsOpen(!isCustomColorsOpen)}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-3 hover:text-gray-900 transition-colors duration-150"
                >
                  <span>Custom Colors</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCustomColorsOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCustomColorsOpen && (
                  <div className="space-y-4 pb-1">
                    <ColorPicker
                      label="Primary Color"
                      value={currentColors.primary}
                      onChange={(color) => {
                        onCustomColorChange('primary', color)
                        setSelectedPaletteId(null)
                      }}
                    />
                    <ColorPicker
                      label="Secondary Color"
                      value={currentColors.secondary}
                      onChange={(color) => {
                        onCustomColorChange('secondary', color)
                        setSelectedPaletteId(null)
                      }}
                    />
                    <ColorPicker
                      label="Accent Color"
                      value={currentColors.accent}
                      onChange={(color) => {
                        onCustomColorChange('accent', color)
                        setSelectedPaletteId(null)
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* Envelope Settings */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">Envelope Color</label>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-3">Select envelope color from your theme palette</p>
                  <div className="space-y-2">
                    {/* Primary row */}
                    <div className="flex gap-1">
                      <span className="text-xs text-gray-500 w-16 flex items-center">Primary</span>
                      <div className="flex gap-1 flex-1">
                        {(['primary', 'primary-light', 'primary-lighter'] as const).map((colorChoice) => {
                          const baseColor = currentColors.primary
                          const bgColor = colorChoice === 'primary' 
                            ? baseColor 
                            : colorChoice === 'primary-light' 
                              ? getLightTint(baseColor, 0.7) 
                              : getLightTint(baseColor, 0.88)
                          return (
                            <button
                              key={colorChoice}
                              onClick={() => {
                                setEnvelopeColorChoice(colorChoice)
                                onEnvelopeColorChange?.(colorChoice)
                              }}
                              className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                                envelopeColorChoice === colorChoice
                                  ? 'ring-2 ring-blue-500 ring-offset-1'
                                  : 'hover:opacity-80'
                              }`}
                              style={{
                                backgroundColor: bgColor,
                                color: colorChoice === 'primary' ? '#fff' : '#333',
                                textShadow: colorChoice === 'primary' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                              }}
                              title={colorChoice === 'primary' ? 'Primary' : colorChoice === 'primary-light' ? 'Primary Light' : 'Primary Lighter'}
                            />
                          )
                        })}
                      </div>
                    </div>
                    {/* Secondary row */}
                    <div className="flex gap-1">
                      <span className="text-xs text-gray-500 w-16 flex items-center">Secondary</span>
                      <div className="flex gap-1 flex-1">
                        {(['secondary', 'secondary-light', 'secondary-lighter'] as const).map((colorChoice) => {
                          const baseColor = currentColors.secondary
                          const bgColor = colorChoice === 'secondary' 
                            ? baseColor 
                            : colorChoice === 'secondary-light' 
                              ? getLightTint(baseColor, 0.7) 
                              : getLightTint(baseColor, 0.88)
                          return (
                            <button
                              key={colorChoice}
                              onClick={() => {
                                setEnvelopeColorChoice(colorChoice)
                                onEnvelopeColorChange?.(colorChoice)
                              }}
                              className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                                envelopeColorChoice === colorChoice
                                  ? 'ring-2 ring-blue-500 ring-offset-1'
                                  : 'hover:opacity-80'
                              }`}
                              style={{
                                backgroundColor: bgColor,
                                color: '#333',
                              }}
                              title={colorChoice === 'secondary' ? 'Secondary' : colorChoice === 'secondary-light' ? 'Secondary Light' : 'Secondary Lighter'}
                            />
                          )
                        })}
                      </div>
                    </div>
                    {/* Accent row */}
                    <div className="flex gap-1">
                      <span className="text-xs text-gray-500 w-16 flex items-center">Accent</span>
                      <div className="flex gap-1 flex-1">
                        {(['accent', 'accent-light', 'accent-lighter'] as const).map((colorChoice) => {
                          const baseColor = currentColors.accent
                          const bgColor = colorChoice === 'accent' 
                            ? baseColor 
                            : colorChoice === 'accent-light' 
                              ? getLightTint(baseColor, 0.7) 
                              : getLightTint(baseColor, 0.88)
                          return (
                            <button
                              key={colorChoice}
                              onClick={() => {
                                setEnvelopeColorChoice(colorChoice)
                                onEnvelopeColorChange?.(colorChoice)
                              }}
                              className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                                envelopeColorChoice === colorChoice
                                  ? 'ring-2 ring-blue-500 ring-offset-1'
                                  : 'hover:opacity-80'
                              }`}
                              style={{
                                backgroundColor: bgColor,
                                color: colorChoice === 'accent' ? '#fff' : '#333',
                                textShadow: colorChoice === 'accent' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                              }}
                              title={colorChoice === 'accent' ? 'Accent' : colorChoice === 'accent-light' ? 'Accent Light' : 'Accent Lighter'}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation Settings */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">Navigation</label>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Show Section Links</p>
                    <p className="text-xs text-gray-500">Display navigation links below couple initials</p>
                  </div>
                  <button
                    onClick={() => {
                      // Toggle showNavLinks setting
                      const currentValue = showNavLinks
                      setShowNavLinks(!currentValue)
                      onNavLinksChange?.(!currentValue)
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showNavLinks ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        showNavLinks ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Navigation Color Background */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Color Background</p>
                      <p className="text-xs text-gray-500">Use theme color as navigation background</p>
                    </div>
                    <button
                      onClick={() => {
                        const newValue = !navUseColorBackground
                        setNavUseColorBackground(newValue)
                        if (!newValue) {
                          setNavBackgroundColorChoice('none')
                          onNavColorBackgroundChange?.(false, 'none')
                        } else {
                          // Default to primary when enabling
                          setNavBackgroundColorChoice('primary')
                          onNavColorBackgroundChange?.(true, 'primary')
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        navUseColorBackground ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          navUseColorBackground ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Color choice buttons - only show when color background is enabled */}
                  {navUseColorBackground && (
                    <div className="space-y-2 mt-2">
                      {/* Primary row */}
                      <div className="flex gap-1">
                        <span className="text-xs text-gray-500 w-16 flex items-center">Primary</span>
                        <div className="flex gap-1 flex-1">
                          {(['primary', 'primary-light', 'primary-lighter'] as const).map((colorChoice) => {
                            const baseColor = currentColors.primary
                            const bgColor = colorChoice === 'primary' 
                              ? baseColor 
                              : colorChoice === 'primary-light' 
                                ? getLightTint(baseColor, 0.7) 
                                : getLightTint(baseColor, 0.88)
                            return (
                              <button
                                key={colorChoice}
                                onClick={() => {
                                  setNavBackgroundColorChoice(colorChoice)
                                  onNavColorBackgroundChange?.(true, colorChoice)
                                }}
                                className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                                  navBackgroundColorChoice === colorChoice
                                    ? 'ring-2 ring-blue-500 ring-offset-1'
                                    : 'hover:opacity-80'
                                }`}
                                style={{
                                  backgroundColor: bgColor,
                                  color: colorChoice === 'primary' ? '#fff' : '#333',
                                  textShadow: colorChoice === 'primary' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                                }}
                                title={colorChoice === 'primary' ? 'Primary' : colorChoice === 'primary-light' ? 'Primary Light' : 'Primary Lighter'}
                              />
                            )
                          })}
                        </div>
                      </div>
                      {/* Secondary row */}
                      <div className="flex gap-1">
                        <span className="text-xs text-gray-500 w-16 flex items-center">Secondary</span>
                        <div className="flex gap-1 flex-1">
                          {(['secondary', 'secondary-light', 'secondary-lighter'] as const).map((colorChoice) => {
                            const baseColor = currentColors.secondary
                            const bgColor = colorChoice === 'secondary' 
                              ? baseColor 
                              : colorChoice === 'secondary-light' 
                                ? getLightTint(baseColor, 0.7) 
                                : getLightTint(baseColor, 0.88)
                            return (
                              <button
                                key={colorChoice}
                                onClick={() => {
                                  setNavBackgroundColorChoice(colorChoice)
                                  onNavColorBackgroundChange?.(true, colorChoice)
                                }}
                                className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                                  navBackgroundColorChoice === colorChoice
                                    ? 'ring-2 ring-blue-500 ring-offset-1'
                                    : 'hover:opacity-80'
                                }`}
                                style={{
                                  backgroundColor: bgColor,
                                  color: '#333',
                                }}
                                title={colorChoice === 'secondary' ? 'Secondary' : colorChoice === 'secondary-light' ? 'Secondary Light' : 'Secondary Lighter'}
                              />
                            )
                          })}
                        </div>
                      </div>
                      {/* Accent row */}
                      <div className="flex gap-1">
                        <span className="text-xs text-gray-500 w-16 flex items-center">Accent</span>
                        <div className="flex gap-1 flex-1">
                          {(['accent', 'accent-light', 'accent-lighter'] as const).map((colorChoice) => {
                            const baseColor = currentColors.accent
                            const bgColor = colorChoice === 'accent' 
                              ? baseColor 
                              : colorChoice === 'accent-light' 
                                ? getLightTint(baseColor, 0.7) 
                                : getLightTint(baseColor, 0.88)
                            return (
                              <button
                                key={colorChoice}
                                onClick={() => {
                                  setNavBackgroundColorChoice(colorChoice)
                                  onNavColorBackgroundChange?.(true, colorChoice)
                                }}
                                className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                                  navBackgroundColorChoice === colorChoice
                                    ? 'ring-2 ring-blue-500 ring-offset-1'
                                    : 'hover:opacity-80'
                                }`}
                                style={{
                                  backgroundColor: bgColor,
                                  color: colorChoice === 'accent' ? '#fff' : '#333',
                                  textShadow: colorChoice === 'accent' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                                }}
                                title={colorChoice === 'accent' ? 'Accent' : colorChoice === 'accent-light' ? 'Accent Light' : 'Accent Lighter'}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'sharing' ? (
            // Sharing Tab
            <div className="space-y-6">
              {/* Social Media Metadata Section */}
              <MetadataSettingsPanel
                weddingNameId={weddingNameId}
                currentMetadata={ogMetadata}
                onSave={async (metadata) => {
                  const response = await fetch(`/api/weddings/${encodeURIComponent(weddingNameId)}/metadata`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(metadata)
                  })
                  if (!response.ok) {
                    throw new Error('Failed to save metadata')
                  }
                  // Update local state
                  setOgMetadata({
                    ogTitle: metadata.ogTitle || null,
                    ogDescription: metadata.ogDescription || null,
                    ogImageUrl: metadata.ogImageUrl || null
                  })
                }}
              />
              
              {/* Divider */}
              <div className="border-t border-gray-200 pt-6"></div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Share Access</h3>
                <p className="text-xs text-blue-700">
                  Add collaborators who can edit your wedding website. They'll need an account to access it.
                </p>
              </div>

              {/* Add Collaborator Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Collaborator by Email
                </label>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!newCollaboratorEmail.trim()) return
                    
                    setIsAddingCollaborator(true)
                    setCollaboratorError(null)
                    
                    const result = await addCollaborator(newCollaboratorEmail.trim())
                    
                    if (result.success) {
                      setNewCollaboratorEmail('')
                    } else {
                      setCollaboratorError(result.error || 'Failed to add collaborator')
                    }
                    
                    setIsAddingCollaborator(false)
                  }}
                  className="flex gap-2"
                >
                  <Input
                    type="email"
                    placeholder="collaborator@email.com"
                    value={newCollaboratorEmail}
                    onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                    className="flex-1"
                    disabled={isAddingCollaborator}
                  />
                  <Button 
                    type="submit" 
                    disabled={isAddingCollaborator || !newCollaboratorEmail.trim()}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add
                  </Button>
                </form>
                {collaboratorError && (
                  <p className="mt-2 text-sm text-red-600">{collaboratorError}</p>
                )}
              </div>

              {/* Collaborators List */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Current Collaborators
                </h3>
                
                {collaboratorsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : collaboratorEmails.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No collaborators yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add someone above to share access</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collaboratorEmails.map((email) => (
                      <div 
                        key={email}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {email}
                          </p>
                          <p className="text-xs text-gray-500">
                            Editor access
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            await removeCollaborator(email)
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove collaborator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

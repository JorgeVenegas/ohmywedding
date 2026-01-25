"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ImageUpload } from "@/components/ui/image-upload"
import { WeddingPreview } from "@/components/wedding-preview"
import { Header } from "@/components/header"
import { Heart, ChevronDown, ChevronRight, Settings, Calendar, Users, Camera, MessageSquare, HelpCircle, MapPin, Palette, Type, Sparkles, LayoutTemplate, Wand2, Check, Clock, Eye, ExternalLink, X, Upload, Gift } from "lucide-react"
import Link from "next/link"
import { FONT_PAIRINGS, FONT_PAIRING_CATEGORIES, COLOR_THEMES, COLOR_THEME_CATEGORIES, DEFAULT_FONT_PAIRING, DEFAULT_COLOR_THEME } from "@/lib/theme-config"
import { PAGE_TEMPLATES, TEMPLATE_CATEGORIES, type PageTemplate } from "@/lib/page-templates"
import { toast } from "sonner"

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

// Creation mode type - AI is always visible, these are secondary options
type CreationMode = 'manual' | 'template'

// Component section interface
interface ComponentSection {
  id: string
  name: string
  icon: React.ComponentType<any>
  description: string
  enabled: boolean
  expanded: boolean
  props: Record<string, any>
  order?: number
}

// Hero variant options
const HERO_VARIANTS = [
  { value: 'minimal', label: 'Minimal', description: 'Clean text-focused design' },
  { value: 'background', label: 'Background Image', description: 'Full-width image with text overlay', requiresImage: true },
  { value: 'side-by-side', label: 'Side by Side', description: 'Split layout with photo', requiresImage: true },
  { value: 'framed', label: 'Framed Photo', description: 'Elegant framed couple photo', requiresImage: true },
  { value: 'stacked', label: 'Stacked', description: 'Photo above content', requiresImage: true }
]

// Event details variant options
const EVENT_VARIANTS = [
  { value: 'classic', label: 'Classic Cards', description: 'Traditional card layout' },
  { value: 'elegant', label: 'Elegant Script', description: 'Romantic serif typography' },
  { value: 'timeline', label: 'Timeline', description: 'Chronological flow' },
  { value: 'minimal', label: 'Minimal', description: 'Clean and simple' },
  { value: 'split', label: 'Split View', description: 'Two-column layout' }
]

// Gallery variant options
const GALLERY_VARIANTS = [
  { value: 'grid', label: 'Grid', description: 'Clean uniform grid' },
  { value: 'masonry', label: 'Masonry', description: 'Pinterest-style layout' },
  { value: 'carousel', label: 'Carousel', description: 'Slideshow format' },
  { value: 'collage', label: 'Collage', description: 'Artistic arrangement' },
  { value: 'list', label: 'List', description: 'Vertical showcase' }
]

// Our Story variant options
const STORY_VARIANTS = [
  { value: 'cards', label: 'Cards', description: 'Card-based sections' },
  { value: 'timeline', label: 'Timeline', description: 'Chronological display' },
  { value: 'minimal', label: 'Minimal', description: 'Text-focused' },
  { value: 'zigzag', label: 'Zigzag', description: 'Alternating layout' },
  { value: 'booklet', label: 'Booklet', description: 'Storybook style' }
]

// Countdown variant options
const COUNTDOWN_VARIANTS = [
  { value: 'classic', label: 'Classic', description: 'Traditional cards' },
  { value: 'minimal', label: 'Minimal', description: 'Clean numbers' },
  { value: 'circular', label: 'Circular', description: 'Progress rings' },
  { value: 'elegant', label: 'Elegant', description: 'Romantic style' },
  { value: 'modern', label: 'Modern', description: 'Bold typography' }
]

// RSVP variant options
const RSVP_VARIANTS = [
  { value: 'elegant', label: 'Elegant', description: 'Romantic serif style' },
  { value: 'minimalistic', label: 'Minimalistic', description: 'Clean modern form' },
  { value: 'cards', label: 'Cards', description: 'Guest card layout' }
]

// FAQ variant options
const FAQ_VARIANTS = [
  { value: 'accordion', label: 'Accordion', description: 'Expandable questions' },
  { value: 'minimal', label: 'Minimal', description: 'Simple list' },
  { value: 'cards', label: 'Cards', description: 'Grid of cards' },
  { value: 'elegant', label: 'Elegant', description: 'Romantic style' }
]

// Registry variant options
const REGISTRY_VARIANTS = [
  { value: 'cards', label: 'Cards', description: 'Classic card layout' },
  { value: 'minimal', label: 'Minimal', description: 'Simple list style' },
  { value: 'elegant', label: 'Elegant', description: 'Romantic style' },
  { value: 'grid', label: 'Grid', description: 'Compact grid' }
]

export default function CreateWeddingPage() {
  // Templates from database
  const [dbTemplates, setDbTemplates] = useState<any[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  
  // Core form data
  const [formData, setFormData] = useState({
    partner1FirstName: "",
    partner1LastName: "",
    partner2FirstName: "",
    partner2LastName: "",
    weddingDate: "",
    weddingTime: "",
    receptionTime: "",
    hasExistingWedding: true,
    primaryColor: DEFAULT_COLOR_THEME.colors.primary,
    secondaryColor: DEFAULT_COLOR_THEME.colors.secondary,
    accentColor: DEFAULT_COLOR_THEME.colors.accent,
    selectedColorThemeId: DEFAULT_COLOR_THEME.id,
    selectedFontPairingId: DEFAULT_FONT_PAIRING.id,
    locale: 'en' as 'en' | 'es',
  })

  // Creation mode
  const [creationMode, setCreationMode] = useState<CreationMode>('template')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('classic-elegance')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiGenerating, setIsAiGenerating] = useState(false)

  // Component sections state
  const [componentSections, setComponentSections] = useState<ComponentSection[]>([
    {
      id: 'hero',
      name: 'Hero Section',
      icon: Heart,
      description: 'Welcome message with names and date',
      enabled: true,
      expanded: false,
      props: {
        variant: 'minimal',
        showTagline: true,
        tagline: "Join us as we tie the knot!",
        showCountdown: true,
        showRSVPButton: true,
        heroImageUrl: "",
        textAlignment: 'center'
      }
    },
    {
      id: 'countdown',
      name: 'Countdown Timer',
      icon: Clock,
      description: 'Live countdown to your wedding day',
      enabled: true,
      expanded: false,
      props: {
        variant: 'classic',
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: false,
        message: 'Until we say "I do"'
      }
    },
    {
      id: 'banner',
      name: 'Banner',
      icon: Camera,
      description: 'Full-width decorative banner',
      enabled: false,
      expanded: false,
      props: {
        imageUrl: '',
        bannerHeight: 'large',
        showText: true,
        title: '',
        subtitle: '',
        overlayOpacity: 40,
        imageBrightness: 100
      }
    },
    {
      id: 'event-details',
      name: 'Event Details',
      icon: MapPin,
      description: 'Ceremony and reception information',
      enabled: true,
      expanded: false,
      props: {
        variant: 'classic',
        showCeremony: true,
        showReception: true,
        showMapLinks: true,
        showMap: true,
        ceremonyVenue: "",
        ceremonyAddress: "",
        receptionVenue: "",
        receptionAddress: "",
        dressCode: ""
      }
    },
    {
      id: 'our-story',
      name: 'Our Story',
      icon: MessageSquare,
      description: 'Share your love story',
      enabled: false,
      expanded: false,
      props: {
        variant: 'cards',
        showHowWeMet: true,
        showProposal: true,
        showPhotos: false,
        howWeMetText: "",
        proposalText: ""
      }
    },
    {
      id: 'gallery',
      name: 'Photo Gallery',
      icon: Camera,
      description: 'Display your photos',
      enabled: true,
      expanded: false,
      props: {
        variant: 'grid',
        gridColumns: 4,
        masonryColumns: 3,
        showViewAllButton: true
      }
    },
    {
      id: 'rsvp',
      name: 'RSVP',
      icon: Users,
      description: 'Guest response form',
      enabled: true,
      expanded: false,
      props: {
        variant: 'elegant',
        embedForm: true,
        showMealPreferences: false,
        showTravelInfo: false
      }
    },
    {
      id: 'faq',
      name: 'FAQ',
      icon: HelpCircle,
      description: 'Frequently asked questions',
      enabled: false,
      expanded: false,
      props: {
        variant: 'accordion',
        questions: []
      }
    }
  ])

  // UI state
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [fontPairingCategoryFilter, setFontPairingCategoryFilter] = useState<string | null>(null)
  const [colorPaletteCategoryFilter, setColorPaletteCategoryFilter] = useState<string | null>(null)
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fontPairingIdCounts = useMemo(() => {
    const counts = new Map<string, number>()
    FONT_PAIRING_CATEGORIES.forEach(cat => {
      cat.pairings.forEach(pairing => {
        counts.set(pairing.id, (counts.get(pairing.id) ?? 0) + 1)
      })
    })
    return counts
  }, [])
  const getFontPairingUniqueId = (categoryId: string, pairingId: string) =>
    (fontPairingIdCounts.get(pairingId) ?? 0) > 1 ? `${categoryId}-${pairingId}` : pairingId
  
  // Bulk photo upload state
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [isDistributingPhotos, setIsDistributingPhotos] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  // Toggle component enabled state
  const toggleComponent = (id: string) => {
    setComponentSections(prev => 
      prev.map(section => 
        section.id === id 
          ? { 
              ...section, 
              enabled: !section.enabled, 
              expanded: !section.enabled ? true : section.expanded 
            }
          : section
      )
    )
  }

  // Toggle component expanded state
  const toggleExpanded = (id: string) => {
    setComponentSections(prev => 
      prev.map(section => 
        section.id === id 
          ? { ...section, expanded: !section.expanded }
          : section
      )
    )
  }

  // Update component prop
  const updateComponentProp = (sectionId: string, propName: string, value: any) => {
    setComponentSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, props: { ...section.props, [propName]: value } }
          : section
      )
    )
  }

  // Default props for each section type - used to ensure all required fields exist
  const defaultSectionProps: Record<string, Record<string, any>> = {
    hero: { showTagline: true, tagline: "Join us as we tie the knot!", showCountdown: true, showRSVPButton: true, heroImageUrl: "", textAlignment: 'center' },
    countdown: { showDays: true, showHours: true, showMinutes: true, showSeconds: false, message: 'Until we say "I do"' },
    banner: { imageUrl: '', bannerHeight: 'large', showText: true, title: '', subtitle: '', overlayOpacity: 40, imageBrightness: 100 },
    'event-details': { showCeremony: true, showReception: true, showMapLinks: true, showMap: true, ceremonyVenue: "", ceremonyAddress: "", receptionVenue: "", receptionAddress: "", events: [] },
    'our-story': { showHowWeMet: true, showProposal: true, showPhotos: false, howWeMetText: "", proposalText: "", howWeMetPhoto: "", proposalPhoto: "" },
    gallery: { gridColumns: 4, masonryColumns: 3, showViewAllButton: true, photos: [] },
    rsvp: { embedForm: true, showMealPreferences: false, showTravelInfo: false },
    registry: { registries: [], customItems: [], showCustomRegistry: false },
    faq: { questions: [] }
  }

  // Section metadata (icons, names, descriptions)
  const sectionMetadata: Record<string, { name: string; icon: React.ComponentType<any>; description: string }> = {
    hero: { name: 'Hero Section', icon: Heart, description: 'Welcome message with names and date' },
    countdown: { name: 'Countdown Timer', icon: Clock, description: 'Live countdown to your wedding day' },
    banner: { name: 'Banner', icon: Camera, description: 'Full-width image banner' },
    'event-details': { name: 'Event Details', icon: MapPin, description: 'Ceremony and reception information' },
    'our-story': { name: 'Our Story', icon: MessageSquare, description: 'Share your love story' },
    gallery: { name: 'Photo Gallery', icon: Camera, description: 'Display your photos' },
    rsvp: { name: 'RSVP', icon: Users, description: 'Guest response form' },
    registry: { name: 'Registry', icon: Gift, description: 'Gift registry and wish list' },
    faq: { name: 'FAQ', icon: HelpCircle, description: 'Frequently asked questions' }
  }

  // Apply template
  const applyTemplate = (template: PageTemplate | any) => {
    // Handle both PageTemplate (from file) and DB template formats
    const isDbTemplate = 'pageConfig' in template
    
    if (isDbTemplate) {
      // Template from database
      const pageConfig = template.pageConfig
      setSelectedTemplateId(template.id)
      
      // Extract colors from page config
      const colors = pageConfig.siteSettings?.theme?.colors || {}
      const fonts = pageConfig.siteSettings?.theme?.fonts || {}
      
      // Find matching font pairing by fonts
      let matchingFontPairingId = formData.selectedFontPairingId
      if (fonts.display || fonts.heading || fonts.body) {
        const pairing = FONT_PAIRINGS.find(p => 
          p.display === fonts.display && 
          p.heading === fonts.heading && 
          p.body === fonts.body
        )
        if (pairing) {
          matchingFontPairingId = pairing.id
        }
      }
      
      // Find matching color theme by colors
      let matchingColorThemeId = formData.selectedColorThemeId
      if (colors.primary || colors.secondary || colors.accent) {
        const theme = COLOR_THEMES.find(t => 
          t.colors.primary === colors.primary && 
          t.colors.secondary === colors.secondary && 
          t.colors.accent === colors.accent
        )
        if (theme) {
          matchingColorThemeId = theme.id
        }
      }
      
      setFormData(prev => ({
        ...prev,
        selectedColorThemeId: matchingColorThemeId,
        selectedFontPairingId: matchingFontPairingId,
        primaryColor: colors.primary || prev.primaryColor,
        secondaryColor: colors.secondary || prev.secondaryColor,
        accentColor: colors.accent || prev.accentColor
      }))
      
      console.log('=== APPLYING DB TEMPLATE ===')
      console.log('Template ID:', template.id)
      console.log('Page config components:', JSON.stringify(pageConfig.components, null, 2))
      console.log('Page config sectionConfigs:', JSON.stringify(pageConfig.sectionConfigs, null, 2))
      
      // Convert page config to component sections
      const newSections = (pageConfig.components || []).map((comp: any) => {
        // Extract base type from component ID (strip numeric suffixes)
        const baseType = comp.id.replace(/-\d+$/, '')
        const metadata = sectionMetadata[baseType] || { 
          name: baseType.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          icon: Heart,
          description: ''
        }
        const defaultProps = defaultSectionProps[baseType] || {}
        
        // Get section config from sectionConfigs using the base type
        // Try both camelCase and kebab-case keys
        const configKey = baseType.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase())
        const sectionConfig = pageConfig.sectionConfigs?.[configKey] || pageConfig.sectionConfigs?.[baseType] || {}
        
        const mergedSection = {
          id: comp.id,
          name: metadata.name,
          icon: metadata.icon,
          description: metadata.description,
          enabled: comp.enabled,
          expanded: false,
          // Merge: start with defaults, then section config, then component props
          props: { ...defaultProps, ...sectionConfig, ...comp.props },
          order: comp.order
        }
        
        console.log(`Section ${comp.id} props:`, JSON.stringify(mergedSection.props, null, 2))
        return mergedSection
      })
      
      console.log('New sections created from DB:', newSections.length)
      setComponentSections(newSections)
    } else {
      // Original PageTemplate from file
      setSelectedTemplateId(template.id)
      setFormData(prev => ({
        ...prev,
        selectedColorThemeId: template.colorThemeId,
        selectedFontPairingId: template.fontPairingId,
        primaryColor: COLOR_THEMES.find(t => t.id === template.colorThemeId)?.colors.primary || prev.primaryColor,
        secondaryColor: COLOR_THEMES.find(t => t.id === template.colorThemeId)?.colors.secondary || prev.secondaryColor,
        accentColor: COLOR_THEMES.find(t => t.id === template.colorThemeId)?.colors.accent || prev.accentColor
      }))
      
      // Debug: Log template being applied
      console.log('=== APPLYING FILE TEMPLATE ===')
      console.log('Template ID:', template.id)
      console.log('Template components:', JSON.stringify(template.components, null, 2))
      
      // Map template components to component sections, preserving template structure
      // Merge default props with template props to ensure all required fields exist
      const newSections = template.components.map((templateComp: any) => {
        // Extract base type from component ID (strip numeric suffixes)
        const baseType = templateComp.id.replace(/-\d+$/, '')
        const metadata = sectionMetadata[baseType] || { 
          name: baseType.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          icon: Heart,
          description: ''
        }
        const defaultProps = defaultSectionProps[baseType] || {}
        
        const mergedSection = {
          id: templateComp.id,
          name: metadata.name,
          icon: metadata.icon,
          description: metadata.description,
          enabled: templateComp.enabled,
          expanded: false,
          // Merge: start with defaults, override with template props
          props: { ...defaultProps, ...templateComp.props },
          order: templateComp.order
        }
        
        console.log(`Section ${templateComp.id} props:`, JSON.stringify(mergedSection.props, null, 2))
        return mergedSection
      })
      
      console.log('New sections created from file:', newSections.length)
      setComponentSections(newSections)
    }
  }

  // Fetch templates from database on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/weddings/demos')
        if (response.ok) {
          const data = await response.json()
          setDbTemplates(data.templates || [])
          console.log('Loaded templates from database:', data.templates?.length || 0)
        }
      } catch (error) {
        console.error('Error fetching templates:', error)
      } finally {
        setIsLoadingTemplates(false)
      }
    }
    fetchTemplates()
  }, [])

  // Apply the default template on initial load
  useEffect(() => {
    if (isLoadingTemplates) return
    
    // Prefer DB template if available, otherwise fall back to file template
    const dbTemplate = dbTemplates.find(t => t.id === 'classic-elegance')
    if (dbTemplate) {
      console.log('Applying DB template on init:', dbTemplate.id)
      applyTemplate(dbTemplate)
    } else {
      const defaultTemplate = PAGE_TEMPLATES.find(t => t.id === 'classic-elegance')
      if (defaultTemplate) {
        console.log('Applying file template on init (no DB template found):', defaultTemplate.id)
        applyTemplate(defaultTemplate)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingTemplates, dbTemplates])

  // Handle AI generation
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    
    setIsAiGenerating(true)
    
    // Simulate AI generation (in production, this would call an AI API)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // For now, select a template based on keywords in the prompt
    const prompt = aiPrompt.toLowerCase()
    let templateId = 'classic-elegance'
    
    if (prompt.includes('modern') || prompt.includes('minimal') || prompt.includes('clean')) {
      templateId = 'modern-minimal'
    } else if (prompt.includes('rustic') || prompt.includes('barn') || prompt.includes('country')) {
      templateId = 'rustic-charm'
    } else if (prompt.includes('romantic') || prompt.includes('garden') || prompt.includes('floral')) {
      templateId = 'romantic-garden'
    } else if (prompt.includes('luxury') || prompt.includes('elegant') || prompt.includes('glamorous')) {
      templateId = 'luxury-noir'
    } else if (prompt.includes('simple') || prompt.includes('basic') || prompt.includes('quick')) {
      templateId = 'simple-love'
    }
    
    // Prefer DB template if available
    const dbTemplate = dbTemplates.find(t => t.id === templateId)
    if (dbTemplate) {
      applyTemplate(dbTemplate)
    } else {
      const fileTemplate = PAGE_TEMPLATES.find(t => t.id === templateId)
      if (fileTemplate) {
        applyTemplate(fileTemplate)
      }
    }
    
    setIsAiGenerating(false)
  }

  // Helper function to distribute photos (accepts photos as parameter)
  const distributePhotosToSectionsWithUrls = async (photos: string[]) => {
    if (photos.length === 0) return
    
    setIsDistributingPhotos(true)
    const newSections = [...componentSections]
    const photosCopy = [...photos]
    let photoIndex = 0
    
    // Helper to get next photo
    const getNextPhoto = () => {
      if (photoIndex >= photosCopy.length) return null
      return photosCopy[photoIndex++]
    }
    
    // Distribute photos intelligently to different sections
    newSections.forEach(section => {
      if (photoIndex >= photosCopy.length) return
      
      // Extract base type from section ID (remove numeric suffix)
      const baseType = section.id.replace(/-\d+$/, '')
      
      switch (baseType) {
        case 'hero':
          // Hero gets first photo
          if (getNextPhoto()) {
            const heroPhoto = photosCopy[photoIndex - 1]
            section.props.heroImageUrl = heroPhoto
            section.props.variant = 'background' // Use background variant to show image
            section.enabled = true
          }
          break
          
        case 'banner':
          // Banner gets one photo
          if (getNextPhoto()) {
            const bannerPhoto = photosCopy[photoIndex - 1]
            section.props.imageUrl = bannerPhoto
            section.enabled = true
          }
          break
          
        case 'gallery':
          // Gallery gets multiple photos (all remaining for now, or first 12)
          const galleryPhotos = photosCopy.slice(photoIndex, photoIndex + 12)
          if (galleryPhotos.length > 0) {
            section.props.photos = galleryPhotos.map((url, idx) => ({
              id: `photo-${idx}`,
              url,
              alt: `Gallery photo ${idx + 1}`,
              caption: ''
            }))
            photoIndex += galleryPhotos.length
            section.enabled = true
          }
          break
          
        case 'our-story':
          // Our story can use 2-3 photos
          const storyPhotos = photosCopy.slice(photoIndex, Math.min(photoIndex + 3, photosCopy.length))
          if (storyPhotos.length > 0) {
            section.props.showPhotos = true
            if (storyPhotos[0]) section.props.howWeMetPhoto = storyPhotos[0]
            if (storyPhotos[1]) section.props.proposalPhoto = storyPhotos[1]
            photoIndex += storyPhotos.length
            section.enabled = true
          }
          break
          
        case 'event-details':
          // Event details can use 1 photo per event
          const eventPhotos = photosCopy.slice(photoIndex, Math.min(photoIndex + 2, photosCopy.length))
          if (eventPhotos.length > 0) {
            const events = section.props.events || []
            eventPhotos.forEach((photoUrl, idx) => {
              if (events[idx]) {
                events[idx].imageUrl = photoUrl
              }
            })
            section.props.events = events
            photoIndex += eventPhotos.length
            section.enabled = true
          }
          break
      }
    })
    
    setComponentSections(newSections)
    setIsDistributingPhotos(false)
  }
  
  // Auto-distribute uploaded photos to sections (wrapper for button)
  const distributePhotosToSections = async () => {
    await distributePhotosToSectionsWithUrls(uploadedPhotos)
    toast.success('Photos distributed successfully!', {
      description: `${uploadedPhotos.length} photo${uploadedPhotos.length !== 1 ? 's' : ''} arranged across sections`
    })
  }

  // Preview component sections for live preview
  const previewComponentSections = useMemo(() => {
    return componentSections.map(section => ({
      id: section.id,
      name: section.name,
      enabled: section.enabled,
      props: { ...section.props }
    }))
  }, [componentSections])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Sort by order if it exists, otherwise maintain current order
      const sortedSections = [...componentSections].sort((a, b) => {
        const orderA = a.order ?? componentSections.indexOf(a)
        const orderB = b.order ?? componentSections.indexOf(b)
        return orderA - orderB
      })

      // Build components array (just ordering and enabled state)
      const enabledComponents = sortedSections
        .filter(section => section.enabled)
        .map((section, index) => {
          // Extract base type from section.id (remove timestamp if present)
          // e.g., 'banner-1769236752509' -> 'banner'
          const baseType = section.id.replace(/-\d+$/, '')
          
          return {
            id: section.id,
            type: baseType,
            enabled: true,
            order: index
            // Note: props are NOT included here - they go in sectionConfigs
          }
        })

      // Build sectionConfigs matching the demo structure
      // This is where all the variant settings, alignment, etc. go
      const sectionConfigs: Record<string, any> = {}
      sortedSections.forEach(section => {
        // Map section id to config key (e.g., 'event-details' -> 'eventDetails', 'our-story' -> 'ourStory')
        const configKey = section.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        sectionConfigs[configKey] = { ...section.props }
      })

      // Debug logging
      console.log('=== CREATE WEDDING DEBUG ===')
      console.log('Selected template:', selectedTemplateId)
      console.log('Component sections:', JSON.stringify(componentSections.map(s => ({ id: s.id, enabled: s.enabled, order: s.order, props: s.props })), null, 2))
      console.log('Section configs being sent:', JSON.stringify(sectionConfigs, null, 2))
      console.log('Components being sent:', JSON.stringify(enabledComponents, null, 2))

      const selectedFontPairing = FONT_PAIRINGS.find(p => p.id === formData.selectedFontPairingId) || DEFAULT_FONT_PAIRING

      const weddingData = {
        ...formData,
        components: enabledComponents,
        sectionConfigs,
        fontPairing: {
          display: selectedFontPairing.display,
          heading: selectedFontPairing.heading,
          body: selectedFontPairing.body,
          displayFamily: selectedFontPairing.displayFamily,
          headingFamily: selectedFontPairing.headingFamily,
          bodyFamily: selectedFontPairing.bodyFamily,
          googleFonts: selectedFontPairing.googleFonts
        }
      }

      const response = await fetch('/api/weddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weddingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create wedding website')
      }

      const result = await response.json()
      window.location.href = `/${result.weddingNameId}`
    } catch (error) {
      console.error('Error creating wedding:', error)
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateBasicInfo = (): boolean => {
    return !!(formData.partner1FirstName.trim() && formData.partner2FirstName.trim())
  }

  // Merge DB templates with file templates - prefer DB templates
  const mergedTemplates = useMemo(() => {
    // Start with PAGE_TEMPLATES from file
    const fileTemplates = PAGE_TEMPLATES.map(t => ({ ...t, source: 'file' }))
    
    // Create map for easy lookup
    const templates = new Map(fileTemplates.map(t => [t.id, t]))
    
    // Override with DB templates where available
    dbTemplates.forEach(dbTemplate => {
      // Find matching file template for metadata
      const fileTemplate = PAGE_TEMPLATES.find(t => t.id === dbTemplate.id)
      if (fileTemplate) {
        // Merge: use file template metadata but DB template page config
        templates.set(dbTemplate.id, {
          ...fileTemplate,
          ...dbTemplate,
          source: 'db',
          // Keep these from file template for UI display
          name: fileTemplate.name,
          description: fileTemplate.description,
          category: fileTemplate.category,
          preview: fileTemplate.preview,
          colorThemeId: fileTemplate.colorThemeId,
          fontPairingId: fileTemplate.fontPairingId,
          demoCouple: fileTemplate.demoCouple
        })
      } else {
        // DB template with no file template match - use DB directly
        templates.set(dbTemplate.id, { ...dbTemplate, source: 'db' })
      }
    })
    
    return Array.from(templates.values())
  }, [dbTemplates])

  const selectedTemplate = mergedTemplates.find(t => t.id === selectedTemplateId) || PAGE_TEMPLATES.find(t => t.id === selectedTemplateId)

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref="/"
        title="Create Your Wedding"
        rightContent={<div className="text-right text-sm font-medium text-primary">One Page Setup</div>}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="p-8 max-w-sm w-full mx-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Heart className="w-12 h-12 text-primary animate-pulse" />
                </div>
                <h3 className="font-serif text-xl text-foreground">Creating Your Wedding Website</h3>
                <p className="text-muted-foreground">Please wait while we set up your beautiful website...</p>
              </div>
            </Card>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ==================== SECTION 1: CORE INFORMATION ==================== */}
          <Card className="p-8 border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Essential Details</h2>
              <p className="text-muted-foreground">The basic information for your wedding website</p>
            </div>
            
            <div className="space-y-6">
              {/* Partners Names */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Your Names
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
                      <Input
                        name="partner1FirstName"
                        value={formData.partner1FirstName}
                        onChange={handleInputChange}
                        placeholder="e.g., Jorge"
                        className="border-border"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Last Name <span className="text-muted-foreground">(optional)</span></label>
                      <Input
                        name="partner1LastName"
                        value={formData.partner1LastName}
                        onChange={handleInputChange}
                        placeholder="e.g., Venegas"
                        className="border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
                      <Input
                        name="partner2FirstName"
                        value={formData.partner2FirstName}
                        onChange={handleInputChange}
                        placeholder="e.g., Yuliana"
                        className="border-border"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Last Name <span className="text-muted-foreground">(optional)</span></label>
                      <Input
                        name="partner2LastName"
                        value={formData.partner2LastName}
                        onChange={handleInputChange}
                        placeholder="e.g., Chavez"
                        className="border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Wedding Date Toggle */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">I have a wedding date</span>
                  </div>
                  <Switch
                    id="hasExistingWedding"
                    checked={formData.hasExistingWedding}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasExistingWedding: checked }))}
                  />
                </div>
                
                {formData.hasExistingWedding && (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Wedding Date</label>
                      <Input
                        name="weddingDate"
                        type="date"
                        value={formData.weddingDate}
                        onChange={handleInputChange}
                        className="border-border"
                        required={formData.hasExistingWedding}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Ceremony Time</label>
                      <Input
                        name="weddingTime"
                        type="time"
                        value={formData.weddingTime}
                        onChange={handleInputChange}
                        className="border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Reception Time</label>
                      <Input
                        name="receptionTime"
                        type="time"
                        value={formData.receptionTime}
                        onChange={handleInputChange}
                        className="border-border"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Language - Compact inline selector */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Website Language</span>
                  </div>
                  <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, locale: 'en' }))}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        formData.locale === 'en'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      🇺🇸 English
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, locale: 'es' }))}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        formData.locale === 'es'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      🇪🇸 Español
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ==================== SECTION 2: CREATION MODE ==================== */}
          <Card className="p-8 border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Starting Point</h2>
              <p className="text-muted-foreground">Select how you'd like to build your wedding website</p>
            </div>

            {/* AI Design - Elegant gold-themed design */}
            <div className="relative mb-8">
              {/* Subtle golden glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#D4AF37]/20 via-[#C9A87C]/20 to-[#B8860B]/20 rounded-2xl blur-lg opacity-60" />
              
              <div className="relative bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50 rounded-2xl p-6 border border-[#D4AF37]/30 overflow-hidden">
                {/* Subtle decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
                  <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                    <path d="M50 0C50 27.6142 27.6142 50 0 50C27.6142 50 50 72.3858 50 100C50 72.3858 72.3858 50 100 50C72.3858 50 50 27.6142 50 0Z" fill="#B8860B"/>
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 w-24 h-24 opacity-5 pointer-events-none">
                  <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" stroke="#D4AF37" strokeWidth="2"/>
                    <circle cx="50" cy="50" r="25" stroke="#D4AF37" strokeWidth="1"/>
                  </svg>
                </div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] shadow-md">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                        AI Design Assistant
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white rounded-full">
                          NEW
                        </span>
                      </h3>
                      <p className="text-sm text-stone-600">Describe your dream wedding, and we'll design it for you</p>
                    </div>
                  </div>

                  <div className="relative">
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Tell us about your wedding vision...

Example: 'A romantic garden ceremony with soft blush colors and elegant serif fonts. We love vintage touches and want to share our love story timeline.'"
                      className="min-h-28 bg-white/80 border-[#D4AF37]/30 text-stone-800 placeholder:text-stone-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 resize-none"
                    />
                    <div className="absolute bottom-3 right-3">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAiGenerate}
                        disabled={!aiPrompt.trim() || isAiGenerating}
                        className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#C9A87C] hover:to-[#D4AF37] text-white border-0 shadow-md disabled:opacity-40 disabled:bg-stone-200 disabled:from-stone-200 disabled:to-stone-300 disabled:text-stone-400 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:from-stone-200 disabled:hover:to-stone-300"
                      >
                        {isAiGenerating ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Designing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Design My Site
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Quick prompts - elegant style */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[
                      { label: 'Romantic', icon: Heart, prompt: 'A romantic and elegant wedding with soft pink and rose colors, beautiful serif fonts, and a dreamy atmosphere' },
                      { label: 'Rustic', icon: MapPin, prompt: 'A rustic barn wedding with earthy tones, warm browns and greens, cozy country vibes' },
                      { label: 'Modern', icon: Sparkles, prompt: 'A sleek modern wedding with clean lines, monochrome colors, minimalist design' },
                      { label: 'Classic', icon: Heart, prompt: 'A timeless classic wedding with elegant ivory and gold tones, traditional serif fonts' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setAiPrompt(item.prompt)}
                        className="px-3 py-1.5 text-xs font-medium bg-white/80 text-stone-600 rounded-full border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all flex items-center gap-1.5"
                      >
                        <item.icon className="w-3 h-3 text-[#D4AF37]" />
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {selectedTemplate && aiPrompt && !isAiGenerating && (
                    <div className="mt-4 p-3 bg-white/60 rounded-lg border border-[#D4AF37]/30">
                      <p className="text-sm text-stone-700">
                        <span className="text-[#B8860B] font-medium">Recommendation:</span> Based on your vision, we suggest <strong className="text-stone-800">{selectedTemplate.name}</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink mx-4 text-sm text-muted-foreground">or choose a template</span>
              <div className="flex-grow border-t border-border" />
            </div>

            {/* Mode selector - Templates or Manual */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setCreationMode('template')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  creationMode === 'template'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <LayoutTemplate className={`w-6 h-6 mb-2 ${creationMode === 'template' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="font-medium text-foreground">Browse Templates</div>
                <div className="text-xs text-muted-foreground">Curated designs ready to use</div>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('manual')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  creationMode === 'manual'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Settings className={`w-6 h-6 mb-2 ${creationMode === 'manual' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="font-medium text-foreground">Start from Scratch</div>
                <div className="text-xs text-muted-foreground">Full customization control</div>
              </button>
            </div>

            {/* Template selection */}
            {creationMode === 'template' && (
              <div className="space-y-4">
                {/* Category filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    type="button"
                    onClick={() => setTemplateCategoryFilter(null)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      templateCategoryFilter === null ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    All
                  </button>
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTemplateCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                        templateCategoryFilter === cat.id ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Template grid with enhanced cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  {isLoadingTemplates ? (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      Loading templates...
                    </div>
                  ) : (
                    mergedTemplates
                      .filter(t => !templateCategoryFilter || t.category === templateCategoryFilter)
                      .map(template => {
                        const colorTheme = COLOR_THEMES.find(t => t.id === template.colorThemeId)
                        const fontPairing = FONT_PAIRINGS.find(f => f.id === template.fontPairingId)
                        
                        return (
                          <div
                            key={template.id}
                            className={`rounded-xl border-2 transition-all hover:shadow-md overflow-hidden ${
                              selectedTemplateId === template.id
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {/* Preview header with template colors */}
                            <div 
                              className="p-4 relative"
                              style={{
                                background: `linear-gradient(135deg, ${colorTheme?.colors.primary}20, ${colorTheme?.colors.secondary}15, ${colorTheme?.colors.accent}10)`
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div 
                                  className="text-xl font-bold"
                                  style={{ 
                                    fontFamily: fontPairing?.displayFamily,
                                    color: colorTheme?.colors.primary
                                  }}
                                >
                                  {template.demoCouple?.partner1FirstName || 'Jane'} & {template.demoCouple?.partner2FirstName || 'John'}
                                </div>
                                {selectedTemplateId === template.id && (
                                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                )}
                              </div>
                              <div 
                                className="text-xs mt-1"
                                style={{ 
                                  fontFamily: fontPairing?.bodyFamily,
                                  color: colorTheme?.colors.secondary
                                }}
                              >
                                {template.demoCouple?.tagline || 'Join us on our special day'}
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-4 bg-background">
                              <div className="mb-3">
                                <h4 className="font-semibold text-foreground">{template.name}</h4>
                                <p className="text-xs text-muted-foreground">{template.description}</p>
                              </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 p-2.5 bg-muted/40 rounded-lg border border-border/30">
                              {/* Load Google Fonts for preview */}
                              <link 
                                rel="stylesheet" 
                                href={`https://fonts.googleapis.com/css2?family=${fontPairing?.googleFonts}&display=swap`} 
                              />
                              <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex gap-1.5">
                                  <div 
                                    className="w-7 h-7 rounded-full border-2 border-white shadow-lg ring-1 ring-black/10" 
                                    style={{ backgroundColor: colorTheme?.colors.primary }} 
                                    title={`Primary: ${colorTheme?.colors.primary}`}
                                  />
                                  <div 
                                    className="w-7 h-7 rounded-full border-2 border-white shadow-lg ring-1 ring-black/10" 
                                    style={{ backgroundColor: colorTheme?.colors.secondary }} 
                                    title={`Secondary: ${colorTheme?.colors.secondary}`}
                                  />
                                  <div 
                                    className="w-7 h-7 rounded-full border-2 border-white shadow-lg ring-1 ring-black/10" 
                                    style={{ backgroundColor: colorTheme?.colors.accent }} 
                                    title={`Accent: ${colorTheme?.colors.accent}`}
                                  />
                                </div>
                              </div>
                              <div className="hidden sm:block h-5 w-px bg-border" />
                              <div className="flex items-center gap-2 text-sm text-foreground">
                                <Type className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-semibold" style={{ fontFamily: fontPairing?.displayFamily }}>{fontPairing?.display}</span>
                                <span className="text-muted-foreground">&</span>
                                <span style={{ fontFamily: fontPairing?.bodyFamily }}>{fontPairing?.body}</span>
                              </div>
                            </div>
                            
                            {/* Sections */}
                            <div className="flex flex-wrap gap-1 mb-4">
                              {((template as any).pageConfig?.components || (template as any).components || []).filter((c: any) => c.enabled).map((c: any) => {
                                // Extract base type (remove numeric suffix)
                                const baseType = c.type.replace(/-\d+$/, '')
                                return (
                                  <span 
                                    key={c.id} 
                                    className="px-2 py-0.5 text-[10px] rounded-full text-muted-foreground border border-border/50"
                                  >
                                    {baseType.replace(/-/g, ' ')}
                                  </span>
                                )
                              })}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => applyTemplate(template)}
                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                                  selectedTemplateId === template.id
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-foreground hover:bg-muted/80'
                                }`}
                              >
                                {selectedTemplateId === template.id ? (
                                  <>
                                    <Check className="w-4 h-4 inline mr-1" />
                                    Selected
                                  </>
                                ) : (
                                  'Use Template'
                                )}
                              </button>
                              <Link 
                                href={(template as any).weddingNameId ? `/${(template as any).weddingNameId}` : `/demo/${template.id}`}
                                target="_blank"
                                className="py-2 px-3 text-sm font-medium rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-all flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                Demo
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* Bulk Photo Upload - Template Mode Only */}
            {creationMode === 'template' && selectedTemplateId && (
              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Camera className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Add Your Photos</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload your wedding photos and we'll automatically distribute them across your template's gallery, hero section, and story pages
                      </p>
                    </div>
                  </div>
                  
                  {/* Photo upload area */}
                  <div className="space-y-3">
                    <div 
                      className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:bg-primary/5 transition-colors cursor-pointer bg-background"
                      onClick={() => document.getElementById('bulk-photo-input')?.click()}
                    >
                      <Camera className="w-8 h-8 text-primary/40 mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">Click to select photos</p>
                      <p className="text-xs text-muted-foreground mt-1">Select multiple images at once</p>
                      <input
                        id="bulk-photo-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length === 0) return
                          
                          setUploadProgress(0)
                          // Upload all files and collect URLs
                          const uploadedUrls: string[] = []
                          let uploadedCount = 0
                          
                          for (const file of files) {
                            try {
                              const formData = new FormData()
                              formData.append('file', file)
                              
                              const response = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData
                              })
                              
                              if (response.ok) {
                                const data = await response.json()
                                if (data.url) {
                                  uploadedUrls.push(data.url)
                                }
                              }
                            } catch (error) {
                              console.error(`Error uploading ${file.name}:`, error)
                            }
                            
                            uploadedCount++
                            setUploadProgress(Math.round((uploadedCount / files.length) * 100))
                          }
                          
                          // Update state and auto-distribute once after all uploads complete
                          if (uploadedUrls.length > 0) {
                            const allPhotos = [...uploadedPhotos, ...uploadedUrls]
                            setUploadedPhotos(allPhotos)
                            setUploadProgress(0)
                            
                            // Auto-distribute photos to sections
                            await distributePhotosToSectionsWithUrls(allPhotos)
                            
                            // Show success toast
                            toast.success(`${uploadedUrls.length} photo${uploadedUrls.length !== 1 ? 's' : ''} uploaded and distributed!`, {
                              description: `Photos have been automatically arranged across your sections`
                            })
                          }
                          
                          // Reset input
                          e.target.value = ''
                        }}
                        className="hidden"
                      />
                    </div>

                    {/* Upload progress */}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Uploading photos...</span>
                          <span className="font-medium text-primary">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Uploaded photos preview */}
                    {uploadedPhotos.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">
                            {uploadedPhotos.length} photo{uploadedPhotos.length !== 1 ? 's' : ''} uploaded
                          </p>
                          <button
                            type="button"
                            onClick={() => setUploadedPhotos([])}
                            className="text-xs text-muted-foreground hover:text-foreground font-medium"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {uploadedPhotos.map((photo, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-lg overflow-hidden group"
                            >
                              <img
                                src={photo}
                                alt={`Uploaded ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setUploadedPhotos(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              >
                                <X className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Auto-distribute button */}
                  {uploadedPhotos.length > 0 && (
                    <Button
                      type="button"
                      onClick={distributePhotosToSections}
                      disabled={isDistributingPhotos}
                      className="w-full"
                    >
                      {isDistributingPhotos ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          Distributing Photos...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Auto-Arrange Photos to Sections
                        </>
                      )}
                    </Button>
                  )}

                  {uploadedPhotos.length > 0 && (
                    <p className="text-xs text-blue-600 text-center">
                      ✨ Photos will be automatically placed in gallery, hero, story, and event sections
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Manual mode message */}
            {creationMode === 'manual' && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                <Settings className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-foreground font-medium">Full Customization Mode</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure every detail using the styling and advanced settings below
                </p>
              </div>
            )}
          </Card>

          {/* ==================== SECTION 3: STYLING ==================== */}
          <Card className="p-8 border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Style Your Website</h2>
              <p className="text-muted-foreground">Colors and typography for your wedding theme</p>
            </div>

            <div className="space-y-6">
              {/* Color Palette */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Color Palette
                </h3>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 hover:border-primary/50 hover:shadow-md"
                    >
                      {(() => {
                        const selectedPalette = COLOR_THEMES.find(t => t.id === formData.selectedColorThemeId)
                        return selectedPalette ? (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1">
                                <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: selectedPalette.colors.primary }} />
                                <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: selectedPalette.colors.secondary }} />
                                <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: selectedPalette.colors.accent }} />
                              </div>
                              <span className="text-foreground font-medium">{selectedPalette.name}</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-muted-foreground">Select a color palette</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )
                      })()}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0 max-h-80 overflow-hidden flex flex-col"
                    align="start"
                    sideOffset={8}
                  >
                    <div className="flex gap-1.5 p-3 border-b border-border bg-muted/30 overflow-x-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setColorPaletteCategoryFilter(null)}
                        className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap flex-shrink-0 ${
                          colorPaletteCategoryFilter === null ? 'bg-primary text-white' : 'bg-background text-foreground hover:bg-muted border border-border'
                        }`}
                      >
                        All
                      </button>
                      {COLOR_THEME_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setColorPaletteCategoryFilter(cat.id)}
                          className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap flex-shrink-0 ${
                            colorPaletteCategoryFilter === cat.id ? 'bg-primary text-white' : 'bg-background text-foreground hover:bg-muted border border-border'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                      <div className="grid grid-cols-4 gap-2">
                        {COLOR_THEME_CATEGORIES
                          .filter(category => colorPaletteCategoryFilter === null || category.id === colorPaletteCategoryFilter)
                          .flatMap(category => category.themes)
                          .map((theme) => (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedColorThemeId: theme.id,
                                  primaryColor: theme.colors.primary,
                                  secondaryColor: theme.colors.secondary,
                                  accentColor: theme.colors.accent
                                }))
                              }}
                              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                                formData.selectedColorThemeId === theme.id ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted'
                              }`}
                            >
                              <div className="flex gap-0.5">
                                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.secondary }} />
                                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                              </div>
                              <span className="text-[10px] text-foreground/80 truncate w-full text-center">{theme.name}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Font Style */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Type className="w-4 h-4 text-primary" />
                  Font Style
                </h3>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all hover:border-primary/50 hover:shadow-md"
                    >
                      {(() => {
                        const selectedFontPairing = FONT_PAIRINGS.find(p => p.id === formData.selectedFontPairingId)
                        return selectedFontPairing ? (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="font-medium text-foreground">{selectedFontPairing.name}</span>
                              <span className="text-xs text-muted-foreground" style={{ fontFamily: selectedFontPairing.displayFamily }}>
                                {selectedFontPairing.display}
                              </span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-muted-foreground">Select a font pairing</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )
                      })()}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0 max-h-80 overflow-hidden flex flex-col"
                    align="start"
                    sideOffset={8}
                  >
                    <div className="flex gap-1.5 p-3 border-b border-border bg-muted/30 overflow-x-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setFontPairingCategoryFilter(null)}
                        className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap flex-shrink-0 ${
                          fontPairingCategoryFilter === null ? 'bg-primary text-white' : 'bg-background text-foreground hover:bg-muted border border-border'
                        }`}
                      >
                        All
                      </button>
                      {FONT_PAIRING_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFontPairingCategoryFilter(cat.id)}
                          className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap flex-shrink-0 ${
                            fontPairingCategoryFilter === cat.id ? 'bg-primary text-white' : 'bg-background text-foreground hover:bg-muted border border-border'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                      {FONT_PAIRING_CATEGORIES
                        .filter(category => fontPairingCategoryFilter === null || category.id === fontPairingCategoryFilter)
                        .map(category => (
                          <div key={category.id}>
                            {category.pairings.map((pairing) => (
                              <button
                                key={`${category.id}-${pairing.id}`}
                                type="button"
                                onClick={() => {
                                  const uniqueId = getFontPairingUniqueId(category.id, pairing.id)
                                  setFormData(prev => ({ ...prev, selectedFontPairingId: uniqueId }))
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all text-left ${
                                  formData.selectedFontPairingId === getFontPairingUniqueId(category.id, pairing.id) ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted'
                                }`}
                              >
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-medium text-foreground">{pairing.name}</span>
                                  <span className="text-xs" style={{ fontFamily: pairing.displayFamily }}>{pairing.display}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Card>

          {/* ==================== SECTION 4: ADVANCED SETTINGS ==================== */}
          <Card className="p-6 border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Page Sections & Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure individual sections and their layouts</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${showAdvancedSettings ? 'rotate-180' : ''}`} />
            </button>
          </Card>

          {/* Component Sections */}
          {showAdvancedSettings && (
            <Card className="p-6 border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="space-y-3">
                {componentSections.map((section) => {
                  const IconComponent = section.icon
                  const isCountdown = section.id.replace(/-\d+$/, '') === 'countdown'
                  const canEnable = !isCountdown || (formData.hasExistingWedding && formData.weddingDate)
                  
                  return (
                    <div 
                      key={section.id} 
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      {/* Section Header */}
                      <div className={`flex items-center justify-between p-4 ${section.enabled ? 'bg-muted/30' : 'bg-background'}`}>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={!!(section.enabled && canEnable)}
                            onCheckedChange={() => canEnable && toggleComponent(section.id)}
                            disabled={!canEnable}
                          />
                          <IconComponent className={`w-5 h-5 ${section.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div>
                            <h4 className="font-medium text-foreground">{section.name}</h4>
                            <p className="text-xs text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                        
                        {section.enabled && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(section.id)}
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${section.expanded ? 'rotate-90' : ''}`} />
                          </Button>
                        )}
                      </div>

                      {/* Section Configuration */}
                      {section.enabled && section.expanded && (
                        <div className="border-t border-border bg-background p-4">
                          {/* Hero Section Config */}
                          {section.id.replace(/-\d+$/, '') === 'hero' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Layout Style</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {HERO_VARIANTS.map(v => (
                                    <button
                                      key={v.value}
                                      type="button"
                                      onClick={() => updateComponentProp(section.id, 'variant', v.value)}
                                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                                        section.props.variant === v.value
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:border-primary/50'
                                      } ${v.requiresImage && !section.props.heroImageUrl ? 'opacity-50' : ''}`}
                                    >
                                      <div className="text-xs font-medium">{v.label}</div>
                                      <div className="text-[10px] text-muted-foreground mt-0.5">{v.description}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Hero Image</label>
                                <ImageUpload
                                  onUpload={(url) => updateComponentProp(section.id, 'heroImageUrl', url)}
                                  currentImageUrl={section.props.heroImageUrl || ""}
                                  placeholder="Upload your hero photo"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Tagline</label>
                                <Input
                                  value={section.props.tagline || ""}
                                  onChange={(e) => updateComponentProp(section.id, 'tagline', e.target.value)}
                                  placeholder="Join us as we tie the knot!"
                                />
                              </div>
                              <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                  <Switch
                                    checked={section.props.showTagline}
                                    onCheckedChange={(checked) => updateComponentProp(section.id, 'showTagline', checked)}
                                  />
                                  Show Tagline
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                  <Switch
                                    checked={section.props.showCountdown}
                                    onCheckedChange={(checked) => updateComponentProp(section.id, 'showCountdown', checked)}
                                  />
                                  Show Countdown
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                  <Switch
                                    checked={section.props.showRSVPButton}
                                    onCheckedChange={(checked) => updateComponentProp(section.id, 'showRSVPButton', checked)}
                                  />
                                  Show RSVP Button
                                </label>
                              </div>
                            </div>
                          )}

                          {/* Countdown Section Config */}
                          {section.id.replace(/-\d+$/, '') === 'countdown' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Style</label>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                  {COUNTDOWN_VARIANTS.map(v => (
                                    <button
                                      key={v.value}
                                      type="button"
                                      onClick={() => updateComponentProp(section.id, 'variant', v.value)}
                                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                                        section.props.variant === v.value
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="text-xs font-medium">{v.label}</div>
                                      <div className="text-[10px] text-muted-foreground mt-0.5">{v.description}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                                <Input
                                  value={section.props.message || ""}
                                  onChange={(e) => updateComponentProp(section.id, 'message', e.target.value)}
                                  placeholder='Until we say "I do"'
                                />
                              </div>
                            </div>
                          )}

                          {/* Banner Section Config */}
                          {section.id.replace(/-\d+$/, '') === 'banner' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Banner Image</label>
                                <ImageUpload
                                  onUpload={(url) => updateComponentProp(section.id, 'imageUrl', url)}
                                  currentImageUrl={section.props.imageUrl || ""}
                                  placeholder="Upload banner image"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Banner Height</label>
                                <div className="flex gap-2">
                                  {[
                                    { value: 'small', label: 'Small' },
                                    { value: 'medium', label: 'Medium' },
                                    { value: 'large', label: 'Large' },
                                    { value: 'full', label: 'Full' }
                                  ].map(height => (
                                    <button
                                      key={height.value}
                                      type="button"
                                      onClick={() => updateComponentProp(section.id, 'bannerHeight', height.value)}
                                      className={`flex-1 py-2 px-3 rounded-lg border-2 text-xs font-medium transition-all ${
                                        section.props.bannerHeight === height.value
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      {height.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                                <Input
                                  value={section.props.title || ""}
                                  onChange={(e) => updateComponentProp(section.id, 'title', e.target.value)}
                                  placeholder="Banner title (optional)"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Subtitle</label>
                                <Input
                                  value={section.props.subtitle || ""}
                                  onChange={(e) => updateComponentProp(section.id, 'subtitle', e.target.value)}
                                  placeholder="Banner subtitle (optional)"
                                />
                              </div>
                              <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                  <Switch
                                    checked={section.props.showText !== false}
                                    onCheckedChange={(checked) => updateComponentProp(section.id, 'showText', checked)}
                                  />
                                  Show Text Overlay
                                </label>
                              </div>
                            </div>
                          )}

                          {/* Event Details Config */}
                          {section.id.replace(/-\d+$/, '') === 'event-details' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Layout Style</label>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                  {EVENT_VARIANTS.map(v => (
                                    <button
                                      key={v.value}
                                      type="button"
                                      onClick={() => updateComponentProp(section.id, 'variant', v.value)}
                                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                                        section.props.variant === v.value
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="text-xs font-medium">{v.label}</div>
                                      <div className="text-[10px] text-muted-foreground mt-0.5">{v.description}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Events List */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <label className="block text-sm font-medium text-foreground">Events</label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const events = section.props.events || []
                                      const newEvent = {
                                        id: `event-${Date.now()}`,
                                        type: 'ceremony',
                                        title: 'Ceremony',
                                        time: '16:00',
                                        venue: '',
                                        address: '',
                                        description: '',
                                        imageUrl: '',
                                        order: events.length,
                                        useWeddingDate: true,
                                        date: formData.weddingDate || ''
                                      }
                                      updateComponentProp(section.id, 'events', [...events, newEvent])
                                    }}
                                    className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                                  >
                                    Add Event
                                  </button>
                                </div>

                                {(section.props.events || []).map((event: any, index: number) => (
                                  <div key={event.id} className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium text-sm">{event.title || `Event ${index + 1}`}</h4>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const events = section.props.events || []
                                          updateComponentProp(section.id, 'events', events.filter((_: any, i: number) => i !== index))
                                        }}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Event Title</label>
                                        <Input
                                          value={event.title || ''}
                                          onChange={(e) => {
                                            const events = [...(section.props.events || [])]
                                            events[index] = { ...events[index], title: e.target.value }
                                            updateComponentProp(section.id, 'events', events)
                                          }}
                                          placeholder="e.g., Ceremony"
                                          className="h-9"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Time</label>
                                        <Input
                                          type="time"
                                          value={event.time || ''}
                                          onChange={(e) => {
                                            const events = [...(section.props.events || [])]
                                            events[index] = { ...events[index], time: e.target.value }
                                            updateComponentProp(section.id, 'events', events)
                                          }}
                                          className="h-9"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Venue</label>
                                        <Input
                                          value={event.venue || ''}
                                          onChange={(e) => {
                                            const events = [...(section.props.events || [])]
                                            events[index] = { ...events[index], venue: e.target.value }
                                            updateComponentProp(section.id, 'events', events)
                                          }}
                                          placeholder="Venue name"
                                          className="h-9"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
                                        <Input
                                          value={event.address || ''}
                                          onChange={(e) => {
                                            const events = [...(section.props.events || [])]
                                            events[index] = { ...events[index], address: e.target.value }
                                            updateComponentProp(section.id, 'events', events)
                                          }}
                                          placeholder="Full address"
                                          className="h-9"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-muted-foreground mb-1">Event Image</label>
                                      <ImageUpload
                                        onUpload={(url) => {
                                          const events = [...(section.props.events || [])]
                                          events[index] = { ...events[index], imageUrl: url }
                                          updateComponentProp(section.id, 'events', events)
                                        }}
                                        currentImageUrl={event.imageUrl || ''}
                                        placeholder="Upload event photo"
                                      />
                                    </div>
                                  </div>
                                ))}
                                
                                {(!section.props.events || section.props.events.length === 0) && (
                                  <div className="text-center py-6 text-muted-foreground text-sm">
                                    No events added yet. Click "Add Event" to create one.
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                  <Switch
                                    checked={section.props.showMapLinks}
                                    onCheckedChange={(checked) => updateComponentProp(section.id, 'showMapLinks', checked)}
                                  />
                                  Show Map Links
                                </label>
                              </div>
                            </div>
                          )}

                          {/* Our Story Config */}
                          {section.id.replace(/-\d+$/, '') === 'our-story' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Layout Style</label>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                  {STORY_VARIANTS.map(v => (
                                    <button
                                      key={v.value}
                                      type="button"
                                      onClick={() => updateComponentProp(section.id, 'variant', v.value)}
                                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                                        section.props.variant === v.value
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="text-xs font-medium">{v.label}</div>
                                      <div className="text-[10px] text-muted-foreground mt-0.5">{v.description}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">How We Met</label>
                                <Textarea
                                  value={section.props.howWeMetText || ""}
                                  onChange={(e) => updateComponentProp(section.id, 'howWeMetText', e.target.value)}
                                  placeholder="Tell your love story..."
                                  className="min-h-20"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">How We Met Photo</label>
                                <ImageUpload
                                  onUpload={(url) => updateComponentProp(section.id, 'howWeMetPhoto', url)}
                                  currentImageUrl={section.props.howWeMetPhoto || ""}
                                  placeholder="Upload photo for how we met story"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">The Proposal</label>
                                <Textarea
                                  value={section.props.proposalText || ""}
                                  onChange={(e) => updateComponentProp(section.id, 'proposalText', e.target.value)}
                                  placeholder="How did you propose..."
                                  className="min-h-20"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Proposal Photo</label>
                                <ImageUpload
                                  onUpload={(url) => updateComponentProp(section.id, 'proposalPhoto', url)}
                                  currentImageUrl={section.props.proposalPhoto || ""}
                                  placeholder="Upload photo for proposal story"
                                />
                              </div>
                            </div>
                          )}

                          {/* Gallery Config */}
                          {section.id.replace(/-\d+$/, '') === 'gallery' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Layout Style</label>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                  {GALLERY_VARIANTS.map(v => (
                                    <button
                                      key={v.value}
                                      type="button"
                                      onClick={() => updateComponentProp(section.id, 'variant', v.value)}
                                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                                        section.props.variant === v.value
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="text-xs font-medium">{v.label}</div>
                                      <div className="text-[10px] text-muted-foreground mt-0.5">{v.description}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {(section.props.variant === 'grid') && (
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-2">Grid Columns</label>
                                  <div className="flex gap-2">
                                    {[2, 3, 4, 5, 6].map(n => (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() => updateComponentProp(section.id, 'gridColumns', n)}
                                        className={`w-10 h-10 rounded-lg border-2 ${
                                          section.props.gridColumns === n
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                      >
                                        {n}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {section.props.variant === 'masonry' && (
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-2">Masonry Columns</label>
                                  <div className="flex gap-2">
                                    {[2, 3, 4, 5].map(n => (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() => updateComponentProp(section.id, 'masonryColumns', n)}
                                        className={`w-10 h-10 rounded-lg border-2 ${
                                          section.props.masonryColumns === n
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                      >
                                        {n}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {section.props.variant === 'collage' && (
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-2">Collage Columns</label>
                                  <div className="flex gap-2">
                                    {[2, 3, 4, 5, 6].map(n => (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() => updateComponentProp(section.id, 'gridColumns', n)}
                                        className={`w-10 h-10 rounded-lg border-2 ${
                                          (section.props.gridColumns || 4) === n
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                      >
                                        {n}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Photo Management */}
                              <div className="border-t pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <label className="block text-sm font-medium text-foreground">Gallery Photos</label>
                                  <div className="flex gap-2">
                                    <input
                                      id={`gallery-photo-input-${section.id}`}
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={async (e) => {
                                        const files = Array.from(e.target.files || [])
                                        if (files.length === 0) return
                                        
                                        const uploadedUrls: string[] = []
                                        for (const file of files) {
                                          try {
                                            const formData = new FormData()
                                            formData.append('file', file)
                                            
                                            const response = await fetch('/api/upload', {
                                              method: 'POST',
                                              body: formData
                                            })
                                            
                                            if (response.ok) {
                                              const data = await response.json()
                                              if (data.url) {
                                                uploadedUrls.push(data.url)
                                              }
                                            }
                                          } catch (error) {
                                            console.error(`Error uploading ${file.name}:`, error)
                                          }
                                        }
                                        
                                        if (uploadedUrls.length > 0) {
                                          const photos = section.props.photos || []
                                          const newPhotos = uploadedUrls.map(url => ({
                                            id: `photo-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                                            url,
                                            caption: '',
                                            alt: ''
                                          }))
                                          updateComponentProp(section.id, 'photos', [...photos, ...newPhotos])
                                        }
                                        
                                        e.target.value = ''
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => document.getElementById(`gallery-photo-input-${section.id}`)?.click()}
                                      className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
                                    >
                                      <Upload className="w-3 h-3" />
                                      Upload Photos
                                    </button>
                                  </div>
                                </div>

                                {(section.props.photos || []).length > 0 ? (
                                  <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {(section.props.photos || []).map((photo: any, index: number) => (
                                      <div key={photo.id} className="p-3 bg-muted/30 rounded-lg border border-border space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium text-muted-foreground">Photo {index + 1}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const photos = section.props.photos || []
                                              updateComponentProp(section.id, 'photos', photos.filter((_: any, i: number) => i !== index))
                                            }}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                        {photo.url && (
                                          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                              src={photo.url}
                                              alt={photo.caption || `Photo ${index + 1}`}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        )}
                                        <Input
                                          value={photo.caption || ''}
                                          onChange={(e) => {
                                            const photos = [...(section.props.photos || [])]
                                            photos[index] = { ...photos[index], caption: e.target.value }
                                            updateComponentProp(section.id, 'photos', photos)
                                          }}
                                          placeholder="Photo caption (optional)"
                                          className="h-8 text-xs"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-muted-foreground text-sm">
                                    No photos added yet. Click "Upload Photos" to add multiple images at once.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* RSVP Config */}
                          {section.id.replace(/-\d+$/, '') === 'rsvp' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Style</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {RSVP_VARIANTS.map(v => (
                                    <button
                                      key={v.value}
                                      type="button"
                                      onClick={() => updateComponentProp(section.id, 'variant', v.value)}
                                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                                        section.props.variant === v.value
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="text-sm font-medium">{v.label}</div>
                                      <div className="text-xs text-muted-foreground">{v.description}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                  <Switch
                                    checked={section.props.embedForm}
                                    onCheckedChange={(checked) => updateComponentProp(section.id, 'embedForm', checked)}
                                  />
                                  Show Full Form
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                  <Switch
                                    checked={section.props.showMealPreferences}
                                    onCheckedChange={(checked) => updateComponentProp(section.id, 'showMealPreferences', checked)}
                                  />
                                  Meal Preferences
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                  <Switch
                                    checked={section.props.showTravelInfo}
                                    onCheckedChange={(checked) => updateComponentProp(section.id, 'showTravelInfo', checked)}
                                  />
                                  Travel Info
                                </label>
                              </div>
                            </div>
                          )}

                          {/* FAQ Config */}
                          {section.id.replace(/-\d+$/, '') === 'faq' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Style</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {FAQ_VARIANTS.map(v => (
                                    <button
                                      key={v.value}
                                      type="button"
                                      onClick={() => updateComponentProp(section.id, 'variant', v.value)}
                                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                                        section.props.variant === v.value
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="text-xs font-medium">{v.label}</div>
                                      <div className="text-[10px] text-muted-foreground mt-0.5">{v.description}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                FAQ questions can be added after your website is created.
                              </p>
                            </div>
                          )}

                          {/* Registry Config */}
                          {section.id.replace(/-\d+$/, '') === 'registry' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Layout Style</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {REGISTRY_VARIANTS.map(v => (
                                    <button
                                      key={v.value}
                                      type="button"
                                      onClick={() => updateComponentProp(section.id, 'variant', v.value)}
                                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                                        section.props.variant === v.value
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="text-xs font-medium">{v.label}</div>
                                      <div className="text-[10px] text-muted-foreground mt-0.5">{v.description}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Registry links and custom items can be added after your website is created.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* ==================== SECTION 5: CREATE BUTTON ==================== */}
          <Card className="p-6 border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Ready to Create?</h3>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                <span>✓ {formData.partner1FirstName && formData.partner2FirstName ? `${formData.partner1FirstName} & ${formData.partner2FirstName}` : 'Enter names above'}</span>
                {formData.hasExistingWedding && formData.weddingDate && (
                  <span>✓ {formData.weddingDate}</span>
                )}
                <span>✓ {componentSections.filter(s => s.enabled).length} sections</span>
              </div>
            </div>

            {submitError && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg mb-4">
                <p className="text-sm text-destructive">❌ {submitError}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full text-lg py-6 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={isSubmitting || !validateBasicInfo()}
            >
              {isSubmitting ? (
                <>
                  <Heart className="w-5 h-5 mr-2 animate-pulse" />
                  Creating Your Website...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Create Wedding Website
                </>
              )}
            </Button>
          </Card>
        </form>

        {/* Live Preview */}
        {(formData.partner1FirstName || formData.partner2FirstName) && (
          <Card className="mt-8 p-6 border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WeddingPreview 
              formData={formData}
              componentSections={previewComponentSections}
            />
          </Card>
        )}
      </div>
    </main>
  )
}

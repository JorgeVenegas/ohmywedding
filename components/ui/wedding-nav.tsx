"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useI18n } from '@/components/contexts/i18n-context'

interface SectionLink {
  id: string
  label: string
}

interface ThemeColors {
  primary?: string
  secondary?: string
  accent?: string
  foreground?: string
  background?: string
  muted?: string
}

export interface SubPageLink {
  id: string
  label: string
  href: string
  isActive: boolean
}

interface WeddingNavProps {
  person1Name: string
  person2Name: string
  accentColor?: string
  showNavLinks?: boolean
  enabledSections?: string[]
  /** Page-level navigation links (rendered alongside scroll anchors) */
  subPageLinks?: SubPageLink[]
  // Color background options
  useColorBackground?: boolean
  backgroundColorChoice?: 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'
  themeColors?: ThemeColors
  /** When true, nav is always visible without waiting to scroll past the hero */
  alwaysVisible?: boolean
  /** When set, section links navigate to this URL with a #sectionId hash instead of scrolling in-page */
  mainPageHref?: string
}

// Export visibility state for other components to use
export const NAV_HEIGHT = 76 // Taller nav with links: py-3 + content

// Helper to calculate relative luminance
function getLuminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g)
  if (!rgb) return 0
  const [r, g, b] = rgb.map(c => {
    const val = parseInt(c, 16) / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Helper to check if a color is light
function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.5
}

// Helper to create a light tint of a color (blend towards white)
function getLightTint(hex: string, amount: number): string {
  const rgb = hex.replace('#', '').match(/.{2}/g)
  if (!rgb) return hex
  const result = rgb.map(c => {
    const val = parseInt(c, 16)
    const white = 255
    const blended = Math.round(val + (white - val) * amount)
    return Math.min(255, blended).toString(16).padStart(2, '0')
  })
  return `#${result.join('')}`
}

// Helper to create a light tint of a color
function getLightTintNav(hex: string, tintAmount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const newR = Math.round(r + (255 - r) * tintAmount)
  const newG = Math.round(g + (255 - g) * tintAmount)
  const newB = Math.round(b + (255 - b) * tintAmount)
  return `rgb(${newR}, ${newG}, ${newB})`
}

// Get color scheme for nav based on background choice
function getNavColorScheme(
  themeColors: ThemeColors | undefined,
  backgroundColorChoice: 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter',
  useColorBackground: boolean
): {
  bgColor: string
  textColor: string
  textColorMuted: string
  borderColor: string
  isColored: boolean
} {
  if (!useColorBackground || backgroundColorChoice === 'none' || !themeColors) {
    return {
      bgColor: 'rgba(255, 255, 255, 0.95)',
      textColor: themeColors?.primary || '#B8860B',
      textColorMuted: '#6b7280',
      borderColor: 'rgba(0, 0, 0, 0.05)',
      isColored: false
    }
  }

  const { primary = '#B8860B', secondary = '#9ba082', accent = '#e6b5a3' } = themeColors

  // Helper to get base color and detect light variants
  const getBaseColorChoice = (c: string) => c.replace('-lighter', '').replace('-light', '') as 'primary' | 'secondary' | 'accent'
  const isLightVariant = backgroundColorChoice.endsWith('-light') && !backgroundColorChoice.endsWith('-lighter')
  const isLighterVariant = backgroundColorChoice.endsWith('-lighter')
  
  const baseChoice = getBaseColorChoice(backgroundColorChoice)
  
  let baseColor: string
  switch (baseChoice) {
    case 'primary': baseColor = primary; break
    case 'secondary': baseColor = secondary; break
    case 'accent': baseColor = accent; break
    default: baseColor = primary
  }

  // Apply light tint if needed
  let finalBgColor = baseColor
  if (isLightVariant) {
    finalBgColor = getLightTintNav(baseColor, 0.5)
  } else if (isLighterVariant) {
    finalBgColor = getLightTintNav(baseColor, 0.88)
  }

  // Light and lighter variants are always light backgrounds
  const bgIsLight = isLightColor(baseColor) || isLightVariant || isLighterVariant
  
  // Find the lightest color for creamy text on dark backgrounds
  const colors = [primary, secondary, accent]
  const lightestColor = colors.reduce((lightest, c) => 
    getLuminance(c) > getLuminance(lightest) ? c : lightest
  , colors[0])
  
  const creamyText = getLightTint(lightestColor, 0.7)
  
  // Get darkest color for text on light backgrounds
  const darkestColor = colors.reduce((darkest, c) => 
    getLuminance(c) < getLuminance(darkest) ? c : darkest
  , colors[0])

  return {
    bgColor: finalBgColor,
    textColor: bgIsLight ? darkestColor : creamyText,
    textColorMuted: bgIsLight ? getLightTint(darkestColor, 0.3) : getLightTint(lightestColor, 0.5),
    borderColor: bgIsLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    isColored: true
  }
}

export function WeddingNav({
  person1Name,
  person2Name,
  accentColor = '#B8860B',
  showNavLinks = true,
  enabledSections = [],
  subPageLinks = [],
  useColorBackground = false,
  backgroundColorChoice = 'none',
  themeColors,
  alwaysVisible = false,
  mainPageHref,
}: WeddingNavProps) {
  const [isVisible, setIsVisible] = useState(alwaysVisible)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const rafRef = useRef<number | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const { t, locale } = useI18n()

  // Section labels mapping using i18n
  const getSectionLabel = (sectionId: string): string => {
    const labelMap: Record<string, string> = {
      'hero': t('nav.home'),
      'our-story': t('nav.ourStory'),
      'countdown': t('countdown.title'),
      'event-details': t('nav.eventDetails'),
      'gallery': t('nav.gallery'),
      'registry': t('registry.title'),
      'rsvp': t('nav.rsvp'),
      'faq': t('nav.faq'),
      'dress-code': t('nav.dressCode'),
      'hotel-suggestions': t('hotelSuggestions.navLabel'),
    }
    return labelMap[sectionId] || sectionId
  }

  // Get color scheme for nav
  const { bgColor, textColor, textColorMuted, borderColor, isColored } = getNavColorScheme(
    themeColors,
    backgroundColorChoice,
    useColorBackground
  )

  useEffect(() => {
    // Get the scroll context based on where the nav is rendered
    const getScrollContext = () => {
      // Use the ref to get the nav element's document context
      const nav = navRef.current
      if (!nav) return { scrollTarget: window, docTarget: document }
      
      // Get the ownerDocument of the nav element - this will be the iframe's document if portaled
      const ownerDoc = nav.ownerDocument
      const ownerWindow = ownerDoc.defaultView || window
      
      return { scrollTarget: ownerWindow, docTarget: ownerDoc }
    }
    
    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      
      rafRef.current = requestAnimationFrame(() => {
        const { docTarget, scrollTarget } = getScrollContext()
        
        // Try to find the actual hero section by id
        const heroSection = docTarget.getElementById('hero')
        const scrollY = scrollTarget.scrollY ?? docTarget.documentElement?.scrollTop ?? 0

        // If no hero element exists, show immediately; otherwise wait until it scrolls out
        const heroHeight = heroSection?.offsetHeight ?? 0
        const shouldShow = alwaysVisible || scrollY >= heroHeight

        setIsVisible(shouldShow)
      })
    }

    // Set up scroll listener after a brief delay to ensure DOM is ready
    const setupListener = () => {
      const { scrollTarget } = getScrollContext()
      
      // Remove any existing listener first
      scrollTarget.removeEventListener('scroll', handleScroll)
      
      // Add the listener
      scrollTarget.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll() // Check initial position
      return scrollTarget
    }
    
    // Use multiple attempts to set up the listener (helps with iframe portaling)
    let attempts = 0
    const maxAttempts = 10
    let currentScrollTarget: Window | null = null
    
    const trySetup = () => {
      attempts++
      if (navRef.current) {
        currentScrollTarget = setupListener() as Window
      } else if (attempts < maxAttempts) {
        setTimeout(trySetup, 100)
      }
    }
    
    // Initial setup attempt
    const timer = setTimeout(trySetup, 50)
    
    return () => {
      clearTimeout(timer)
      if (currentScrollTarget) {
        currentScrollTarget.removeEventListener('scroll', handleScroll)
      }
      // Also try to clean up from window in case
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // Get initials from names
  const getInitial = (name: string) => {
    return name.trim().charAt(0).toUpperCase()
  }

  const person1Initial = getInitial(person1Name)
  const person2Initial = getInitial(person2Name)
  const initials = person1Initial && person2Initial
    ? `${person1Initial}<span style="font-size: 0.7em; margin: 0 0.1em;">${locale === 'es' ? 'Y' : '&'}</span>${person2Initial}`
    : [person1Initial, person2Initial].filter(Boolean).join('')

  // Valid section ids that we support in navigation
  const validSectionIds = ['hero', 'our-story', 'countdown', 'event-details', 'gallery', 'registry', 'rsvp', 'faq', 'dress-code', 'hotel-suggestions']

  // Generate section links from enabled sections (including hero as "Home")
  const sectionLinks: SectionLink[] = enabledSections
    .filter(sectionId => validSectionIds.includes(sectionId))
    .map(sectionId => ({
      id: sectionId,
      label: getSectionLabel(sectionId)
    }))

  // Handle smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const nav = document.getElementById('wedding-nav')
    const ownerDoc = nav?.ownerDocument || document
    
    // Map section type to actual DOM id
    const elementId = sectionId === 'event-details' ? 'event-details' : sectionId
    const element = ownerDoc.getElementById(elementId)
    
    if (element) {
      const navHeight = NAV_HEIGHT
      const elementPosition = element.getBoundingClientRect().top
      const ownerWindow = ownerDoc.defaultView || window
      const offsetPosition = elementPosition + ownerWindow.scrollY - navHeight - 16
      
      ownerWindow.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
    
    // Close mobile menu after clicking
    setIsMobileMenuOpen(false)
  }

  // Track which section is currently in view to highlight it in the nav.
  // Only applies when scrolling within this page (no mainPageHref, i.e. sections live here).
  const sectionIdsKey = sectionLinks.map(link => link.id).join(',')
  useEffect(() => {
    if (mainPageHref || !sectionIdsKey) {
      setActiveSectionId(null)
      return
    }

    let observer: IntersectionObserver | null = null
    let attempts = 0
    const maxAttempts = 10

    const trySetup = () => {
      attempts++
      const nav = navRef.current
      const ownerDoc = nav?.ownerDocument || document
      const ids = sectionIdsKey.split(',')
      const elements = ids
        .map(id => ({ id, el: ownerDoc.getElementById(id) }))
        .filter((e): e is { id: string; el: HTMLElement } => !!e.el)

      if (elements.length === 0) {
        if (attempts < maxAttempts) setTimeout(trySetup, 150)
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          if (visible.length > 0) {
            const match = elements.find(e => e.el === visible[0].target)
            if (match) setActiveSectionId(match.id)
          }
        },
        {
          rootMargin: `-${NAV_HEIGHT + 20}px 0px -60% 0px`,
          threshold: 0,
        }
      )

      elements.forEach(({ el }) => observer!.observe(el))
    }

    const timer = setTimeout(trySetup, 100)

    return () => {
      clearTimeout(timer)
      observer?.disconnect()
    }
  }, [mainPageHref, sectionIdsKey])

  // Dispatch custom event when visibility changes so other components can react
  // Dispatch to both parent window and current context to ensure EditingTopBar receives it
  // Also include nav height info for control buttons positioning
  useEffect(() => {
    // Calculate current nav height based on screen size
    const hasDesktopLinks = showNavLinks && (sectionLinks.length > 0 || subPageLinks.length > 0)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const navHeight = isMobile ? 56 : (hasDesktopLinks ? 76 : 56) // Mobile is shorter
    
    const event = new CustomEvent('weddingNavVisibilityChange', { 
      detail: { isVisible, navHeight } 
    })
    
    // Dispatch to current window context
    window.dispatchEvent(event)
    
    // If we're in an iframe, also dispatch to parent window
    if (window.parent && window.parent !== window) {
      try {
        window.parent.dispatchEvent(new CustomEvent('weddingNavVisibilityChange', { 
          detail: { isVisible, navHeight } 
        }))
      } catch (e) {
        // Cross-origin restrictions may prevent this
      }
    }
  }, [isVisible, showNavLinks, sectionLinks.length])

  // Close mobile menu when nav becomes hidden
  useEffect(() => {
    if (!isVisible) {
      setIsMobileMenuOpen(false)
    }
  }, [isVisible])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <>
      <nav
        ref={navRef}
        id="wedding-nav"
        className={`
          fixed top-0 left-0 right-0 z-40
          backdrop-blur-md
          transition-all duration-300 ease-out
          ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
        `}
        style={{ 
          backgroundColor: isColored ? bgColor : 'rgba(255, 255, 255, 0.95)',
          borderBottom: `1px solid ${borderColor}`,
          boxShadow: isVisible ? '0 1px 3px 0 rgba(0, 0, 0, 0.05)' : 'none'
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          {/* Mobile layout: Initials centered, hamburger on right */}
          <div className="sm:hidden flex items-center justify-between h-14">
            {/* Spacer for balance */}
            <div className="w-10" />
            
            {/* Initials - centered */}
            <div 
              className="text-xl"
              style={{ 
                color: isColored ? textColor : accentColor,
                fontFamily: 'var(--font-display, var(--font-heading, serif))'
              }}
            >
              <span className="font-light" dangerouslySetInnerHTML={{ __html: initials }} />
            </div>
            
            {/* Mobile hamburger button - far right */}
            {showNavLinks && (sectionLinks.length > 0 || subPageLinks.length > 0) ? (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 transition-colors rounded-md"
                style={{ 
                  color: isColored ? textColor : accentColor,
                  backgroundColor: 'transparent'
                }}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>
          
          {/* Desktop layout: Initials with links below */}
          <div className="hidden sm:flex flex-col items-center py-3 relative">
            {/* Initials */}
            <div 
              className="text-xl"
              style={{ 
                color: isColored ? textColor : accentColor,
                fontFamily: 'var(--font-display, var(--font-heading, serif))'
              }}
            >
              <span className="font-light" dangerouslySetInnerHTML={{ __html: initials }} />
            </div>
            
            {/* Desktop links - scroll anchors + page links */}
            {showNavLinks && (sectionLinks.length > 0 || subPageLinks.length > 0) && (
              <div className="flex items-center justify-center gap-6 mt-2">
                {sectionLinks.map((link) => (
                  mainPageHref ? (
                    <Link
                      key={link.id}
                      href={`${mainPageHref}#${link.id}`}
                      className="text-sm transition-colors whitespace-nowrap"
                      style={{
                        fontFamily: 'var(--font-body, sans-serif)',
                        color: isColored ? textColorMuted : '#6b7280'
                      }}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className="text-sm transition-colors whitespace-nowrap pb-0.5"
                      style={{
                        fontFamily: 'var(--font-body, sans-serif)',
                        color: link.id === activeSectionId
                          ? (isColored ? textColor : accentColor)
                          : (isColored ? textColorMuted : '#6b7280'),
                        fontWeight: link.id === activeSectionId ? 700 : 400,
                        borderBottom: link.id === activeSectionId
                          ? `2px solid ${isColored ? textColor : accentColor}`
                          : '2px solid transparent',
                      }}
                    >
                      {link.label}
                    </button>
                  )
                ))}
                {sectionLinks.length > 0 && subPageLinks.length > 0 && (
                  <span className="w-px h-3 opacity-30" style={{ background: isColored ? textColor : accentColor }} />
                )}
                {subPageLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    className="text-sm transition-colors whitespace-nowrap pb-0.5"
                    style={{
                      fontFamily: 'var(--font-body, sans-serif)',
                      color: link.isActive
                        ? (isColored ? textColor : accentColor)
                        : (isColored ? textColorMuted : '#6b7280'),
                      fontWeight: link.isActive ? 700 : 400,
                      borderBottom: link.isActive
                        ? `2px solid ${isColored ? textColor : accentColor}`
                        : '2px solid transparent',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Full-screen Mobile Menu Overlay */}
      {showNavLinks && (sectionLinks.length > 0 || subPageLinks.length > 0) && (
        <div
          className={`
            fixed inset-0 z-50
            sm:hidden
            transition-all duration-300 ease-out
            ${isVisible && isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          style={{ 
            background: isColored 
              ? bgColor 
              : `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 100%)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          {/* Close button at top right */}
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-full transition-colors"
              style={{ 
                color: isColored ? textColor : accentColor,
                backgroundColor: isColored ? 'rgba(255,255,255,0.1)' : `${accentColor}10`
              }}
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Centered menu content */}
          <div className="flex flex-col items-center justify-center h-full px-8">
            {/* Initials at top of menu */}
            <div 
              className="text-3xl tracking-wide mb-12"
              style={{ 
                color: isColored ? textColor : accentColor,
                fontFamily: 'var(--font-display, var(--font-heading, serif))'
              }}
            >
              <span className="font-light" dangerouslySetInnerHTML={{ __html: initials }} />
            </div>
            
            {/* Menu items */}
            <div className="flex flex-col items-center gap-6">
              {sectionLinks.map((link) => (
                mainPageHref ? (
                  <Link
                    key={link.id}
                    href={`${mainPageHref}#${link.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xl transition-all duration-200 hover:scale-105"
                    style={{
                      fontFamily: 'var(--font-body, sans-serif)',
                      color: isColored ? textColor : accentColor
                    }}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="text-xl transition-all duration-200 hover:scale-105"
                    style={{
                      fontFamily: 'var(--font-body, sans-serif)',
                      color: isColored ? textColor : accentColor,
                      fontWeight: link.id === activeSectionId ? 700 : 400,
                    }}
                  >
                    {link.label}
                    {link.id === activeSectionId && (
                      <span className="block mx-auto mt-1 w-6 h-0.5 rounded-full" style={{ background: isColored ? textColor : accentColor }} />
                    )}
                  </button>
                )
              ))}
              {sectionLinks.length > 0 && subPageLinks.length > 0 && (
                <span className="w-8 h-px opacity-20" style={{ background: isColored ? textColor : accentColor }} />
              )}
              {subPageLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xl transition-all duration-200 hover:scale-105"
                  style={{
                    fontFamily: 'var(--font-body, sans-serif)',
                    color: isColored ? textColor : accentColor,
                    fontWeight: link.isActive ? 700 : 400,
                  }}
                >
                  {link.label}
                  {link.isActive && (
                    <span className="block mx-auto mt-1 w-6 h-0.5 rounded-full" style={{ background: isColored ? textColor : accentColor }} />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

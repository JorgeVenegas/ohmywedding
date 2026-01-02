"use client"

import { getWeddingByNameIdClient } from "@/lib/wedding-data-client"
import { createConfigFromWedding } from "@/lib/wedding-configs"
import { ConfigBasedWeddingRenderer } from "@/components/config-based-wedding-renderer"
import { PageConfigProvider, usePageConfig } from "@/components/contexts/page-config-context"
import { I18nProvider, useTranslation } from "@/components/contexts/i18n-context"
import { notFound, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Wedding } from "@/lib/wedding-data"
import Image from "next/image"

interface WeddingPageClientProps {
  weddingNameId: string
}

interface WeddingPageContentProps {
  weddingNameId: string
}

interface GuestGroup {
  id: string
  name: string
  wedding_id: string
}

interface EnvelopeContentProps {
  isMobile: boolean
  envelopeFalling: boolean
  envelopeOpening: boolean
  handleEnvelopeClick: () => void
  primaryColor: string
  flapColor: string
  textColor: string
  coupleNames: string
  coupleInitials: string
  weddingDate: string
  guestGroup: GuestGroup | null
}

function EnvelopeContent({
  isMobile,
  envelopeFalling,
  envelopeOpening,
  handleEnvelopeClick,
  primaryColor,
  flapColor,
  textColor,
  coupleNames,
  coupleInitials,
  weddingDate,
  guestGroup
}: EnvelopeContentProps) {
  const { t } = useTranslation()
  
  return (
    <>
      {/* Overlay to block scrolling and interactions */}
      {!envelopeFalling && (
        <div 
          className="fixed inset-0 z-29"
          style={{
            backgroundColor: 'transparent',
            pointerEvents: 'auto',
          }}
        />
      )}
      
      {/* Envelope flap - triangle that moves up on desktop, left on mobile */}
      <div 
        className="fixed z-40"
        style={{
          backgroundColor: flapColor,
          pointerEvents: envelopeFalling ? 'none' : 'auto',
          boxShadow: isMobile 
            ? 'inset -10px 0 20px rgba(0, 0, 0, 0.1), 4px 0 15px rgba(0, 0, 0, 0.2)'
            : 'inset 0 -10px 20px rgba(0, 0, 0, 0.1), 0 4px 15px rgba(0, 0, 0, 0.2)',
          ...(isMobile ? {
            // Mobile: left side vertical triangle
            left: 0,
            top: 0,
            bottom: 0,
            width: '40vw',
            clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
            transform: envelopeFalling ? 'translateX(-100%)' : 'translateX(0)',
          } : {
            // Desktop: top horizontal triangle
            top: 0,
            left: 0,
            right: 0,
            height: '40vh',
            clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
            transform: envelopeFalling ? 'translateY(-100%)' : 'translateY(0)',
          }),
          transition: 'transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Envelope body - rectangle that moves down on desktop, right on mobile */}
      <div 
        className="fixed inset-0 z-30"
        style={{
          background: primaryColor,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          transform: envelopeFalling 
            ? (isMobile ? 'translateX(100%)' : 'translateY(100%)')
            : 'translate(0, 0)',
          transition: 'transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: envelopeFalling ? 'default' : 'pointer',
          pointerEvents: envelopeFalling ? 'none' : 'auto',
        }}
        onClick={!envelopeFalling ? handleEnvelopeClick : undefined}
      >
        <div 
          className="h-full w-full flex flex-col items-center justify-center p-4 sm:p-8"
          style={{
            paddingTop: isMobile ? '2rem' : '45vh',
            paddingLeft: isMobile ? '45vw' : '2rem',
          }}
        >
          <div className="relative z-10 text-center max-w-4xl w-full px-4">
            {/* From/To Tags - Elegant styling */}
            <div className="mb-12 sm:mb-16">
              <div className="inline-block border-t border-b border-white/30 py-4 px-8">
                <p className="text-xs sm:text-sm font-light tracking-widest uppercase mb-2" style={{ color: textColor, opacity: 0.7 }}>{t('common.from')}: {coupleNames || "The Couple"}</p>
                <p className="text-sm sm:text-base font-light tracking-wider" style={{ color: textColor }}>{t('common.to')}: {guestGroup?.name || "Guest"}</p>
              </div>
            </div>
            
            <div className="mb-4 sm:mb-8">
              {coupleInitials && coupleInitials.includes('<span') ? (
                <h1 
                  className="font-serif text-6xl sm:text-8xl md:text-9xl mb-3 sm:mb-6 drop-shadow-lg" 
                  style={{ color: textColor }}
                  dangerouslySetInnerHTML={{ __html: coupleInitials }}
                />
              ) : (
                <h1 className="font-serif text-6xl sm:text-8xl md:text-9xl mb-3 sm:mb-6 drop-shadow-lg" style={{ color: textColor }}>
                  {coupleInitials || "You're Invited"}
                </h1>
              )}
              {weddingDate && (
                <p className="text-base sm:text-xl md:text-2xl font-light drop-shadow-md" style={{ color: textColor, opacity: 0.9 }}>{weddingDate}</p>
              )}
            </div>

            <div className="mt-6 sm:mt-12" style={{ minHeight: '2rem' }}>
              {!envelopeOpening && (
                <p className="text-xs sm:text-sm animate-pulse font-light tracking-wide drop-shadow" style={{ color: textColor, opacity: 0.7 }}>
                  {t('common.tapToOpen')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Wrapper to get locale and colors from page config (same pattern as ConfigBasedWeddingRenderer)
function EnvelopeWithI18n(props: Omit<EnvelopeContentProps, 'primaryColor' | 'flapColor' | 'textColor'>) {
  const { config } = usePageConfig()
  const locale = config.siteSettings.locale || 'en'
  
  // Get envelope color choice from config, default to 'primary'
  const envelopeColorChoice = config.siteSettings.envelope?.colorChoice || 'primary'
  
  // Helper to create a light tint
  const getLightTint = (hex: string, tintAmount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    const newR = Math.round(r + (255 - r) * tintAmount)
    const newG = Math.round(g + (255 - g) * tintAmount)
    const newB = Math.round(b + (255 - b) * tintAmount)
    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`
  }
  
  // Helper to calculate luminance and determine text color
  const getContrastTextColor = (hex: string): string => {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    // Calculate relative luminance using sRGB coefficients
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    // Return dark text for light backgrounds, light text for dark backgrounds
    return luminance > 0.6 ? '#1a1a1a' : '#ffffff'
  }
  
  // Get the base color (primary, secondary, or accent)
  const colors = config.siteSettings.theme?.colors || {}
  const baseColorType = envelopeColorChoice.includes('primary') ? 'primary' 
    : envelopeColorChoice.includes('secondary') ? 'secondary' 
    : 'accent'
  const baseColor = colors[baseColorType] || colors.primary || '#c9a961'
  
  // Apply tint based on choice
  const envelopeColor = envelopeColorChoice.endsWith('-lighter') 
    ? getLightTint(baseColor, 0.88)
    : envelopeColorChoice.endsWith('-light') 
      ? getLightTint(baseColor, 0.7)
      : baseColor
  
  // Calculate a lighter shade for the flap
  const lightenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace("#",""), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1)
  }
  const flapColor = lightenColor(envelopeColor, 20)
  
  // Calculate text color for contrast
  const textColor = getContrastTextColor(envelopeColor)
  
  return (
    <I18nProvider initialLocale={locale}>
      <EnvelopeContent {...props} primaryColor={envelopeColor} flapColor={flapColor} textColor={textColor} />
    </I18nProvider>
  )
}

function WeddingPageContent({ weddingNameId }: WeddingPageContentProps) {
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [weddingDataLoading, setWeddingDataLoading] = useState(true)
  const [curtainFalling, setCurtainFalling] = useState(false)
  const [showEnvelope, setShowEnvelope] = useState(false)
  const [envelopeFalling, setEnvelopeFalling] = useState(false)
  const [envelopeOpening, setEnvelopeOpening] = useState(false)
  const [envelopeComplete, setEnvelopeComplete] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [guestGroup, setGuestGroup] = useState<GuestGroup | null>(null)
  
  // Check for demo mode and groupId in search params
  const urlSearchParams = useSearchParams()
  const isDemoMode = urlSearchParams.get('demo') === 'true'
  const groupId = urlSearchParams.get('groupId')

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    async function loadWedding() {
      try {
        const weddingData = await getWeddingByNameIdClient(weddingNameId)
        setWedding(weddingData)
        
        // Fetch group data if group_id is provided
        if (groupId) {
          try {
            const response = await fetch(`/api/guest-groups/${groupId}`)
            if (response.ok) {
              const data = await response.json()
              console.log('Group API Response:', data)
              // Check if data.group exists or if it's structured differently
              const group = data.group || data
              console.log('Setting Guest Group:', group)
              setGuestGroup(group)
            } else {
              console.error('Group API error:', response.status, response.statusText)
            }
          } catch (error) {
            console.error('Error loading group:', error)
          }
        }
        
        setWeddingDataLoading(false)
        // Only show envelope if group_id is provided
        setShowEnvelope(!!groupId)
      } catch (error) {
        console.error('Error loading wedding:', error)
        setWeddingDataLoading(false)
      }
    }
    loadWedding()
  }, [weddingNameId, groupId])

  const handleEnvelopeClick = () => {
    setEnvelopeOpening(true)
    setEnvelopeFalling(true)
    // Remove from DOM after animation completes (1200ms)
    setTimeout(() => {
      setEnvelopeComplete(true)
    }, 1200)
  }

  // Helper to get curtain color from wedding config
  const getCurtainColor = (wedding: Wedding | null): string => {
    if (!wedding?.page_config) return '#c9a961'
    
    const envelopeColorChoice = wedding.page_config.siteSettings?.envelope?.colorChoice || 'primary'
    const colors = wedding.page_config.siteSettings?.theme?.colors || {}
    const baseColorType = envelopeColorChoice.includes('primary') ? 'primary' 
      : envelopeColorChoice.includes('secondary') ? 'secondary' 
      : 'accent'
    const baseColor = colors[baseColorType] || colors.primary || '#c9a961'
    
    // Helper to create a light tint
    const getLightTint = (hex: string, tintAmount: number): string => {
      const num = parseInt(hex.replace('#', ''), 16)
      const r = (num >> 16) & 255
      const g = (num >> 8) & 255
      const b = num & 255
      const newR = Math.round(r + (255 - r) * tintAmount)
      const newG = Math.round(g + (255 - g) * tintAmount)
      const newB = Math.round(b + (255 - b) * tintAmount)
      return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`
    }
    
    // Apply tint based on choice to get final curtain color
    return envelopeColorChoice.endsWith('-lighter') 
      ? getLightTint(baseColor, 0.88)
      : envelopeColorChoice.endsWith('-light') 
        ? getLightTint(baseColor, 0.7)
        : baseColor
  }

  if (!wedding && weddingDataLoading) {
    return null // Don't show anything while loading - WeddingContentWithCurtain will show the curtain
  }

  if (!wedding) {
    notFound()
    return null
  }

  // Create the wedding page configuration
  // You can customize the style here: 'classic', 'modern', or 'rustic'
  const config = createConfigFromWedding(wedding, 'modern')
  
  // Enable variant switchers based on demo mode or default to editing enabled
  const showVariantSwitchers = isDemoMode || true

  // Build couple names for envelope
  const partner1Names = [wedding.partner1_first_name, wedding.partner1_last_name].filter(Boolean)
  const partner2Names = [wedding.partner2_first_name, wedding.partner2_last_name].filter(Boolean)
  const partner1 = partner1Names.join(' ')
  const partner2 = partner2Names.join(' ')
  const coupleNames = [partner1, partner2].filter(Boolean).join(' & ')
  
  // Get initials for envelope display
  const partner1Initial = wedding.partner1_first_name?.charAt(0)?.toUpperCase() || ''
  const partner2Initial = wedding.partner2_first_name?.charAt(0)?.toUpperCase() || ''
  const coupleInitials = partner1Initial && partner2Initial 
    ? `${partner1Initial}${partner2Initial}`.split('').map((char, idx) => 
        idx === 1 ? `<span class="text-[0.6em]">&</span>${char}` : char
      ).join('')
    : [partner1Initial, partner2Initial].filter(Boolean).join(' ')
  
  // Format wedding date using locale from wedding page_config and UTC to avoid timezone issues
  const locale = wedding.page_config?.siteSettings?.locale || 'en'
  const weddingDate = wedding.wedding_date ? (() => {
    // Parse as UTC to avoid timezone shift
    const [year, month, day] = wedding.wedding_date.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(date)
  })() : ''

  return (
    <>
      <PageConfigProvider weddingNameId={weddingNameId}>
        <WeddingContentWithCurtain
          wedding={wedding}
          weddingNameId={weddingNameId}
          showEnvelope={showEnvelope}
          isMobile={isMobile}
          envelopeFalling={envelopeFalling}
          envelopeOpening={envelopeOpening}
          envelopeComplete={envelopeComplete}
          handleEnvelopeClick={handleEnvelopeClick}
          coupleNames={coupleNames}
          coupleInitials={coupleInitials}
          weddingDate={weddingDate}
          guestGroup={guestGroup}
        />
      </PageConfigProvider>
    </>
  )
}

// Component that waits for config to load before falling curtain
function WeddingContentWithCurtain({
  wedding,
  weddingNameId,
  showEnvelope,
  isMobile,
  envelopeFalling,
  envelopeOpening,
  envelopeComplete,
  handleEnvelopeClick,
  coupleNames,
  coupleInitials,
  weddingDate,
  guestGroup
}: {
  wedding: Wedding
  weddingNameId: string
  showEnvelope: boolean
  isMobile: boolean
  envelopeFalling: boolean
  envelopeOpening: boolean
  envelopeComplete: boolean
  handleEnvelopeClick: () => void
  coupleNames: string
  coupleInitials: string
  weddingDate: string
  guestGroup: GuestGroup | null
}) {
  const { isLoading: configLoading, config } = usePageConfig()
  const [curtainFalling, setCurtainFalling] = useState(false)
  const [curtainComplete, setCurtainComplete] = useState(false)
  const [curtainColor, setCurtainColor] = useState('#c9a961') // Start with golden

  // Calculate envelope color
  const getEnvelopeColor = (): string => {
    const envelopeColorChoice = wedding.page_config?.siteSettings?.envelope?.colorChoice || 'primary'
    const colors = wedding.page_config?.siteSettings?.theme?.colors || {}
    const baseColorType = envelopeColorChoice.includes('primary') ? 'primary' 
      : envelopeColorChoice.includes('secondary') ? 'secondary' 
      : 'accent'
    const baseColor = colors[baseColorType] || colors.primary || '#c9a961'
    
    // Helper to create a light tint
    const getLightTint = (hex: string, tintAmount: number): string => {
      const num = parseInt(hex.replace('#', ''), 16)
      const r = (num >> 16) & 255
      const g = (num >> 8) & 255
      const b = num & 255
      const newR = Math.round(r + (255 - r) * tintAmount)
      const newG = Math.round(g + (255 - g) * tintAmount)
      const newB = Math.round(b + (255 - b) * tintAmount)
      return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`
    }
    
    // Apply tint based on choice to get final color
    return envelopeColorChoice.endsWith('-lighter') 
      ? getLightTint(baseColor, 0.88)
      : envelopeColorChoice.endsWith('-light') 
        ? getLightTint(baseColor, 0.7)
        : baseColor
  }

  // Set body background color to match curtain color
  useEffect(() => {
    document.body.style.backgroundColor = curtainColor
    document.body.style.transition = 'background-color 800ms ease-in-out'
    
    // Reset body background on cleanup
    return () => {
      document.body.style.backgroundColor = ''
      document.body.style.transition = ''
    }
  }, [curtainColor])

  // Once config loads, transition to envelope color, then fall curtain
  useEffect(() => {
    if (!configLoading) {
      // Transition to envelope color
      setCurtainColor(getEnvelopeColor())
      // Wait a brief moment then trigger curtain fall
      setTimeout(() => {
        setCurtainFalling(true)
        // Remove from DOM after animation completes (800ms)
        setTimeout(() => {
          setCurtainComplete(true)
        }, 800)
      }, 100)
    }
  }, [configLoading])

  return (
    <>
      {/* Curtain overlay - starts covering screen, then falls */}
      {!curtainComplete && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div 
            className="absolute inset-0 transition-all duration-800 ease-in-out flex items-center justify-center"
            style={{
              transform: curtainFalling ? 'translateY(100%)' : 'translateY(0)',
              backgroundColor: curtainColor,
            }}
          >
            <Image
              src="/images/logos/OMW Logo White.png"
              alt="OhMyWedding"
              width={120}
              height={120}
              className="w-32 h-auto will-change-auto"
              style={{ pointerEvents: 'none' }}
              priority
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Envelope screen with parallel animations */}
      {showEnvelope && !envelopeComplete && (
        <EnvelopeWithI18n 
          isMobile={isMobile}
          envelopeFalling={envelopeFalling}
          envelopeOpening={envelopeOpening}
          handleEnvelopeClick={handleEnvelopeClick}
          coupleNames={coupleNames}
          coupleInitials={coupleInitials}
          weddingDate={weddingDate}
          guestGroup={guestGroup}
        />
      )}
      
      <ConfigBasedWeddingRenderer 
        wedding={wedding}
        weddingNameId={weddingNameId}
      />
    </>
  )
}

// Wrapper component
export default function WeddingPageClient({ weddingNameId }: WeddingPageClientProps) {
  return (
    <WeddingPageContent weddingNameId={weddingNameId} />
  )
}
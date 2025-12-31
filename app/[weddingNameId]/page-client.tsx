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
                <p className="text-white/70 text-xs sm:text-sm font-light tracking-widest uppercase mb-2">{t('common.from')}: {coupleNames || "The Couple"}</p>
                <p className="text-white text-sm sm:text-base font-light tracking-wider">{t('common.to')}: {guestGroup?.name || "Guest"}</p>
              </div>
            </div>
            
            <div className="mb-4 sm:mb-8">
              <h1 className="font-serif text-6xl sm:text-8xl md:text-9xl mb-3 sm:mb-6 text-white tracking-wider drop-shadow-lg">
                {coupleInitials || "You're Invited"}
              </h1>
              {weddingDate && (
                <p className="text-base sm:text-xl md:text-2xl text-white/90 font-light drop-shadow-md">{weddingDate}</p>
              )}
            </div>

            <div className="mt-6 sm:mt-12" style={{ minHeight: '2rem' }}>
              {!envelopeOpening && (
                <p className="text-xs sm:text-sm text-white/70 animate-pulse font-light tracking-wide drop-shadow">
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

// Wrapper to get locale from page config (same pattern as ConfigBasedWeddingRenderer)
function EnvelopeWithI18n(props: EnvelopeContentProps) {
  const { config } = usePageConfig()
  const locale = config.siteSettings.locale || 'en'
  
  return (
    <I18nProvider initialLocale={locale}>
      <EnvelopeContent {...props} />
    </I18nProvider>
  )
}

function WeddingPageContent({ weddingNameId }: WeddingPageContentProps) {
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [curtainFalling, setCurtainFalling] = useState(false)
  const [showEnvelope, setShowEnvelope] = useState(false)
  const [envelopeFalling, setEnvelopeFalling] = useState(false)
  const [envelopeOpening, setEnvelopeOpening] = useState(false)
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
        
        setLoading(false)
        // Only show envelope if group_id is provided
        setShowEnvelope(!!groupId)
        // Wait a brief moment then trigger curtain fall
        setTimeout(() => {
          setCurtainFalling(true)
        }, 100)
      } catch (error) {
        console.error('Error loading wedding:', error)
        setLoading(false)
      }
    }
    loadWedding()
  }, [weddingNameId, groupId])

  const handleEnvelopeClick = () => {
    setEnvelopeOpening(true)
    setEnvelopeFalling(true)
  }

  if (!wedding && loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#c9a961] flex items-center justify-center">
        <Image
          src="/images/logos/OMW Logo White.png"
          alt="OhMyWedding"
          width={120}
          height={120}
          className="w-32 h-auto"
          priority
          unoptimized
        />
      </div>
    )
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

  // Get wedding colors from page_config
  const primaryColor = wedding.primary_color || wedding.page_config?.colors?.primary || '#c9a961'
  const secondaryColor = wedding.secondary_color || wedding.page_config?.colors?.secondary || '#8b7355'
  
  // Calculate a lighter shade of primary color for the flap
  const lightenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace("#",""), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1)
  }
  const flapColor = lightenColor(primaryColor, 20)
  
  // Build couple names for envelope
  const partner1Names = [wedding.partner1_first_name, wedding.partner1_last_name].filter(Boolean)
  const partner2Names = [wedding.partner2_first_name, wedding.partner2_last_name].filter(Boolean)
  const partner1 = partner1Names.join(' ')
  const partner2 = partner2Names.join(' ')
  const coupleNames = [partner1, partner2].filter(Boolean).join(' & ')
  
  // Get initials for envelope display
  const partner1Initial = wedding.partner1_first_name?.charAt(0)?.toUpperCase() || ''
  const partner2Initial = wedding.partner2_first_name?.charAt(0)?.toUpperCase() || ''
  const coupleInitials = [partner1Initial, partner2Initial].filter(Boolean).join(' & ')
  
  // Format wedding date
  const weddingDate = wedding.wedding_date ? new Date(wedding.wedding_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : ''

  return (
    <>
      {/* Gold curtain overlay - starts covering screen, then falls */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div 
          className="absolute inset-0 bg-[#c9a961] transition-transform duration-800 ease-in-out flex items-center justify-center"
          style={{
            transform: curtainFalling ? 'translateY(100%)' : 'translateY(0)',
          }}
        >
          <Image
            src="/images/logos/OMW Logo White.png"
            alt="OhMyWedding"
            width={120}
            height={120}
            className="w-32 h-auto"
            priority
            unoptimized
          />
        </div>
      </div>

      <PageConfigProvider weddingNameId={weddingNameId}>
        {/* Envelope screen with parallel animations */}
        {showEnvelope && (
          <EnvelopeWithI18n 
            isMobile={isMobile}
            envelopeFalling={envelopeFalling}
            envelopeOpening={envelopeOpening}
            handleEnvelopeClick={handleEnvelopeClick}
            primaryColor={primaryColor}
            flapColor={flapColor}
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
      </PageConfigProvider>
    </>
  )
}

// Wrapper component
export default function WeddingPageClient({ weddingNameId }: WeddingPageClientProps) {
  return (
    <WeddingPageContent weddingNameId={weddingNameId} />
  )
}
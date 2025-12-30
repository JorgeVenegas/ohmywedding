"use client"

import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Wedding } from '@/lib/wedding-data'
import {
  HeroSection,
  OurStorySection,
  EventDetailsSection,
  RSVPSection,
  GallerySection,
  FAQSection,
  CountdownSection,
  RegistrySection
} from './wedding-sections'
import { VariantProvider } from './contexts/variant-context'
import { SiteConfigProvider } from './contexts/site-config-context'
import { EditingModeProvider } from './contexts/editing-mode-context'
import { CustomizeProvider } from './contexts/customize-context'
import { ViewportProvider } from './contexts/viewport-context'
import { I18nProvider } from './contexts/i18n-context'
import { SectionCustomizer } from './ui/section-customizer'
import { EditingTopBar } from './ui/editing-top-bar'
import { AddSectionButton } from './ui/add-section-button'
import { DeleteSectionButton } from './ui/delete-section-button'
import { ViewportWrapper } from './ui/viewport-wrapper'
import { WeddingNav } from './ui/wedding-nav'
import { usePageConfig } from './contexts/page-config-context'
import { useSiteConfigSafe } from './contexts/site-config-context'
import { useEditingModeSafe } from './contexts/editing-mode-context'

interface ConfigBasedWeddingRendererProps {
  wedding: Wedding
  weddingNameId: string
}

function ConfigBasedWeddingRendererContent({
  wedding,
  weddingNameId
}: ConfigBasedWeddingRendererProps) {
  const { config, isLoading, updateComponents, updateSiteSettings, weddingDetails, setWeddingDetails } = usePageConfig()
  const siteConfigContext = useSiteConfigSafe()
  const editingContext = useEditingModeSafe()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId') ?? undefined
  
  // Check if user is authorized to access admin (owner or collaborator)
  const [isAuthorized, setIsAuthorized] = React.useState(false)
  
  React.useEffect(() => {
    async function checkAuthorization() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsAuthorized(false)
          return
        }
        
        // Check if user is owner or collaborator
        const isOwner = wedding.owner_id === user.id
        const isCollaborator = wedding.collaborator_emails?.includes(user.email || '') || false
        const isUnowned = wedding.owner_id === null || wedding.owner_id === undefined
        
        setIsAuthorized(isOwner || isCollaborator || isUnowned)
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthorized(false)
      }
    }
    
    checkAuthorization()
  }, [wedding.owner_id, wedding.collaborator_emails])
  
  // Initialize wedding details from the wedding prop
  React.useEffect(() => {
    if (wedding && !weddingDetails) {
      setWeddingDetails({
        partner1_first_name: wedding.partner1_first_name,
        partner1_last_name: wedding.partner1_last_name,
        partner2_first_name: wedding.partner2_first_name,
        partner2_last_name: wedding.partner2_last_name,
        wedding_date: wedding.wedding_date,
        wedding_time: wedding.wedding_time,
        ceremony_venue_name: wedding.ceremony_venue_name,
        ceremony_venue_address: wedding.ceremony_venue_address,
        reception_venue_name: wedding.reception_venue_name,
        reception_venue_address: wedding.reception_venue_address,
      })
    }
  }, [wedding, weddingDetails, setWeddingDetails])
  
  // Create an effective wedding object that merges original data with real-time updates
  const effectiveWedding = React.useMemo(() => {
    if (!weddingDetails) return wedding
    return {
      ...wedding,
      ...weddingDetails
    }
  }, [wedding, weddingDetails])
  
  // Apply theme colors to CSS variables
  React.useEffect(() => {
    const colors = config.siteSettings.theme?.colors
    if (colors) {
      document.documentElement.style.setProperty('--theme-primary', colors.primary || '#d4a574')
      document.documentElement.style.setProperty('--theme-secondary', colors.secondary || '#9ba082')
      document.documentElement.style.setProperty('--theme-accent', colors.accent || '#e6b5a3')
    }
  }, [
    config.siteSettings.theme?.colors?.primary,
    config.siteSettings.theme?.colors?.secondary,
    config.siteSettings.theme?.colors?.accent
  ])

  // Load Google Fonts dynamically when fonts change
  React.useEffect(() => {
    const fonts = config.siteSettings.theme?.fonts
    if (fonts?.googleFonts) {
      // Remove existing font link if any
      const existingLink = document.getElementById('custom-google-fonts')
      if (existingLink) {
        existingLink.remove()
      }
      
      // Add new font link
      const link = document.createElement('link')
      link.id = 'custom-google-fonts'
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${fonts.googleFonts}&display=swap`
      document.head.appendChild(link)
      
      // Apply fonts to CSS variables
      if (fonts.displayFamily) {
        document.documentElement.style.setProperty('--font-display', fonts.displayFamily)
      }
      if (fonts.headingFamily) {
        document.documentElement.style.setProperty('--font-heading', fonts.headingFamily)
      }
      if (fonts.bodyFamily) {
        document.documentElement.style.setProperty('--font-body', fonts.bodyFamily)
      }
    }
  }, [
    config.siteSettings.theme?.fonts?.googleFonts,
    config.siteSettings.theme?.fonts?.displayFamily,
    config.siteSettings.theme?.fonts?.headingFamily,
    config.siteSettings.theme?.fonts?.bodyFamily
  ])
  
  // Only render enabled components from the page configuration
  const allComponents = config.components
    .filter(component => component.enabled)
    .sort((a, b) => a.order - b.order)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  // Handler for adding new sections
  const handleAddSection = (position: number, sectionType: string) => {
    // Check if the component already exists in the array
    const existingComponent = config.components.find(comp => comp.type === sectionType)
    
    // Build the new list of enabled components in the correct order
    const newEnabledComponents = [...allComponents]
    
    if (existingComponent && !existingComponent.enabled) {
      // Component exists but is disabled, enable it and insert at position
      newEnabledComponents.splice(position, 0, { ...existingComponent, enabled: true })
    } else if (!existingComponent) {
      // Component doesn't exist, create a new one and insert at position
      const newComponent = {
        id: `${sectionType}-${Date.now()}`,
        type: sectionType,
        enabled: true,
        order: 0, // Will be set below
        props: getDefaultPropsForSection(sectionType)
      }
      newEnabledComponents.splice(position, 0, newComponent)
    } else {
      // Component already exists and is enabled, do nothing
      return
    }
    
    // Reassign orders sequentially based on position in array
    const reorderedEnabled = newEnabledComponents.map((comp, idx) => ({
      ...comp,
      enabled: true,
      order: idx
    }))
    
    // Merge with disabled components (keep them but don't change their order)
    const disabledComponents = config.components.filter(comp => 
      !comp.enabled && comp.type !== sectionType
    )
    
    const updatedComponents = [...reorderedEnabled, ...disabledComponents]
    
    updateComponents(updatedComponents)
  }
  
  // Helper function to get default props for a section type
  const getDefaultPropsForSection = (sectionType: string): Record<string, any> => {
    switch (sectionType) {
      case 'hero':
        return {
          showCoverImage: false,
          showTagline: true,
          tagline: 'Join us as we tie the knot!',
          showCountdown: true,
          showRSVPButton: true
        }
      case 'our-story':
        return {
          variant: 'cards',
          showHowWeMet: true,
          showProposal: true,
          showPhotos: false
        }
      case 'countdown':
        return {
          showDays: true,
          showHours: true,
          showMinutes: true,
          showSeconds: true
        }
      case 'event-details':
        return {
          showCeremony: true,
          showReception: true,
          showDressCode: true,
          showMapLinks: true
        }
      case 'gallery':
        return {
          showEngagementPhotos: true,
          showVideoSupport: false,
          showDemoPhotos: true
        }
      case 'rsvp':
        return {
          variant: 'cta',
          showMealPreferences: true
        }
      case 'faq':
        return {
          questions: []
        }
      case 'registry':
        return {
          variant: 'cards',
          registries: [],
          customItems: [],
          showCustomRegistry: false
        }
      default:
        return {}
    }
  }

  // Handler for deleting sections
  const handleDeleteSection = (componentId: string) => {
    // Disable from main components
    const updatedComponents = config.components.map(comp => 
      comp.id === componentId 
        ? { ...comp, enabled: false }
        : comp
    )
    updateComponents(updatedComponents)
  }

  const renderComponent = (component: any, index: number) => {
    const commonProps = {
      wedding: effectiveWedding,
      dateId: wedding.date_id,
      weddingNameId,
      theme: config.siteSettings.theme,
      alignment: { text: 'center' },
      groupId: component.type === 'rsvp' ? groupId : undefined
    }

    let renderedComponent

    switch (component.type) {
      case 'hero':
        renderedComponent = (
          <HeroSection
            key={component.id}
            {...commonProps}
            {...component.props}
          />
        )
        break
      case 'our-story':
        renderedComponent = (
          <OurStorySection
            key={component.id}
            {...commonProps}
            {...component.props}
            howWeMetText={component.props?.howWeMetText || undefined}
          />
        )
        break
      case 'event-details':
        renderedComponent = (
          <EventDetailsSection
            key={component.id}
            {...commonProps}
            {...component.props}
          />
        )
        break
      case 'countdown':
        renderedComponent = (
          <CountdownSection
            key={component.id}
            {...commonProps}
            {...component.props}
            weddingDate={effectiveWedding.wedding_date}
          />
        )
        break
      case 'gallery':
        renderedComponent = (
          <GallerySection
            key={component.id}
            {...commonProps}
            {...component.props}
          />
        )
        break
      case 'rsvp':
        renderedComponent = (
          <RSVPSection
            key={component.id}
            {...commonProps}
            {...component.props}
          />
        )
        break
      case 'faq':
        renderedComponent = (
          <FAQSection
            key={component.id}
            {...commonProps}
            {...component.props}
          />
        )
        break
      case 'registry':
        renderedComponent = (
          <RegistrySection
            key={component.id}
            {...commonProps}
            {...component.props}
            weddingNameId={weddingNameId}
          />
        )
        break
      default:
        return null
    }

    return (
      <React.Fragment key={component.id}>
        <div className="relative group">
          <DeleteSectionButton 
            componentId={component.id}
            componentType={component.type}
            onDelete={handleDeleteSection}
          />
          {renderedComponent}
          <AddSectionButton 
            position={index + 1} 
            onAddSection={handleAddSection}
            enabledComponents={allComponents.map(c => c.type)}
            hasWeddingDate={!!effectiveWedding.wedding_date}
          />
        </div>
      </React.Fragment>
    )
  }

  return (
    <>
      <EditingTopBar weddingNameId={weddingNameId} />

      <ViewportWrapper>
        {/* Wedding Navigation - appears after scrolling past hero */}
        <WeddingNav 
          person1Name={effectiveWedding.partner1_first_name}
          person2Name={effectiveWedding.partner2_first_name}
          accentColor={config.siteSettings.theme?.colors?.primary || '#B8860B'}
          showNavLinks={config.siteSettings.navigation?.showNavLinks !== false}
          enabledSections={allComponents.map(c => c.type)}
          useColorBackground={config.siteSettings.navigation?.useColorBackground || false}
          backgroundColorChoice={config.siteSettings.navigation?.backgroundColorChoice || 'none'}
          themeColors={config.siteSettings.theme?.colors}
        />
        
        {allComponents.length === 0 ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">No Components Configured</h2>
              <p className="text-gray-600 mb-4">This wedding page has no components enabled.</p>
              <AddSectionButton 
                position={0} 
                onAddSection={handleAddSection}
                enabledComponents={[]}
                hasWeddingDate={!!effectiveWedding.wedding_date}
              />
            </div>
          </div>
        ) : (
          <>
            {allComponents.map((component, index) => renderComponent(component, index))}
          </>
        )}
        
        {/* Footer inside viewport */}
        <footer className="border-t border-border/30 bg-background/80 backdrop-blur-sm mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Created with</span>
                <a 
                  href="https://ohmywedding.com" 
                  className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-primary">♥</span>
                  <span>OhMyWedding</span>
                </a>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {isAuthorized && (
                  <Link 
                    href={`/admin/${weddingNameId}/dashboard`}
                    className="hover:text-primary transition-colors font-medium"
                  >
                    Manage Wedding
                  </Link>
                )}
                <a 
                  href="https://ohmywedding.com/create" 
                  className="hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Create Your Own
                </a>
              </div>
            </div>
          </div>
        </footer>
      </ViewportWrapper>

      <SectionCustomizer />
    </>
  )
}

export function ConfigBasedWeddingRenderer(props: ConfigBasedWeddingRendererProps) {
  // We need to wrap this in PageConfigProvider first to get initial colors
  return (
    <I18nProviderWithConfig>
      <VariantProvider>
        <ViewportProvider>
          <EditingModeProvider weddingNameId={props.weddingNameId}>
            <ConfigBasedWeddingRendererWithConfig {...props} />
          </EditingModeProvider>
        </ViewportProvider>
      </VariantProvider>
    </I18nProviderWithConfig>
  )
}

// Wrapper to get locale from page config
function I18nProviderWithConfig({ children }: { children: React.ReactNode }) {
  const { config } = usePageConfig()
  const locale = config.siteSettings.locale || 'en'
  
  return (
    <I18nProvider initialLocale={locale}>
      {children}
    </I18nProvider>
  )
}

function ConfigBasedWeddingRendererWithConfig(props: ConfigBasedWeddingRendererProps) {
  const { config } = usePageConfig()
  
  // Get initial colors from page config
  const initialColors = {
    primary: config.siteSettings.theme?.colors?.primary || '#d4a574',
    secondary: config.siteSettings.theme?.colors?.secondary || '#9ba082',
    accent: config.siteSettings.theme?.colors?.accent || '#e6b5a3'
  }
  
  return (
    <SiteConfigProvider initialColors={initialColors}>
      <CustomizeProvider weddingDate={props.wedding.wedding_date} weddingNameId={props.weddingNameId}>
        <ConfigBasedWeddingRendererContent {...props} />
      </CustomizeProvider>
    </SiteConfigProvider>
  )
}
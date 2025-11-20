"use client"

import React from 'react'
import { Wedding } from '@/lib/wedding-data'
import {
  HeroSection,
  OurStorySection,
  EventDetailsSection,
  RSVPSection,
  GallerySection,
  FAQSection,
  CountdownSection
} from './wedding-sections'
import { VariantProvider } from './contexts/variant-context'
import { SiteConfigProvider } from './contexts/site-config-context'
import { EditingModeProvider } from './contexts/editing-mode-context'
import { CustomizeProvider } from './contexts/customize-context'
import { ViewportProvider } from './contexts/viewport-context'
import { SectionCustomizer } from './ui/section-customizer'
import { EditingTopBar } from './ui/editing-top-bar'
import { AddSectionButton } from './ui/add-section-button'
import { DeleteSectionButton } from './ui/delete-section-button'
import { ViewportWrapper } from './ui/viewport-wrapper'
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
  const { config, isLoading, updateComponents, updateSiteSettings } = usePageConfig()
  const siteConfigContext = useSiteConfigSafe()
  const editingContext = useEditingModeSafe()
  
  // Load Google Fonts dynamically when fonts change
  React.useEffect(() => {
    if (siteConfigContext?.config.fonts.googleFonts) {
      console.log('Loading fonts:', siteConfigContext.config.fonts)
      
      // Remove existing font link if any
      const existingLink = document.getElementById('custom-google-fonts')
      if (existingLink) {
        existingLink.remove()
      }
      
      // Add new font link
      const link = document.createElement('link')
      link.id = 'custom-google-fonts'
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${siteConfigContext.config.fonts.googleFonts}&display=swap`
      document.head.appendChild(link)
      
      console.log('Setting CSS variables:', {
        display: siteConfigContext.config.fonts.displayFamily,
        heading: siteConfigContext.config.fonts.headingFamily,
        body: siteConfigContext.config.fonts.bodyFamily
      })
      
      // Apply fonts to CSS variables
      document.documentElement.style.setProperty('--font-display', siteConfigContext.config.fonts.displayFamily)
      document.documentElement.style.setProperty('--font-heading', siteConfigContext.config.fonts.headingFamily)
      document.documentElement.style.setProperty('--font-body', siteConfigContext.config.fonts.bodyFamily)
    }
  }, [siteConfigContext?.config.fonts])
  
  // Only render enabled components from the page configuration
  const allComponents = config.components
    .filter(component => component.enabled)
    .sort((a, b) => a.order - b.order)
  
  // Debug log when config changes
  React.useEffect(() => {
    console.log('Config changed in renderer - total components:', config.components.length)
    console.log('Components detail:', JSON.stringify(config.components.map(c => ({ id: c.id, type: c.type, enabled: c.enabled, order: c.order })), null, 2))
  }, [config])
  
  // Debug log for allComponents
  React.useEffect(() => {
    console.log('All components to render:', allComponents.length)
    console.log('Rendering these components:', JSON.stringify(allComponents.map(c => ({ id: c.id, type: c.type, enabled: c.enabled, order: c.order })), null, 2))
  }, [allComponents.length, config.components])
  
  // Sync page config colors back to site config (for discarding changes)
  React.useEffect(() => {
    if (siteConfigContext && config.siteSettings.theme?.colors) {
      const pageColors = config.siteSettings.theme.colors
      const siteColors = siteConfigContext.config.colors
      
      // Update site config if page config colors changed (e.g., from discarding)
      if (
        pageColors.primary && pageColors.secondary && pageColors.accent &&
        (pageColors.primary !== siteColors.primary ||
        pageColors.secondary !== siteColors.secondary ||
        pageColors.accent !== siteColors.accent)
      ) {
        siteConfigContext.updateColors({
          primary: pageColors.primary,
          secondary: pageColors.secondary,
          accent: pageColors.accent
        })
      }
    }
  }, [
    config.siteSettings.theme?.colors?.primary,
    config.siteSettings.theme?.colors?.secondary,
    config.siteSettings.theme?.colors?.accent
  ])
  
  // Apply site config color changes to page config
  React.useEffect(() => {
    if (siteConfigContext && updateSiteSettings) {
      const currentColors = config.siteSettings.theme?.colors
      const newColors = siteConfigContext.config.colors
      
      // Only update if colors actually changed to avoid infinite loop
      if (
        currentColors?.primary !== newColors.primary ||
        currentColors?.secondary !== newColors.secondary ||
        currentColors?.accent !== newColors.accent
      ) {
        updateSiteSettings({
          theme: {
            colors: {
              primary: newColors.primary,
              secondary: newColors.secondary,
              accent: newColors.accent
            }
          }
        })
      }
    }
  }, [
    siteConfigContext?.config.colors.primary,
    siteConfigContext?.config.colors.secondary,
    siteConfigContext?.config.colors.accent
  ])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  // Handler for adding new sections
  const handleAddSection = (position: number, sectionType: string) => {
    console.log('Adding section:', sectionType, 'at position:', position)
    
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
      console.log('Component already enabled')
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
    
    console.log('Updated components:', updatedComponents)
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
          howWeMetText: 'Our love story began in the most unexpected way. From the moment we met, we knew there was something special between us. What started as a chance encounter blossomed into a beautiful friendship, and eventually, a love that we knew would last forever.',
          proposalText: 'The proposal was a magical moment we\'ll cherish forever. Surrounded by the beauty of nature and the warmth of our love, the question was asked and answered with tears of joy. It was the perfect beginning to our next chapter together.',
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
      wedding,
      dateId: wedding.date_id,
      weddingNameId,
      theme: config.siteSettings.theme,
      alignment: { text: 'center' }
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
            hasWeddingDate={!!wedding.wedding_date}
          />
        </div>
      </React.Fragment>
    )
  }

  return (
    <>
      <EditingTopBar />
      
      <ViewportWrapper>
        {allComponents.length === 0 ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">No Components Configured</h2>
              <p className="text-gray-600 mb-4">This wedding page has no components enabled.</p>
              <AddSectionButton 
                position={0} 
                onAddSection={handleAddSection}
                enabledComponents={[]}
                hasWeddingDate={!!wedding.wedding_date}
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
    <VariantProvider>
      <ViewportProvider>
        <EditingModeProvider>
          <ConfigBasedWeddingRendererWithConfig {...props} />
        </EditingModeProvider>
      </ViewportProvider>
    </VariantProvider>
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
      <CustomizeProvider weddingDate={props.wedding.wedding_date}>
        <ConfigBasedWeddingRendererContent {...props} />
      </CustomizeProvider>
    </SiteConfigProvider>
  )
}
"use client"

import React, { useMemo } from 'react'
import { Wedding } from '@/lib/wedding-data'
import { WeddingPageConfig, ComponentConfig } from '@/lib/wedding-config'
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
import { SiteConfigProvider, useSiteConfigSafe } from './contexts/site-config-context'
import { EditingModeProvider, useEditingModeSafe } from './contexts/editing-mode-context'
import { CustomizeProvider, useCustomizeSafe } from './contexts/customize-context'
import { SectionCustomizer } from './ui/section-customizer'
import { EditingTopBar } from './ui/editing-top-bar'
import { AddSectionButton } from './ui/add-section-button'
import { createConfigFromWedding } from '@/lib/wedding-configs'

interface ClientWeddingPageRendererProps {
  wedding: Wedding
  dateId: string
  weddingNameId: string
  config: WeddingPageConfig
  showVariantSwitchers?: boolean
}

function ClientWeddingPageRendererContent({
  wedding,
  dateId,
  weddingNameId,
  config,
  showVariantSwitchers = false
}: ClientWeddingPageRendererProps) {
  const siteConfigContext = useSiteConfigSafe()
  const editingContext = useEditingModeSafe()
  const customizeContext = useCustomizeSafe()
  
  // Use editing context if available, otherwise fall back to prop
  const isEditingMode = editingContext?.isEditingMode ?? showVariantSwitchers

  // Handler for adding new sections
  const handleAddSection = (position: number, sectionType: string) => {
    if (siteConfigContext) {
      siteConfigContext.addComponent(sectionType, position, filteredComponents)
    }
  }
  // Sort components by order
  const sortedComponents = config.components
    .filter(component => component.enabled)
    .sort((a, b) => a.order - b.order)

  const renderComponent = (component: ComponentConfig, configToUse = config) => {
    const commonProps = {
      theme: { ...configToUse.theme, ...component.theme },
      alignment: component.alignment
    }

    switch (component.type) {
      case 'hero':
        return (
          <HeroSection
            key={component.id}
            wedding={wedding}
            weddingNameId={weddingNameId}
            {...commonProps}
            {...component.props}
            variant={component.props.variant || 'background'}
            imagePosition={component.props.imagePosition || 'left'}
            frameStyle={component.props.frameStyle || 'circular'}
            imageSize={component.props.imageSize || 'medium'}
            backgroundColor={component.props.backgroundColor}
            showDecorations={component.props.showDecorations !== false}
          />
        )

      case 'our-story':
        return (
          <OurStorySection
            key={component.id}
            {...commonProps}
            {...component.props}
            howWeMetText={component.props.howWeMetText || ""}
            variant={component.props.variant || 'cards'}
          />
        )

      case 'event-details':
        return (
          <EventDetailsSection
            key={component.id}
            wedding={wedding}
            dateId={dateId}
            weddingNameId={weddingNameId}
            {...commonProps}
            {...component.props}
          />
        )

      case 'rsvp':
        return (
          <RSVPSection
            key={component.id}
            dateId={dateId}
            weddingNameId={weddingNameId}
            {...commonProps}
            {...component.props}
            variant={component.props.variant || 'cta'}
          />
        )

      case 'gallery':
        return (
          <GallerySection
            key={component.id}
            dateId={dateId}
            weddingNameId={weddingNameId}
            {...commonProps}
            {...component.props}
          />
        )

      case 'faq':
        return (
          <FAQSection
            key={component.id}
            {...commonProps}
            {...component.props}
          />
        )

      case 'countdown':
        return (
          <CountdownSection
            key={component.id}
            weddingDate={wedding.wedding_date || ''}
            {...commonProps}
            {...component.props}
          />
        )

      // Placeholder for future components
      case 'wedding-party':
      case 'schedule':
      case 'travel':
      case 'registry':
      case 'guestbook':
      case 'contact':
      case 'livestream':
      case 'thank-you':
        return (
          <div key={component.id} className="py-16 text-center">
            <h2 className="text-2xl font-bold mb-4">
              {component.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Section
            </h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        )

      default:
        return null
    }
  }

  // Apply site configuration if available
  const appliedConfig = useMemo(() => {
    if (!siteConfigContext) return config
    
    const { config: siteConfig } = siteConfigContext
    
    // Regenerate the full config with the selected style
    const newConfig = createConfigFromWedding(
      wedding, 
      siteConfig.style as 'classic' | 'modern' | 'rustic'
    )
    
    // Apply custom colors on top of the style config
    return {
      ...newConfig,
      theme: {
        ...newConfig.theme,
        colors: {
          ...newConfig.theme.colors,
          primary: siteConfig.colors.primary,
          secondary: siteConfig.colors.secondary,
          accent: siteConfig.colors.accent,
        }
      }
    }
  }, [config, wedding, siteConfigContext?.config])
  
  // Filter and enable components based on site configuration
  const filteredComponents = useMemo(() => {
    // Use components from the applied config (which includes all components for the selected style)
    const componentsToFilter = appliedConfig.components || sortedComponents
    
    if (!siteConfigContext) return componentsToFilter
    
    const { config: siteConfig } = siteConfigContext
    
    // Get existing enabled components
    const existingComponents = componentsToFilter
      .map(component => ({
        ...component,
        enabled: siteConfig.enabledComponents.includes(component.type)
      }))
      .filter(component => component.enabled)

    // Create dynamic components from the context
    const dynamicComponents = siteConfig.dynamicComponents
      .filter(dynComp => dynComp.enabled)
      .map(dynComp => ({
        id: dynComp.id,
        type: dynComp.type as ComponentConfig['type'],
        enabled: true,
        order: dynComp.order,
        props: {}, // Default empty props
        alignment: { 
          text: 'center' as const, 
          content: 'center' as const, 
          image: 'center' as const 
        }
      }))

    // Combine and sort all components
    const allComponents = [...existingComponents, ...dynamicComponents]
    return allComponents.sort((a, b) => a.order - b.order)
  }, [appliedConfig, sortedComponents, siteConfigContext?.config])

  const content = (
    <div className="min-h-screen">
      {/* Editing Top Bar */}
      <EditingTopBar />
      
      {/* Section Customizer */}
      <SectionCustomizer />
      
      {/* Render components with add buttons after each */}
      <div>
        {filteredComponents.map((component, index) => (
          <React.Fragment key={component.id}>
            {renderComponent(component, appliedConfig)}
            
            {/* Add button after each section */}
            <AddSectionButton 
              position={index + 1} 
              onAddSection={handleAddSection}
              enabledComponents={siteConfigContext?.config.enabledComponents || []}
              hasWeddingDate={!!wedding.wedding_date}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  )

  return content
}

export function ClientWeddingPageRenderer(props: ClientWeddingPageRendererProps) {
  return (
    <SiteConfigProvider>
      <EditingModeProvider initialEditingMode={props.showVariantSwitchers}>
        <CustomizeProvider weddingDate={props.wedding.wedding_date}>
          <VariantProvider>
            <ClientWeddingPageRendererContent {...props} />
          </VariantProvider>
        </CustomizeProvider>
      </EditingModeProvider>
    </SiteConfigProvider>
  )
}
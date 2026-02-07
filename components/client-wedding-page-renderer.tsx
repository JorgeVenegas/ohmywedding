"use client"

import React, { useMemo } from 'react'
import { Wedding } from '@/lib/wedding-data'
import { WeddingPageConfig, ComponentConfig, ComponentType, defaultComponentConfigs } from '@/lib/wedding-config'
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
import { WeddingNav } from './ui/wedding-nav'
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
      dateId,
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
            howWeMetText={component.props.howWeMetText || undefined}
            variant={component.props.variant || 'cards'}
          />
        )

      case 'event-details':
        return (
          <EventDetailsSection
            key={component.id}
            wedding={wedding}
            weddingNameId={weddingNameId}
            {...commonProps}
            {...component.props}
          />
        )

      case 'rsvp':
        return (
          <RSVPSection
            key={component.id}
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
    
    // Regenerate the full config with the default style
    const newConfig = createConfigFromWedding(wedding, 'classic')
    
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
    
    // Create a map of existing components by type
    const existingComponentsByType = new Map<string, ComponentConfig>()
    componentsToFilter.forEach(comp => {
      existingComponentsByType.set(comp.type, comp)
    })
    
    // Build the final component list
    const allComponents: ComponentConfig[] = []
    
    siteConfig.enabledComponents.forEach((componentType, index) => {
      // Check if component already exists in the config
      if (existingComponentsByType.has(componentType)) {
        const existing = existingComponentsByType.get(componentType)!
        allComponents.push({
          ...existing,
          enabled: true,
          order: index // Use the order from enabledComponents array
        })
      } else {
        // Create a new component from defaults if it doesn't exist
        const defaultConfig = defaultComponentConfigs[componentType as ComponentType]
        if (defaultConfig) {
          allComponents.push({
            id: `${componentType}-${Date.now()}`,
            ...defaultConfig,
            enabled: true,
            order: index
          })
        }
      }
    })
    
    return allComponents.sort((a, b) => a.order - b.order)
  }, [appliedConfig, sortedComponents, siteConfigContext?.config])

  const content = (
    <div className="min-h-screen">
      {/* Wedding Navigation - appears after scrolling past hero */}
      <WeddingNav 
        person1Name={wedding.partner1_first_name}
        person2Name={wedding.partner2_first_name}
        accentColor={appliedConfig.theme?.colors?.primary || '#DDA46F'}
        themeColors={appliedConfig.theme?.colors}
      />
      
      {/* Editing Top Bar */}
      <EditingTopBar weddingNameId={weddingNameId} />
      
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
        <CustomizeProvider weddingDate={props.wedding.wedding_date} weddingNameId={props.weddingNameId}>
          <VariantProvider>
            <ClientWeddingPageRendererContent {...props} />
          </VariantProvider>
        </CustomizeProvider>
      </EditingModeProvider>
    </SiteConfigProvider>
  )
}
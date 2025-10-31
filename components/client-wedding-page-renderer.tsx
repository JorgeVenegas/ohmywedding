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
import { SiteControlPanel } from './ui/site-control-panel'
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
            dateId={dateId}
            weddingNameId={weddingNameId}
            {...commonProps}
            {...component.props}
            variant={component.props.variant || 'background'}
            imagePosition={component.props.imagePosition || 'left'}
            frameStyle={component.props.frameStyle || 'circular'}
            imageSize={component.props.imageSize || 'medium'}
            backgroundColor={component.props.backgroundColor}
            showDecorations={component.props.showDecorations !== false}
            showVariantSwitcher={showVariantSwitchers}
          />
        )

      case 'our-story':
        return (
          <OurStorySection
            key={component.id}
            {...commonProps}
            {...component.props}
            // Pre-populate with wedding story if available
            howWeMetText={component.props.howWeMetText || wedding.story || ""}
            variant={component.props.variant || 'cards'}
            showVariantSwitcher={showVariantSwitchers}
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
            showVariantSwitcher={showVariantSwitchers}
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
            weddingDate={wedding.wedding_date}
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
    
    return componentsToFilter
      .map(component => ({
        ...component,
        enabled: siteConfig.enabledComponents.includes(component.type)
      }))
      .filter(component => component.enabled)
      .sort((a, b) => a.order - b.order) // Ensure proper ordering
  }, [appliedConfig, sortedComponents, siteConfigContext?.config.enabledComponents])

  const content = (
    <div className="min-h-screen">
      {/* Site Control Panel */}
      {showVariantSwitchers && siteConfigContext && (
        <SiteControlPanel
          currentStyle={siteConfigContext.config.style}
          currentColors={siteConfigContext.config.colors}
          enabledComponents={siteConfigContext.config.enabledComponents}
          onStyleChange={siteConfigContext.updateStyle}
          onColorsChange={siteConfigContext.updateColors}
          onComponentToggle={siteConfigContext.toggleComponent}
          onCustomColorChange={siteConfigContext.updateCustomColor}
        />
      )}
      
      {/* Render filtered components */}
      {filteredComponents.map(component => renderComponent(component, appliedConfig))}
    </div>
  )

  return content
}

export function ClientWeddingPageRenderer(props: ClientWeddingPageRendererProps) {
  return (
    <SiteConfigProvider>
      <VariantProvider>
        <ClientWeddingPageRendererContent {...props} />
      </VariantProvider>
    </SiteConfigProvider>
  )
}
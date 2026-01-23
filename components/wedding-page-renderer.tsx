import React from 'react'
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
import { BannerSection } from './wedding-sections/banner-section'
import { ClientWeddingPageRenderer } from './client-wedding-page-renderer'
import { WeddingNav } from './ui/wedding-nav'

interface WeddingPageRendererProps {
  wedding: Wedding
  dateId: string
  weddingNameId: string
  config: WeddingPageConfig
  showVariantSwitchers?: boolean // Enable/disable variant switchers globally
}

export function WeddingPageRenderer({
  wedding,
  dateId,
  weddingNameId,
  config,
  showVariantSwitchers = false
}: WeddingPageRendererProps) {
  // Sort components by order
  const sortedComponents = config.components
    .filter(component => component.enabled)
    .sort((a, b) => a.order - b.order)

  const renderComponent = (component: ComponentConfig) => {
    const commonProps = {
      dateId,
      theme: { ...config.theme, ...component.theme },
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
            showVariantSwitcher={showVariantSwitchers}
          />
        )

      case 'banner':
        return (
          <BannerSection
            key={component.id}
            {...commonProps}
            {...component.props}
          />
        )

      case 'our-story':
        return (
          <OurStorySection
            key={component.id}
            {...commonProps}
            {...component.props}
            howWeMetText={component.props.howWeMetText || undefined}
            proposalText={component.props.proposalText || undefined}
            variant={component.props.variant || 'cards'}
            showVariantSwitcher={showVariantSwitchers}
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
            showVariantSwitcher={showVariantSwitchers}
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

  // Use the client component when we need variant switching
  if (showVariantSwitchers) {
    return (
      <ClientWeddingPageRenderer
        wedding={wedding}
        dateId={dateId}
        weddingNameId={weddingNameId}
        config={config}
        showVariantSwitchers={showVariantSwitchers}
      />
    )
  }

  // Otherwise render as server component for better performance
  return (
    <div className="min-h-screen">
      {/* Wedding Navigation - appears after scrolling past hero */}
      <WeddingNav 
        person1Name={wedding.partner1_first_name}
        person2Name={wedding.partner2_first_name}
        accentColor={config.theme?.colors?.primary || '#B8860B'}
        themeColors={config.theme?.colors}
      />
      
      {/* Render components in order */}
      {sortedComponents.map(renderComponent)}
    </div>
  )
}
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
import { SectionCustomizer } from './ui/section-customizer'
import { EditingTopBar } from './ui/editing-top-bar'
import { AddSectionButton } from './ui/add-section-button'
import { DeleteSectionButton } from './ui/delete-section-button'
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
  const { config, isLoading, updateComponents } = usePageConfig()
  const siteConfigContext = useSiteConfigSafe()
  const editingContext = useEditingModeSafe()

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

  // Only render enabled components from the page configuration
  const allComponents = config.components
    .filter(component => component.enabled)
    .sort((a, b) => a.order - b.order)

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
          howWeMetText: 'Our love story began in the most unexpected way...',
          proposalText: 'The proposal was a magical moment...',
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
            howWeMetText={component.props.howWeMetText || ""}
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
        </div>
        <AddSectionButton 
          position={index + 1} 
          onAddSection={handleAddSection}
          enabledComponents={allComponents.map(c => c.type)}
          hasWeddingDate={!!wedding.wedding_date}
        />
      </React.Fragment>
    )
  }

  return (
    <>
      <EditingTopBar />
      
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

      <SectionCustomizer />
    </>
  )
}

export function ConfigBasedWeddingRenderer(props: ConfigBasedWeddingRendererProps) {
  return (
    <VariantProvider>
      <EditingModeProvider>
        <SiteConfigProvider>
          <CustomizeProvider weddingDate={props.wedding.wedding_date}>
            <ConfigBasedWeddingRendererContent {...props} />
          </CustomizeProvider>
        </SiteConfigProvider>
      </EditingModeProvider>
    </VariantProvider>
  )
}
"use client"

import React from 'react'
import { CustomizePanel } from './customize-panel'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { 
  HeroConfigForm, 
  CountdownConfigForm, 
  OurStoryConfigForm, 
  RSVPConfigForm 
} from './config-forms'
import { Button } from './button'

const SECTION_ICONS: Record<string, string> = {
  hero: '🏠',
  countdown: '⏰',
  'our-story': '💕',
  rsvp: '📝',
  gallery: '📸',
  faq: '❓',
  'event-details': '📍'
}

const SECTION_NAMES: Record<string, string> = {
  hero: 'Hero Section',
  countdown: 'Countdown Timer',
  'our-story': 'Our Story',
  rsvp: 'RSVP',
  gallery: 'Photo Gallery',
  faq: 'FAQ',
  'event-details': 'Event Details'
}

export function SectionCustomizer() {
  const customizeContext = useCustomizeSafe()
  
  if (!customizeContext) return null
  
  const { state, closeCustomizer, updateConfig, resetConfig } = customizeContext
  const { isOpen, sectionType, sectionConfig } = state

  const renderConfigForm = () => {
    switch (sectionType) {
      case 'hero':
        return (
          <HeroConfigForm 
            config={sectionConfig} 
            onChange={updateConfig}
            hasWeddingDate={!!customizeContext.weddingDate}
            weddingNameId={customizeContext.weddingNameId}
          />
        )
      case 'countdown':
        return (
          <CountdownConfigForm 
            config={sectionConfig} 
            onChange={updateConfig}
          />
        )
      case 'our-story':
        return (
          <OurStoryConfigForm 
            config={sectionConfig} 
            onChange={updateConfig}
            weddingNameId={customizeContext.weddingNameId}
          />
        )
      case 'rsvp':
        return (
          <RSVPConfigForm 
            config={sectionConfig} 
            onChange={updateConfig}
          />
        )
      case 'gallery':
      case 'faq':
      case 'event-details':
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Configuration options for {SECTION_NAMES[sectionType]} coming soon!</p>
          </div>
        )
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Unknown section type</p>
          </div>
        )
    }
  }

  const sectionIcon = sectionType ? SECTION_ICONS[sectionType] : '⚙️'
  const sectionName = sectionType ? SECTION_NAMES[sectionType] : 'Section'
  const title = `${sectionIcon} ${sectionName}`

  return (
    <CustomizePanel
      isOpen={isOpen}
      onClose={closeCustomizer}
      title={title}
    >
      <div className="space-y-6">
        {renderConfigForm()}
        
        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <Button
            onClick={resetConfig}
            variant="outline"
            className="flex-1"
          >
            Reset to Default
          </Button>
        </div>
      </div>
    </CustomizePanel>
  )
}
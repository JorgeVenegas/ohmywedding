"use client"

import React from 'react'
import { Crown, Heart, Clock, MapPin, Image, Mail, HelpCircle } from 'lucide-react'
import { CustomizePanel } from './customize-panel'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { 
  HeroConfigForm, 
  CountdownConfigForm, 
  OurStoryConfigForm, 
  RSVPConfigForm,
  EventDetailsConfigForm,
  FAQConfigForm
} from './config-forms'
import { Button } from './button'

// Gold color for elegant icons
const GOLD_COLOR = '#B8860B'

const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: <Crown className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />,
  countdown: <Clock className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />,
  'our-story': <Heart className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />,
  rsvp: <Mail className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />,
  gallery: <Image className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />,
  faq: <HelpCircle className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />,
  'event-details': <MapPin className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />
}

const SECTION_NAMES: Record<string, string> = {
  hero: 'Main Banner',
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
      case 'event-details':
        return (
          <EventDetailsConfigForm 
            config={sectionConfig} 
            onChange={updateConfig}
          />
        )
      case 'faq':
        return (
          <FAQConfigForm 
            config={sectionConfig} 
            onChange={updateConfig}
          />
        )
      case 'gallery':
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

  const sectionName = sectionType ? SECTION_NAMES[sectionType] : 'Section'
  const sectionIcon = sectionType ? SECTION_ICONS[sectionType] : null

  return (
    <CustomizePanel
      isOpen={isOpen}
      onClose={closeCustomizer}
      title={sectionName}
      icon={sectionIcon}
    >
      <div className="space-y-6">
        {renderConfigForm()}
      </div>
    </CustomizePanel>
  )
}
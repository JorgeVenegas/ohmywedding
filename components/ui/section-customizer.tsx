"use client"

import React from 'react'
import { Crown, Heart, Clock, MapPin, Image, Mail, HelpCircle, Gift } from 'lucide-react'
import { CustomizePanel } from './customize-panel'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { usePageConfigSafe } from '@/components/contexts/page-config-context'
import { useI18n } from '@/components/contexts/i18n-context'
import { 
  HeroConfigForm, 
  CountdownConfigForm, 
  OurStoryConfigForm, 
  RSVPConfigForm,
  EventDetailsConfigForm,
  FAQConfigForm,
  RegistryConfigForm,
  GalleryConfigForm
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
  'event-details': <MapPin className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />,
  registry: <Gift className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />
}

export function SectionCustomizer() {
  const customizeContext = useCustomizeSafe()
  const pageConfigContext = usePageConfigSafe()
  const { t } = useI18n()
  
  if (!customizeContext) return null
  
  const { state, closeCustomizer, updateConfig, resetConfig } = customizeContext
  const { isOpen, sectionType, sectionConfig } = state

  // Get translated section name
  const getSectionName = (type: string | null): string => {
    if (!type) return t('config.unknownSection')
    const sectionNameMap: Record<string, string> = {
      hero: t('config.sectionMainBanner'),
      countdown: t('config.sectionCountdown'),
      'our-story': t('config.sectionOurStory'),
      rsvp: t('config.sectionRsvp'),
      gallery: t('config.sectionGallery'),
      faq: t('config.sectionFaq'),
      'event-details': t('config.sectionEventDetails'),
      registry: t('registry.title')
    }
    return sectionNameMap[type] || t('config.unknownSection')
  }

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
            wedding={pageConfigContext?.weddingDetails || undefined}
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
      case 'registry':
        return (
          <RegistryConfigForm 
            config={sectionConfig} 
            onChange={updateConfig}
          />
        )
      case 'gallery':
        return (
          <GalleryConfigForm 
            config={sectionConfig} 
            onChange={updateConfig}
          />
        )
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>{t('config.unknownSection')}</p>
          </div>
        )
    }
  }

  const sectionName = getSectionName(sectionType)
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
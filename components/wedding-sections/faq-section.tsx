"use client"

import React from 'react'
import {
  FAQAccordionVariant,
  FAQMinimalVariant,
  FAQCardsVariant,
  FAQElegantVariant,
  FAQSimpleVariant,
  BaseFAQProps
} from './faq-variants'
import { 
  useSectionVariants, 
  createVariantConfig, 
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'
import { useI18n } from '@/components/contexts/i18n-context'

// Old hardcoded English defaults to detect
const OLD_ENGLISH_DEFAULTS = {
  title: ['Frequently Asked Questions'],
  subtitle: ['Everything you need to know for our special day'],
  contactNote: ["Have a question that's not answered here? Feel free to reach out to us directly!"]
}

function isOldHardcodedDefault(value: string | undefined, type: 'title' | 'subtitle' | 'contactNote'): boolean {
  if (!value) return false
  return OLD_ENGLISH_DEFAULTS[type].includes(value)
}

interface FAQSectionProps extends BaseFAQProps {
  variant?: 'accordion' | 'minimal' | 'cards' | 'elegant' | 'simple'
  showVariantSwitcher?: boolean
}

export function FAQSection({
  theme,
  alignment,
  questions = [],
  allowMultipleOpen = false,
  sectionTitle,
  sectionSubtitle,
  showContactNote = true,
  contactNoteText,
  variant = 'accordion',
  showVariantSwitcher = true
}: FAQSectionProps) {
  const { t } = useI18n()
  
  // Use standardized section behavior
  const {
    activeVariant,
    customConfig,
    shouldShowVariantSwitcher,
    setVariant,
    handleEditClick
  } = useSectionVariants('faq', 'faq', 'accordion', variant, showVariantSwitcher)

  // Define variants
  const faqVariants: VariantOption[] = [
    {
      value: 'accordion',
      label: 'Accordion',
      description: 'Classic expandable accordion style'
    },
    {
      value: 'minimal',
      label: 'Minimal',
      description: 'Ultra-clean and compact design'
    },
    {
      value: 'cards',
      label: 'Cards Grid',
      description: 'All questions visible in a grid'
    },
    {
      value: 'elegant',
      label: 'Elegant',
      description: 'Romantic style with decorative elements'
    },
    {
      value: 'simple',
      label: 'Simple List',
      description: 'Clean numbered list format'
    }
  ]

  // Create config using standardized helper
  const config = createVariantConfig(customConfig, {
    questions,
    allowMultipleOpen,
    sectionTitle,
    sectionSubtitle,
    showContactNote,
    contactNoteText,
    useColorBackground: false,
    backgroundColorChoice: 'none'
  })

  // Get translated values, treating old hardcoded English defaults as empty
  const getTranslatedTitle = () => {
    const configTitle = config.sectionTitle
    if (configTitle && !isOldHardcodedDefault(configTitle, 'title')) {
      return configTitle
    }
    if (sectionTitle && !isOldHardcodedDefault(sectionTitle, 'title')) {
      return sectionTitle
    }
    return undefined // Let variant use translated default
  }

  const getTranslatedSubtitle = () => {
    const configSubtitle = config.sectionSubtitle
    if (configSubtitle && !isOldHardcodedDefault(configSubtitle, 'subtitle')) {
      return configSubtitle
    }
    if (sectionSubtitle && !isOldHardcodedDefault(sectionSubtitle, 'subtitle')) {
      return sectionSubtitle
    }
    return undefined // Let variant use translated default
  }

  const getTranslatedContactNote = () => {
    const configNote = config.contactNoteText
    if (configNote && !isOldHardcodedDefault(configNote, 'contactNote')) {
      return configNote
    }
    if (contactNoteText && !isOldHardcodedDefault(contactNoteText, 'contactNote')) {
      return contactNoteText
    }
    return undefined // Let variant use translated default
  }

  const commonProps: BaseFAQProps = {
    theme,
    alignment,
    questions: config.questions || questions,
    allowMultipleOpen: config.allowMultipleOpen ?? allowMultipleOpen,
    sectionTitle: getTranslatedTitle(),
    sectionSubtitle: getTranslatedSubtitle(),
    showContactNote: config.showContactNote ?? showContactNote,
    contactNoteText: getTranslatedContactNote(),
    useColorBackground: config.useColorBackground ?? false,
    backgroundColorChoice: config.backgroundColorChoice || 'none'
  }

  const renderFAQContent = (activeVariant: string) => {
    switch (activeVariant) {
      case 'minimal':
        return <FAQMinimalVariant {...commonProps} />
      case 'cards':
        return <FAQCardsVariant {...commonProps} />
      case 'elegant':
        return <FAQElegantVariant {...commonProps} />
      case 'simple':
        return <FAQSimpleVariant {...commonProps} />
      case 'accordion':
      default:
        return <FAQAccordionVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    // Pass custom values to the edit form - leave empty if no custom value set
    // The page will display translated defaults, but the form should show empty inputs
    handleEditClick(sectionType, {
      questions: config.questions || questions,
      allowMultipleOpen: config.allowMultipleOpen ?? allowMultipleOpen,
      sectionTitle: getTranslatedTitle() || '', // Empty string if no custom title
      sectionSubtitle: getTranslatedSubtitle() || '', // Empty string if no custom subtitle
      showContactNote: config.showContactNote ?? showContactNote,
      contactNoteText: getTranslatedContactNote() || '', // Empty string if no custom note
      useColorBackground: config.useColorBackground ?? false,
      backgroundColorChoice: config.backgroundColorChoice || 'none'
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="faq"
      sectionType="faq"
      onEditClick={onEditClick}
    >
      {renderFAQContent(activeVariant)}
    </EditableSectionWrapper>
  )
}
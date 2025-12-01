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

interface FAQSectionProps extends BaseFAQProps {
  variant?: 'accordion' | 'minimal' | 'cards' | 'elegant' | 'simple'
  showVariantSwitcher?: boolean
}

export function FAQSection({
  theme,
  alignment,
  questions = [],
  allowMultipleOpen = false,
  sectionTitle = "Frequently Asked Questions",
  sectionSubtitle = "Everything you need to know for our special day",
  showContactNote = true,
  contactNoteText = "Have a question that's not answered here? Feel free to reach out to us directly!",
  variant = 'accordion',
  showVariantSwitcher = true
}: FAQSectionProps) {
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

  const commonProps: BaseFAQProps = {
    theme,
    alignment,
    questions: config.questions || questions,
    allowMultipleOpen: config.allowMultipleOpen ?? allowMultipleOpen,
    sectionTitle: config.sectionTitle || sectionTitle,
    sectionSubtitle: config.sectionSubtitle || sectionSubtitle,
    showContactNote: config.showContactNote ?? showContactNote,
    contactNoteText: config.contactNoteText || contactNoteText,
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
    handleEditClick(sectionType, {
      questions: config.questions || questions,
      allowMultipleOpen: config.allowMultipleOpen ?? allowMultipleOpen,
      sectionTitle: config.sectionTitle || sectionTitle,
      sectionSubtitle: config.sectionSubtitle || sectionSubtitle,
      showContactNote: config.showContactNote ?? showContactNote,
      contactNoteText: config.contactNoteText || contactNoteText,
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
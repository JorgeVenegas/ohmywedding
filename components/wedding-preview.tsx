"use client"

import React, { useMemo } from 'react'
import { WeddingPageRenderer } from '@/components/wedding-page-renderer'
import { I18nProvider } from '@/components/contexts/i18n-context'

interface WeddingPreviewProps {
  formData: {
    partner1FirstName: string
    partner1LastName: string
    partner2FirstName: string
    partner2LastName: string
    weddingDate: string
    weddingTime: string
    receptionTime: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
  }
  componentSections: Array<{
    id: string
    name: string
    enabled: boolean
    props: Record<string, any>
  }>
}

export function WeddingPreview({ formData, componentSections }: WeddingPreviewProps) {
  // Memoize the wedding config to ensure proper re-renders
  const weddingConfig = useMemo(() => ({
    theme: {
      colors: {
        primary: formData.primaryColor,
        secondary: formData.secondaryColor,
        accent: formData.accentColor,
        background: '#ffffff',
        foreground: '#000000',
        muted: '#f8f9fa'
      },
      fonts: {
        heading: 'Playfair Display',
        body: 'Inter',
        script: 'Dancing Script'
      },
      spacing: {
        section: '4rem',
        container: '2rem'
      }
    },
    meta: {
      title: `${formData.partner1FirstName} & ${formData.partner2FirstName} - Wedding`,
      description: 'Join us for our special day!'
    },
    components: componentSections
      .filter(section => section.enabled)
      .map((section, index) => {
        const props = { ...section.props }
        
        // For our-story section, don't pass empty strings - let component use defaults
        if (section.id === 'our-story') {
          if (!props.howWeMetText || props.howWeMetText.trim() === '') {
            delete props.howWeMetText
          }
          if (!props.proposalText || props.proposalText.trim() === '') {
            delete props.proposalText
          }
        }
        
        return {
          id: section.id,
          type: section.id as any,
          enabled: true,
          order: index,
          props
        }
      })
  }), [formData, componentSections])

  // Create a mock wedding object for the preview
  const mockWedding = {
    id: 'preview',
    date_id: 'preview',
    wedding_name_id: 'preview',
    partner1_first_name: formData.partner1FirstName || 'Partner 1',
    partner1_last_name: formData.partner1LastName || '',
    partner2_first_name: formData.partner2FirstName || 'Partner 2', 
    partner2_last_name: formData.partner2LastName || '',
    wedding_date: formData.weddingDate || null,
    wedding_time: formData.weddingTime || null,
    reception_time: formData.receptionTime || null,
    story: null,
    primary_color: formData.primaryColor,
    secondary_color: formData.secondaryColor,
    accent_color: formData.accentColor,
    ceremony_venue_name: null,
    ceremony_venue_address: null,
    reception_venue_name: null,
    reception_venue_address: null,
    owner_id: null,
    collaborator_emails: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    page_config: {
      theme: {
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor
      },
      components: componentSections
        .filter(section => section.enabled)
        .map(section => ({
          id: section.id,
          type: section.id,
          enabled: true,
          props: section.props
        }))
    }
  }

  if (!formData.partner1FirstName && !formData.partner2FirstName) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Enter partner names to see preview</p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">Live Preview</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        <I18nProvider initialLocale="en">
          <WeddingPageRenderer 
            wedding={mockWedding}
            dateId="preview"
            weddingNameId="preview"
            config={weddingConfig}
            showVariantSwitchers={false}
          />
        </I18nProvider>
      </div>
    </div>
  )
}
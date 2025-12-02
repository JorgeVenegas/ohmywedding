"use client"

import React, { useState, useEffect } from 'react'
import { X, FileText } from 'lucide-react'
import { Button } from './button'
import { WeddingDetailsForm } from './config-forms/wedding-details-form'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { useI18n } from '@/components/contexts/i18n-context'

interface WeddingDetailsPanel {
  isOpen: boolean
  onClose: () => void
  weddingNameId: string
}

interface WeddingDetails {
  partner1_first_name: string
  partner1_last_name: string
  partner2_first_name: string
  partner2_last_name: string
  wedding_date: string | null
  wedding_time: string | null
  reception_time: string | null
  ceremony_venue_name: string | null
  ceremony_venue_address: string | null
  reception_venue_name: string | null
  reception_venue_address: string | null
}

export function WeddingDetailsPanel({ isOpen, onClose, weddingNameId }: WeddingDetailsPanel) {
  const [details, setDetails] = useState<WeddingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { config } = usePageConfig()
  const { t } = useI18n()
  
  // Get theme colors
  const primaryColor = config.siteSettings.theme?.colors?.primary || '#d4a574'

  // Load wedding details when panel opens
  useEffect(() => {
    if (isOpen && weddingNameId) {
      loadDetails()
    }
  }, [isOpen, weddingNameId])

  const loadDetails = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/weddings/${weddingNameId}/details`)
      
      if (!response.ok) {
        throw new Error('Failed to load wedding details')
      }

      const data = await response.json()
      setDetails(data.details)
    } catch (err) {
      console.error('Error loading wedding details:', err)
      setError('Failed to load wedding details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = (updatedDetails: WeddingDetails) => {
    setDetails(updatedDetails)
    // Optionally reload the page to reflect changes
    // window.location.reload()
  }

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: primaryColor }} />
            <h2 className="text-lg font-semibold text-gray-900">{t('config.weddingDetails')}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-65px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div 
                  className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3"
                  style={{ borderColor: primaryColor }}
                ></div>
                <p className="text-sm text-gray-500">{t('common.loading')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={loadDetails} variant="outline" size="sm">
                {t('common.tryAgain')}
              </Button>
            </div>
          ) : details ? (
            <WeddingDetailsForm
              weddingNameId={weddingNameId}
              initialDetails={details}
              onSave={handleSave}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}

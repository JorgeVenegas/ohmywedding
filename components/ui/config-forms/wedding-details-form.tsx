"use client"

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, Users, Save, Loader2 } from 'lucide-react'
import { usePageConfigSafe } from '@/components/contexts/page-config-context'
import { useI18n } from '@/components/contexts/i18n-context'

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

interface WeddingDetailsFormProps {
  weddingNameId: string
  initialDetails: WeddingDetails
  onSave?: (details: WeddingDetails) => void
}

export function WeddingDetailsForm({ weddingNameId, initialDetails, onSave }: WeddingDetailsFormProps) {
  const [details, setDetails] = useState<WeddingDetails>(initialDetails)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  const pageConfigContext = usePageConfigSafe()
  const { t } = useI18n()

  // Initialize wedding details in context
  useEffect(() => {
    if (pageConfigContext && initialDetails) {
      pageConfigContext.setWeddingDetails(initialDetails)
    }
  }, []) // Only on mount

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(details) !== JSON.stringify(initialDetails)
    setHasChanges(changed)
  }, [details, initialDetails])

  const handleChange = (field: keyof WeddingDetails, value: string) => {
    const newDetails = {
      ...details,
      [field]: value || null
    }
    setDetails(newDetails)
    setSaveMessage(null)
    
    // Update context for real-time preview
    if (pageConfigContext) {
      pageConfigContext.updateWeddingDetails({ [field]: value || null })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const response = await fetch(`/api/weddings/${weddingNameId}/details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ details }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save wedding details')
      }

      setSaveMessage({ type: 'success', text: t('config.savedSuccessfully') })
      onSave?.(details)
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving wedding details:', error)
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : t('config.failedToSave') 
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Partner Names */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4" />
          {t('config.partnerNames')}
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('config.partner1FirstName')}</label>
            <Input
              value={details.partner1_first_name || ''}
              onChange={(e) => handleChange('partner1_first_name', e.target.value)}
              placeholder={t('config.firstName')}
              className="h-9"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('config.partner1LastName')}</label>
            <Input
              value={details.partner1_last_name || ''}
              onChange={(e) => handleChange('partner1_last_name', e.target.value)}
              placeholder={t('config.lastName')}
              className="h-9"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('config.partner2FirstName')}</label>
            <Input
              value={details.partner2_first_name || ''}
              onChange={(e) => handleChange('partner2_first_name', e.target.value)}
              placeholder={t('config.firstName')}
              className="h-9"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('config.partner2LastName')}</label>
            <Input
              value={details.partner2_last_name || ''}
              onChange={(e) => handleChange('partner2_last_name', e.target.value)}
              placeholder={t('config.lastName')}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Wedding Date */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {t('config.weddingDate')}
        </h3>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('config.date')}</label>
          <Input
            type="date"
            value={details.wedding_date || ''}
            onChange={(e) => handleChange('wedding_date', e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Ceremony Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {t('config.ceremony')}
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('config.time')}</label>
            <Input
              type="time"
              value={details.wedding_time || ''}
              onChange={(e) => handleChange('wedding_time', e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('config.venueName')}</label>
            <Input
              value={details.ceremony_venue_name || ''}
              onChange={(e) => handleChange('ceremony_venue_name', e.target.value)}
              placeholder="e.g., St. Mary's Church"
              className="h-9"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('config.address')}</label>
            <Input
              value={details.ceremony_venue_address || ''}
              onChange={(e) => handleChange('ceremony_venue_address', e.target.value)}
              placeholder={t('config.fullAddress')}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Reception Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {t('config.reception')}
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('config.time')}</label>
            <Input
              type="time"
              value={details.reception_time || ''}
              onChange={(e) => handleChange('reception_time', e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('config.venueName')}</label>
            <Input
              value={details.reception_venue_name || ''}
              onChange={(e) => handleChange('reception_venue_name', e.target.value)}
              placeholder="e.g., Grand Ballroom"
              className="h-9"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('config.address')}</label>
            <Input
              value={details.reception_venue_address || ''}
              onChange={(e) => handleChange('reception_venue_address', e.target.value)}
              placeholder={t('config.fullAddress')}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-3 rounded-lg text-sm ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || !hasChanges}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('editing.saving')}
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            {hasChanges ? t('editing.saveChanges') : t('config.noChanges')}
          </>
        )}
      </Button>
    </div>
  )
}

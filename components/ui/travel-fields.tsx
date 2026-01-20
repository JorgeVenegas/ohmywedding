"use client"

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/contexts/i18n-context'
import { Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react'

interface TravelFieldsProps {
  guestId: string
  guestName: string
  weddingNameId: string
  isTraveling: boolean
  travelingFrom: string
  travelArrangement: 'already_booked' | 'no_ticket_needed' | null
  ticketAttachmentUrl?: string | null
  adminSetTravel?: boolean // If true, travel status was set by admin and can't be changed
  requireTicketAttachment?: boolean // If true, ticket upload is required for 'already_booked'
  requireNoTicketReason?: boolean // If true, reason is required for 'no_ticket_needed'
  onTravelChange: (isTraveling: boolean) => void
  onTravelingFromChange: (location: string) => void
  onTravelArrangementChange: (arrangement: 'already_booked' | 'no_ticket_needed' | null) => void
  onTicketUpload?: (url: string) => void
  primaryColor?: string
  textColor?: string
}

export function TravelFields({
  guestId,
  guestName,
  weddingNameId,
  isTraveling,
  travelingFrom,
  travelArrangement,
  ticketAttachmentUrl,
  adminSetTravel = false,
  requireTicketAttachment = false,
  requireNoTicketReason = false,
  onTravelChange,
  onTravelingFromChange,
  onTravelArrangementChange,
  onTicketUpload,
  primaryColor = '#d4a574',
  textColor = '#333'
}: TravelFieldsProps) {
  const { t } = useI18n()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handleTicketUpload = async (file: File) => {
    if (!file || !onTicketUpload) return

    setUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('guestId', guestId)
      formData.append('weddingNameId', weddingNameId)

      const response = await fetch('/api/travel-ticket', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        onTicketUpload(data.url)
      } else {
        setUploadError(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Ticket upload error:', error)
      setUploadError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveTicket = async () => {
    if (!ticketAttachmentUrl || !onTicketUpload) return

    try {
      await fetch(`/api/travel-ticket?guestId=${guestId}`, {
        method: 'DELETE'
      })
      onTicketUpload('')
    } catch (error) {
      console.error('Error removing ticket:', error)
    }
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border" style={{ borderColor: `${primaryColor}30` }}>
      {/* Are you traveling? - Only show if not set by admin */}
      {!adminSetTravel ? (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" style={{ color: textColor }}>
            {t('rsvp.areyouTraveling')}
          </label>
          <Switch
            checked={isTraveling}
            onCheckedChange={onTravelChange}
          />
        </div>
      ) : (
        <div className="p-3 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
          <p className="text-sm font-medium" style={{ color: textColor }}>
            {t('rsvp.travelRequiredByOrganizer')}
          </p>
        </div>
      )}

      {isTraveling && (
        <>
          {/* Traveling From */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              {t('rsvp.travelingFrom')}
            </label>
            <Input
              type="text"
              value={travelingFrom}
              onChange={(e) => onTravelingFromChange(e.target.value)}
              placeholder={t('rsvp.travelingFromPlaceholder')}
              className="w-full"
            />
          </div>

          {/* Travel Arrangement - 2 Options */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              {t('rsvp.travelArrangement')}
            </label>
            <div className="space-y-2">
              {/* Already Booked (Requires Upload) */}
              <button
                type="button"
                onClick={() => onTravelArrangementChange('already_booked')}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  travelArrangement === 'already_booked' ? 'font-semibold' : ''
                }`}
                style={{
                  borderColor: travelArrangement === 'already_booked' ? primaryColor : '#e5e7eb',
                  backgroundColor: travelArrangement === 'already_booked' ? `${primaryColor}10` : 'transparent',
                  color: textColor
                }}
              >
                {t('rsvp.alreadyBookedTransportation')}
              </button>

              {/* No Ticket Needed */}
              <button
                type="button"
                onClick={() => onTravelArrangementChange('no_ticket_needed')}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  travelArrangement === 'no_ticket_needed' ? 'font-semibold' : ''
                }`}
                style={{
                  borderColor: travelArrangement === 'no_ticket_needed' ? primaryColor : '#e5e7eb',
                  backgroundColor: travelArrangement === 'no_ticket_needed' ? `${primaryColor}10` : 'transparent',
                  color: textColor
                }}
              >
                {t('rsvp.noTicketNeeded')}
              </button>
            </div>
          </div>

          {/* Ticket Upload - Show if already_booked is selected */}
          {travelArrangement === 'already_booked' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: textColor }}>
                {t('rsvp.uploadTicketProof')} {requireTicketAttachment && <span className="text-red-500">*</span>}
              </label>
              
              {ticketAttachmentUrl ? (
                <div className="p-3 rounded-lg border-2" style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}05` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className="text-sm font-medium" style={{ color: textColor }}>
                        {t('rsvp.ticketUploaded')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(ticketAttachmentUrl, '_blank')}
                        className="h-7 px-2 text-xs"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        {t('common.view')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveTicket}
                        className="h-7 px-2 text-xs"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleTicketUpload(file)
                      }}
                      disabled={uploading}
                      className="hidden"
                      id={`ticket-upload-${guestId}`}
                    />
                    <label
                      htmlFor={`ticket-upload-${guestId}`}
                      className={`flex items-center justify-center gap-2 w-full p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                        uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'
                      }`}
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm" style={{ color: textColor }}>{t('common.uploading')}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span className="text-sm" style={{ color: textColor }}>{t('rsvp.clickToUploadTicket')}</span>
                        </>
                      )}
                    </label>
                  </div>
                  {uploadError && (
                    <p className="text-xs text-red-500">{uploadError}</p>
                  )}
                  <p className="text-xs" style={{ color: `${textColor}80` }}>
                    {t('rsvp.acceptedFormats')} PDF, JPG, PNG
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

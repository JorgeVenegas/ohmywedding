"use client"

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/components/contexts/i18n-context'
import { Upload, X, FileText } from 'lucide-react'

interface TravelFieldsProps {
  guestId: string
  guestName: string
  weddingNameId: string
  isTraveling: boolean
  travelingFrom: string
  travelArrangement: 'will_buy_ticket' | 'no_ticket_needed' | null
  ticketUrl: string | null
  noTicketReason: string
  adminSetTravel?: boolean // If true, travel status was set by admin and can't be changed
  onTravelChange: (isTraveling: boolean) => void
  onTravelingFromChange: (location: string) => void
  onTravelArrangementChange: (arrangement: 'will_buy_ticket' | 'no_ticket_needed' | null) => void
  onTicketUpload: (url: string) => void
  onNoTicketReasonChange: (reason: string) => void
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
  ticketUrl,
  noTicketReason,
  adminSetTravel = false,
  onTravelChange,
  onTravelingFromChange,
  onTravelArrangementChange,
  onTicketUpload,
  onNoTicketReasonChange,
  primaryColor = '#d4a574',
  textColor = '#333'
}: TravelFieldsProps) {
  const { t } = useI18n()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [noTicketNeeded, setNoTicketNeeded] = useState(!!noTicketReason)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB')
      return
    }

    setIsUploading(true)
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

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      onTicketUpload(data.url)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveTicket = async () => {
    if (!ticketUrl) return

    try {
      const response = await fetch(`/api/travel-ticket?guestId=${guestId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onTicketUpload('')
      }
    } catch (error) {
      console.error('Delete error:', error)
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

          {/* Travel Arrangement - Ticket Options */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              {t('rsvp.travelArrangement')}
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onTravelArrangementChange('will_buy_ticket')
                  setNoTicketNeeded(false)
                }}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  travelArrangement === 'will_buy_ticket' ? 'font-semibold' : ''
                }`}
                style={{
                  borderColor: travelArrangement === 'will_buy_ticket' ? primaryColor : '#e5e7eb',
                  backgroundColor: travelArrangement === 'will_buy_ticket' ? `${primaryColor}10` : 'transparent',
                  color: textColor
                }}
              >
                {t('rsvp.willBuyTicket')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onTravelArrangementChange('no_ticket_needed')
                  setNoTicketNeeded(true)
                }}
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

          {/* Ticket Upload (only if will_buy_ticket selected) */}
          {travelArrangement === 'will_buy_ticket' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: textColor }}>
                {t('rsvp.uploadTicket')} <span className="text-red-500">*</span>
              </label>
              
              {!ticketUrl ? (
                <div>
                  <label
                    className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                    style={{ borderColor: `${primaryColor}50` }}
                  >
                    <Upload className="w-8 h-8 mb-2" style={{ color: primaryColor }} />
                    <span className="text-sm text-center" style={{ color: textColor }}>
                      {isUploading ? t('rsvp.uploadingTicket') : t('rsvp.uploadTravelTicket')}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {t('rsvp.maxFileSize')}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                  {uploadError && (
                    <p className="text-sm text-red-600 mt-2">{uploadError}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg" style={{ borderColor: `${primaryColor}30`, backgroundColor: `${primaryColor}05` }}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                      <span className="text-sm" style={{ color: textColor }}>
                        {t('rsvp.ticketUploaded')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveTicket}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  {/* Inline Preview */}
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: `${primaryColor}30` }}>
                    {ticketUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img 
                        src={ticketUrl} 
                        alt="Ticket preview" 
                        className="w-full h-auto max-h-96 object-contain bg-gray-50"
                      />
                    ) : (
                      <iframe 
                        src={ticketUrl} 
                        className="w-full h-96 bg-gray-50"
                        title="Ticket preview"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reason for no ticket (only if no_ticket_needed selected) */}
          {travelArrangement === 'no_ticket_needed' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                {t('rsvp.noTicketReason')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={noTicketReason}
                onChange={(e) => onNoTicketReasonChange(e.target.value)}
                placeholder={t('rsvp.noTicketReasonPlaceholder')}
                rows={3}
                className="w-full p-3 rounded-lg border-2 bg-transparent resize-none"
                style={{ borderColor: `${primaryColor}50`, color: textColor }}
              />
              {!noTicketReason && (
                <p className="text-xs text-red-500 mt-1">{t('rsvp.reasonRequired')}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

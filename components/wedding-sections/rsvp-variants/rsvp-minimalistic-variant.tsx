'use client'

import React, { useState, useEffect } from 'react'
import { SectionWrapper } from '../section-wrapper'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { OTPVerificationDialog } from '@/components/ui/otp-verification-dialog'
import { TravelFields } from '@/components/ui/travel-fields'
import { Check, X, Loader2 } from 'lucide-react'
import { useI18n } from '@/components/contexts/i18n-context'
import { BaseRSVPProps, getColorScheme } from './types'

interface Guest {
  id: string
  name: string
  attending?: boolean
  is_traveling?: boolean
  traveling_from?: string
  travel_arrangement?: 'will_buy_ticket' | 'no_ticket_needed' | null
  ticket_attachment_url?: string | null
  no_ticket_reason?: string
  adminSetTravel?: boolean
}

interface GroupData {
  id: string
  name: string
  phone_number?: string
  phone_numbers?: string[]
  guests: Guest[]
  hasSubmitted?: boolean
}

export function RSVPMinimalisticVariant({
  weddingNameId,
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  groupId,
  useColorBackground,
  backgroundColorChoice,
}: BaseRSVPProps) {
  const { t } = useI18n()
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [showOTPDialog, setShowOTPDialog] = useState(false)

  const { bgColor, textColor, titleColor, cardBg, isColored } = getColorScheme(
    theme,
    backgroundColorChoice,
    useColorBackground
  )

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/guest-groups/${groupId}`)
        if (response.ok) {
          const data = await response.json()
          setGroupData(data)
          
          // Map guests and check if any have responded
          const mappedGuests = data.guests.map((g: any) => ({
            id: g.id,
            name: g.name,
            attending: g.confirmation_status === 'confirmed' ? true : g.confirmation_status === 'declined' ? false : null,
            is_traveling: g.is_traveling || false,
            traveling_from: g.traveling_from || '',
            travel_arrangement: g.travel_arrangement || null,
            ticket_attachment_url: g.ticket_attachment_url || null,
            no_ticket_reason: g.no_ticket_reason || '',
            adminSetTravel: g.admin_set_travel || false
          }))
          
          setGuests(mappedGuests)
          
          // Check if any guest has already submitted (confirmation_status is not 'pending')
          const hasResponded = data.guests.some((g: any) => 
            g.confirmation_status && g.confirmation_status !== 'pending'
          )
          setSubmitted(hasResponded)
        }
      } catch (error) {
        console.error('Error fetching group:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGroupData()
  }, [groupId, isEditing])

  const updateGuest = (guestId: string, field: keyof Guest, value: any) => {
    setGuests(prev =>
      prev.map(g => (g.id === guestId ? { ...g, [field]: value } : g))
    )
  }

  const handleSubmitClick = () => {
    setShowOTPDialog(true)
  }

  const handleOTPVerified = async (token: string) => {
    setVerificationToken(token)
    setShowOTPDialog(false)
    
    // Proceed with submission
    setSubmitError('')
    setSubmitting(true)
    try {
      const response = await fetch('/api/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingNameId,
          groupId,
          verificationToken: token,
          guests: guests.map(g => ({
            guestId: g.id,
            attending: g.attending,
            is_traveling: g.is_traveling,
            traveling_from: g.traveling_from,
            travel_arrangement: g.travel_arrangement,
            ticket_attachment_url: g.ticket_attachment_url,
            no_ticket_reason: g.no_ticket_reason
          })),
          message
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        setIsEditing(false)
        setShowOTPDialog(false)
      } else {
        setSubmitError(data.error || t('rsvp.error'))
        setShowOTPDialog(false)
      }
    } catch (error) {
      setSubmitError(t('rsvp.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={{ backgroundColor: bgColor }}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: titleColor }} />
        </div>
      </SectionWrapper>
    )
  }

  if (submitted && !isEditing) {
    return (
      <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={{ backgroundColor: bgColor }}>
        <div className="max-w-2xl mx-auto px-6 py-24">
          <div 
            className="p-12 rounded-2xl border-2"
            style={{
              backgroundColor: cardBg,
              borderColor: titleColor,
              color: textColor,
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${titleColor}20`, color: titleColor }}
              >
                <Check className="w-10 h-10" />
              </div>
            </div>
            <h3 
              className="text-3xl font-light text-center mb-4"
              style={{ color: titleColor }}
            >
              {t('rsvp.alreadySubmitted')}
            </h3>
            <p className="text-center text-lg font-light mb-8" style={{ color: textColor }}>
              {t('rsvp.responseRecorded')}
            </p>

            {/* Show guest responses */}
            <div className="space-y-3 mb-8">
              {guests.map((guest) => (
                <div 
                  key={guest.id}
                  className="p-4 rounded-lg flex items-center justify-between"
                  style={{ 
                    backgroundColor: isColored ? 'rgba(255, 255, 255, 0.5)' : 'white',
                    border: `1px solid ${isColored ? 'rgba(255, 255, 255, 0.3)' : '#e5e7eb'}`
                  }}
                >
                  <span className="font-medium" style={{ color: titleColor }}>
                    {guest.name}
                  </span>
                  <span 
                    className={`px-3 py-1 rounded-full text-sm ${
                      guest.attending 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {guest.attending ? t('rsvp.attending') : t('rsvp.notAttending')}
                  </span>
                </div>
              ))}
            </div>

            {/* Edit Response Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 rounded-lg text-base font-medium transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: titleColor,
                  color: isColored ? 'white' : bgColor 
                }}
              >
                {t('rsvp.editResponse')}
              </button>
            </div>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={{ backgroundColor: bgColor }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center" style={{ textAlign: alignment?.text || 'center' }}>
          <h2 
            className="text-3xl md:text-4xl font-light tracking-wide mb-3"
            style={{ color: titleColor }}
          >
            {sectionTitle || t('rsvp.title')}
          </h2>
          {(sectionSubtitle || t('rsvp.subtitle')) && (
            <>
              <div className="flex items-center justify-center gap-4 my-4">
                <div className="h-px w-16" style={{ backgroundColor: theme?.colors?.accent || titleColor, opacity: 0.4 }} />
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme?.colors?.accent || titleColor }} />
                <div className="h-px w-16" style={{ backgroundColor: theme?.colors?.accent || titleColor, opacity: 0.4 }} />
              </div>
              <p className="text-base font-light tracking-wide" style={{ color: textColor }}>
                {sectionSubtitle || t('rsvp.subtitle')}
              </p>
            </>
          )}
        </div>

        {groupData && (
          <div 
            className="p-6 md:p-8 rounded-2xl border"
            style={{
              backgroundColor: cardBg,
              borderColor: isColored ? `${titleColor}40` : '#e5e7eb',
            }}
          >
            {/* Group Name */}
            <div className="mb-6 pb-5 border-b" style={{ borderColor: `${titleColor}20` }}>
              <h3 className="text-xl font-light tracking-wide" style={{ color: titleColor }}>
                {groupData.name}
              </h3>
              <p className="text-xs font-light mt-1 tracking-wide" style={{ color: `${textColor}99` }}>
                {guests.length} {guests.length === 1 ? 'Guest' : 'Guests'}
              </p>
            </div>

            {/* Guests List */}
            <div className="space-y-5">
              {guests.map((guest) => (
                <div 
                  key={guest.id} 
                  className="pb-5 border-b last:border-b-0"
                  style={{ borderColor: `${titleColor}15` }}
                >
                  {/* Guest Name */}
                  <div className="mb-4">
                    <p className="text-lg font-light tracking-wide" style={{ color: titleColor }}>
                      {guest.name}
                    </p>
                  </div>

                  {/* Attending Buttons */}
                  <div className="flex gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => updateGuest(guest.id, 'attending', true)}
                      className="flex-1 py-4 px-6 rounded-xl border-2 transition-all hover:shadow-md font-light tracking-wider text-sm"
                      style={{
                        borderColor: guest.attending === true ? (theme?.colors?.accent || titleColor) : `${titleColor}30`,
                        backgroundColor: guest.attending === true ? `${theme?.colors?.accent || titleColor}15` : 'transparent',
                        color: guest.attending === true ? (theme?.colors?.accent || titleColor) : textColor,
                      }}
                    >
                      <Check className="w-5 h-5 inline mr-2" />
                      {t('rsvp.willAttend')}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateGuest(guest.id, 'attending', false)}
                      className="flex-1 py-4 px-6 rounded-xl border-2 transition-all font-light tracking-wider text-sm"
                      style={{
                        borderColor: guest.attending === false ? `${textColor}60` : `${titleColor}30`,
                        backgroundColor: guest.attending === false ? `${textColor}10` : 'transparent',
                        color: guest.attending === false ? `${textColor}99` : textColor,
                      }}
                    >
                      <X className="w-4 h-4 inline mr-2" />
                      {t('rsvp.cannotAttend')}
                    </button>
                  </div>

                  {/* Travel Fields - Only show if attending */}
                  {guest.attending === true && (
                    <div className="mt-4">
                      <TravelFields
                        guestId={guest.id}
                        guestName={guest.name}
                        weddingNameId={weddingNameId}
                        isTraveling={guest.is_traveling || false}
                        travelingFrom={guest.traveling_from || ''}
                        travelArrangement={guest.travel_arrangement || null}
                        ticketUrl={guest.ticket_attachment_url || null}
                        noTicketReason={guest.no_ticket_reason || ''}
                        adminSetTravel={guest.adminSetTravel || false}
                        primaryColor={titleColor}
                        textColor={textColor}
                        onTravelChange={(isTraveling: boolean) => updateGuest(guest.id, 'is_traveling', isTraveling)}
                        onTravelingFromChange={(from: string) => updateGuest(guest.id, 'traveling_from', from)}
                        onTravelArrangementChange={(arrangement: 'will_buy_ticket' | 'no_ticket_needed' | null) => updateGuest(guest.id, 'travel_arrangement', arrangement)}
                        onTicketUpload={(url: string) => updateGuest(guest.id, 'ticket_attachment_url', url)}
                        onNoTicketReasonChange={(reason: string) => updateGuest(guest.id, 'no_ticket_reason', reason)}
                      />
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* Message */}
            <div className="mt-6">
              <label 
                className="block text-sm font-light tracking-wide mb-2"
                style={{ color: textColor }}
              >
                {t('rsvp.message')}
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('rsvp.messagePlaceholder')}
                rows={4}
                className="border-2 rounded-xl font-light resize-none"
                style={{
                  borderColor: `${titleColor}30`,
                  color: textColor,
                  backgroundColor: cardBg,
                }}
              />
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              {submitError && (
                <p className="mb-3 text-sm text-red-600 text-center">{submitError}</p>
              )}
              <button
                type="button"
                onClick={handleSubmitClick}
                disabled={submitting || guests.every(g => g.attending === undefined)}
                className="w-full py-4 px-8 rounded-xl font-light tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-[1.02]"
                style={{
                  backgroundColor: theme?.colors?.accent || titleColor,
                  color: '#ffffff',
                  border: 'none',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                    {t('rsvp.submitting')}
                  </>
                ) : (
                  t('rsvp.submit')
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OTP Verification Dialog */}
      {groupId && groupData && (
        <OTPVerificationDialog
          isOpen={showOTPDialog}
          onClose={() => setShowOTPDialog(false)}
          groupId={groupId}
          phoneNumbers={groupData.phone_numbers || []}
          onVerified={handleOTPVerified}
          buttonColor={theme?.colors?.accent || titleColor}
          textColor={textColor}
        />
      )}
    </SectionWrapper>
  )
}

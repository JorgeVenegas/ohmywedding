'use client'

import React, { useState, useEffect } from 'react'
import { SectionWrapper } from '../section-wrapper'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { OTPVerificationDialog } from '@/components/ui/otp-verification-dialog'
import { TravelFields } from '@/components/ui/travel-fields'
import { Check, X, Loader2, CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/components/contexts/i18n-context'
import { BaseRSVPProps, getColorScheme } from './types'

interface Guest {
  id: string
  name: string
  attending?: boolean
  is_traveling?: boolean
  traveling_from?: string
  travel_arrangement?: 'already_booked' | 'no_ticket_needed' | null
  ticket_attachment_url?: string | null
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
// Map old travel arrangement values to new ones for backwards compatibility
const mapTravelArrangement = (value: string | null): 'already_booked' | 'no_ticket_needed' | null => {
  if (!value) return null
  // Map old values to new ones
  if (value === 'will_buy_ticket' || value === 'own_means' || value === 'have_ticket') return 'already_booked'
  if (value === 'no_transport' || value === 'needs_transport') return 'no_ticket_needed'
  // Return as-is if already correct format
  return value as 'already_booked' | 'no_ticket_needed' | null
}
export function RSVPCardsVariant({
  weddingNameId,
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  groupId,
  useColorBackground,
  backgroundColorChoice,
}: BaseRSVPProps) {
  // Ensure defaults are set
  const effectiveUseColorBackground = useColorBackground ?? false
  const effectiveBackgroundColorChoice = backgroundColorChoice ?? 'none'
  
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
  const [applyToAllEnabled, setApplyToAllEnabled] = useState<{ [guestId: string]: boolean }>({})
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)

  const { bgColor, textColor, titleColor, cardBg, isColored } = getColorScheme(
    theme,
    effectiveBackgroundColorChoice,
    effectiveUseColorBackground
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
          setGuests(
            data.guests.map((g: any) => ({
              id: g.id,
              name: g.name,
              attending: g.attending,
              is_traveling: g.is_traveling || false,
              traveling_from: g.traveling_from || '',
              travel_arrangement: mapTravelArrangement(g.travel_arrangement),
              ticket_attachment_url: g.ticket_attachment_url || null,
              adminSetTravel: g.admin_set_travel || false
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching group:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGroupData()
  }, [groupId])

  const updateGuest = (guestId: string, field: keyof Guest, value: any) => {
    // Set editing guest when attending field is changed
    if (field === 'attending') {
      setEditingGuestId(guestId)
    }
    
    const updatedGuests = guests.map(g => {
      if (g.id === guestId) {
        const updated = { ...g, [field]: value }
        // Clear travel info when declining
        if (field === 'attending' && value === false) {
          updated.is_traveling = false
          updated.traveling_from = ''
          updated.travel_arrangement = null
          updated.ticket_attachment_url = null
        }
        // Clear ticket URL when switching to no_ticket_needed or disabling travel
        if (field === 'travel_arrangement' && value === 'no_ticket_needed') {
          updated.ticket_attachment_url = null
        }
        if (field === 'is_traveling' && value === false) {
          updated.traveling_from = ''
          updated.travel_arrangement = null
          updated.ticket_attachment_url = null
        }
        return updated
      }
      return g
    })
    setGuests(updatedGuests)
    
    // If "Apply to All" is enabled for this guest, apply to all other guests
    if (applyToAllEnabled[guestId] && guests.length > 1) {
      const sourceGuest = updatedGuests.find(g => g.id === guestId)
      if (sourceGuest) {
        applyGuestDataToAll(guestId, sourceGuest)
      }
    }
  }

  const applyGuestDataToAll = (sourceGuestId: string, sourceGuest: Guest) => {
    setGuests(prev => prev.map(g => {
      if (g.id === sourceGuestId) return g
      
      return {
        ...g,
        attending: sourceGuest.attending,
        is_traveling: sourceGuest.is_traveling,
        traveling_from: sourceGuest.traveling_from,
        travel_arrangement: sourceGuest.travel_arrangement
      }
    }))
  }

  const handleSubmitClick = () => {
    // Validate: Check if admin requires travel info but guest hasn't provided it
    const guestsNeedingTravelInfo = guests.filter(g => 
      g.attending === true && 
      g.adminSetTravel && 
      (!g.is_traveling || !g.travel_arrangement)
    )
    
    if (guestsNeedingTravelInfo.length > 0) {
      setSubmitError(t('rsvp.travelInfoRequired'))
      return
    }
    
    // Validate: Check if any guest has selected 'already_booked' but hasn't uploaded a ticket
    const guestsNeedingTicket = guests.filter(g => 
      g.attending === true && 
      g.is_traveling && 
      g.travel_arrangement === 'already_booked' && 
      !g.ticket_attachment_url
    )
    
    if (guestsNeedingTicket.length > 0) {
      setSubmitError(t('rsvp.ticketRequired'))
      return
    }
    
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
            is_traveling: g.attending === false ? false : g.is_traveling,
            traveling_from: g.attending === false ? null : g.traveling_from,
            travel_arrangement: g.attending === false ? null : g.travel_arrangement,
            ticket_attachment_url: g.attending === false ? null : g.ticket_attachment_url
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
      <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={isColored ? { backgroundColor: bgColor } : undefined}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: titleColor }} />
        </div>
      </SectionWrapper>
    )
  }

  if (submitted && !isEditing) {
    return (
      <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={isColored ? { backgroundColor: bgColor } : undefined}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <div 
            className="p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl border-2 shadow-xl"
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
              className="text-3xl font-medium text-center mb-4"
              style={{ color: titleColor }}
            >
              {t('rsvp.alreadySubmitted')}
            </h3>
            <p className="text-center text-lg mb-8" style={{ color: textColor }}>
              {t('rsvp.responseRecorded')}
            </p>

            {/* Show guest responses in grid */}
            <div className="grid gap-4 md:grid-cols-2 mb-8">
              {guests.map((guest) => (
                <div 
                  key={guest.id}
                  className="p-5 rounded-2xl shadow-md"
                  style={{ 
                    backgroundColor: isColored ? 'rgba(255, 255, 255, 0.5)' : 'white',
                    border: `2px solid ${isColored ? 'rgba(255, 255, 255, 0.3)' : '#e5e7eb'}`
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold text-white"
                      style={{ backgroundColor: titleColor }}
                    >
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold" style={{ color: titleColor }}>
                      {guest.name}
                    </span>
                  </div>
                  <span 
                    className={`inline-block px-3 py-1 rounded-full text-sm mb-3 ${
                      guest.attending === true
                        ? 'bg-green-100 text-green-700' 
                        : guest.attending === false
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {guest.attending === true ? t('rsvp.attending') : guest.attending === false ? t('rsvp.notAttending') : t('rsvp.noResponse')}
                  </span>
                  
                  {/* Travel Details */}
                  {guest.attending === true && guest.is_traveling && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: `${titleColor}20` }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: titleColor }}>
                        {t('rsvp.travelDetails')}
                      </p>
                      <div className="space-y-1 text-sm" style={{ color: textColor }}>
                        <p className="text-xs">
                          <CheckCircle2 className="w-3 h-3 inline mr-1.5 text-green-600" />
                          {t('rsvp.traveling')}
                          {guest.traveling_from && (
                            <span className="ml-1">
                              {t('rsvp.from')}: <span className="font-medium">{guest.traveling_from}</span>
                            </span>
                          )}
                        </p>
                        {guest.travel_arrangement === 'already_booked' && (
                          <p className="text-xs">
                            {t('rsvp.alreadyBookedTransportation')}
                          </p>
                        )}
                        {guest.travel_arrangement === 'no_ticket_needed' && (
                          <p className="text-xs">
                            {t('rsvp.noTicketNeeded')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {guest.attending === true && !guest.is_traveling && (
                    <p className="mt-2 text-xs text-gray-500">
                      {t('rsvp.notTraveling')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={isColored ? { backgroundColor: bgColor } : undefined}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12 text-center" style={{ textAlign: alignment?.text || 'center' }}>
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-3"
            style={{ color: titleColor }}
          >
            {sectionTitle || t('rsvp.title')}
          </h2>
          {(sectionSubtitle || t('rsvp.subtitle')) && (
            <>
              <div className="flex items-center justify-center gap-4 my-4">
                <div 
                  className="h-1 w-20 rounded-full" 
                  style={{ 
                    background: `linear-gradient(to right, transparent, ${theme?.colors?.accent || titleColor}, transparent)` 
                  }} 
                />
              </div>
              <p className="text-base font-medium" style={{ color: textColor }}>
                {sectionSubtitle || t('rsvp.subtitle')}
              </p>
            </>
          )}
        </div>

        {groupData && (
          <>
            {/* Group Header */}
            <div className="mb-8 text-center">
              <div 
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-full mb-3 text-sm sm:text-base"
                style={{ 
                  backgroundColor: `${theme?.colors?.accent || titleColor}15`,
                  border: `2px solid ${theme?.colors?.accent || titleColor}30`
                }}
              >
                <h3 className="text-xl font-semibold" style={{ color: theme?.colors?.accent || titleColor }}>
                  {groupData.name}
                </h3>
              </div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: `${textColor}99` }}>
                {guests.length} {guests.length === 1 ? 'Guest' : 'Guests'}
              </p>
            </div>

            {/* Guest Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {guests.map((guest) => (
                <div
                  key={guest.id}
                  className="group p-5 rounded-2xl border-2 shadow-md transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: guest.attending !== undefined ? (theme?.colors?.accent || titleColor) : `${titleColor}20`,
                  }}
                >
                  {/* Guest Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ 
                        backgroundColor: `${theme?.colors?.accent || titleColor}15`,
                        border: `2px solid ${theme?.colors?.accent || titleColor}30`,
                        color: theme?.colors?.accent || titleColor
                      }}
                    >
                      <span className="text-base font-semibold">{guest.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <h4 className="text-lg font-semibold flex-1" style={{ color: titleColor }}>
                      {guest.name}
                    </h4>
                  </div>

                  {/* Attending Buttons */}
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => updateGuest(guest.id, 'attending', true)}
                      className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg border-2 transition-all hover:shadow-md font-medium text-xs sm:text-sm"
                      style={{
                        borderColor: guest.attending === true ? (theme?.colors?.accent || titleColor) : `${titleColor}25`,
                        backgroundColor: guest.attending === true ? (theme?.colors?.accent || titleColor) : 'transparent',
                        color: guest.attending === true ? '#ffffff' : textColor,
                      }}
                    >
                      <Check className="w-3.5 h-3.5 inline mr-1.5" />
                      {t('rsvp.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateGuest(guest.id, 'attending', false)}
                      className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg border-2 transition-all hover:shadow-md font-medium text-xs sm:text-sm"
                      style={{
                        borderColor: guest.attending === false ? `${textColor}50` : `${titleColor}25`,
                        backgroundColor: guest.attending === false ? `${textColor}15` : 'transparent',
                        color: textColor,
                      }}
                    >
                      <X className="w-3.5 h-3.5 inline mr-1.5" />
                      {t('rsvp.no')}
                    </button>
                  </div>

                  {/* Apply to All Switch - only show for guest being edited */}
                  {guests.length > 1 && guest.attending !== undefined && editingGuestId === guest.id && (
                    <div className="mt-4">
                      <div 
                        className="flex items-center gap-3 p-3 rounded-lg border-2"
                        style={{
                          borderColor: `${theme?.colors?.accent || titleColor}30`,
                          backgroundColor: `${theme?.colors?.accent || titleColor}05`
                        }}
                      >
                        <Switch
                          checked={applyToAllEnabled[guest.id] || false}
                          onCheckedChange={(checked) => {
                            setApplyToAllEnabled(prev => ({ ...prev, [guest.id]: checked }))
                            if (checked) {
                              applyGuestDataToAll(guest.id, guest)
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-xs font-semibold" style={{ color: titleColor }}>
                            {t('rsvp.applyToAllGuests')}
                          </p>
                          <p className="text-xs opacity-70" style={{ color: textColor }}>
                            {t('rsvp.applyToAllDescription')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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
                        ticketAttachmentUrl={guest.ticket_attachment_url}
                        adminSetTravel={guest.adminSetTravel || false}
                        primaryColor={titleColor}
                        textColor={textColor}
                        onTravelChange={(isTraveling: boolean) => updateGuest(guest.id, 'is_traveling', isTraveling)}
                        onTravelingFromChange={(from: string) => updateGuest(guest.id, 'traveling_from', from)}
                        onTravelArrangementChange={(arrangement: 'already_booked' | 'no_ticket_needed' | null) => updateGuest(guest.id, 'travel_arrangement', arrangement)}
                        onTicketUpload={(url: string) => updateGuest(guest.id, 'ticket_attachment_url', url)}
                      />
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* Message Box */}
            <div 
              className="p-6 rounded-2xl border-2 shadow-md mb-6 transition-all"
              style={{
                backgroundColor: cardBg,
                borderColor: `${theme?.colors?.accent || titleColor}25`,
              }}
            >
              <label 
                className="block text-sm font-medium mb-2 flex items-center gap-2"
                style={{ color: titleColor }}
              >
                <div 
                  className="w-1 h-4 rounded-full" 
                  style={{ backgroundColor: theme?.colors?.accent || titleColor }}
                />
                {t('rsvp.message')}
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('rsvp.messagePlaceholder')}
                rows={4}
                className="border-2 rounded-xl resize-none font-medium"
                style={{
                  borderColor: `${theme?.colors?.accent || titleColor}25`,
                  color: textColor,
                  backgroundColor: cardBg,
                }}
              />
            </div>

            {/* Submit Button */}
            {submitError && (
              <p className="mb-3 text-sm text-red-600 text-center">{submitError}</p>
            )}
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={submitting || !guests.some(g => g.attending !== undefined)}
              className="w-full py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-[1.01]"
              style={{
                backgroundColor: theme?.colors?.accent || titleColor,
                color: '#ffffff',
                border: 'none',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  {t('rsvp.submitting')}
                </>
              ) : (
                t('rsvp.submit')
              )}
            </button>
          </>
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

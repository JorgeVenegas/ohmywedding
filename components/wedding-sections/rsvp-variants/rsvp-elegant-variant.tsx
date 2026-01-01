"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { OTPVerificationDialog } from '@/components/ui/otp-verification-dialog'
import { TravelFields } from '@/components/ui/travel-fields'
import { Heart, Sparkles, CheckCircle2 } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseRSVPProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

interface GuestInfo {
  id: string
  name: string
  attending: boolean | null
  is_traveling?: boolean
  traveling_from?: string
  travel_arrangement?: 'already_booked' | 'no_ticket_needed' | null
  ticket_attachment_url?: string | null
  adminSetTravel?: boolean // Track if admin pre-set travel status
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

interface GroupData {
  id: string
  name: string
  phone_number?: string
  phone_numbers?: string[]
  guests: Array<{
    id: string
    name: string
    attending?: boolean | null
  }>
  hasSubmitted?: boolean
}

export function RSVPElegantVariant({
  weddingNameId,
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  showCustomQuestions = false,
  customQuestions = [],
  useColorBackground = false,
  backgroundColorChoice = 'none',
  groupId
}: BaseRSVPProps) {
  const { t } = useI18n()
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [guests, setGuests] = useState<GuestInfo[]>([])
  const [message, setMessage] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [showOTPDialog, setShowOTPDialog] = useState(false)
  const [applyToAllEnabled, setApplyToAllEnabled] = useState<{ [guestId: string]: boolean }>({})
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)

  const title = sectionTitle || t('rsvp.title')
  const subtitle = sectionSubtitle || t('rsvp.subtitle')
  
  const { bgColor, titleColor, subtitleColor, textColor, cardBg, isColored } = getColorScheme(
    theme,
    backgroundColorChoice,
    useColorBackground
  )

  const textAlign = alignment?.text || 'center'

  useEffect(() => {
    if (groupId) {
      fetchGroupData()
    } else {
      setIsLoading(false)
    }
  }, [groupId])

  const fetchGroupData = async () => {
    try {
      const response = await fetch(`/api/guest-groups/${groupId}`)
      if (response.ok) {
        const data = await response.json()
        setGroupData(data)
        
        // Set guests with their existing RSVP status
        setGuests(
          data.guests.map((g: any) => {
            return {
              id: g.id,
              name: g.name,
              attending: g.attending,
              is_traveling: g.is_traveling || false,
              traveling_from: g.traveling_from || '',
              travel_arrangement: mapTravelArrangement(g.travel_arrangement),
              ticket_attachment_url: g.ticket_attachment_url || null,
              adminSetTravel: g.admin_set_travel || false
            }
          })
        )
        
        // If all guests have responded, show submitted state
        if (data.hasSubmitted) {
          setIsSubmitted(true)
          setIsEditing(false)
        } else {
          setIsEditing(true)
        }
      }
    } catch (error) {
      // Failed to fetch group data
    } finally {
      setIsLoading(false)
    }
  }

  const handleAttendingChange = (guestId: string, attending: boolean) => {
    setEditingGuestId(guestId)
    const updatedGuests = guests.map(g => {
      if (g.id === guestId) {
        return {
          ...g,
          attending,
          // Clear travel info when declining
          is_traveling: attending ? g.is_traveling : false,
          traveling_from: attending ? g.traveling_from : '',
          travel_arrangement: attending ? g.travel_arrangement : null
        }
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

  const handleGuestUpdate = (guestId: string, field: keyof GuestInfo, value: any) => {
    const updatedGuests = guests.map(g => {
      if (g.id === guestId) {
        const updated = { ...g, [field]: value }
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

  const applyGuestDataToAll = (sourceGuestId: string, sourceGuest: GuestInfo) => {
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

  const handleFieldChange = (guestId: string, field: string, value: string) => {
    setGuests(guests.map(g => 
      g.id === guestId ? { ...g, [field]: value } : g
    ))
  }

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if at least one guest has responded
    const hasAtLeastOneResponse = guests.some(g => g.attending !== null)
    if (!hasAtLeastOneResponse) {
      setSubmitError(t('rsvp.respondForAtLeastOne'))
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

    // Open OTP dialog
    setShowOTPDialog(true)
  }

  const handleOTPVerified = async (token: string) => {
    setVerificationToken(token)
    setSubmitError('')
    setIsSubmitting(true)
    
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
        setIsSubmitted(true)
        setIsEditing(false)
        setShowOTPDialog(false)
      } else {
        setSubmitError(data.error || t('rsvp.error'))
      }
    } catch (error) {
      setSubmitError(t('rsvp.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if at least one guest has responded
  const hasAtLeastOneResponse = guests.some(g => g.attending !== null)

  if (isLoading) {
    return (
      <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={{ backgroundColor: bgColor }}>
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: titleColor }} />
          </div>
        </div>
      </SectionWrapper>
    )
  }

  if (isSubmitted && !isEditing) {
    return (
      <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={{ backgroundColor: bgColor }}>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto">
            <div 
              className="relative p-10 md:p-12 rounded-3xl border-4 shadow-2xl"
              style={{ 
                backgroundColor: cardBg || '#f5f1ed',
                borderColor: isColored ? 'rgba(255, 255, 255, 0.3)' : titleColor || '#d4a574'
              }}
            >
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
                  <Sparkles className="w-10 h-10 text-green-600" />
                </div>
                
                <div style={{ color: titleColor }}>
                  <h2 className="text-4xl font-serif mb-4">
                    {t('rsvp.alreadySubmitted')}
                  </h2>
                  <div className="flex items-center justify-center gap-4 my-6">
                    <div className="h-px w-16" style={{ backgroundColor: titleColor }} />
                    <Heart className="w-6 h-6 fill-current" />
                    <div className="h-px w-16" style={{ backgroundColor: titleColor }} />
                  </div>
                  <p className="text-lg font-light italic mb-8">
                    {t('rsvp.responseRecorded')}
                  </p>
                </div>

                {/* Show guest responses */}
                <div className="space-y-4 text-left mb-8">
                  {guests.map((guest) => (
                    <div 
                      key={guest.id}
                      className="p-4 rounded-lg"
                      style={{ 
                        backgroundColor: isColored ? 'rgba(255, 255, 255, 0.5)' : 'white',
                        border: `1px solid ${isColored ? 'rgba(255, 255, 255, 0.3)' : '#e5e7eb'}`
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: titleColor }}>
                          {guest.name}
                        </span>
                        <span 
                          className={`px-3 py-1 rounded-full text-sm ${
                            guest.attending === true
                              ? 'bg-green-100 text-green-700' 
                              : guest.attending === false
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {guest.attending === true ? t('rsvp.attending') : guest.attending === false ? t('rsvp.notAttending') : t('rsvp.noResponse')}
                        </span>
                      </div>
                      
                      {/* Travel Details */}
                      {guest.attending === true && guest.is_traveling && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: `${titleColor}20` }}>
                          <p className="text-xs font-semibold mb-2" style={{ color: titleColor }}>
                            {t('rsvp.travelDetails')}
                          </p>
                          <div className="space-y-1 text-sm" style={{ color: textColor }}>
                            <p>
                              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 text-green-600" />
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
                
                {/* Edit Response Button */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-4 px-6 rounded-lg text-lg font-serif transition-all hover:opacity-90 shadow-lg"
                  style={{ 
                    backgroundColor: titleColor,
                    color: 'white'
                  }}
                >
                  {t('rsvp.editResponse')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  if (!groupId) {
    return (
      <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={{ backgroundColor: bgColor }}>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-xl mx-auto">
            <div 
              className="relative p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl border-2 sm:border-4 shadow-2xl"
              style={{ 
                backgroundColor: cardBg || '#f5f1ed',
                borderColor: isColored ? 'rgba(255, 255, 255, 0.3)' : titleColor || '#d4a574',
                textAlign
              }}
            >
              <div className="space-y-8">
                <div>
                  <h2 className="text-5xl font-serif tracking-widest mb-6" style={{ color: titleColor }}>
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-lg font-light italic" style={{ color: subtitleColor }}>
                      {subtitle}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-center gap-4 my-8">
                  <div className="h-px flex-1" style={{ backgroundColor: titleColor }} />
                  <Heart className="w-6 h-6 fill-current" style={{ color: titleColor }} />
                  <div className="h-px flex-1" style={{ backgroundColor: titleColor }} />
                </div>
                
                <p className="text-base leading-relaxed" style={{ color: textColor }}>
                  {t('rsvp.individualInvitationsMessage')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={{ backgroundColor: bgColor }}>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          {/* Main Invitation Card */}
          <div 
            className="relative p-6 sm:p-8 md:p-12 lg:p-16 rounded-2xl sm:rounded-3xl border-2 sm:border-4 shadow-2xl"
            style={{ 
              backgroundColor: cardBg || '#f5f1ed',
              borderColor: isColored ? 'rgba(255, 255, 255, 0.3)' : titleColor || '#d4a574',
              textAlign
            }}
          >
            <form onSubmit={handleSubmitClick} className="space-y-8">
              {/* Header */}
              <div className="space-y-5">
                <div className="space-y-4">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif tracking-wide leading-tight" style={{ color: titleColor }}>
                    {title}
                  </h2>
                  
                  <div className="flex items-center justify-center gap-6 py-3">
                    <div className="h-px flex-1 max-w-20" style={{ 
                      background: `linear-gradient(to right, transparent, ${theme?.colors?.accent || titleColor})`,
                      opacity: 0.6 
                    }} />
                    <div className="relative">
                      <div 
                        className="absolute inset-0 animate-pulse rounded-full" 
                        style={{ 
                          backgroundColor: theme?.colors?.accent || titleColor,
                          opacity: 0.2,
                          filter: 'blur(8px)'
                        }} 
                      />
                      <Heart className="w-6 h-6 fill-current relative z-10" style={{ color: theme?.colors?.accent || titleColor }} />
                    </div>
                    <div className="h-px flex-1 max-w-20" style={{ 
                      background: `linear-gradient(to left, transparent, ${theme?.colors?.accent || titleColor})`,
                      opacity: 0.6 
                    }} />
                  </div>
                  
                  {subtitle && (
                    <p className="text-base md:text-lg font-light italic leading-relaxed" style={{ 
                      color: textColor,
                      opacity: 0.9
                    }}>
                      {subtitle}
                    </p>
                  )}
                </div>
                
                {groupData && (
                  <div className="pt-2">
                    <div 
                      className="inline-block px-6 py-3 rounded-full border"
                      style={{ 
                        borderColor: `${theme?.colors?.accent || titleColor}40`,
                        backgroundColor: `${theme?.colors?.accent || titleColor}08`
                      }}
                    >
                      <p className="text-lg sm:text-xl md:text-2xl font-serif italic tracking-wide" style={{ color: titleColor }}>
                        {groupData.name}
                      </p>
                      <p className="text-xs tracking-[0.2em] uppercase mt-1 opacity-70" style={{ color: textColor }}>
                        {t('rsvp.partyOf')} {guests.length}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Guests */}
              <div className="space-y-6">
                {guests.map((guest, index) => (
                  <div key={guest.id} className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div 
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-serif border-2 transition-all"
                        style={{ 
                          borderColor: `${theme?.colors?.accent || titleColor}50`,
                          color: theme?.colors?.accent || titleColor,
                          backgroundColor: `${theme?.colors?.accent || titleColor}08`,
                          boxShadow: `0 0 20px ${theme?.colors?.accent || titleColor}15`
                        }}
                      >
                        {index + 1}
                      </div>
                      <p className="text-lg sm:text-xl md:text-2xl font-serif font-light" style={{ color: titleColor }}>
                        {guest.name}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 sm:gap-3 pl-0 sm:pl-14">
                      <button
                        type="button"
                        onClick={() => handleAttendingChange(guest.id, true)}
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-3 rounded-full border-2 transition-all duration-300 hover:scale-[1.02] font-light tracking-wide text-xs sm:text-sm shadow-sm hover:shadow-lg"
                        style={guest.attending === true ? {
                          borderColor: theme?.colors?.accent || titleColor,
                          backgroundColor: theme?.colors?.accent || titleColor,
                          color: '#ffffff',
                          boxShadow: `0 6px 25px ${theme?.colors?.accent || titleColor}30`
                        } : {
                          borderColor: `${titleColor}40`,
                          backgroundColor: 'transparent',
                          color: titleColor
                        }}
                      >
                        {t('rsvp.accept')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttendingChange(guest.id, false)}
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-3 rounded-full border-2 transition-all duration-300 hover:scale-[1.02] font-light tracking-wide text-xs sm:text-sm shadow-sm hover:shadow-lg"
                        style={guest.attending === false ? {
                          borderColor: '#9ca3af',
                          backgroundColor: '#9ca3af',
                          color: '#ffffff',
                          boxShadow: '0 4px 15px rgba(156, 163, 175, 0.3)'
                        } : {
                          borderColor: '#e5e7eb',
                          backgroundColor: 'transparent',
                          color: textColor,
                          opacity: 0.7
                        }}
                      >
                        {t('rsvp.decline')}
                      </button>
                    </div>
                    
                    {/* Apply to All Switch - only show for guest being edited */}
                    {guests.length > 1 && guest.attending !== null && editingGuestId === guest.id && (
                      <div className="pl-0 sm:pl-14 pt-4">
                        <div 
                          className="flex items-center gap-3 p-3 rounded-lg border"
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
                            <p className="text-sm font-medium" style={{ color: titleColor }}>
                              {t('rsvp.applyToAllGuests')}
                            </p>
                            <p className="text-xs" style={{ color: textColor, opacity: 0.7 }}>
                              {t('rsvp.applyToAllDescription')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Travel Fields - only show if attending */}
                    {guest.attending === true && (
                      <div className="pl-0 sm:pl-14 pt-2">
                        <TravelFields
                          guestId={guest.id}
                          guestName={guest.name}
                          weddingNameId={weddingNameId}
                          isTraveling={guest.is_traveling || false}
                          travelingFrom={guest.traveling_from || ''}
                          travelArrangement={guest.travel_arrangement || null}
                          ticketAttachmentUrl={guest.ticket_attachment_url}
                          adminSetTravel={guest.adminSetTravel || false}
                          onTravelChange={(isTraveling) => {
                            handleGuestUpdate(guest.id, 'is_traveling', isTraveling)
                          }}
                          onTravelingFromChange={(location) => {
                            handleGuestUpdate(guest.id, 'traveling_from', location)
                          }}
                          onTravelArrangementChange={(arrangement) => {
                            handleGuestUpdate(guest.id, 'travel_arrangement', arrangement)
                          }}
                          onTicketUpload={(url) => {
                            handleGuestUpdate(guest.id, 'ticket_attachment_url', url)
                          }}
                          primaryColor={theme?.colors?.accent || titleColor}
                          textColor={textColor}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message */}
              <div className="space-y-3 pt-4">
                <label className="block text-sm font-light tracking-wide" style={{ 
                  color: textColor,
                  opacity: 0.8
                }}>
                  {t('rsvp.messageToCouple')}
                  <span className="text-xs ml-2 opacity-60">({t('rsvp.messageToCoupleOptional')})</span>
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('rsvp.messagePlaceholderShort')}
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl border-2 bg-transparent font-light resize-none transition-all duration-300 focus:shadow-lg"
                  style={{
                    borderColor: `${theme?.colors?.accent || titleColor}30`,
                    color: textColor
                  }}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                {submitError && (
                  <p className="mb-3 text-sm text-red-600 text-center">{submitError}</p>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting || !hasAtLeastOneResponse}
                  className="w-full py-5 rounded-full text-base font-light tracking-widest transition-all duration-500 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-2xl"
                  style={{
                    backgroundColor: theme?.colors?.accent || titleColor,
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: `0 8px 30px ${theme?.colors?.accent || titleColor}40`
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      {t('rsvp.submittingResponse')}
                    </span>
                  ) : (
                    t('rsvp.submitResponse')
                  )}
                </Button>
                {!hasAtLeastOneResponse && (
                  <p className="mt-3 text-xs text-center font-light italic" style={{ color: textColor, opacity: 0.6 }}>
                    {t('rsvp.respondForAtLeastOne')}
                  </p>
                )}
              </div>
            </form>

            {/* OTP Verification Dialog */}
            {groupId && groupData && (
              <OTPVerificationDialog
                isOpen={showOTPDialog}
                onClose={() => setShowOTPDialog(false)}
                onVerified={handleOTPVerified}
                groupId={groupId}
                phoneNumbers={groupData.phone_numbers || []}
                buttonColor={theme?.colors?.accent || titleColor}
                textColor={textColor}
              />
            )}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

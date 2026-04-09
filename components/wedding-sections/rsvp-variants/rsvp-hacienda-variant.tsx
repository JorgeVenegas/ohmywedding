"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { OTPVerificationDialog } from '@/components/ui/otp-verification-dialog'
import { TravelFields } from '@/components/ui/travel-fields'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { AnimatedSection } from '../animated-section'
import { BaseRSVPProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import {
  FloralDivider, CandleGlow,
  OrnateCorner, BotanicalCorner, DecorativeQuoteBlock,
} from '../hacienda-ornaments'

interface GuestInfo {
  id: string; name: string; attending: boolean | null
  is_traveling?: boolean; traveling_from?: string
  travel_arrangement?: 'already_booked' | 'no_ticket_needed' | null
  ticket_attachment_url?: string | null; adminSetTravel?: boolean
}

const mapTravelArrangement = (value: string | null): 'already_booked' | 'no_ticket_needed' | null => {
  if (!value) return null
  if (value === 'will_buy_ticket' || value === 'own_means' || value === 'have_ticket') return 'already_booked'
  if (value === 'no_transport' || value === 'needs_transport') return 'no_ticket_needed'
  return value as 'already_booked' | 'no_ticket_needed' | null
}

interface GroupData {
  id: string; name: string; phone_number?: string; phone_numbers?: string[]
  guests: Array<{ id: string; name: string; attending?: boolean | null }>
  hasSubmitted?: boolean
  extra_passes?: number
  extra_passes_confirmed?: number
}

export function RSVPHaciendaVariant({
  weddingNameId, theme, alignment, sectionTitle, sectionSubtitle,
  showTravelInfo = true, showCustomQuestions = false, customQuestions = [],
  useColorBackground, backgroundColorChoice, groupId,
}: BaseRSVPProps) {
  const effectiveUseColorBackground = useColorBackground ?? false
  const effectiveBackgroundColorChoice = backgroundColorChoice ?? 'none'
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
  const [extraPassesAttending, setExtraPassesAttending] = useState(0)

  const title = sectionTitle || t('rsvp.title')
  const subtitle = sectionSubtitle || t('rsvp.subtitle')

  const { bgColor, titleColor, textColor, cardBg, isColored } = getColorScheme(
    theme, effectiveBackgroundColorChoice, effectiveUseColorBackground
  )

  const primary = theme?.colors?.primary || '#2D4A32'
  const accent = theme?.colors?.accent || '#C0A882'
  const secondary = theme?.colors?.secondary || '#FAF6EF'

  const textAlign = alignment?.text || 'center'
  // Gold/accent and secondary bgs need dark text for contrast
  const isAccentBg = effectiveBackgroundColorChoice === 'accent' || effectiveBackgroundColorChoice === 'accent-light' || effectiveBackgroundColorChoice === 'accent-lighter'
  const isSecondaryBg = effectiveBackgroundColorChoice === 'secondary' || effectiveBackgroundColorChoice === 'secondary-light' || effectiveBackgroundColorChoice === 'secondary-lighter'
  const needsDarkText = isColored && (isAccentBg || isSecondaryBg)
  const cardBackground = needsDarkText ? `${secondary}CC` : (isColored ? (cardBg || secondary) : secondary)
  const cardBorderColor = `${accent}35`
  const renderTitleColor = needsDarkText ? primary : (isColored ? (titleColor || primary) : primary)
  const renderTextColor = needsDarkText ? primary : (isColored ? (textColor || primary) : `${primary}CC`)

  useEffect(() => {
    if (groupId) fetchGroupData()
    else setIsLoading(false)
  }, [groupId])

  const fetchGroupData = async () => {
    try {
      const response = await fetch(`/api/guest-groups/${groupId}`)
      if (response.ok) {
        const data = await response.json()
        setGroupData(data)
        setGuests(data.guests.map((g: any) => ({
          id: g.id, name: g.name, attending: g.attending,
          is_traveling: g.is_traveling || false, traveling_from: g.traveling_from || '',
          travel_arrangement: mapTravelArrangement(g.travel_arrangement),
          ticket_attachment_url: g.ticket_attachment_url || null,
          adminSetTravel: g.admin_set_travel || false,
        })))
        if (data.hasSubmitted) { setIsSubmitted(true); setIsEditing(false); setExtraPassesAttending(data.extra_passes_confirmed || 0) }
        else setIsEditing(true)
      }
    } catch { /* Failed to fetch */ }
    finally { setIsLoading(false) }
  }

  const handleAttendingChange = (guestId: string, attending: boolean) => {
    setEditingGuestId(guestId)
    const updatedGuests = guests.map((g) => {
      if (g.id === guestId) {
        return { ...g, attending, is_traveling: attending ? g.is_traveling : false,
          traveling_from: attending ? g.traveling_from : '', travel_arrangement: attending ? g.travel_arrangement : null }
      }
      return g
    })
    setGuests(updatedGuests)
    if (applyToAllEnabled[guestId] && guests.length > 1) {
      const source = updatedGuests.find((g) => g.id === guestId)
      if (source) applyGuestDataToAll(guestId, source)
    }
  }

  const handleGuestUpdate = (guestId: string, field: keyof GuestInfo, value: any) => {
    const updatedGuests = guests.map((g) => {
      if (g.id === guestId) {
        const updated = { ...g, [field]: value }
        if (field === 'travel_arrangement' && value === 'no_ticket_needed') updated.ticket_attachment_url = null
        if (field === 'is_traveling' && value === false) { updated.traveling_from = ''; updated.travel_arrangement = null; updated.ticket_attachment_url = null }
        return updated
      }
      return g
    })
    setGuests(updatedGuests)
    if (applyToAllEnabled[guestId] && guests.length > 1) {
      const source = updatedGuests.find((g) => g.id === guestId)
      if (source) applyGuestDataToAll(guestId, source)
    }
  }

  const applyGuestDataToAll = (sourceGuestId: string, sourceGuest: GuestInfo) => {
    setGuests((prev) => prev.map((g) => {
      if (g.id === sourceGuestId) return g
      return { ...g, attending: sourceGuest.attending, is_traveling: sourceGuest.is_traveling,
        traveling_from: sourceGuest.traveling_from, travel_arrangement: sourceGuest.travel_arrangement }
    }))
  }

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault()
    const hasAtLeastOneResponse = guests.some((g) => g.attending !== null)
    if (!hasAtLeastOneResponse) { setSubmitError(t('rsvp.respondForAtLeastOne')); return }
    const guestsNeedingTravelInfo = guests.filter((g) => g.attending === true && g.adminSetTravel && (!g.is_traveling || !g.travel_arrangement))
    if (guestsNeedingTravelInfo.length > 0) { setSubmitError(t('rsvp.travelInfoRequired')); return }
    const guestsNeedingTicket = guests.filter((g) => g.attending === true && g.is_traveling && g.travel_arrangement === 'already_booked' && !g.ticket_attachment_url)
    if (guestsNeedingTicket.length > 0) { setSubmitError(t('rsvp.ticketRequired')); return }
    setShowOTPDialog(true)
  }

  const handleOTPVerified = async (token: string) => {
    setVerificationToken(token)
    setSubmitError(''); setIsSubmitting(true)
    try {
      const response = await fetch('/api/rsvps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingNameId, groupId, verificationToken: token,
          guests: guests.map((g) => ({
            guestId: g.id, attending: g.attending,
            is_traveling: g.attending === false ? false : g.is_traveling,
            traveling_from: g.attending === false ? null : g.traveling_from,
            travel_arrangement: g.attending === false ? null : g.travel_arrangement,
            ticket_attachment_url: g.attending === false ? null : g.ticket_attachment_url,
          })),
          extraPassesAttending: (groupData?.extra_passes || 0) > 0 ? extraPassesAttending : undefined,
          message,
        }),
      })
      const data = await response.json()
      if (response.ok) { setIsSubmitted(true); setIsEditing(false); setShowOTPDialog(false) }
      else setSubmitError(data.error || t('rsvp.error'))
    } catch { setSubmitError(t('rsvp.error')) }
    finally { setIsSubmitting(false) }
  }

  const hasAtLeastOneResponse = guests.some((g) => g.attending !== null)

  /** Ornate card wrapper with baroque-inspired decoration */
  const OrnateCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`relative p-6 sm:p-8 md:p-12 rounded-2xl border shadow-lg overflow-hidden ${className}`}
      style={{
        backgroundColor: cardBackground, borderColor: cardBorderColor,
        boxShadow: `0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px ${accent}08`,
      }}>
      {/* Ornate corners */}
      <OrnateCorner position="top-left" color={`${accent}45`} size="sm" />
      <OrnateCorner position="top-right" color={`${accent}45`} size="sm" />
      <OrnateCorner position="bottom-left" color={`${accent}35`} size="sm" />
      <OrnateCorner position="bottom-right" color={`${accent}35`} size="sm" />
      {/* Warm inner glow */}
      <CandleGlow position="center" intensity="subtle" />
      {/* Top gold accent line */}
      <div className="absolute top-0 left-[15%] right-[15%] h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }} />
      <div className="relative z-10">{children}</div>
    </div>
  )

  /* Loading */
  if (isLoading) {
    return (
      <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={isColored ? { backgroundColor: bgColor } : { backgroundColor: secondary }}>
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: accent }} />
        </div>
      </SectionWrapper>
    )
  }

  /* Submitted */
  if (isSubmitted && !isEditing) {
    return (
      <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={isColored ? { backgroundColor: bgColor } : { backgroundColor: secondary }}>
        <BotanicalCorner position="top-left" color={`${accent}55`} size="sm" />
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-16 sm:py-20 relative z-10">
          <AnimatedSection>
            <OrnateCard>
              <div className="text-center space-y-5">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: `${accent}15` }}>
                  <Sparkles className="w-8 h-8" style={{ color: accent }} />
                </div>
                <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: 'var(--font-display, cursive)', color: renderTitleColor, fontWeight: 400 }}>
                  {t('rsvp.alreadySubmitted')}
                </h2>
                <FloralDivider color={accent} />
                <p className="text-base font-light italic" style={{ color: renderTextColor }}>{t('rsvp.responseRecorded')}</p>

                <div className="space-y-3 text-left mt-6">
                  {guests.map((guest) => (
                    <div key={guest.id} className="p-4 rounded-xl border" style={{ backgroundColor: `${secondary}80`, borderColor: `${accent}20` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm" style={{ color: renderTitleColor }}>{guest.name}</span>
                        <span className={`px-3 py-0.5 rounded-full text-xs ${guest.attending === true ? 'bg-green-100 text-green-700' : guest.attending === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {guest.attending === true ? t('rsvp.attending') : guest.attending === false ? t('rsvp.notAttending') : t('rsvp.noResponse')}
                        </span>
                      </div>
                      {guest.attending === true && guest.is_traveling && (
                        <div className="mt-2 pt-2 border-t text-xs space-y-1" style={{ borderColor: `${accent}15`, color: renderTextColor }}>
                          <p><CheckCircle2 className="w-3 h-3 inline mr-1 text-green-600" />{t('rsvp.traveling')}
                            {guest.traveling_from && <span className="ml-1">{t('rsvp.from')}: <span className="font-medium">{guest.traveling_from}</span></span>}
                          </p>
                          {guest.travel_arrangement === 'already_booked' && <p>{t('rsvp.alreadyBookedTransportation')}</p>}
                          {guest.travel_arrangement === 'no_ticket_needed' && <p>{t('rsvp.noTicketNeeded')}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {(groupData?.extra_passes || 0) > 0 && (
                  <div className="p-4 rounded-xl border text-left" style={{ borderColor: `${accent}20`, backgroundColor: `${accent}08` }}>
                    <span className="text-sm font-light" style={{ color: renderTextColor }}>
                      {t('rsvp.additionalGuests')}: {extraPassesAttending} / {groupData?.extra_passes}
                    </span>
                  </div>
                )}

                <button onClick={() => setIsEditing(true)}
                  className="w-full py-3.5 rounded-full text-sm font-light tracking-[0.2em] uppercase transition-all hover:opacity-90"
                  style={{ backgroundColor: primary, color: secondary }}>
                  {t('rsvp.editResponse')}
                </button>
              </div>
            </OrnateCard>
          </AnimatedSection>
        </div>
      </SectionWrapper>
    )
  }

  /* No group */
  if (!groupId) {
    return (
      <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={isColored ? { backgroundColor: bgColor } : { backgroundColor: secondary }}>
        <BotanicalCorner position="bottom-right" color={`${accent}52`} size="sm" />
        <div className="max-w-xl mx-auto px-6 sm:px-8 py-16 sm:py-20 relative z-10">
          <AnimatedSection>
            <OrnateCard>
              <div className="space-y-6" style={{ textAlign }}>
                <h2 className="text-3xl sm:text-4xl md:text-5xl" style={{ fontFamily: 'var(--font-display, cursive)', color: renderTitleColor, fontWeight: 400 }}>{title}</h2>
                <FloralDivider color={accent} />
                <p className="text-base leading-relaxed" style={{ color: renderTextColor }}>{t('rsvp.individualInvitationsMessage')}</p>
              </div>
            </OrnateCard>
          </AnimatedSection>
        </div>
      </SectionWrapper>
    )
  }

  /* Main RSVP Form */
  return (
    <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={isColored ? { backgroundColor: bgColor } : { backgroundColor: secondary }}>
      <BotanicalCorner position="top-right" color={`${accent}52`} size="sm" />
      <BotanicalCorner position="bottom-left" color={`${accent}45`} size="sm" />
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-14 sm:py-18 relative z-10">
        <AnimatedSection>
          <OrnateCard>
            <form onSubmit={handleSubmitClick} className="space-y-7" style={{ textAlign }}>
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-display, cursive)', color: renderTitleColor, fontWeight: 400 }}>{title}</h2>
                <FloralDivider color={accent} />
                {subtitle && <p className="text-sm sm:text-base font-light italic leading-relaxed" style={{ color: renderTextColor, opacity: 0.9 }}>{subtitle}</p>}
                {groupData && (
                  <div className="pt-2">
                    <div className="inline-block px-5 py-2.5 rounded-full border" style={{ borderColor: `${accent}35`, backgroundColor: `${accent}08` }}>
                      <p className="text-lg sm:text-xl font-light italic tracking-wide" style={{ fontFamily: 'var(--font-heading, serif)', color: renderTitleColor }}>{groupData.name}</p>
                      <p className="text-[10px] tracking-[0.2em] uppercase mt-0.5 opacity-60" style={{ color: renderTextColor }}>{t('rsvp.partyOf')} {guests.length + (groupData?.extra_passes || 0)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {guests.map((guest, index) => (
                  <div key={guest.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-light border"
                        style={{ borderColor: `${accent}50`, color: accent, backgroundColor: `${accent}08` }}>{index + 1}</div>
                      <p className="text-base sm:text-lg font-light" style={{ fontFamily: 'var(--font-heading, serif)', color: renderTitleColor }}>{guest.name}</p>
                    </div>

                    <div className="flex gap-2 sm:gap-3 pl-0 sm:pl-12">
                      <button type="button" onClick={() => handleAttendingChange(guest.id, true)}
                        className="flex-1 px-4 py-2.5 sm:py-3 rounded-full border transition-all duration-300 text-xs sm:text-sm tracking-wide font-light"
                        style={guest.attending === true
                          ? { borderColor: accent, backgroundColor: accent, color: '#ffffff' }
                          : { borderColor: `${renderTitleColor}30`, backgroundColor: 'transparent', color: renderTitleColor }}>
                        {t('rsvp.accept')}
                      </button>
                      <button type="button" onClick={() => handleAttendingChange(guest.id, false)}
                        className="flex-1 px-4 py-2.5 sm:py-3 rounded-full border transition-all duration-300 text-xs sm:text-sm tracking-wide font-light"
                        style={guest.attending === false
                          ? { borderColor: '#9ca3af', backgroundColor: '#9ca3af', color: '#ffffff' }
                          : { borderColor: '#e5e7eb', backgroundColor: 'transparent', color: renderTextColor, opacity: 0.7 }}>
                        {t('rsvp.decline')}
                      </button>
                    </div>

                    {guests.length > 1 && guest.attending !== null && editingGuestId === guest.id && (
                      <div className="pl-0 sm:pl-12 pt-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: `${accent}25`, backgroundColor: `${accent}05` }}>
                          <Switch checked={applyToAllEnabled[guest.id] || false} onCheckedChange={(checked) => {
                            setApplyToAllEnabled((prev) => ({ ...prev, [guest.id]: checked }))
                            if (checked) applyGuestDataToAll(guest.id, guest)
                          }} />
                          <div className="flex-1">
                            <p className="text-xs font-medium" style={{ color: renderTitleColor }}>{t('rsvp.applyToAllGuests')}</p>
                            <p className="text-[10px]" style={{ color: renderTextColor, opacity: 0.7 }}>{t('rsvp.applyToAllDescription')}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {guest.attending === true && (
                      <div className="pl-0 sm:pl-12 pt-1">
                        {showTravelInfo && (
                          <TravelFields guestId={guest.id} guestName={guest.name} weddingNameId={weddingNameId}
                          isTraveling={guest.is_traveling || false} travelingFrom={guest.traveling_from || ''}
                          travelArrangement={guest.travel_arrangement || null} ticketAttachmentUrl={guest.ticket_attachment_url}
                          adminSetTravel={guest.adminSetTravel || false}
                          onTravelChange={(v) => handleGuestUpdate(guest.id, 'is_traveling', v)}
                          onTravelingFromChange={(v) => handleGuestUpdate(guest.id, 'traveling_from', v)}
                          onTravelArrangementChange={(v) => handleGuestUpdate(guest.id, 'travel_arrangement', v)}
                          onTicketUpload={(v) => handleGuestUpdate(guest.id, 'ticket_attachment_url', v)}
                          primaryColor={accent} textColor={renderTextColor} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Extra Passes */}
              {(groupData?.extra_passes || 0) > 0 && (
                <div className="pt-3">
                  <div className="p-4 rounded-xl border" style={{ borderColor: `${accent}25`, backgroundColor: `${accent}08` }}>
                    <label className="block text-xs font-light tracking-wide uppercase mb-3"
                      style={{ color: renderTextColor, opacity: 0.7, letterSpacing: '0.15em' }}>
                      {t('rsvp.additionalGuests')}
                    </label>
                    <div className="flex items-center gap-3">
                      <button type="button"
                        onClick={() => setExtraPassesAttending(prev => Math.max(0, prev - 1))}
                        className="w-9 h-9 rounded-full border flex items-center justify-center text-lg transition-all hover:scale-105"
                        style={{ borderColor: `${accent}40`, color: renderTitleColor }}
                        disabled={extraPassesAttending <= 0}>-</button>
                      <span className="text-xl font-serif min-w-[3ch] text-center" style={{ color: renderTitleColor }}>
                        {extraPassesAttending}
                      </span>
                      <button type="button"
                        onClick={() => setExtraPassesAttending(prev => Math.min(groupData?.extra_passes || 0, prev + 1))}
                        className="w-9 h-9 rounded-full border flex items-center justify-center text-lg transition-all hover:scale-105"
                        style={{ borderColor: `${accent}40`, color: renderTitleColor }}
                        disabled={extraPassesAttending >= (groupData?.extra_passes || 0)}>+</button>
                    </div>
                    <p className="text-[10px] mt-2 opacity-50" style={{ color: renderTextColor }}>
                      {t('rsvp.extraPassesMax', { max: String(groupData?.extra_passes || 0) })}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-3">
                <label className="block text-xs font-light tracking-wide uppercase" style={{ color: renderTextColor, opacity: 0.7, letterSpacing: '0.15em' }}>
                  {t('rsvp.messageToCouple')}<span className="text-[10px] ml-2 opacity-50 normal-case">({t('rsvp.messageToCoupleOptional')})</span>
                </label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('rsvp.messagePlaceholderShort')} rows={3}
                  className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm font-light resize-none transition-all focus:shadow-md"
                  style={{ borderColor: `${accent}25`, color: renderTextColor }} />
              </div>

              <div className="pt-3">
                {submitError && <p className="mb-2 text-xs text-red-600 text-center">{submitError}</p>}
                <Button type="submit" disabled={isSubmitting || !hasAtLeastOneResponse}
                  className="w-full py-4 rounded-full text-sm font-light tracking-[0.25em] uppercase transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  style={{ backgroundColor: primary, color: secondary, border: 'none' }}>
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2"><Sparkles className="w-4 h-4 animate-spin" />{t('rsvp.submittingResponse')}</span>
                  ) : t('rsvp.submitResponse')}
                </Button>
                {!hasAtLeastOneResponse && (
                  <p className="mt-2 text-[10px] text-center font-light italic" style={{ color: renderTextColor, opacity: 0.5 }}>{t('rsvp.respondForAtLeastOne')}</p>
                )}
              </div>
            </form>

            {groupId && groupData && (
              <OTPVerificationDialog isOpen={showOTPDialog} onClose={() => setShowOTPDialog(false)}
                onVerified={handleOTPVerified} groupId={groupId}
                phoneNumbers={groupData.phone_numbers || []} buttonColor={accent} textColor={renderTextColor} />
            )}
          </OrnateCard>
        </AnimatedSection>
      </div>
    </SectionWrapper>
  )
}

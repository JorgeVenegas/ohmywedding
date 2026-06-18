"use client"

import React, { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { OTPVerificationDialog } from '@/components/ui/otp-verification-dialog'
import { TravelFields } from '@/components/ui/travel-fields'
import { Loader2 } from 'lucide-react'
import { AnimatedSection } from '../animated-section'
import { BaseRSVPProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { useWeddingSettings } from '@/hooks/use-wedding-settings'

const EDITORIAL_BG   = '#F6F1EB'
const EDITORIAL_INK  = '#211D1A'
const EDITORIAL_MUTED    = '#8A7B6E'
const EDITORIAL_HAIRLINE = 'rgba(33,29,26,0.12)'

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
  extra_passes?: number
  extra_passes_confirmed?: number
}

const mapTravelArrangement = (value: string | null): 'already_booked' | 'no_ticket_needed' | null => {
  if (!value) return null
  if (value === 'will_buy_ticket' || value === 'own_means' || value === 'have_ticket') return 'already_booked'
  if (value === 'no_transport' || value === 'needs_transport') return 'no_ticket_needed'
  return value as 'already_booked' | 'no_ticket_needed' | null
}

interface RSVPOldMoneyVariantProps extends BaseRSVPProps {
  bgStyle?: string
  accentMetal?: string
  showOrnaments?: boolean
}

export function RSVPOldMoneyVariant({
  dateId,
  weddingNameId,
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  showTravelInfo: showTravelInfoProp = true,
  groupId,
  useColorBackground,
  backgroundColorChoice,
  requirePhoneVerification = true,
  bgStyle = 'cream',
  accentMetal = 'gold',
  showOrnaments = true,
}: RSVPOldMoneyVariantProps) {
  const { t } = useI18n()
  const { settings: weddingSettings } = useWeddingSettings({ weddingNameId })

  const [groupData, setGroupData]   = useState<GroupData | null>(null)
  const [guests, setGuests]         = useState<Guest[]>([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage]       = useState('')
  const [submitted, setSubmitted]   = useState(false)
  const [isEditing, setIsEditing]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showOTPDialog, setShowOTPDialog] = useState(false)
  const [applyToAllEnabled, setApplyToAllEnabled] = useState<{ [guestId: string]: boolean }>({})
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [extraPassesAttending, setExtraPassesAttending] = useState(0)

  const { bgColor, titleColor, subtitleColor, isColored } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const bg      = isColored && bgColor   ? bgColor   : EDITORIAL_BG
  const ink     = isColored && titleColor ? titleColor : EDITORIAL_INK
  const muted   = isColored && subtitleColor ? subtitleColor : EDITORIAL_MUTED
  const hairline = isColored && titleColor ? `${titleColor}22` : EDITORIAL_HAIRLINE
  const primary = isColored && titleColor ? titleColor : (theme?.colors?.primary || EDITORIAL_INK)

  const showTravelInfo = showTravelInfoProp && (weddingSettings?.rsvp_travel_confirmation_enabled ?? true)

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId) { setLoading(false); return }
      try {
        const response = await fetch(`/api/guest-groups/${groupId}`)
        if (response.ok) {
          const data = await response.json()
          setGroupData(data)
          const mappedGuests = data.guests.map((g: any) => ({
            id: g.id, name: g.name,
            attending: g.confirmation_status === 'confirmed' ? true : g.confirmation_status === 'declined' ? false : null,
            is_traveling: g.is_traveling || false,
            traveling_from: g.traveling_from || '',
            travel_arrangement: mapTravelArrangement(g.travel_arrangement),
            ticket_attachment_url: g.ticket_attachment_url || null,
            adminSetTravel: g.admin_set_travel || false,
          }))
          setGuests(mappedGuests)
          const hasResponded = data.guests.some((g: any) => g.confirmation_status && g.confirmation_status !== 'pending')
          setSubmitted(hasResponded)
          if (hasResponded) setExtraPassesAttending(data.extra_passes_confirmed || 0)
        }
      } catch {}
      finally { setLoading(false) }
    }
    fetchGroupData()
  }, [groupId, isEditing])

  const updateGuest = (guestId: string, field: keyof Guest, value: any) => {
    if (field === 'attending') setEditingGuestId(guestId)
    const updatedGuests = guests.map(g => {
      if (g.id !== guestId) return g
      const updated = { ...g, [field]: value }
      if (field === 'attending' && value === false) {
        updated.is_traveling = false; updated.traveling_from = ''; updated.travel_arrangement = null; updated.ticket_attachment_url = null
      }
      if (field === 'travel_arrangement' && value === 'no_ticket_needed') updated.ticket_attachment_url = null
      if (field === 'is_traveling' && value === false) {
        updated.traveling_from = ''; updated.travel_arrangement = null; updated.ticket_attachment_url = null
      }
      return updated
    })
    setGuests(updatedGuests)
    if (applyToAllEnabled[guestId] && guests.length > 1) {
      const src = updatedGuests.find(g => g.id === guestId)
      if (src) applyGuestDataToAll(guestId, src)
    }
  }

  const applyGuestDataToAll = (srcId: string, src: Guest) => {
    setGuests(prev => prev.map(g => g.id === srcId ? g : {
      ...g, attending: src.attending, is_traveling: src.is_traveling,
      traveling_from: src.traveling_from, travel_arrangement: src.travel_arrangement,
    }))
  }

  const handleSubmitClick = () => {
    if (showTravelInfo) {
      const missing = guests.filter(g => g.attending === true && g.adminSetTravel && (!g.is_traveling || !g.travel_arrangement))
      if (missing.length > 0) { setSubmitError(t('rsvp.travelInfoRequired')); return }
      if (weddingSettings?.rsvp_require_ticket_attachment) {
        const noTicket = guests.filter(g => g.attending === true && g.is_traveling && g.travel_arrangement === 'already_booked' && !g.ticket_attachment_url)
        if (noTicket.length > 0) { setSubmitError(t('rsvp.ticketRequired')); return }
      }
    }
    requirePhoneVerification ? setShowOTPDialog(true) : handleDirectSubmit()
  }

  const buildBody = (token?: string) => ({
    weddingNameId, groupId,
    ...(token ? { verificationToken: token } : { skipPhoneVerification: true }),
    guests: guests.map(g => ({
      guestId: g.id, attending: g.attending,
      is_traveling: g.attending === false ? false : g.is_traveling,
      traveling_from: g.attending === false ? null : g.traveling_from,
      travel_arrangement: g.attending === false ? null : g.travel_arrangement,
      ticket_attachment_url: g.attending === false ? null : g.ticket_attachment_url,
    })),
    extraPassesAttending: (groupData?.extra_passes || 0) > 0 ? extraPassesAttending : undefined,
    message,
  })

  const handleDirectSubmit = async () => {
    setSubmitError(''); setSubmitting(true)
    try {
      const res = await fetch('/api/rsvps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildBody()) })
      const data = await res.json()
      if (res.ok) { setSubmitted(true); setIsEditing(false) }
      else { setSubmitError(data.error || t('rsvp.error')) }
    } catch { setSubmitError(t('rsvp.error')) }
    finally { setSubmitting(false) }
  }

  const handleOTPVerified = async (token: string) => {
    setShowOTPDialog(false); setSubmitError(''); setSubmitting(true)
    try {
      const res = await fetch('/api/rsvps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildBody(token)) })
      const data = await res.json()
      if (res.ok) { setSubmitted(true); setIsEditing(false) }
      else { setSubmitError(data.error || t('rsvp.error')) }
    } catch { setSubmitError(t('rsvp.error')) }
    finally { setSubmitting(false) }
  }

  const title = sectionTitle || t('rsvp.title')
  const guestCountLabel = `${guests.length} ${guests.length === 1 ? t('rsvp.guest') : t('rsvp.guests')}`

  // ── Styles reused across states ───────────────────────────────────────
  const sectionInner = {
    paddingTop: 'clamp(5rem, 10vw, 8rem)' as const,
    paddingBottom: 'clamp(5rem, 10vw, 8rem)' as const,
  }

  // When bg is colored, opacity suffixes on ink (#fff) go near-invisible — boost them
  const btnBorderIdle    = isColored ? `${ink}90` : `${ink}55`
  const btnTextIdle      = isColored ? ink         : `${ink}85`
  const btnBorderDecline = isColored ? ink          : `${ink}80`
  const btnBgDecline     = isColored ? `${ink}28` : `${ink}12`
  const btnTextDecline   = isColored ? ink          : ink

  // Micro-label: 11px uppercase tracked heading font
  const microLabel = {
    fontFamily: 'var(--font-heading, serif)',
    fontSize: '11px',
    letterSpacing: '0.38em',
    textTransform: 'uppercase' as const,
    fontWeight: 400,
    color: `${ink}65`,
  }

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section id="rsvp" className="w-full py-20 flex items-center justify-center" style={{ backgroundColor: bg }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: `${ink}40` }} />
      </section>
    )
  }

  // ── Confirmed (read-only) state ───────────────────────────────────────
  if (submitted && !isEditing) {
    return (
      <section id="rsvp" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
        <div className="max-w-xl mx-auto px-8 sm:px-14 md:px-10" style={sectionInner}>
          <AnimatedSection>
            <p style={microLabel} className="mb-6">{t('rsvp.title')}</p>
            <div role="heading" aria-level={2} style={{
              fontFamily: 'var(--font-display, serif)', fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: primary, lineHeight: 1.1, marginBottom: '3.5rem',
            }}>
              {t('rsvp.alreadySubmitted')}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={80}>
            <div style={{ height: '1px', background: hairline }} />
            {guests.map(g => (
              <div key={g.id}>
                <div className="flex items-center justify-between py-5 sm:py-6">
                  <span style={{
                    fontFamily: 'var(--font-heading, serif)', fontStyle: 'italic', fontWeight: 400,
                    fontSize: 'clamp(2.5rem, 13vw, 5rem)', color: ink,
                  }}>
                    {g.name}
                  </span>
                  {/* Attendance badge — ink for attending, muted hairline for not */}
                  <span style={{
                    fontFamily: 'var(--font-heading, serif)',
                    fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase',
                    color: g.attending === true ? bg : `${ink}55`,
                    background: g.attending === true ? ink : 'transparent',
                    border: `1px solid ${g.attending === true ? ink : `${ink}30`}`,
                    padding: '4px 10px',
                  }}>
                    {g.attending === true ? t('rsvp.attending') : g.attending === false ? t('rsvp.notAttending') : t('rsvp.noResponse')}
                  </span>
                </div>
                <div style={{ height: '1px', background: hairline }} />
              </div>
            ))}

            <button
              onClick={() => setIsEditing(true)}
              style={{ ...microLabel, marginTop: '2rem', display: 'block', color: `${ink}45` }}
              className="transition-opacity hover:opacity-70"
            >
              {t('rsvp.editResponse')}
            </button>
          </AnimatedSection>
        </div>
      </section>
    )
  }

  // ── No group (preview / public) ───────────────────────────────────────
  if (!groupId) {
    return (
      <section id="rsvp" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
        <div className="max-w-xl mx-auto px-8 sm:px-14 md:px-10" style={sectionInner}>
          <AnimatedSection>
            <p style={{
              fontFamily: 'var(--font-heading, serif)', fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: `${ink}70`, lineHeight: 1.7,
            }}>
              {t('rsvp.individualInvitationsMessage')}
            </p>
          </AnimatedSection>
        </div>
      </section>
    )
  }

  // ── Main RSVP form ────────────────────────────────────────────────────
  return (
    <>
      <section id="rsvp" className="relative overflow-hidden" style={{ backgroundColor: bg }}>
        <div className="max-w-xl mx-auto px-8 sm:px-14 md:px-10" style={sectionInner}>

          {/* Section heading */}
          <AnimatedSection className="mb-12 sm:mb-16">
            {sectionSubtitle && (
              <p style={{ ...microLabel, marginBottom: '1.25rem' }}>{sectionSubtitle}</p>
            )}
            <div role="heading" aria-level={2} style={{
              fontFamily: 'var(--font-display, serif)', fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(2.2rem, 5vw, 4.5rem)', color: primary, lineHeight: 1.1,
            }}>
              {title}
            </div>
          </AnimatedSection>

          {groupData && (
            <AnimatedSection delay={80}>

              {/* Group header — the personal address */}
              <div style={{ marginBottom: '2.5rem' }}>
                <p style={{ ...microLabel, marginBottom: '0.875rem' }}>{guestCountLabel}</p>
                <p data-custom-font style={{
                  fontFamily: 'var(--font-display, serif)', fontStyle: 'italic', fontWeight: 400,
                  fontSize: 'clamp(1.875rem, 6vw, 3rem)', color: ink, lineHeight: 1.1,
                }}>
                  {groupData.name}
                </p>
              </div>

              {/* Guest list */}
              <div style={{ height: '1px', background: hairline }} />

              {guests.map((guest, gi) => (
                <div key={guest.id}>
                  <div className="py-7 sm:py-8">

                    {/* Guest name */}
                    <p data-custom-font style={{
                      fontFamily: 'var(--font-heading, serif)', fontStyle: 'italic', fontWeight: 400,
                      fontSize: 'clamp(1.375rem, 4vw, 1.875rem)', color: ink,
                      marginBottom: '1.25rem', letterSpacing: '0.02em',
                    }}>
                      {guest.name}
                    </p>

                    {/* Attendance choice — vertical stack, ink-based contrast */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Attending */}
                      <button
                        type="button"
                        onClick={() => updateGuest(guest.id, 'attending', true)}
                        style={{
                          width: '100%', padding: '1rem 0',
                          fontFamily: 'var(--font-heading, serif)', fontWeight: 400,
                          fontSize: '10px', letterSpacing: '0.34em', textTransform: 'uppercase',
                          transition: 'all 200ms',
                          border: `1px solid ${guest.attending === true ? ink : btnBorderIdle}`,
                          background: guest.attending === true ? ink : 'transparent',
                          color: guest.attending === true ? bg : btnTextIdle,
                        }}
                      >
                        {t('rsvp.willAttend')}
                      </button>

                      {/* Cannot attend */}
                      <button
                        type="button"
                        onClick={() => updateGuest(guest.id, 'attending', false)}
                        style={{
                          width: '100%', padding: '1rem 0',
                          fontFamily: 'var(--font-heading, serif)', fontWeight: 400,
                          fontSize: '10px', letterSpacing: '0.34em', textTransform: 'uppercase',
                          transition: 'all 200ms',
                          border: `1px solid ${guest.attending === false ? btnBorderDecline : btnBorderIdle}`,
                          background: guest.attending === false ? btnBgDecline : 'transparent',
                          color: guest.attending === false ? btnTextDecline : btnTextIdle,
                        }}
                      >
                        {t('rsvp.cannotAttend')}
                      </button>
                    </div>

                    {/* Apply to all */}
                    {guests.length > 1 && guest.attending !== undefined && editingGuestId === guest.id && (
                      <div className="flex items-center gap-3 mt-4 py-3 px-4" style={{
                        background: `${ink}04`,
                        border: `1px solid ${ink}18`,
                      }}>
                        <Switch
                          checked={applyToAllEnabled[guest.id] || false}
                          onCheckedChange={(checked) => {
                            setApplyToAllEnabled(prev => ({ ...prev, [guest.id]: checked }))
                            if (checked) applyGuestDataToAll(guest.id, guest)
                          }}
                        />
                        <div>
                          <p style={{ ...microLabel, letterSpacing: '0.28em', color: ink }}>{t('rsvp.applyToAllGuests')}</p>
                          <p style={{ fontFamily: 'var(--font-body, sans-serif)', fontSize: '11px', color: `${ink}50`, marginTop: '2px' }}>
                            {t('rsvp.applyToAllDescription')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Travel fields */}
                    {showTravelInfo && guest.attending === true && (
                      <div className="mt-5">
                        <TravelFields
                          guestId={guest.id}
                          guestName={guest.name}
                          weddingNameId={weddingNameId}
                          isTraveling={guest.is_traveling || false}
                          travelingFrom={guest.traveling_from || ''}
                          travelArrangement={guest.travel_arrangement || null}
                          ticketAttachmentUrl={guest.ticket_attachment_url}
                          adminSetTravel={guest.adminSetTravel || false}
                          primaryColor={ink}
                          textColor={ink}
                          requireTicketAttachment={weddingSettings?.rsvp_require_ticket_attachment ?? false}
                          requireNoTicketReason={weddingSettings?.rsvp_require_no_ticket_reason ?? false}
                          onTravelChange={(v: boolean) => updateGuest(guest.id, 'is_traveling', v)}
                          onTravelingFromChange={(v: string) => updateGuest(guest.id, 'traveling_from', v)}
                          onTravelArrangementChange={(v: 'already_booked' | 'no_ticket_needed' | null) => updateGuest(guest.id, 'travel_arrangement', v)}
                          onTicketUpload={(v: string) => updateGuest(guest.id, 'ticket_attachment_url', v)}
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ height: '1px', background: hairline }} />
                </div>
              ))}

              {/* Extra passes */}
              {(groupData?.extra_passes || 0) > 0 && (
                <div className="py-7">
                  <p style={{ ...microLabel, marginBottom: '1.5rem' }}>{t('rsvp.additionalGuests')}</p>
                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      onClick={() => setExtraPassesAttending(p => Math.max(0, p - 1))}
                      disabled={extraPassesAttending <= 0}
                      className="w-9 h-9 flex items-center justify-center transition-opacity disabled:opacity-25"
                      style={{ border: `1px solid ${ink}30`, color: ink, fontFamily: 'var(--font-heading, serif)', fontSize: '1.125rem' }}
                    >
                      −
                    </button>
                    <span style={{
                      fontFamily: 'var(--font-heading, serif)', fontWeight: 300,
                      fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', color: ink,
                      minWidth: '2ch', textAlign: 'center',
                    }}>
                      {extraPassesAttending}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExtraPassesAttending(p => Math.min(groupData?.extra_passes || 0, p + 1))}
                      disabled={extraPassesAttending >= (groupData?.extra_passes || 0)}
                      className="w-9 h-9 flex items-center justify-center transition-opacity disabled:opacity-25"
                      style={{ border: `1px solid ${ink}30`, color: ink, fontFamily: 'var(--font-heading, serif)', fontSize: '1.125rem' }}
                    >
                      +
                    </button>
                  </div>
                  <p style={{ ...microLabel, marginTop: '1rem', letterSpacing: '0.22em', color: `${ink}38` }}>
                    {t('rsvp.extraPassesMax', { max: String(groupData?.extra_passes || 0) })}
                  </p>
                  <div style={{ height: '1px', background: hairline, marginTop: '1.75rem' }} />
                </div>
              )}

              {/* Message */}
              <div className="py-6">
                <label style={{ ...microLabel, display: 'block', marginBottom: '0.875rem', color: ink }}>
                  {t('rsvp.message')}
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('rsvp.messagePlaceholder')}
                  rows={3}
                  className="[&::placeholder]:text-[var(--rsvp-ph)]"
                  style={{
                    '--rsvp-ph': `${ink}80`,
                    border: `1px solid ${ink}22`,
                    color: ink,
                    backgroundColor: 'transparent',
                    fontFamily: 'var(--font-body, sans-serif)',
                    fontSize: '0.9375rem',
                    borderRadius: 0,
                    resize: 'none',
                  } as React.CSSProperties}
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                {submitError && (
                  <p style={{ fontFamily: 'var(--font-body, sans-serif)', fontSize: '0.8125rem', color: '#B04040', marginBottom: '1rem', textAlign: 'center' }}>
                    {submitError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSubmitClick}
                  disabled={submitting || !guests.some(g => g.attending !== undefined)}
                  className="w-full transition-opacity disabled:opacity-30"
                  style={{
                    padding: '1.125rem 0',
                    background: ink, color: bg,
                    fontFamily: 'var(--font-heading, serif)', fontWeight: 300,
                    fontSize: '11px', letterSpacing: '0.42em', textTransform: 'uppercase',
                    border: 'none',
                  }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 inline animate-spin" /> : t('rsvp.submit')}
                </button>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>

      {groupId && groupData && (
        <OTPVerificationDialog
          isOpen={showOTPDialog}
          onClose={() => setShowOTPDialog(false)}
          groupId={groupId}
          phoneNumbers={groupData.phone_numbers || []}
          onVerified={handleOTPVerified}
          buttonColor={ink}
          textColor={ink}
        />
      )}
    </>
  )
}

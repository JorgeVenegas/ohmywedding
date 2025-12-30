'use client'

import React, { useState, useEffect } from 'react'
import { SectionWrapper } from '../section-wrapper'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, Loader2 } from 'lucide-react'
import { useI18n } from '@/components/contexts/i18n-context'
import { BaseRSVPProps, getColorScheme } from './types'

interface Guest {
  id: string
  name: string
  attending?: boolean
}

interface GroupData {
  id: string
  name: string
  guests: Guest[]
  hasSubmitted?: boolean
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
  const { t } = useI18n()
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

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
          setGuests(
            data.guests.map((g: any) => ({
              id: g.id,
              name: g.name,
              attending: g.attending,
            }))
          )
          
          // If all guests have responded, show submitted state
          if (data.hasSubmitted) {
            setSubmitted(true)
            setIsEditing(false)
          } else {
            setIsEditing(true)
          }
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
    setGuests(prev =>
      prev.map(g => (g.id === guestId ? { ...g, [field]: value } : g))
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingNameId,
          groupId,
          guests: guests.map(g => ({
            guestId: g.id,
            attending: g.attending,
          })),
          message
        })
      })

      if (response.ok) {
        setSubmitted(true)
        setIsEditing(false)
      }
    } catch (error) {
      // RSVP submission failed
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
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div 
            className="p-12 rounded-3xl border-2 shadow-xl"
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
                    className={`inline-block px-3 py-1 rounded-full text-sm ${
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

            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 shadow-lg"
              style={{ backgroundColor: titleColor }}
            >
              {t('rsvp.editResponse')}
            </button>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper theme={theme} alignment={alignment} id="rsvp" style={{ backgroundColor: bgColor }}>
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center" style={{ textAlign: alignment?.text || 'center' }}>
          <h2 
            className="text-3xl md:text-4xl font-semibold tracking-tight mb-3"
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
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full mb-3"
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
                      className="flex-1 py-2.5 px-3 rounded-lg border-2 transition-all hover:shadow-md font-medium text-sm"
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
                      className="flex-1 py-2.5 px-3 rounded-lg border-2 transition-all hover:shadow-md font-medium text-sm"
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
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || guests.every(g => g.attending === undefined)}
              className="w-full py-4 px-8 rounded-xl font-semibold text-base tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-[1.01]"
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
    </SectionWrapper>
  )
}

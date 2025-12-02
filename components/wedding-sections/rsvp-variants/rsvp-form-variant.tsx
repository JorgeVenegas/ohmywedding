"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Heart, Users } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseRSVPProps } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function RSVPFormVariant({
  dateId,
  weddingNameId,
  theme,
  alignment,
  showMealPreferences = true,
  showCustomQuestions = false,
  customQuestions = []
}: BaseRSVPProps) {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    attending: '',
    guestCount: 1,
    mealPreference: '',
    dietaryRestrictions: '',
    message: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSubmitted(true)
    } catch (error) {
      console.error('RSVP submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <SectionWrapper theme={theme} alignment={alignment} background="default" id="rsvp">
        <div className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <CheckCircle2 className="w-20 h-20 mx-auto mb-6 text-green-500" />
            <h2 className="text-3xl font-bold mb-4" style={{ color: theme?.colors?.foreground }}>
              {t('rsvp.thankYou')}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {t('rsvp.responseReceived')}
            </p>
            <Button 
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              style={{ borderColor: theme?.colors?.primary, color: theme?.colors?.primary }}
            >
              {t('rsvp.updateResponse')}
            </Button>
          </div>
        </div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper theme={theme} alignment={alignment} background="muted" id="rsvp">
      <div className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Heart className="w-12 h-12 mx-auto mb-4" style={{ color: theme?.colors?.accent }} />
            <h2 className="text-3xl md:text-4xl font-bold mb-4" 
                style={{ color: theme?.colors?.foreground }}>
              {t('rsvp.title')}
            </h2>
            <p className="text-gray-600">
              {t('rsvp.subtitle')}
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('rsvp.firstName')} *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('rsvp.firstName')}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('rsvp.email')} *</label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('rsvp.email')}
                />
              </div>

              {/* Attendance */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('rsvp.willYouAttend')} *</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="attending"
                      value="yes"
                      checked={formData.attending === 'yes'}
                      onChange={(e) => setFormData({ ...formData, attending: e.target.value })}
                      className="mr-2"
                    />
                    {t('rsvp.attending')}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="attending"
                      value="no"
                      checked={formData.attending === 'no'}
                      onChange={(e) => setFormData({ ...formData, attending: e.target.value })}
                      className="mr-2"
                    />
                    {t('rsvp.notAttending')}
                  </label>
                </div>
              </div>

              {/* Guest Count */}
              {formData.attending === 'yes' && (
                <div>
                  <label className="block text-sm font-medium mb-2">{t('rsvp.numberOfGuests')}</label>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.guestCount}
                      onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              {/* Meal Preferences */}
              {formData.attending === 'yes' && showMealPreferences && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('rsvp.mealPreference')}</label>
                    <select
                      value={formData.mealPreference}
                      onChange={(e) => setFormData({ ...formData, mealPreference: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      <option value="">{t('rsvp.selectMealOption')}</option>
                      <option value="beef">{t('rsvp.beef')}</option>
                      <option value="chicken">{t('rsvp.chicken')}</option>
                      <option value="fish">{t('rsvp.fish')}</option>
                      <option value="vegetarian">{t('rsvp.vegetarian')}</option>
                      <option value="vegan">{t('rsvp.vegan')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t('rsvp.dietaryRestrictions')}</label>
                    <Textarea
                      value={formData.dietaryRestrictions}
                      onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                      placeholder={t('rsvp.dietaryRestrictionsPlaceholder')}
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Custom Questions */}
              {showCustomQuestions && customQuestions.map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium mb-2">
                    {question.question} {question.required && '*'}
                  </label>
                  {question.type === 'textarea' ? (
                    <Textarea placeholder="Your answer..." />
                  ) : question.type === 'select' ? (
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="">Select an option</option>
                      {question.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <Input 
                      type={question.type} 
                      placeholder="Your answer..." 
                      required={question.required}
                    />
                  )}
                </div>
              ))}

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('rsvp.message')}</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t('rsvp.messagePlaceholder')}
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-lg"
                style={{ backgroundColor: theme?.colors?.primary }}
              >
                {isSubmitting ? t('rsvp.submitting') : t('rsvp.submit')}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </SectionWrapper>
  )
}
"use client"

import { useI18n } from '@/components/contexts/i18n-context'

/**
 * Hook to get translated default values for section content
 * This provides fallback translations when content is not customized
 */
export function useTranslatedDefaults() {
  const { t } = useI18n()
  
  return {
    // Hero Section
    hero: {
      tagline: t('hero.wereGettingMarried'),
      subtitle: t('hero.joinUs'),
      ctaText: t('hero.rsvpNow'),
      secondaryCtaText: t('hero.viewDetails')
    },
    
    // Countdown Section
    countdown: {
      message: t('countdown.untilWeSayIDo'),
      weddingDayMessage: t('countdown.weddingDay'),
      units: {
        years: t('countdown.years'),
        year: t('countdown.year'),
        months: t('countdown.months'),
        month: t('countdown.month'),
        days: t('countdown.days'),
        day: t('countdown.day'),
        hours: t('countdown.hours'),
        hour: t('countdown.hour'),
        minutes: t('countdown.minutes'),
        minute: t('countdown.minute'),
        seconds: t('countdown.seconds'),
        second: t('countdown.second')
      }
    },
    
    // Our Story Section
    ourStory: {
      title: t('ourStory.title'),
      subtitle: t('ourStory.subtitle'),
      ourJourney: t('ourStory.ourJourney'),
      chapterOne: t('ourStory.chapterOne'),
      howWeMetTitle: t('ourStory.howWeMet'),
      howWeMetText: t('ourStory.howWeMetDefault'),
      theBigMoment: t('ourStory.theBigMoment'),
      proposalTitle: t('ourStory.theProposal'),
      proposalText: t('ourStory.proposalDefault')
    },
    
    // Event Details Section
    eventDetails: {
      title: t('eventDetails.title'),
      subtitle: t('eventDetails.subtitle'),
      ceremony: t('eventDetails.ceremony'),
      reception: t('eventDetails.reception'),
      getDirections: t('eventDetails.getDirections'),
      viewOnMap: t('eventDetails.viewOnMap')
    },
    
    // RSVP Section
    rsvp: {
      title: t('rsvp.title'),
      subtitle: t('rsvp.subtitle'),
      firstName: t('rsvp.firstName'),
      lastName: t('rsvp.lastName'),
      email: t('rsvp.email'),
      phone: t('rsvp.phone'),
      attending: t('rsvp.attending'),
      notAttending: t('rsvp.notAttending'),
      willYouAttend: t('rsvp.willYouAttend'),
      numberOfGuests: t('rsvp.numberOfGuests'),
      dietaryRestrictions: t('rsvp.dietaryRestrictions'),
      specialRequests: t('rsvp.specialRequests'),
      message: t('rsvp.message'),
      submit: t('rsvp.submit'),
      submitting: t('rsvp.submitting'),
      thankYou: t('rsvp.thankYou'),
      responseReceived: t('rsvp.responseReceived'),
      lookingForward: t('rsvp.lookingForward'),
      willMissYou: t('rsvp.willMissYou')
    },
    
    // Gallery Section
    gallery: {
      title: t('gallery.title'),
      subtitle: t('gallery.subtitle'),
      viewAll: t('gallery.viewAll')
    },
    
    // FAQ Section
    faq: {
      title: t('faq.title'),
      subtitle: t('faq.subtitle'),
      noFaqsYet: t('faq.noFaqsYet'),
      questionsWillAppear: t('faq.questionsWillAppear'),
      contactNote: t('faq.contactNote')
    },
    
    // Navigation labels
    nav: {
      home: t('nav.home'),
      ourStory: t('nav.ourStory'),
      eventDetails: t('nav.eventDetails'),
      gallery: t('nav.gallery'),
      rsvp: t('nav.rsvp'),
      faq: t('nav.faq')
    },
    
    // Common
    common: {
      loading: t('common.loading'),
      save: t('common.save'),
      cancel: t('common.cancel'),
      edit: t('common.edit'),
      delete: t('common.delete'),
      add: t('common.add'),
      close: t('common.close')
    },
    
    // Date/Time helpers
    dateTime: {
      at: t('dateTime.at'),
      on: t('dateTime.on')
    }
  }
}

/**
 * Hook to format dates according to current locale
 */
export function useLocalizedDate() {
  const { locale, t } = useI18n()
  
  const formatDate = (dateString: string | null | undefined, options?: Intl.DateTimeFormatOptions) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }
    
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', defaultOptions)
  }
  
  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return ''
    
    // Parse time string (assumes HH:MM or HH:MM:SS format)
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes)
    
    return date.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: locale === 'en' // Use 12-hour format for English, 24-hour for Spanish
    })
  }
  
  const getMonthName = (monthIndex: number) => {
    const monthKeys = [
      'months.january', 'months.february', 'months.march', 'months.april',
      'months.may', 'months.june', 'months.july', 'months.august',
      'months.september', 'months.october', 'months.november', 'months.december'
    ]
    return t(monthKeys[monthIndex])
  }
  
  const getDayName = (dayIndex: number) => {
    const dayKeys = [
      'daysOfWeek.sunday', 'daysOfWeek.monday', 'daysOfWeek.tuesday',
      'daysOfWeek.wednesday', 'daysOfWeek.thursday', 'daysOfWeek.friday',
      'daysOfWeek.saturday'
    ]
    return t(dayKeys[dayIndex])
  }
  
  return {
    formatDate,
    formatTime,
    getMonthName,
    getDayName
  }
}

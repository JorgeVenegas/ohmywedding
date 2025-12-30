// Client-side utility functions for wedding data formatting
// These functions don't require server components and can be used in client components

import { Locale } from './i18n'

// Locale mapping for date/time formatting
const localeMap: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES'
}

export function formatWeddingDate(dateString: string | null | undefined, locale: Locale = 'en'): string {
  if (!dateString) return locale === 'es' ? 'Fecha por confirmar' : 'Date TBD'
  
  // Parse date string manually to avoid timezone conversion
  // Date strings from DB are in YYYY-MM-DD format
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return locale === 'es' ? 'Fecha por confirmar' : 'Date TBD'
  
  // Create date in local timezone (month is 0-based)
  const date = new Date(year, month - 1, day)
  if (isNaN(date.getTime())) return locale === 'es' ? 'Fecha por confirmar' : 'Date TBD'
  
  return date.toLocaleDateString(localeMap[locale], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatWeddingTime(timeString: string | null | undefined, locale: Locale = 'en'): string {
  if (!timeString) return locale === 'es' ? 'Hora por confirmar' : 'Time TBD'
  
  const [hours, minutes] = timeString.split(':')
  if (!hours || !minutes) return locale === 'es' ? 'Hora por confirmar' : 'Time TBD'
  
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  
  return date.toLocaleTimeString(localeMap[locale], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: locale === 'en' // Use 12-hour format for English, 24-hour for Spanish
  })
}

export function calculateDaysUntilWedding(weddingDate: string | null | undefined): number {
  if (!weddingDate) return 0 // Return 0 if no date is set
  
  // Parse date string manually to avoid timezone conversion
  const [year, month, day] = weddingDate.split('-').map(Number)
  if (!year || !month || !day) return 0
  
  // Create wedding date in local timezone at start of day
  const wedding = new Date(year, month - 1, day)
  if (isNaN(wedding.getTime())) return 0 // Return 0 if invalid date
  
  // Get today at start of day
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  wedding.setHours(0, 0, 0, 0)
  
  const diffTime = wedding.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}
import { Locale, Translations } from './types'
import { en } from './locales/en'
import { es } from './locales/es'

// Available translations
const translations: Record<Locale, Translations> = {
  en,
  es
}

// Default locale
export const defaultLocale: Locale = 'en'

// Get all available locales
export const locales: Locale[] = ['en', 'es']

// Locale display names
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español'
}

// Get translations for a locale
export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations[defaultLocale]
}

// Helper to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined
    }
    current = current[key]
  }
  
  return typeof current === 'string' ? current : undefined
}

// Create a translation function for a specific locale
export function createTranslator(locale: Locale) {
  const t = getTranslations(locale)
  
  return function translate(key: string, params?: Record<string, string | number>): string {
    let value = getNestedValue(t, key)
    
    if (value === undefined) {
      // Fallback to English if key not found
      value = getNestedValue(translations[defaultLocale], key)
    }
    
    if (value === undefined) {
      return key
    }
    
    // Replace parameters like {{param}} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value!.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue))
      })
    }
    
    return value
  }
}

// Export types
export type { Locale, Translations, TranslationFunction } from './types'

// Re-export locale files for direct access if needed
export { en } from './locales/en'
export { es } from './locales/es'

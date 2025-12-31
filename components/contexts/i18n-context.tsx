"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react'
import { Locale, Translations, getTranslations, createTranslator, defaultLocale, locales, localeNames } from '@/lib/i18n'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  translations: Translations
  locales: Locale[]
  localeNames: Record<Locale, string>
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | null>(null)

interface I18nProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

export function I18nProvider({ children, initialLocale = defaultLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  
  // Update locale when initialLocale prop changes (e.g., from config)
  useEffect(() => {
    if (initialLocale && initialLocale !== locale) {
      setLocaleState(initialLocale)
      // Update html lang attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = initialLocale
      }
    }
  }, [initialLocale, locale])
  
  const setLocale = useCallback((newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      setLocaleState(newLocale)
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferred-locale', newLocale)
      }
      // Update html lang attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale
      }
    }
  }, [])
  
  const translations = useMemo(() => getTranslations(locale), [locale])
  const t = useMemo(() => createTranslator(locale), [locale])
  
  // Check if current locale is RTL (for future Arabic/Hebrew support)
  const isRTL = false // Currently no RTL languages supported
  
  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    translations,
    locales,
    localeNames,
    isRTL
  }), [locale, setLocale, t, translations])
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

// Hook to use i18n context
export function useI18n() {
  const context = useContext(I18nContext)
  
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  
  return context
}

// Hook for just the translation function (convenience)
export function useTranslation() {
  const { t, locale } = useI18n()
  return { t, locale }
}

// Server-side translation helper (for server components)
export function getServerTranslations(locale: Locale = defaultLocale) {
  return {
    t: createTranslator(locale),
    translations: getTranslations(locale)
  }
}

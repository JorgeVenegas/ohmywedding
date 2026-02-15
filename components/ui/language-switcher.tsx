"use client"

import React from 'react'
import { Globe } from 'lucide-react'
import { useI18n } from '@/components/contexts/i18n-context'
import { Locale } from '@/lib/i18n'

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'minimal' | 'pill'
  className?: string
  textColor?: string
}

export function LanguageSwitcher({ variant = 'buttons', className = '', textColor }: LanguageSwitcherProps) {
  const { locale, setLocale, locales, localeNames } = useI18n()

  if (variant === 'pill') {
    return (
      <div className={`flex items-center rounded-full border border-white/20 overflow-hidden text-xs ${className}`}>
        <button
          onClick={() => setLocale('en')}
          className={`px-2.5 py-1 transition-colors ${
            locale === 'en' ? 'bg-white/20 text-white font-medium' : 'text-white/60 hover:text-white'
          }`}
          aria-label="Switch to English"
        >
          EN
        </button>
        <button
          onClick={() => setLocale('es')}
          className={`px-2.5 py-1 transition-colors ${
            locale === 'es' ? 'bg-white/20 text-white font-medium' : 'text-white/60 hover:text-white'
          }`}
          aria-label="Cambiar a Español"
        >
          ES
        </button>
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
        className={`flex items-center gap-1.5 px-2 py-1 text-sm rounded-md hover:opacity-70 transition-all ${className}`}
        style={{ color: textColor }}
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase font-medium">{locale}</span>
      </button>
    )
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="appearance-none bg-transparent border border-gray-300 rounded-md px-3 py-1.5 pr-8 text-sm cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Select language"
        >
          {locales.map((loc) => (
            <option key={loc} value={loc}>
              {localeNames[loc]}
            </option>
          ))}
        </select>
        <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-500" />
      </div>
    )
  }

  // Default: buttons variant
  return (
    <div className={`flex items-center gap-1 ${className}`} style={{ color: textColor }}>
      <Globe className="w-4 h-4 mr-1" style={{ opacity: 0.7 }} />
      {locales.map((loc, index) => (
        <React.Fragment key={loc}>
          {index > 0 && <span style={{ opacity: 0.3 }}>|</span>}
          <button
            onClick={() => setLocale(loc)}
            className={`px-2 py-1 text-sm rounded transition-opacity ${
              locale === loc
                ? 'font-semibold opacity-100'
                : 'opacity-60 hover:opacity-80'
            }`}
            style={{ color: textColor }}
            aria-label={`Switch to ${localeNames[loc]}`}
            aria-current={locale === loc ? 'true' : undefined}
          >
            {loc.toUpperCase()}
          </button>
        </React.Fragment>
      ))}
    </div>
  )
}

// Compact version for header/nav
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n()

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
      className={`flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors ${className}`}
      aria-label={`Switch to ${locale === 'en' ? 'Español' : 'English'}`}
      title={`Switch to ${locale === 'en' ? 'Español' : 'English'}`}
    >
      <span className="text-xs font-bold uppercase">{locale === 'en' ? 'ES' : 'EN'}</span>
    </button>
  )
}

"use client"

import React, { useState } from 'react'
import { ExternalLink, Gift, Heart, Sparkles } from 'lucide-react'
import { BaseRegistryProps, getColorScheme, getProviderLogoUrl } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

import Link from 'next/link'

export function RegistryElegantVariant({
  theme,
  sectionTitle,
  sectionSubtitle,
  message,
  registries = [],
  showCustomRegistry = false,
  customItems = [],
  showDescription = true,
  useColorBackground = false,
  backgroundColorChoice = 'none',
  weddingNameId
}: BaseRegistryProps) {
  const [showAlert, setShowAlert] = useState(false)
  const { bgColor, titleColor, subtitleColor, bodyTextColor, mutedTextColor, accentColor, cardBg, cardBorder, isColored, primary, secondary } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const { t } = useI18n()

  const title = sectionTitle || t('registry.title')
  const subtitle = sectionSubtitle || t('registry.subtitle')
  const messageText = message || t('registry.message')

  const hasRegistries = registries.length > 0
  const hasCustomRegistry = showCustomRegistry && !!weddingNameId

  return (
    <section 
      id="registry"
      className="w-full py-16 sm:py-20 md:py-24 relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Decorative Elements */}
      <div 
        className="absolute top-0 left-0 w-64 h-64 opacity-10 rounded-full blur-3xl"
        style={{ backgroundColor: primary, transform: 'translate(-50%, -50%)' }}
      />
      <div 
        className="absolute bottom-0 right-0 w-64 h-64 opacity-10 rounded-full blur-3xl"
        style={{ backgroundColor: secondary, transform: 'translate(50%, 50%)' }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header with Decorative Elements */}
        <div className="mb-2 sm:mb-4 text-center">
          {/* Decorative Heart */}
          <div className="mb-4">
            <Heart 
              className="w-8 h-8 mx-auto" 
              style={{ color: primary }}
              fill={primary}
            />
          </div>
          
          <h2 
            className="text-4xl sm:text-5xl md:text-6xl mb-4"
            style={{ 
              fontFamily: 'var(--font-display, cursive)',
              color: titleColor,
              fontWeight: 400
            }}
          >
            {title}
          </h2>
          
          {/* Elegant Divider */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div 
              className="w-16 h-px"
              style={{ backgroundColor: isColored ? accentColor : primary }}
            />
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: isColored ? accentColor : primary }}
            />
            <div 
              className="w-16 h-px"
              style={{ backgroundColor: isColored ? accentColor : primary }}
            />
          </div>
          
          <p 
            className="text-lg sm:text-xl font-light italic max-w-xl mx-auto"
            style={{ 
              color: subtitleColor,
              fontFamily: 'var(--font-body, sans-serif)'
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Message in Decorative Box */}
        {messageText && (
          <div 
            className="mb-6 p-6 sm:p-8 rounded-2xl text-center relative"
            style={{ 
              backgroundColor: isColored ? 'rgba(255,255,255,0.1)' : '#faf8f5',
              border: `1px solid ${isColored ? 'rgba(255,255,255,0.2)' : '#e8e4dc'}`
            }}
          >
            <p 
              className="text-base sm:text-lg italic"
              style={{ 
                color: bodyTextColor,
                fontFamily: 'var(--font-body, sans-serif)'
              }}
            >
              "{messageText}"
            </p>
          </div>
        )}

        {/* Registry Links - Elegant Cards */}
        {!hasRegistries && !hasCustomRegistry ? (
          <div 
            className="text-center py-16 px-8 rounded-2xl border border-dashed"
            style={{ 
              borderColor: isColored ? 'rgba(255,255,255,0.3)' : '#d1d5db',
              backgroundColor: isColored ? 'rgba(255,255,255,0.05)' : 'transparent'
            }}
          >
            <Gift 
              className="w-14 h-14 mx-auto mb-4 opacity-30"
              style={{ color: primary }}
            />
            <p 
              className="text-lg font-light"
              style={{ color: mutedTextColor }}
            >
              {t('registry.noRegistriesYet')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {registries.map((registry) => {
              const hasUrl = registry.url && registry.url.trim() !== ''

              return (
                <div
                  key={registry.id}
                  className="relative w-full"
                >
                  {/* Ornate outer border */}
                  <div 
                    className="absolute -inset-3 rounded-3xl opacity-20"
                    style={{ 
                      border: `2px solid ${primary}`,
                      background: `radial-gradient(circle at top left, ${primary}10, transparent 70%)`
                    }}
                  />
                  
                  {/* Corner flourishes */}
                  <div 
                    className="absolute -top-2 -left-2 w-8 h-8 rounded-full"
                    style={{ 
                      background: `radial-gradient(circle, ${primary}, transparent)`,
                      opacity: 0.3
                    }}
                  />
                  <div 
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full"
                    style={{ 
                      background: `radial-gradient(circle, ${secondary}, transparent)`,
                      opacity: 0.3
                    }}
                  />
                  
                  {/* Main card */}
                  <div
                    className="relative rounded-2xl overflow-hidden shadow-xl"
                    style={{ 
                      backgroundColor: cardBg,
                      border: `1px solid ${cardBorder}`
                    }}
                  >
                    {/* Subtle gradient overlay */}
                    <div 
                      className="absolute inset-0 opacity-5"
                      style={{ 
                        background: `linear-gradient(135deg, ${primary}30, ${secondary}30)`
                      }}
                    />
                    
                    {/* Decorative top border */}
                    <div 
                      className="h-1"
                      style={{ 
                        background: `linear-gradient(90deg, transparent, ${primary}, ${secondary}, transparent)`
                      }}
                    />
                    
                    <div className="relative p-8 sm:p-10 text-center">
                      {/* Provider Logo with decorative frame */}
                      <div className="mb-6 relative inline-block">
                        <div 
                          className="absolute -inset-4 rounded-full opacity-10"
                          style={{ border: `1px solid ${primary}` }}
                        />
                        <div className="h-20 sm:h-24 flex items-center justify-center">
                          <img 
                            src={getProviderLogoUrl(registry)}
                            alt={registry.name}
                            className="max-h-16 sm:max-h-20 max-w-[140px] sm:max-w-[160px] object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<span class="text-4xl font-light" style="color: ${primary}; font-family: var(--font-display, cursive)">${registry.name.charAt(0)}</span>`
                      }}
                    />
                        </div>
                      </div>
                      
                      {/* Decorative divider */}
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-8 h-px" style={{ backgroundColor: primary, opacity: 0.3 }} />
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primary, opacity: 0.5 }} />
                        <div className="w-8 h-px" style={{ backgroundColor: primary, opacity: 0.3 }} />
                      </div>
                      
                      <h3 
                        className="text-xl sm:text-2xl font-light mb-2 tracking-wide"
                        style={{ 
                          color: titleColor,
                          fontFamily: 'var(--font-display, cursive)'
                        }}
                      >
                        {registry.name}
                      </h3>
                      
                      {showDescription && registry.description && (
                        <p 
                          className="text-sm mb-5 font-light italic line-clamp-2 px-4"
                          style={{ color: mutedTextColor }}
                        >
                          {registry.description}
                        </p>
                      )}
                      
                      {hasUrl ? (
                        <a
                          href={registry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-light tracking-wide transition-all duration-300 hover:shadow-lg border"
                          style={{ 
                            backgroundColor: 'transparent',
                            borderColor: primary,
                            color: primary
                          }}
                        >
                          {t('registry.visitRegistry')}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <button
                          onClick={() => setShowAlert(true)}
                          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-light tracking-wide transition-all duration-300 hover:shadow-lg border"
                          style={{ 
                            backgroundColor: 'transparent',
                            borderColor: primary,
                            color: primary
                          }}
                        >
                          {t('registry.visitRegistry')}
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Custom Registry Card */}
            {showCustomRegistry && weddingNameId && (
              <div className="relative w-full">
                <Link
                  href={`/${weddingNameId}/registry`}
                  className="block relative rounded-2xl overflow-hidden shadow-md transition-shadow duration-300 hover:shadow-xl"
                  style={{ 
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`
                  }}
                >
                  {/* Subtle gradient overlay */}
                  <div 
                    className="absolute inset-0 opacity-5"
                    style={{ 
                      background: `linear-gradient(135deg, ${primary}30, ${secondary}30)`
                    }}
                  />
                  
                  {/* Decorative top border */}
                  <div 
                    className="h-1"
                    style={{ 
                      background: `linear-gradient(90deg, transparent, ${primary}, ${secondary}, transparent)`
                    }}
                  />
                  
                  <div className="relative p-8 sm:p-10 text-center">
                    {/* Heart Icon with decorative frame */}
                    <div className="mb-6 relative inline-block">
                      <div 
                        className="absolute -inset-4 rounded-full opacity-10"
                        style={{ border: `1px solid ${primary}` }}
                      />
                      <div className="h-20 sm:h-24 flex items-center justify-center">
                        <Heart 
                          className="w-16 h-16 sm:w-20 sm:h-20" 
                          style={{ color: primary }} 
                          fill={primary}
                        />
                      </div>
                    </div>
                    
                    {/* Decorative divider */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-8 h-px" style={{ backgroundColor: primary, opacity: 0.3 }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primary, opacity: 0.5 }} />
                      <div className="w-8 h-px" style={{ backgroundColor: primary, opacity: 0.3 }} />
                    </div>
                    
                    <h3 
                      className="text-xl sm:text-2xl font-light mb-2 tracking-wide"
                      style={{ 
                        color: titleColor,
                        fontFamily: 'var(--font-display, cursive)'
                      }}
                    >
                      {t('registry.customTitle') || 'Our Custom Registry'}
                    </h3>
                    
                    {showDescription && (
                      <p 
                        className="text-sm mb-5 font-light italic line-clamp-2 px-4"
                        style={{ color: mutedTextColor }}
                      >
                        {t('registry.customDescription') || 'Support our special experiences and dreams'}
                      </p>
                    )}
                    
                    <div
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-light tracking-wide transition-all duration-300 hover:shadow-lg border"
                      style={{ 
                        backgroundColor: 'transparent',
                        borderColor: primary,
                        color: primary
                      }}
                    >
                      {t('registry.visitRegistry')}
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

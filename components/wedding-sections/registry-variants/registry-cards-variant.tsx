"use client"

import React, { useState } from 'react'
import { ExternalLink, Gift, Heart } from 'lucide-react'
import { BaseRegistryProps, getColorScheme, getProviderLogoUrl } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import Link from 'next/link'

export function RegistryCardsVariant({
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
  const { bgColor, titleColor, subtitleColor, bodyTextColor, mutedTextColor, accentColor, cardBg, cardBorder, isColored, primary } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const { t } = useI18n()

  // Use translated defaults if not provided
  const title = sectionTitle || t('registry.title')
  const subtitle = sectionSubtitle || t('registry.subtitle')
  const messageText = message || t('registry.message')

  const hasRegistries = registries.length > 0
  const hasCustomRegistry = showCustomRegistry && !!weddingNameId

  return (
    <section 
      id="registry"
      className="w-full py-12 sm:py-16 md:py-20"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10 sm:mb-12 text-center">
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4"
            style={{ 
              fontFamily: 'var(--font-display, cursive)',
              color: titleColor,
              fontWeight: 400
            }}
          >
            {title}
          </h2>
          <div 
            className="w-20 sm:w-24 h-1 mx-auto rounded mb-4 sm:mb-6"
            style={{ backgroundColor: isColored ? accentColor : primary }}
          />
          <p 
            className="text-base sm:text-lg max-w-2xl mx-auto"
            style={{ 
              color: subtitleColor,
              fontFamily: 'var(--font-body, sans-serif)'
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Message */}
        {messageText && (
          <div className="mb-10 text-center">
            <p 
              className="text-base sm:text-lg italic max-w-2xl mx-auto"
              style={{ color: bodyTextColor }}
            >
              {messageText}
            </p>
          </div>
        )}

        {/* Registry Links */}
        {!hasRegistries && !hasCustomRegistry ? (
          <div 
            className="text-center py-12 px-6 rounded-lg border-2 border-dashed"
            style={{ 
              borderColor: isColored ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
              backgroundColor: isColored ? 'rgba(255,255,255,0.05)' : '#f9fafb'
            }}
          >
            <Gift 
              className="w-12 h-12 mx-auto mb-4 opacity-40"
              style={{ color: isColored ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}
            />
            <p 
              className="text-lg font-medium mb-1"
              style={{ color: isColored ? 'rgba(255,255,255,0.7)' : '#6b7280' }}
            >
              {t('registry.noRegistriesYet')}
            </p>
            <p 
              className="text-sm"
              style={{ color: isColored ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}
            >
              {t('registry.registriesWillAppear')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto [&>*:last-child:nth-child(3n+1)]:lg:col-start-2">
            {registries.map((registry) => {
              const hasUrl = registry.url && registry.url.trim() !== ''
              const CardWrapper = hasUrl ? 'a' : 'div'
              const linkProps = hasUrl ? {
                href: registry.url,
                target: "_blank",
                rel: "noopener noreferrer"
              } : {
                onClick: () => setShowAlert(true),
                style: { cursor: 'pointer' }
              }

              return (
                <CardWrapper
                  key={registry.id}
                  {...linkProps}
                  className="group relative flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 w-full h-full"
                  style={{ 
                    backgroundColor: cardBg,
                    border: `2px solid ${cardBorder}`
                  }}
                >
                  {/* Accent Bar */}
                  <div 
                    className="h-2"
                    style={{ 
                      background: `linear-gradient(90deg, ${primary}, ${accentColor})`
                    }}
                  />
                  
                  <div className="p-6 sm:p-8 text-center flex-1 flex flex-col justify-center">
                    {/* Provider Logo - Larger */}
                    <div className="mb-5 h-20 sm:h-24 flex items-center justify-center">
                      <img 
                        src={getProviderLogoUrl(registry)}
                        alt={registry.name}
                        className="max-h-16 sm:max-h-20 max-w-[140px] sm:max-w-[180px] object-contain"
                      onError={(e) => {
                        // Fallback to text if image fails
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<span class="text-2xl font-bold" style="color: ${primary}">${registry.name.charAt(0)}</span>`
                      }}
                    />
                  </div>
                  
                  <h3 
                    className="text-lg sm:text-xl font-bold mb-3"
                    style={{ color: titleColor }}
                  >
                    {registry.name}
                  </h3>
                  
                  {showDescription && registry.description && (
                    <p 
                      className="text-sm mb-5 line-clamp-2 px-2"
                      style={{ color: mutedTextColor }}
                    >
                      {registry.description}
                    </p>
                  )}
                  
                  {/* Button Style CTA */}
                  <div 
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 group-hover:shadow-md"
                    style={{ 
                      backgroundColor: primary,
                      color: '#ffffff'
                    }}
                  >
                    {t('registry.viewRegistry')}
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </CardWrapper>
            )
          })}

            {/* Custom Registry Card */}
            {showCustomRegistry && weddingNameId && (
              <Link
                href={`/${weddingNameId}/registry`}
                className="group relative flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 w-full h-full"
                style={{ 
                  backgroundColor: cardBg,
                  border: `2px solid ${cardBorder}`
                }}
              >
                {/* Accent Bar */}
                <div 
                  className="h-2"
                  style={{ 
                    background: `linear-gradient(90deg, ${primary}, ${accentColor})`
                  }}
                />
                
                <div className="p-6 sm:p-8 text-center flex-1 flex flex-col justify-center">
                  {/* Heart Icon */}
                  <div className="mb-5 h-20 sm:h-24 flex items-center justify-center">
                    <Heart 
                      className="w-16 h-16 sm:w-20 sm:h-20" 
                      style={{ color: primary }}
                      fill={primary}
                    />
                  </div>
                  
                  <h3 
                    className="text-lg sm:text-xl font-bold mb-3"
                    style={{ color: titleColor }}
                  >
                    {t('registry.customTitle') || 'Our Custom Registry'}
                  </h3>
                  
                  {showDescription && (
                    <p 
                      className="text-sm mb-5 line-clamp-2 px-2"
                      style={{ color: mutedTextColor }}
                    >
                      {t('registry.customDescription') || 'Support our special experiences and dreams'}
                    </p>
                  )}
                  
                  {/* Button Style CTA */}
                  <div className="flex justify-center">
                    <div 
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 group-hover:shadow-md"
                      style={{ 
                        backgroundColor: primary,
                        color: '#ffffff'
                      }}
                    >
                      {t('registry.viewRegistry')}
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

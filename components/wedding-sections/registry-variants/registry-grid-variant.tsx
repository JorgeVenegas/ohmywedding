"use client"

import React, { useState } from 'react'
import { ExternalLink, Gift, Heart } from 'lucide-react'
import { BaseRegistryProps, getColorScheme, getProviderLogoUrl } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import Link from 'next/link'

export function RegistryGridVariant({
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10 sm:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Gift className="w-6 h-6" style={{ color: primary }} />
            <h2 
              className="text-2xl sm:text-3xl font-bold"
              style={{ 
                fontFamily: 'var(--font-heading, sans-serif)',
                color: titleColor
              }}
            >
              {title}
            </h2>
          </div>
          <p 
            className="text-base"
            style={{ color: subtitleColor }}
          >
            {subtitle}
          </p>
        </div>

        {/* Message */}
        {messageText && (
          <div 
            className="mb-8 p-4 rounded-lg"
            style={{ 
              backgroundColor: isColored ? 'rgba(255,255,255,0.1)' : '#f9fafb',
              borderLeft: `4px solid ${primary}`
            }}
          >
            <p 
              className="text-sm sm:text-base"
              style={{ color: bodyTextColor }}
            >
              {messageText}
            </p>
          </div>
        )}

        {/* Registry Links - Grid Layout */}
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
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
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
                  className="group flex flex-col items-center gap-3 transition-transform duration-200 hover:-translate-y-1"
                >
                  {/* Circular Badge */}
                  <div 
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-lg group-hover:shadow-xl transition-shadow duration-200 flex items-center justify-center"
                    style={{ 
                      backgroundColor: cardBg,
                      border: `3px solid ${primary}`
                    }}
                  >
                    <img 
                      src={getProviderLogoUrl(registry)}
                      alt={registry.name}
                      className="max-h-12 sm:max-h-14 max-w-[70px] sm:max-w-[80px] object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.parentElement!.innerHTML = `<span class="text-3xl font-bold" style="color: ${primary}">${registry.name.charAt(0)}</span>`
                    }}
                  />
                  
                  {/* Small external link indicator */}
                  <div 
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow-md flex items-center justify-center"
                    style={{ backgroundColor: primary }}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                
                {/* Name below badge */}
                <div className="text-center max-w-[120px]">
                  <h3 
                    className="text-sm sm:text-base font-semibold line-clamp-2"
                    style={{ color: titleColor }}
                  >
                    {registry.name}
                  </h3>
                </div>
              </CardWrapper>
            )
          })}

          {/* Custom Registry Card */}
          {showCustomRegistry && weddingNameId && (
            <Link
              href={`/${weddingNameId}/registry`}
              className="flex flex-col items-center gap-2 transition-transform duration-200 hover:scale-105 cursor-pointer"
            >
              <div 
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow duration-200"
                style={{ 
                  backgroundColor: cardBg,
                  border: `3px solid ${primary}`
                }}
              >
                <Heart className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: primary }} fill={primary} />
                
                {/* Small external link indicator */}
                <div 
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow-md flex items-center justify-center"
                  style={{ backgroundColor: primary }}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              
              {/* Name below badge */}
              <div className="text-center max-w-[120px]">
                <h3 
                  className="text-sm sm:text-base font-semibold line-clamp-2"
                  style={{ color: titleColor }}
                >
                  {t('registry.customTitle') || 'Our Custom Registry'}
                </h3>
              </div>
            </Link>
          )}
          </div>
        )}
      </div>

      {/* Alert Dialog */}
      <RegistryAlertDialog 
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        primary={primary}
        accent={accentColor}
      />
    </section>
  )
}

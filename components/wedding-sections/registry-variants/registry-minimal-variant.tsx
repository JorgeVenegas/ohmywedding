"use client"

import React, { useState } from 'react'
import { ExternalLink, Gift, Heart, ArrowRight } from 'lucide-react'
import { BaseRegistryProps, getColorScheme, getProviderLogoUrl } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { getWeddingPath } from '@/lib/wedding-url'
import Link from 'next/link'

export function RegistryMinimalVariant({
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <h2 
            className="text-2xl sm:text-3xl mb-2"
            style={{ 
              fontFamily: 'var(--font-heading, serif)',
              color: titleColor,
              fontWeight: 500,
              letterSpacing: '0.05em'
            }}
          >
            {title}
          </h2>
          <p 
            className="text-sm sm:text-base"
            style={{ color: subtitleColor }}
          >
            {subtitle}
          </p>
        </div>

        {/* Message */}
        {messageText && (
          <div className="mb-8 text-center">
            <p 
              className="text-sm sm:text-base"
              style={{ color: bodyTextColor }}
            >
              {messageText}
            </p>
          </div>
        )}

        {/* Registry Links - Simple List Style */}
        {!hasRegistries && !hasCustomRegistry ? (
          <div 
            className="text-center py-10 px-6 border border-dashed rounded-lg"
            style={{ 
              borderColor: isColored ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
              backgroundColor: isColored ? 'rgba(255,255,255,0.05)' : 'transparent'
            }}
          >
            <Gift 
              className="w-10 h-10 mx-auto mb-3 opacity-40"
              style={{ color: isColored ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}
            />
            <p 
              className="text-sm"
              style={{ color: mutedTextColor }}
            >
              {t('registry.noRegistriesYet')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {registries.map((registry) => {
              const hasUrl = registry.url && registry.url.trim() !== ''
              const ItemWrapper = hasUrl ? 'a' : 'div'
              const linkProps = hasUrl ? {
                href: registry.url,
                target: "_blank",
                rel: "noopener noreferrer"
              } : {
                onClick: () => setShowAlert(true),
                style: { cursor: 'pointer' }
              }

              return (
                <ItemWrapper
                  key={registry.id}
                  {...linkProps}
                  className="group flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:bg-opacity-80 border-l-4"
                  style={{ 
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderLeftColor: primary,
                    borderLeftWidth: '4px'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 flex items-center justify-center rounded-full"
                      style={{ backgroundColor: `${primary}15` }}
                    >
                      <img 
                        src={getProviderLogoUrl(registry)}
                        alt={registry.name}
                        className="w-6 h-6 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<span class="text-sm font-bold" style="color: ${primary}">${registry.name.charAt(0)}</span>`
                      }}
                    />
                  </div>
                  <div>
                    <span 
                      className="font-medium block"
                      style={{ color: titleColor }}
                    >
                      {registry.name}
                    </span>
                    {showDescription && registry.description && (
                      <span
                        className="text-xs block mt-0.5 line-clamp-1"
                        style={{ color: mutedTextColor }}
                      >
                        {registry.description}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight 
                  className="w-5 h-5"
                  style={{ color: primary }}
                />
              </ItemWrapper>
            )
          })}

          {/* Custom Registry Item */}
          {showCustomRegistry && weddingNameId && (
            <Link
              href={getWeddingPath(weddingNameId, '/registry')}
              className="flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md group cursor-pointer"
              style={{ 
                borderColor: cardBorder,
                backgroundColor: cardBg
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primary}20` }}>
                  <Heart className="w-6 h-6" style={{ color: primary }} fill={primary} />
                </div>
                <div className="text-left">
                  <span 
                    className="text-base sm:text-lg font-semibold block"
                    style={{ color: titleColor }}
                  >
                    {t('registry.customTitle') || 'Our Custom Registry'}
                  </span>
                  {showDescription && (
                    <span 
                      className="text-xs block mt-0.5 line-clamp-1"
                      style={{ color: mutedTextColor }}
                    >
                      {t('registry.customDescription') || 'Support our special experiences and dreams'}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight 
                className="w-5 h-5"
                style={{ color: primary }}
              />
            </Link>
          )}
          </div>
        )}
      </div>
    </section>
  )
}

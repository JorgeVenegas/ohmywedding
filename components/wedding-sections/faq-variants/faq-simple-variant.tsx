"use client"

import React from 'react'
import { BaseFAQProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function FAQSimpleVariant({
  theme,
  questions = [],
  sectionTitle,
  sectionSubtitle,
  showContactNote = true,
  contactNoteText,
  useColorBackground = false,
  backgroundColorChoice = 'none'
}: BaseFAQProps) {
  const { bgColor, titleColor, subtitleColor, bodyTextColor, mutedTextColor, accentColor, isColored, primary } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const { t } = useI18n()

  // Use translated defaults if not provided
  const title = sectionTitle || t('faq.title')
  const subtitle = sectionSubtitle || t('faq.subtitle')
  const contactNote = contactNoteText || t('faq.contactNote')

  const faqItems = questions || []
  const hasQuestions = faqItems.length > 0

  return (
    <section 
      id="faq"
      className="w-full py-12 sm:py-16 md:py-20"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Section Header - Simple */}
        <div className="mb-10 sm:mb-12 text-center sm:text-left">
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3"
            style={{ 
              color: titleColor,
              fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p 
              className="text-base sm:text-lg"
              style={{ 
                color: subtitleColor,
                fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* FAQ Items - Simple list */}
        {!hasQuestions ? (
          <div 
            className="py-10 text-center sm:text-left"
          >
            <p 
              className="text-base"
              style={{ color: isColored ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}
            >
              {t('faq.noFaqsYet')}. {t('faq.questionsWillAppear')}.
            </p>
          </div>
        ) : (
        <div className="space-y-8 sm:space-y-10">
          {faqItems.map((item, index) => (
            <div 
              key={item.id || index}
              className="group text-center sm:text-left"
            >
              <h3 
                className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-3"
                style={{ 
                  color: titleColor,
                  fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
                }}
              >
                <span 
                  className="flex-shrink-0 text-sm font-bold"
                  style={{ color: isColored ? accentColor : primary }}
                >
                  Q{index + 1}.
                </span>
                <span>{item.question}</span>
              </h3>
              <div className="sm:pl-10">
                {item.image_url && (
                  <div className="mb-3 rounded-lg overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.question}
                      className="w-full h-auto object-cover max-h-64"
                    />
                  </div>
                )}
                <p 
                  className="text-sm sm:text-base leading-relaxed"
                  style={{ 
                    color: bodyTextColor,
                    fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                  }}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Contact Note */}
        {showContactNote && contactNote && (
          <div 
            className="mt-10 sm:mt-14 pt-8 sm:pt-10 text-center sm:text-left"
            style={{ 
              borderTop: `2px solid ${isColored ? 'rgba(255,255,255,0.15)' : '#e5e7eb'}`
            }}
          >
            <p 
              className="text-base sm:text-lg font-medium"
              style={{ 
                color: bodyTextColor,
                fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
              }}
            >
              {contactNote}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

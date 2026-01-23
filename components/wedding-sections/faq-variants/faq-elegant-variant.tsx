"use client"

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { BaseFAQProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function FAQElegantVariant({
  theme,
  questions = [],
  allowMultipleOpen = false,
  sectionTitle,
  sectionSubtitle,
  showContactNote = true,
  contactNoteText,
  useColorBackground = false,
  backgroundColorChoice = 'none'
}: BaseFAQProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const { bgColor, titleColor, subtitleColor, bodyTextColor, mutedTextColor, accentColor, isColored, primary } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const { t } = useI18n()

  // Use translated defaults if not provided
  const title = sectionTitle || t('faq.title')
  const subtitle = sectionSubtitle || t('faq.subtitle')
  const contactNote = contactNoteText || t('faq.contactNote')

  const faqItems = questions || []
  const hasQuestions = faqItems.length > 0

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (allowMultipleOpen) {
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index)
      } else {
        newOpenItems.add(index)
      }
    } else {
      if (newOpenItems.has(index)) {
        newOpenItems.clear()
      } else {
        newOpenItems.clear()
        newOpenItems.add(index)
      }
    }
    setOpenItems(newOpenItems)
  }

  return (
    <section 
      id="faq"
      className="w-full py-16 sm:py-20 md:py-28"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Section Header - Elegant with decorative elements */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Decorative flourish */}
          <div 
            className="mb-4 flex items-center justify-center gap-3"
            style={{ color: isColored ? accentColor : primary }}
          >
            <div className="w-12 h-px" style={{ backgroundColor: 'currentColor', opacity: 0.5 }} />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3L14.5 8.5L21 9.5L16.5 14L17.5 21L12 18L6.5 21L7.5 14L3 9.5L9.5 8.5L12 3Z" />
            </svg>
            <div className="w-12 h-px" style={{ backgroundColor: 'currentColor', opacity: 0.5 }} />
          </div>
          
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl font-light italic mb-3 sm:mb-4"
            style={{ 
              color: titleColor,
              fontFamily: theme?.fonts?.script || 'Georgia, serif'
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p 
              className="text-base sm:text-lg font-light"
              style={{ 
                color: subtitleColor,
                fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* FAQ Items - Elegant accordion */}
        {!hasQuestions ? (
          <div 
            className="text-center py-12 px-6 rounded-lg"
            style={{ 
              backgroundColor: isColored ? 'rgba(255,255,255,0.05)' : '#faf9f7'
            }}
          >
            <p 
              className="text-lg font-light italic mb-1"
              style={{ 
                color: isColored ? 'rgba(255,255,255,0.6)' : '#9ca3af',
                fontFamily: theme?.fonts?.script || 'Georgia, serif'
              }}
            >
              {t('faq.noFaqsYet')}
            </p>
            <p 
              className="text-sm"
              style={{ color: isColored ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}
            >
              {t('faq.questionsWillAppear')}
            </p>
          </div>
        ) : (
        <div className="space-y-3 sm:space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openItems.has(index)
            
            return (
              <div 
                key={item.id || index}
                className="rounded-lg overflow-hidden transition-all duration-300"
                style={{ 
                  backgroundColor: isColored ? 'rgba(255,255,255,0.08)' : 'white',
                  border: `1px solid ${isColored ? 'rgba(255,255,255,0.15)' : '#e5e7eb'}`,
                  boxShadow: isColored ? 'none' : '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full text-left px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between gap-4"
                >
                  <h3 
                    className="text-base sm:text-lg font-light"
                    style={{ 
                      color: titleColor,
                      fontFamily: theme?.fonts?.script || 'Georgia, serif',
                      fontStyle: 'italic'
                    }}
                  >
                    {item.question}
                  </h3>
                  <ChevronDown 
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: isColored ? accentColor : primary }}
                  />
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px]' : 'max-h-0'}`}
                >
                  <div className="px-5 sm:px-7 pb-5 sm:pb-6">
                    {item.image_url && (
                      <div className="mb-4 rounded-lg overflow-hidden">
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
              </div>
            )
          })}
        </div>
        )}

        {/* Contact Note - Elegant styling */}
        {showContactNote && contactNote && (
          <div className="mt-12 sm:mt-16 text-center">
            {/* Decorative line */}
            <div 
              className="w-16 h-px mx-auto mb-5"
              style={{ backgroundColor: isColored ? accentColor : primary, opacity: 0.4 }}
            />
            <p 
              className="text-base font-light italic"
              style={{ 
                color: mutedTextColor,
                fontFamily: theme?.fonts?.script || 'Georgia, serif'
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

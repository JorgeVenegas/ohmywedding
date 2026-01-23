"use client"

import React, { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { BaseFAQProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function FAQMinimalVariant({
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
      className="w-full py-12 sm:py-16 md:py-20"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Section Header - Minimal */}
        <div className="mb-10 sm:mb-12 text-center">
          <p 
            className="text-xs uppercase tracking-[0.3em] mb-2 sm:mb-3"
            style={{ color: isColored ? accentColor : primary }}
          >
            FAQ
          </p>
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-light"
            style={{ 
              color: titleColor,
              fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
            }}
          >
            {title}
          </h2>
        </div>

        {/* FAQ Items - Clean lines */}
        {!hasQuestions ? (
          <div 
            className="text-center py-10 px-6"
          >
            <p 
              className="text-sm"
              style={{ color: isColored ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}
            >
              {t('faq.noFaqsYet')}
            </p>
          </div>
        ) : (
        <div className="divide-y" style={{ borderColor: isColored ? 'rgba(255,255,255,0.2)' : '#e5e7eb' }}>
          {faqItems.map((item, index) => {
            const isOpen = openItems.has(index)
            
            return (
              <div 
                key={item.id || index}
                className="py-4 sm:py-5"
                style={{ borderColor: isColored ? 'rgba(255,255,255,0.2)' : '#e5e7eb' }}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full text-left flex items-start justify-between gap-4"
                >
                  <h3 
                    className="text-sm sm:text-base font-medium"
                    style={{ 
                      color: titleColor,
                      fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                    }}
                  >
                    {item.question}
                  </h3>
                  <div 
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: isColored ? accentColor : primary }}
                  >
                    {isOpen ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px] mt-3' : 'max-h-0'}`}
                >
                  {item.image_url && (
                    <div className="mb-3 rounded overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.question}
                        className="w-full h-auto object-cover max-h-60"
                      />
                    </div>
                  )}
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ 
                      color: mutedTextColor,
                      fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                    }}
                  >
                    {item.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        )}

        {/* Contact Note */}
        {showContactNote && contactNote && (
          <div className="mt-10 sm:mt-12 text-center">
            <p 
              className="text-sm font-light"
              style={{ 
                color: mutedTextColor,
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

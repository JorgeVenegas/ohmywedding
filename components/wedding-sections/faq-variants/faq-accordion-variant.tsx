"use client"

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, X } from 'lucide-react'
import { BaseFAQProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import Image from 'next/image'

export function FAQAccordionVariant({
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const { bgColor, titleColor, subtitleColor, bodyTextColor, mutedTextColor, accentColor, cardBg, cardBorder, isColored, primary } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const { t } = useI18n()

  // Handle fade-in after mount
  useEffect(() => {
    if (selectedImage && !isClosing) {
      // Small delay to ensure DOM is ready, then trigger fade-in
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    }
  }, [selectedImage, isClosing])

  const handleCloseImage = () => {
    setIsVisible(false)
    setIsClosing(true)
    setTimeout(() => {
      setSelectedImage(null)
      setIsClosing(false)
    }, 300)
  }

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
      className="w-full py-12 sm:py-16 md:py-20"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10 sm:mb-12 text-center">
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4"
            style={{ 
              fontFamily: 'cursive',
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
            className="text-base sm:text-lg"
            style={{ 
              color: subtitleColor,
              fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* FAQ Items */}
        {!hasQuestions ? (
          <div 
            className="text-center py-12 px-6 rounded-lg border-2 border-dashed"
            style={{ 
              borderColor: isColored ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
              backgroundColor: isColored ? 'rgba(255,255,255,0.05)' : '#f9fafb'
            }}
          >
            <HelpCircle 
              className="w-12 h-12 mx-auto mb-4 opacity-40"
              style={{ color: isColored ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}
            />
            <p 
              className="text-lg font-medium mb-1"
              style={{ color: isColored ? 'rgba(255,255,255,0.7)' : '#6b7280' }}
            >
              {t('faq.noFaqsYet')}
            </p>
            <p 
              className="text-sm"
              style={{ color: isColored ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}
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
                className="rounded-lg shadow-sm overflow-hidden transition-all duration-200"
                style={{ 
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`
                }}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left flex items-center justify-between transition-colors duration-200"
                  style={{ 
                    backgroundColor: isOpen ? (isColored ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.02)') : 'transparent'
                  }}
                >
                  <h3 
                    className="text-base sm:text-lg font-semibold pr-4"
                    style={{ 
                      color: titleColor,
                      fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
                    }}
                  >
                    {item.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {isOpen ? (
                      <ChevronUp 
                        className="w-5 h-5" 
                        style={{ color: isColored ? accentColor : primary }}
                      />
                    ) : (
                      <ChevronDown 
                        className="w-5 h-5" 
                        style={{ color: isColored ? accentColor : primary }}
                      />
                    )}
                  </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}
                >
                  <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                    <div 
                      className="w-full h-px mb-3 sm:mb-4"
                      style={{ backgroundColor: cardBorder }}
                    />
                    <p 
                      className="text-sm sm:text-base leading-relaxed mb-4"
                      style={{ 
                        color: mutedTextColor,
                        fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                      }}
                    >
                      {item.answer}
                    </p>
                    {item.images && item.images.length > 0 && (
                      <div className={`grid gap-2 sm:gap-3 ${
                        item.images.length === 1 ? 'grid-cols-1' :
                        item.images.length === 2 ? 'grid-cols-2' :
                        item.images.length === 3 ? 'grid-cols-2 sm:grid-cols-3' :
                        item.images.length === 4 ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4' :
                        'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                      }`}>
                        {item.images.map((imageUrl, imgIndex) => (
                          <div 
                            key={imgIndex} 
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedImage(imageUrl)}
                          >
                            <img 
                              src={imageUrl} 
                              alt={`${item.question} - Image ${imgIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
              className="text-sm"
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

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className={`fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleCloseImage}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            onClick={handleCloseImage}
          >
            <X className="w-6 h-6" />
          </button>
          <div className={`relative max-w-6xl max-h-[90vh] w-full h-full transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}>
            <Image
              src={selectedImage}
              alt="FAQ Image Preview"
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
            />
          </div>
        </div>
      )}
    </section>
  )
}

"use client"

import React, { useState, useEffect, ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { BaseFAQProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import Image from 'next/image'

interface AnimatedFAQItemProps {
  index: number
  className?: string
  style?: React.CSSProperties
  children: ReactNode
}

function AnimatedFAQItem({ index, className, style, children }: AnimatedFAQItemProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: true })

  return (
    <div
      ref={ref}
      className={`${className || ''} transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ ...style, transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const { bgColor, titleColor, subtitleColor, bodyTextColor, mutedTextColor, accentColor, cardBg, cardBorder, isColored, primary } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  const { t } = useI18n()

  // Handle fade-in after mount
  useEffect(() => {
    if (selectedImage && !isClosing) {
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
              <AnimatedFAQItem
                key={item.id || index}
                index={index}
                className="rounded-lg overflow-hidden"
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
                
                {isOpen && (
                  <div className="px-5 sm:px-7 pb-5 sm:pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p 
                      className="text-sm sm:text-base leading-relaxed mb-4"
                      style={{ 
                        color: bodyTextColor,
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
                )}
              </AnimatedFAQItem>
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

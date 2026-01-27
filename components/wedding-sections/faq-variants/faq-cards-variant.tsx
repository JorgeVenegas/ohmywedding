"use client"

import React, { useState, useEffect, ReactNode } from 'react'
import { X } from 'lucide-react'
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
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
      }`}
      style={{ ...style, transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

export function FAQCardsVariant({
  theme,
  questions = [],
  sectionTitle,
  sectionSubtitle,
  showContactNote = true,
  contactNoteText,
  useColorBackground = false,
  backgroundColorChoice = 'none'
}: BaseFAQProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const { bgColor, titleColor, subtitleColor, bodyTextColor, mutedTextColor, accentColor, isColored, primary } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
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

  // Card background and border colors
  const cardBg = isColored ? 'rgba(255,255,255,0.1)' : 'white'
  const cardBorder = isColored ? 'rgba(255,255,255,0.15)' : '#e5e7eb'
  const cardShadow = isColored ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'

  return (
    <section 
      id="faq"
      className="w-full py-12 sm:py-16 md:py-24"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-3 sm:mb-4"
            style={{ 
              color: titleColor,
              fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p 
              className="text-base sm:text-lg max-w-xl mx-auto"
              style={{ 
                color: subtitleColor,
                fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* FAQ Cards Grid */}
        {!hasQuestions ? (
          <div 
            className="text-center py-12 px-6 rounded-xl border-2 border-dashed"
            style={{ 
              borderColor: isColored ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
              backgroundColor: isColored ? 'rgba(255,255,255,0.05)' : '#f9fafb'
            }}
          >
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {faqItems.map((item, index) => (
            <AnimatedFAQItem
              key={item.id || index}
              index={index}
              className="p-5 sm:p-6 rounded-lg hover:scale-[1.02]"
              style={{ 
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                boxShadow: cardShadow
              }}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
                {/* Number badge */}
                <div 
                  className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-medium"
                  style={{ 
                    backgroundColor: isColored ? 'rgba(255,255,255,0.15)' : `${primary}15`,
                    color: isColored ? accentColor : primary
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-base sm:text-lg font-medium mb-2"
                    style={{ 
                      color: titleColor,
                      fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
                    }}
                  >
                    {item.question}
                  </h3>
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
              </div>
            </AnimatedFAQItem>
          ))}
        </div>
        )}

        {/* Contact Note */}
        {showContactNote && contactNote && (
          <div 
            className="mt-10 sm:mt-14 text-center p-6 sm:p-8 rounded-xl"
            style={{ 
              backgroundColor: isColored ? 'rgba(255,255,255,0.08)' : `${primary}08`,
              border: isColored ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${primary}15`
            }}
          >
            <p 
              className="text-base sm:text-lg"
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

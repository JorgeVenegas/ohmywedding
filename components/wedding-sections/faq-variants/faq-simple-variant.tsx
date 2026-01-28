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
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false })

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
            <AnimatedFAQItem
              key={item.id || index}
              index={index}
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
            </AnimatedFAQItem>
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

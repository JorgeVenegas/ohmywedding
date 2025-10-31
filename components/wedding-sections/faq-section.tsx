"use client"

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { SectionWrapper } from './section-wrapper'
import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

interface FAQItem {
  id?: string
  question: string
  answer: string
}

interface FAQSectionProps {
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  questions?: FAQItem[]
  allowMultipleOpen?: boolean
}

export function FAQSection({
  theme,
  alignment,
  questions = [],
  allowMultipleOpen = false
}: FAQSectionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const defaultQuestions: FAQItem[] = [
    {
      question: "What is the dress code?",
      answer: "Black tie optional. We want you to feel comfortable and look your best! Ladies can wear cocktail dresses or formal gowns, and gentlemen can wear suits or tuxedos."
    },
    {
      question: "Can I bring a plus one?",
      answer: "Please refer to your invitation. If a plus one is invited, their name will be listed. Due to venue capacity, we're unable to accommodate additional guests."
    },
    {
      question: "Is there parking available?",
      answer: "Yes, complimentary parking is available at both venues. Valet service will be provided at the reception venue for your convenience."
    },
    {
      question: "What about dietary restrictions?",
      answer: "Please indicate any dietary restrictions in your RSVP. We'll make sure to accommodate vegetarian, vegan, gluten-free, and other dietary needs."
    },
    {
      question: "Will there be a vegetarian option?",
      answer: "Yes, vegetarian and vegan options will be available. Please let us know your preference when you RSVP."
    },
    {
      question: "Can I take photos during the ceremony?",
      answer: "We ask that you refrain from taking photos during the ceremony to preserve the moment for our professional photographer. Feel free to take photos during the reception!"
    },
    {
      question: "What time should I arrive?",
      answer: "Please arrive 15-30 minutes before the ceremony begins to allow time for seating. The ceremony will begin promptly at the scheduled time."
    },
    {
      question: "Is the venue accessible?",
      answer: "Yes, both venues are wheelchair accessible and have accessible parking and restroom facilities."
    }
  ]

  const faqItems = questions.length > 0 ? questions : defaultQuestions

  if (faqItems.length === 0) return null

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
    <SectionWrapper 
      theme={theme} 
      alignment={alignment} 
      background="default"
      id="faq"
    >
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ 
              fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 
                          theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif',
              color: theme?.colors?.foreground || '#1f2937'
            }}
          >
            Frequently Asked Questions
          </h2>
          <div 
            className="w-24 h-1 mx-auto rounded mb-6"
            style={{ backgroundColor: theme?.colors?.accent || '#e8a76a' }}
          />
          <p 
            className="text-lg"
            style={{ 
              color: theme?.colors?.muted || '#6b7280',
              fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
            }}
          >
            Everything you need to know for our special day
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openItems.has(index)
            
            return (
              <div 
                key={item.id || index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 
                    className="text-lg font-semibold pr-4"
                    style={{ 
                      color: theme?.colors?.foreground || '#1f2937',
                      fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
                    }}
                  >
                    {item.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {isOpen ? (
                      <ChevronUp 
                        className="w-5 h-5" 
                        style={{ color: theme?.colors?.primary || '#a86b8f' }}
                      />
                    ) : (
                      <ChevronDown 
                        className="w-5 h-5" 
                        style={{ color: theme?.colors?.primary || '#a86b8f' }}
                      />
                    )}
                  </div>
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-4">
                    <div 
                      className="w-full h-px mb-4"
                      style={{ backgroundColor: theme?.colors?.muted || '#6b7280' }}
                    />
                    <p 
                      className="text-base leading-relaxed"
                      style={{ 
                        color: theme?.colors?.muted || '#6b7280',
                        fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                      }}
                    >
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Contact Note */}
        <div className="mt-12 text-center">
          <p 
            className="text-sm"
            style={{ 
              color: theme?.colors?.muted || '#6b7280',
              fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
            }}
          >
            Have a question that's not answered here? Feel free to reach out to us directly!
          </p>
        </div>
      </div>
    </SectionWrapper>
  )
}
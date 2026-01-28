import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseOurStoryProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

export function OurStoryTimelineVariant({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  sectionTitle,
  sectionSubtitle,
  howWeMetText,
  howWeMetPhoto,
  proposalText,
  proposalPhoto,
  timeline = [],
  useColorBackground = false,
  backgroundColorChoice
}: BaseOurStoryProps) {
  const { t } = useI18n()
  
  // Use translated defaults if not provided
  const title = sectionTitle || t('ourStory.title')
  const subtitle = sectionSubtitle
  
  // Get enhanced color scheme with complementary palette colors
  const { bgColor, titleColor, subtitleColor, sectionTextColor, sectionTextColorAlt, accentColor, contrastColor, colorLight, colorDark, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  
  const allEvents = [
    ...(showHowWeMet ? [{
      date: t('ourStory.chapterOne'),
      title: t('ourStory.howWeMet'),
      description: howWeMetText || t('ourStory.howWeMetDefault'),
      photo: howWeMetPhoto
    }] : []),
    ...timeline,
    ...(showProposal ? [{
      date: t('ourStory.theProposal'),
      title: t('ourStory.theBigMoment'),
      description: proposalText || t('ourStory.proposalDefault'),
      photo: proposalPhoto
    }] : [])
  ]

  // Color scheme - high contrast colors for titles, body text color for readability
  const sectionTitleColor = isColored ? sectionTextColor : theme?.colors?.foreground
  const cardTitleColor = isColored ? titleColor : theme?.colors?.foreground  // Darkest palette color for high contrast
  const cardTextColor = bodyTextColor // Use body text color for readability
  const dateColor = isColored ? subtitleColor : theme?.colors?.accent  // Second darkest for dates
  const dotColor = isColored ? sectionTextColor : theme?.colors?.primary
  const lineColor = isColored ? sectionTextColorAlt : theme?.colors?.accent

  return (
    <SectionWrapper 
      theme={isColored ? undefined : theme} 
      alignment={alignment} 
      background="default" 
      id="our-story"
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      <div className="py-6 sm:py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8"
              style={{ color: sectionTitleColor }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-center mb-6 sm:mb-8 max-w-2xl mx-auto" style={{ color: isColored ? sectionTextColorAlt : theme?.colors?.muted }}>
              {subtitle}
            </p>
          )}
          
          {/* Mobile Timeline - Simple Vertical Stack */}
          <div className="md:hidden space-y-8 relative">
            {/* Continuous connecting line */}
            <div 
              className="absolute left-2.5 top-0 bottom-0 w-0.5"
              style={{ 
                background: isColored 
                  ? `linear-gradient(to bottom, ${lineColor}, ${sectionTextColor}, ${lineColor})`
                  : '#e5e7eb'
              }}
            />
            
            {allEvents.map((event, index) => {
              const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false })
              return (
                <div 
                  key={index} 
                  ref={ref}
                  className={`relative pl-8 flex items-center transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
                >
                  {/* Timeline dot */}
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 shadow-md flex items-center justify-center z-10"
                    style={{ 
                      backgroundColor: dotColor,
                      borderColor: isColored ? bgColor : '#fff'
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isColored ? bgColor : '#fff' }} />
                  </div>
                  
                  {/* Content card - light tinted background */}
                  <div 
                    className={`rounded-xl shadow-lg p-5 w-full ${isColored ? '' : 'bg-white border border-gray-100'}`}
                    style={{ 
                      backgroundColor: isColored ? cardBg : undefined,
                      boxShadow: isColored ? `0 8px 32px rgba(0,0,0,0.15)` : undefined
                    }}
                  >
                    <div 
                      className="text-xs font-bold uppercase tracking-wider mb-2"
                      style={{ color: dateColor }}
                    >
                      {event.date}
                    </div>
                    <h3 
                      className="text-lg font-bold mb-3 leading-tight"
                      style={{ color: cardTitleColor }}
                    >
                      {event.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-700"
                       style={{ color: cardTextColor }}>
                      {event.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Desktop Timeline - Original Centered Design */}
          <div className="hidden md:block relative">
            {/* Timeline line with gradient */}
            <div 
              className="absolute left-1/2 transform -translate-x-px h-full w-0.5"
              style={{ 
                background: isColored 
                  ? `linear-gradient(to bottom, transparent, ${lineColor}, white, ${lineColor}, transparent)`
                  : 'linear-gradient(to bottom, transparent, #d1d5db, transparent)'
              }}
            />
            
            <div className="space-y-6 sm:space-y-8">
              {allEvents.map((event, index) => {
                const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false })
                const isLeft = index % 2 === 0
                return (
                  <div 
                    key={index} 
                    ref={ref}
                    className={`flex items-center transition-all duration-500 ${
                      isLeft ? '' : 'flex-row-reverse'
                    } ${
                      isVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ 
                      transform: isVisible ? 'translateX(0)' : isLeft ? 'translateX(-20px)' : 'translateX(20px)',
                      transitionDelay: isVisible ? `${index * 150}ms` : '0ms'
                    }}
                  >
                    {/* Content - light tinted background */}
                    <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                      <div 
                        className={`rounded-lg shadow-lg p-6 ${isColored ? '' : 'bg-white border border-gray-200'}`}
                        style={{ 
                          backgroundColor: isColored ? cardBg : undefined,
                          boxShadow: isColored ? `0 8px 32px rgba(0,0,0,0.15)` : undefined
                        }}
                      >
                        <div className="text-sm font-semibold mb-2" style={{ color: dateColor }}>
                          {event.date}
                        </div>
                        <h3 className="text-xl mb-3" style={{ color: cardTitleColor }}>
                          {event.title}
                        </h3>
                        <p className="leading-relaxed text-gray-600"
                           style={{ color: cardTextColor }}>
                          {event.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Timeline dot */}
                    <div 
                      className="relative z-10 w-8 h-8 rounded-full border-4 shadow-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: dotColor,
                        borderColor: isColored ? bgColor : '#fff'
                      }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isColored ? bgColor : '#fff' }} />
                    </div>
                    
                    {/* Image */}
                    <div className="w-1/2">
                      {event.photo && (
                        <div 
                          className={`relative h-64 rounded-lg overflow-hidden ${index % 2 === 0 ? 'ml-8' : 'mr-8'}`}
                          style={isColored ? { boxShadow: `0 8px 32px rgba(0,0,0,0.2)` } : undefined}
                        >
                          <Image
                            src={event.photo}
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}  
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
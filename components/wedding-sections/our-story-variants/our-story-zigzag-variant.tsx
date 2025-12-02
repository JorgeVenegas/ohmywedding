'use client'

import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseOurStoryProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function OurStoryZigzagVariant({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  showPhotos = false,
  howWeMetText,
  howWeMetPhoto,
  proposalText,
  proposalPhoto,
  timeline = [],
  photos = [],
  useColorBackground = false,
  backgroundColorChoice
}: BaseOurStoryProps) {
  const { t } = useI18n()
  
  // Get enhanced color scheme with complementary palette colors
  const { bgColor, titleColor, subtitleColor: paletteSubtitle, sectionTextColor, sectionTextColorAlt, accentColor, contrastColor, colorLight, colorDark, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  
  const allEvents = [
    ...(showHowWeMet ? [{
      date: t('ourStory.chapterOne'),
      title: t('ourStory.howWeMet'),
      description: howWeMetText || t('ourStory.howWeMetDefault'),
      photo: howWeMetPhoto || photos[0]?.url
    }] : []),
    ...timeline,
    ...(showProposal ? [{
      date: t('ourStory.theBigMoment'),
      title: t('ourStory.theProposal'),
      description: proposalText || t('ourStory.proposalDefault'),
      photo: proposalPhoto || photos[photos.length - 1]?.url
    }] : [])
  ]

  // Color scheme - high contrast colors for titles, body text color for readability
  const sectionTitleColor = isColored ? sectionTextColor : theme?.colors?.foreground
  const subtitleColor = isColored ? sectionTextColorAlt : undefined
  const cardTitleColor = isColored ? titleColor : theme?.colors?.foreground  // Darkest palette color for high contrast
  const cardTextColor = bodyTextColor // Use body text color for readability
  
  // Event element colors - use high contrast colors for important elements
  const eventColors = {
    numberColor: isColored ? 'rgba(255,255,255,0.15)' : `${theme?.colors?.primary}15`,
    quoteColor: isColored ? titleColor : theme?.colors?.accent,  // High contrast for quotes
    tagBg: isColored ? paletteSubtitle : `${theme?.colors?.primary}15`,  // Low contrast for bg
    tagColor: isColored ? sectionTextColor : theme?.colors?.primary,
    decorativeBg: isColored ? paletteSubtitle : theme?.colors?.primary,  // Low contrast for decorative
    cornerAccent: isColored ? paletteSubtitle : theme?.colors?.accent  // Low contrast for corners
  }

  return (
    <SectionWrapper 
      theme={isColored ? undefined : theme} 
      alignment={alignment} 
      background="default" 
      id="our-story"
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      <div className="py-6 sm:py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4"
              style={{ color: sectionTitleColor }}>
            {t('ourStory.title')}
          </h2>
          <p className={`text-center mb-6 sm:mb-8 max-w-2xl mx-auto ${isColored ? '' : 'text-gray-600'}`}
             style={{ color: subtitleColor }}>
            {t('ourStory.subtitle')}
          </p>
          
          <div className="space-y-24">
            {allEvents.map((event, index) => {
              return (
                <div 
                  key={index} 
                  className={`relative flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8 ${
                    index % 2 === 0 ? '' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Decorative number */}
                  <div 
                    className={`absolute -top-8 md:-top-12 text-8xl md:text-9xl font-bold opacity-10 pointer-events-none ${
                      index % 2 === 0 ? 'left-0 md:left-[10%]' : 'right-0 md:right-[10%]'
                    }`}
                    style={{ color: eventColors.numberColor }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  {/* Image */}
                  {event.photo && (
                    <div 
                      className="w-full md:w-1/2 relative group"
                      data-aos="fade-up"
                    >
                      <div 
                        className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-2xl transform transition-transform duration-500 group-hover:scale-105"
                        style={isColored ? { boxShadow: `0 16px 48px rgba(0,0,0,0.3)` } : undefined}
                      >
                        <Image
                          src={event.photo}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      </div>
                      
                      {/* Decorative element */}
                      <div 
                        className={`hidden md:block absolute -bottom-6 w-32 h-32 rounded-full opacity-30 blur-2xl ${
                          index % 2 === 0 ? '-right-6' : '-left-6'
                        }`}
                        style={{ backgroundColor: eventColors.decorativeBg }}
                      ></div>
                    </div>
                  )}

                  {/* Content */}
                  <div 
                    className={`w-full ${event.photo ? 'md:w-1/2' : 'md:w-2/3 mx-auto text-center'}`}
                    data-aos="fade-up"
                    data-aos-delay="200"
                  >
                    <div className="relative">
                      {/* Decorative quote mark */}
                      <div 
                        className="text-6xl md:text-8xl font-serif opacity-20 absolute -top-4 md:-top-8 -left-2 md:-left-6 pointer-events-none"
                        style={{ color: eventColors.quoteColor }}
                      >
                        "
                      </div>
                      
                      <div 
                        className={`relative rounded-2xl p-8 md:p-10 shadow-xl ${isColored ? '' : 'bg-white border border-gray-100'}`}
                        style={{ 
                          backgroundColor: isColored ? cardBg : undefined,
                          boxShadow: isColored ? `0 8px 32px rgba(0,0,0,0.15)` : undefined
                        }}
                      >
                        <div 
                          className="inline-block text-xs md:text-sm font-bold uppercase tracking-widest mb-3 px-4 py-2 rounded-full"
                          style={{ 
                            backgroundColor: eventColors.tagBg,
                            color: eventColors.tagColor 
                          }}
                        >
                          {event.date}
                        </div>
                        
                        <h3 
                          className="text-2xl md:text-3xl font-bold mb-4 leading-tight"
                          style={{ color: cardTitleColor }}
                        >
                          {event.title}
                        </h3>
                        
                        <p className="text-base md:text-lg leading-relaxed text-gray-700">
                          {event.description}
                        </p>

                        {/* Decorative corner accent */}
                        <div 
                          className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-full opacity-20"
                          style={{ backgroundColor: eventColors.cornerAccent }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

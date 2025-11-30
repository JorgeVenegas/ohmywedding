'use client'

import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseOurStoryProps, getColorScheme } from './types'

export function OurStoryBookletVariant({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  showPhotos = false,
  howWeMetText = "From strangers to soulmates, our journey began in the most unexpected way.",
  howWeMetPhoto,
  proposalText = "Under the stars, a question was asked and forever was promised.",
  proposalPhoto,
  timeline = [],
  photos = [],
  useColorBackground = false,
  backgroundColorChoice
}: BaseOurStoryProps) {
  // Get enhanced color scheme with complementary palette colors
  const { bgColor, titleColor, subtitleColor: paletteSubtitle, sectionTextColor, sectionTextColorAlt, accentColor, contrastColor, colorLight, colorDark, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  
  const allEvents = [
    ...(showHowWeMet ? [{
      date: "Chapter One",
      title: "How We Met",
      description: howWeMetText,
      photo: howWeMetPhoto || photos[0]?.url
    }] : []),
    ...timeline,
    ...(showProposal ? [{
      date: "The Big Moment",
      title: "The Proposal",
      description: proposalText,
      photo: proposalPhoto || photos[photos.length - 1]?.url
    }] : [])
  ]

  // Rich color scheme - high contrast for titles, low contrast for decorative
  const sectionTitleColor = isColored ? sectionTextColor : theme?.colors?.foreground
  const subtitleColor = isColored ? sectionTextColorAlt : theme?.colors?.accent
  const introColor = isColored ? sectionTextColorAlt : undefined
  const headingColor = isColored ? titleColor : theme?.colors?.foreground  // Darkest for headings
  const textColor = bodyTextColor // Use body text color for readability
  
  // Page element colors - high contrast for important, low for decorative
  const pageColors = {
    bookmarkBg: isColored ? paletteSubtitle : theme?.colors?.primary,  // Lower contrast for bg
    bookmarkText: isColored ? sectionTextColor : 'white',
    dateColor: isColored ? titleColor : theme?.colors?.accent,  // High contrast for dates
    dropCapColor: isColored ? titleColor : theme?.colors?.primary,  // High contrast for drop cap
    ornamentColor: isColored ? paletteSubtitle : theme?.colors?.accent,  // Low contrast for ornaments
    dividerColor: isColored ? paletteSubtitle : theme?.colors?.accent  // Low contrast for dividers
  }

  return (
    <SectionWrapper 
      theme={isColored ? undefined : theme} 
      alignment={alignment} 
      background="default" 
      id="our-story" 
      className={isColored ? '' : 'bg-gradient-to-b from-gray-50 to-white'}
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      <div className="py-6 sm:py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Book Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div 
              className="inline-block text-sm uppercase tracking-[0.3em] mb-3"
              style={{ color: subtitleColor }}
            >
              ━━ Our Story ━━
            </div>
            <h2 
              className="text-4xl md:text-5xl font-serif mb-4"
              style={{ color: sectionTitleColor }}
            >
              The Pages of Our Love
            </h2>
            <p className={isColored ? '' : 'text-gray-600 italic'}
               style={{ color: introColor }}>
              A chapter-by-chapter journey of our love story
            </p>
          </div>
          
          {/* Stacked Pages */}
          <div className="relative space-y-6 sm:space-y-8">
            {allEvents.map((event, index) => {
              return (
                <div 
                  key={index}
                >
                  {/* Page Container - light tinted background */}
                  <div 
                    className={`relative rounded-lg shadow-2xl overflow-hidden ${isColored ? '' : 'bg-white border border-gray-200'}`}
                    style={{
                      backgroundColor: isColored ? cardBg : undefined,
                      transform: `rotate(${index % 2 === 0 ? -0.5 : 0.5}deg)`,
                      transition: 'transform 0.3s ease',
                      boxShadow: isColored ? `0 16px 48px rgba(0,0,0,0.2)` : undefined
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = `rotate(${index % 2 === 0 ? -0.5 : 0.5}deg)`
                    }}
                  >
                    {/* Page number bookmark */}
                    <div 
                      className="absolute top-0 right-4 md:right-8 w-10 h-14 md:w-16 md:h-20 flex items-start justify-center pt-2 md:pt-3 font-bold text-xs md:text-sm shadow-lg"
                      style={{ 
                        backgroundColor: pageColors.bookmarkBg,
                        color: pageColors.bookmarkText,
                        clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)'
                      }}
                    >
                      {index + 1}
                    </div>

                    <div className="flex flex-col md:flex-row">
                      {/* Image side */}
                      {event.photo && (
                        <div className="w-full md:w-2/5 relative h-64 md:h-auto min-h-[300px]">
                          <Image
                            src={event.photo}
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                          {/* Vintage film strip effect */}
                          <div className="absolute inset-0 pointer-events-none"
                               style={{
                                 backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 11px)',
                               }}>
                          </div>
                        </div>
                      )}

                      {/* Content side */}
                      <div className={`${event.photo ? 'w-full md:w-3/5' : 'w-full'} p-8 md:p-12 relative`}>
                        {/* Decorative corner ornament */}
                        <div 
                          className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 opacity-40"
                          style={{ borderColor: pageColors.ornamentColor }}
                        ></div>
                        <div 
                          className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 opacity-40"
                          style={{ borderColor: pageColors.ornamentColor }}
                        ></div>

                        {/* Content */}
                        <div className="relative">
                          <div 
                            className="text-xs uppercase tracking-[0.25em] mb-3 font-semibold"
                            style={{ color: pageColors.dateColor }}
                          >
                            {event.date}
                          </div>
                          
                          <h3 
                            className="text-2xl md:text-3xl font-serif mb-6 leading-tight"
                            style={{ color: headingColor }}
                          >
                            {event.title}
                          </h3>
                          
                          {/* First letter drop cap */}
                          <div className="relative">
                            <span 
                              className="float-left text-5xl md:text-6xl font-serif leading-none mr-2 mt-1"
                              style={{ color: pageColors.dropCapColor }}
                            >
                              {event.description.charAt(0)}
                            </span>
                            <p className="text-base md:text-lg leading-relaxed text-justify text-gray-700">
                              {event.description.substring(1)}
                            </p>
                          </div>

                          {/* Decorative line */}
                          <div className="mt-8 flex items-center gap-3">
                            <div 
                              className="h-px flex-1 opacity-60"
                              style={{ backgroundColor: pageColors.dividerColor }}
                            ></div>
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: pageColors.dividerColor }}
                            ></div>
                            <div 
                              className="h-px flex-1 opacity-60"
                              style={{ backgroundColor: pageColors.dividerColor }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shadow layers for depth */}
                  <div 
                    className={`absolute inset-0 rounded-lg -z-10 shadow-md ${isColored ? 'bg-white/10' : 'bg-white'}`}
                    style={{
                      top: '8px',
                      left: '8px',
                      right: '-8px',
                      transform: 'rotate(1deg)'
                    }}
                  ></div>
                </div>
              )
            })}
          </div>

          {/* The End */}
          <div className="text-center mt-8 sm:mt-12 mb-4 sm:mb-6">
            <div 
              className="inline-block text-2xl md:text-3xl font-serif italic"
              style={{ color: isColored ? sectionTextColor : theme?.colors?.primary }}
            >
              To be continued...
            </div>
            <div className="mt-4 flex justify-center items-center gap-2">
              {isColored ? (
                <>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                  <div className="w-12 h-px" style={{ backgroundColor: sectionTextColor, opacity: 0.5 }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                </>
              ) : (
                <svg width="60" height="20" viewBox="0 0 60 20" fill="none" className="mx-auto opacity-40">
                  <path 
                    d="M2 10 Q15 2, 30 10 T58 10" 
                    stroke={theme?.colors?.primary || '#000'} 
                    strokeWidth="2" 
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
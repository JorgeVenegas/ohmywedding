"use client"

import React from 'react'
import Image from 'next/image'
import { Heart, BookOpen, Sparkles } from 'lucide-react'
import { BaseOurStoryProps, getColorScheme } from './types'

export function OurStorySplitVariant({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  showPhotos = true,
  showHowWeMetPhoto = false,
  showProposalPhoto = false,
  howWeMetText = "From strangers to soulmates, our journey began in the most unexpected way.",
  howWeMetPhoto,
  proposalText = "Under the stars, a question was asked and forever was promised.",
  proposalPhoto,
  timeline = [],
  photos = [],
  useColorBackground = false,
  backgroundColorChoice,
  howWeMetTextAlignment = 'center',
  proposalTextAlignment = 'center'
}: BaseOurStoryProps) {
  const { bgColor, titleColor, subtitleColor: paletteSubtitle, sectionTextColor, sectionTextColorAlt, accentColor, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)

  // Helper to get alignment classes - center on mobile, configured alignment on desktop
  const getAlignmentClasses = (textAlignment: 'left' | 'center' | 'right') => {
    switch (textAlignment) {
      case 'left':
        return {
          text: 'text-center sm:text-left',
          flex: 'justify-center sm:justify-start',
          items: 'items-center sm:items-start'
        }
      case 'right':
        return {
          text: 'text-center sm:text-right',
          flex: 'justify-center sm:justify-end',
          items: 'items-center sm:items-end'
        }
      case 'center':
      default:
        return {
          text: 'text-center',
          flex: 'justify-center',
          items: 'items-center'
        }
    }
  }

  // Helper to get text alignment for a section
  const getSectionAlignment = (sectionId: string): 'left' | 'center' | 'right' => {
    if (sectionId === 'how-we-met') return howWeMetTextAlignment
    if (sectionId === 'proposal') return proposalTextAlignment
    return 'center' // default for timeline events
  }

  // Helper to extract URL from Photo object or string
  const getPhotoUrl = (photo: any): string | undefined => {
    if (!photo) return undefined
    if (typeof photo === 'string') return photo
    if (photo.url) return photo.url
    return undefined
  }

  // Build story sections - for split variant, always try to show photos if available
  // Priority: specific photo (howWeMetPhoto/proposalPhoto) > photos array
  const getHowWeMetPhoto = (): string | undefined => {
    // First try the specific howWeMetPhoto if it exists
    if (howWeMetPhoto) return howWeMetPhoto
    // Then try the first photo from the photos array
    if (photos && photos.length > 0) return getPhotoUrl(photos[0])
    return undefined
  }

  const getProposalPhoto = (): string | undefined => {
    // First try the specific proposalPhoto if it exists
    if (proposalPhoto) return proposalPhoto
    // Then try the last photo from the photos array (or second if only 2)
    if (photos && photos.length > 0) {
      // If we have multiple photos, use a different one than howWeMet
      const index = photos.length > 1 ? photos.length - 1 : 0
      return getPhotoUrl(photos[index])
    }
    return undefined
  }

  const storySections = [
    ...(showHowWeMet ? [{
      id: 'how-we-met',
      label: 'Chapter One',
      title: 'How We Met',
      text: howWeMetText,
      photo: getHowWeMetPhoto(),
      icon: BookOpen
    }] : []),
    ...timeline.map((event, index) => ({
      id: `timeline-${index}`,
      label: event.date,
      title: event.title,
      text: event.description,
      photo: event.photo,
      icon: Sparkles
    })),
    ...(showProposal ? [{
      id: 'proposal',
      label: 'The Big Moment',
      title: 'The Proposal',
      text: proposalText,
      photo: getProposalPhoto(),
      icon: Heart
    }] : [])
  ]

  // Color scheme - using contrast-aware colors from getColorScheme
  // sectionTextColor/sectionTextColorAlt: adapt based on background brightness (light text on dark, dark on light)
  // titleColor/subtitleColor: always darkest colors (best for light card backgrounds)
  const sectionTitleColor = isColored ? sectionTextColor : theme?.colors?.foreground
  const sectionSubtitleColor = isColored ? sectionTextColorAlt : theme?.colors?.muted
  
  // Content text colors - use contrast-aware colors for direct-on-background text
  const contentTitleColor = isColored ? sectionTextColor : theme?.colors?.primary
  const contentTextColor = isColored ? sectionTextColor : theme?.colors?.foreground
  const contentMutedColor = isColored ? sectionTextColorAlt : theme?.colors?.muted
  const contentIconColor = isColored ? sectionTextColor : theme?.colors?.primary
  const accentLineColor = isColored ? sectionTextColorAlt : theme?.colors?.accent
  const sectionBg = isColored ? bgColor : (theme?.colors?.background || '#ffffff')

  // Check if any photos are available - for split variant, we always want to show photos if they exist
  // This ignores the showPhotos toggle since the split view is specifically designed to showcase photos
  const hasVisiblePhotos = storySections.some(s => s.photo)

  return (
    <section 
      id="our-story"
      className="w-full"
      style={{ backgroundColor: sectionBg }}
    >
      {/* Elegant Header */}
      <div className="text-center py-8 sm:py-10 px-4">
        <div className="flex items-center justify-center gap-4 mb-3 sm:mb-4">
          <div className="w-16 h-px" style={{ backgroundColor: accentLineColor, opacity: 0.5 }} />
          <Heart className="w-4 h-4" style={{ color: accentLineColor }} />
          <div className="w-16 h-px" style={{ backgroundColor: accentLineColor, opacity: 0.5 }} />
        </div>
        <p 
          className="text-xs uppercase tracking-[0.3em] mb-2 sm:mb-3 font-light"
          style={{ color: isColored ? sectionTextColorAlt : theme?.colors?.accent }}
        >
          Our Journey
        </p>
        <h2 
          className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3"
          style={{ 
            fontFamily: 'cursive',
            color: sectionTitleColor,
            fontWeight: 400
          }}
        >
          Our Love Story
        </h2>
        <p 
          className="text-base max-w-md mx-auto font-light"
          style={{ 
            color: sectionSubtitleColor,
            fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
          }}
        >
          Every great love story has a beginning, and this is ours
        </p>
      </div>

      {/* Story Sections */}
      {!hasVisiblePhotos ? (
        // Side-by-side text layout when no photos
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-8 sm:pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {storySections.map((section, index) => {
              const IconComponent = section.icon
              const sectionAlignment = getSectionAlignment(section.id)
              const alignClasses = getAlignmentClasses(sectionAlignment)
              
              return (
                <div 
                  key={section.id}
                  className={alignClasses.text}
                >
                  {/* Icon */}
                  <div className={`flex ${alignClasses.flex} gap-3 mb-3 sm:mb-4`}>
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center border"
                      style={{ 
                        borderColor: isColored ? `${contentIconColor}25` : `${theme?.colors?.primary}20`,
                        backgroundColor: isColored ? `${contentIconColor}08` : `${theme?.colors?.primary}05`
                      }}
                    >
                      <IconComponent 
                        className="w-5 h-5" 
                        style={{ color: contentIconColor }}
                      />
                    </div>
                  </div>

                  {/* Label */}
                  <p 
                    className="text-xs uppercase tracking-widest mb-2 font-light"
                    style={{ color: contentMutedColor }}
                  >
                    {section.label}
                  </p>

                  {/* Title */}
                  <h3 
                    className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4"
                    style={{ 
                      color: contentTitleColor,
                      fontFamily: 'cursive',
                      fontWeight: 400
                    }}
                  >
                    {section.title}
                  </h3>

                  {/* Text */}
                  <p 
                    className="text-sm sm:text-base leading-relaxed font-light"
                    style={{ 
                      color: contentTextColor,
                      fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                    }}
                  >
                    {section.text}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        // Full-width split layout with photos
        <>
          {storySections.map((section, index) => {
            const isImageRight = index % 2 === 1
            const IconComponent = section.icon

            // Skip sections without photos if showPhotos is required
            if (!section.photo) {
              return (
                <div 
                  key={section.id}
                  className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-10"
                >
                  <div className="text-center">
                    {/* Icon */}
                    <div className="flex justify-center gap-3 mb-3 sm:mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center border"
                        style={{ 
                          borderColor: isColored ? `${contentIconColor}25` : `${theme?.colors?.primary}20`,
                          backgroundColor: isColored ? `${contentIconColor}08` : `${theme?.colors?.primary}05`
                        }}
                      >
                        <IconComponent 
                          className="w-5 h-5" 
                          style={{ color: contentIconColor }}
                        />
                      </div>
                    </div>

                    {/* Label */}
                    <p 
                      className="text-xs uppercase tracking-widest mb-2 font-light"
                      style={{ color: contentMutedColor }}
                    >
                      {section.label}
                    </p>

                    {/* Title */}
                    <h3 
                      className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4"
                      style={{ 
                        color: contentTitleColor,
                        fontFamily: 'cursive',
                        fontWeight: 400
                      }}
                    >
                      {section.title}
                    </h3>

                    {/* Text */}
                    <p 
                      className="text-sm sm:text-base leading-relaxed font-light max-w-2xl mx-auto"
                      style={{ 
                        color: contentTextColor,
                        fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                      }}
                    >
                      {section.text}
                    </p>
                  </div>
                </div>
              )
            }

            return (
              <div 
                key={section.id}
                className="w-full"
                style={{ 
                  backgroundColor: isColored ? bgColor : (index % 2 === 0 ? '#ffffff' : (theme?.colors?.muted ? `${theme.colors.muted}08` : '#fafafa'))
                }}
              >
                {(() => {
                  const sectionAlignment = getSectionAlignment(section.id)
                  const alignClasses = getAlignmentClasses(sectionAlignment)
                  
                  return (
                    <div className={`flex flex-col lg:flex-row ${isImageRight ? 'lg:flex-row-reverse' : ''}`}>
                      {/* Image Side */}
                      <div className="w-full lg:w-1/2 min-h-[350px] lg:min-h-[550px] relative overflow-hidden">
                        <Image 
                          src={section.photo} 
                          alt={section.title}
                          fill
                          className="object-cover transition-transform duration-700 hover:scale-105"
                        />
                        {/* Subtle gradient overlay for elegance */}
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: isImageRight 
                              ? 'linear-gradient(to left, rgba(0,0,0,0.02), transparent 30%)'
                              : 'linear-gradient(to right, rgba(0,0,0,0.02), transparent 30%)'
                          }}
                        />
                      </div>

                      {/* Content Side */}
                      <div className="w-full lg:w-1/2 flex items-center">
                        <div className={`w-full max-w-lg mx-auto px-4 sm:px-8 py-8 sm:py-10 lg:px-12 lg:py-12 ${alignClasses.text}`}>
                          {/* Icon */}
                          <div className={`flex ${alignClasses.flex} gap-3 mb-3 sm:mb-4`}>
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center border"
                              style={{ 
                                borderColor: isColored ? `${contentIconColor}25` : `${theme?.colors?.primary}20`,
                                backgroundColor: 'transparent'
                              }}
                            >
                              <IconComponent 
                                className="w-5 h-5" 
                                style={{ color: contentIconColor }}
                              />
                            </div>
                          </div>

                          {/* Label */}
                          <p 
                            className="text-xs uppercase tracking-widest mb-2 font-light"
                            style={{ color: contentMutedColor }}
                          >
                            {section.label}
                          </p>

                          {/* Title */}
                          <h3 
                            className="text-2xl sm:text-3xl md:text-4xl mb-4 sm:mb-5"
                            style={{ 
                              color: contentTitleColor,
                              fontFamily: 'cursive',
                              fontWeight: 400
                            }}
                          >
                            {section.title}
                          </h3>

                          {/* Decorative Line */}
                          <div 
                            className={`w-16 h-px mb-4 sm:mb-5 mx-auto ${sectionAlignment === 'left' ? 'sm:mx-0 sm:ml-0' : sectionAlignment === 'right' ? 'sm:mx-0 sm:mr-0 sm:ml-auto' : ''}`}
                            style={{ backgroundColor: accentLineColor, opacity: 0.5 }}
                          />

                          {/* Text */}
                          <p 
                            className="text-sm sm:text-base leading-relaxed font-light"
                            style={{ 
                              color: contentTextColor,
                              fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                            }}
                          >
                            {section.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </>
      )}
    </section>
  )
}

import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseOurStoryProps, getColorScheme } from './types'

export function OurStoryCardsVariant({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  howWeMetText = "Our love story began in the most unexpected way. From the moment we met, we knew there was something special between us. What started as a chance encounter blossomed into a beautiful friendship, and eventually, a love that we knew would last forever.",
  howWeMetPhoto,
  proposalText = "The proposal was a magical moment we'll cherish forever. Surrounded by the beauty of nature and the warmth of our love, the question was asked and answered with tears of joy. It was the perfect beginning to our next chapter together.",
  proposalPhoto,
  photos = [],
  useColorBackground = false,
  backgroundColorChoice
}: BaseOurStoryProps) {
  // Get enhanced color scheme with complementary palette colors
  const { bgColor, titleColor, subtitleColor, sectionTextColor, sectionTextColorAlt, accentColor, contrastColor, colorLight, colorDark, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  
  const stories = []
  
  if (showHowWeMet) {
    stories.push({
      title: "How We Met",
      text: howWeMetText,
      image: howWeMetPhoto || photos.find(p => p.caption?.includes('meeting') || p.caption?.includes('first'))?.url
    })
  }
  
  if (showProposal) {
    stories.push({
      title: "The Proposal",
      text: proposalText,
      image: proposalPhoto || photos.find(p => p.caption?.includes('proposal') || p.caption?.includes('engaged'))?.url
    })
  }

  // Color scheme - high contrast colors for titles, body text color for readability
  const sectionTitleColor = isColored ? sectionTextColor : theme?.colors?.foreground
  const cardTitleColor = isColored ? titleColor : theme?.colors?.primary  // Darkest palette color for high contrast
  const cardTextColor = bodyTextColor // Use body text color for readability
  const accentLineColor = isColored ? sectionTextColorAlt : theme?.colors?.accent

  return (
    <SectionWrapper 
      theme={isColored ? undefined : theme} 
      alignment={alignment} 
      background="muted" 
      id="our-story"
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16"
              style={{ color: sectionTitleColor }}>
            Our Love Story
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {stories.map((story, index) => (
              <div key={index} 
                   className={`rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] ${isColored ? '' : 'bg-white'}`}
                   style={{ 
                     backgroundColor: isColored ? cardBg : undefined,
                     boxShadow: isColored ? `0 8px 32px rgba(0,0,0,0.15)` : undefined
                   }}
              >
                {story.image && (
                  <div className="relative h-64">
                    <Image
                      src={story.image}
                      alt={story.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4" 
                      style={{ color: cardTitleColor }}>
                    {story.title}
                  </h3>
                  <p className="leading-relaxed text-lg"
                     style={{ color: cardTextColor }}>
                    {story.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Photo gallery if provided */}
          {photos.length > 2 && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-center mb-8"
                  style={{ color: sectionTitleColor }}>
                Our Journey
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.slice(0, 8).map((photo, idx) => (
                  <div 
                    key={photo.id} 
                    className="relative aspect-square rounded-lg overflow-hidden"
                    style={isColored ? { 
                      boxShadow: `0 4px 16px rgba(0,0,0,0.15)` 
                    } : undefined}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.alt || photo.caption || "Our story"}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionWrapper>
  )
}
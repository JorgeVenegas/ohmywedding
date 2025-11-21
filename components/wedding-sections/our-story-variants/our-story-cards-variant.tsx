import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseOurStoryProps } from './types'

export function OurStoryCardsVariant({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  howWeMetText = "Our love story began in the most unexpected way. From the moment we met, we knew there was something special between us. What started as a chance encounter blossomed into a beautiful friendship, and eventually, a love that we knew would last forever.",
  howWeMetPhoto,
  proposalText = "The proposal was a magical moment we'll cherish forever. Surrounded by the beauty of nature and the warmth of our love, the question was asked and answered with tears of joy. It was the perfect beginning to our next chapter together.",
  proposalPhoto,
  photos = []
}: BaseOurStoryProps) {
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

  return (
    <SectionWrapper theme={theme} alignment={alignment} background="muted" id="our-story">
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16"
              style={{ color: theme?.colors?.foreground }}>
            Our Love Story
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {stories.map((story, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                   style={{ borderTop: `4px solid ${theme?.colors?.primary || '#000'}` }}>
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
                      style={{ color: theme?.colors?.primary || '#000' }}>
                    {story.title}
                  </h3>
                  <p className="leading-relaxed text-lg"
                     style={{ color: theme?.colors?.foreground || '#4B5563' }}>
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
                  style={{ color: theme?.colors?.foreground }}>
                Our Journey
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.slice(0, 8).map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
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
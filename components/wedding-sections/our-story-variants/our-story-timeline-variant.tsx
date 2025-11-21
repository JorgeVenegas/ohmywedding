import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseOurStoryProps } from './types'

export function OurStoryTimelineVariant({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  howWeMetText = "Our love story began in the most unexpected way. From the moment we met, we knew there was something special between us. What started as a chance encounter blossomed into a beautiful friendship, and eventually, a love that we knew would last forever.",
  howWeMetPhoto,
  proposalText = "The proposal was a magical moment we'll cherish forever. Surrounded by the beauty of nature and the warmth of our love, the question was asked and answered with tears of joy. It was the perfect beginning to our next chapter together.",
  proposalPhoto,
  timeline = []
}: BaseOurStoryProps) {
  const allEvents = [
    ...(showHowWeMet ? [{
      date: "First Meeting",
      title: "How We Met",
      description: howWeMetText,
      photo: howWeMetPhoto
    }] : []),
    ...timeline,
    ...(showProposal ? [{
      date: "The Proposal",
      title: "The Big Question",
      description: proposalText,
      photo: proposalPhoto
    }] : [])
  ]

  return (
    <SectionWrapper theme={theme} alignment={alignment} background="default" id="our-story">
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16"
              style={{ color: theme?.colors?.foreground }}>
            Our Love Story
          </h2>
          
          {/* Mobile Timeline - Simple Vertical Stack */}
          <div className="md:hidden space-y-8 relative">
            {/* Continuous connecting line */}
            <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {allEvents.map((event, index) => (
              <div key={index} className="relative pl-8 flex items-center">
                {/* Timeline dot - centered vertically */}
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center z-10"
                  style={{ backgroundColor: theme?.colors?.primary }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                
                {/* Content card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 w-full">
                  <div 
                    className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80"
                    style={{ color: theme?.colors?.accent }}
                  >
                    {event.date}
                  </div>
                  <h3 
                    className="text-lg font-bold mb-3 leading-tight"
                    style={{ color: theme?.colors?.foreground }}
                  >
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop Timeline - Original Centered Design */}
          <div className="hidden md:block relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
            
            <div className="space-y-16">
              {allEvents.map((event, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                  {/* Content */}
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                      <div className="text-sm font-semibold mb-2" style={{ color: theme?.colors?.accent }}>
                        {event.date}
                      </div>
                      <h3 className="text-xl font-bold mb-3" style={{ color: theme?.colors?.foreground }}>
                        {event.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="relative z-10 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                       style={{ backgroundColor: theme?.colors?.primary }}>
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                  
                  {/* Image placeholder */}
                  <div className="w-1/2">
                    {event.photo && (
                      <div className={`relative h-64 rounded-lg overflow-hidden ${index % 2 === 0 ? 'ml-8' : 'mr-8'}`}>
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
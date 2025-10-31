import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseOurStoryProps } from './types'

export function OurStoryTimelineVariant({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  howWeMetText = "We met at...",
  proposalText = "The proposal was...",
  timeline = []
}: BaseOurStoryProps) {
  const allEvents = [
    ...(showHowWeMet ? [{
      date: "First Meeting",
      title: "How We Met",
      description: howWeMetText,
      photo: undefined
    }] : []),
    ...timeline,
    ...(showProposal ? [{
      date: "The Proposal",
      title: "The Big Question",
      description: proposalText,
      photo: undefined
    }] : [])
  ]

  return (
    <SectionWrapper theme={theme} alignment={alignment} background="default" id="our-story">
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16" 
              style={{ color: theme?.colors?.foreground }}>
            Our Love Story
          </h2>
          
          <div className="relative">
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
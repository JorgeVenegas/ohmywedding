'use client'

import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseOurStoryProps } from './types'

export function OurStoryZigzagVariant({
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
  photos = []
}: BaseOurStoryProps) {
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

  return (
    <SectionWrapper theme={theme} alignment={alignment} background="default" id="our-story">
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4"
              style={{ color: theme?.colors?.foreground }}>
            Our Love Story
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            Every great love story has a beginning, middle, and a happily ever after
          </p>
          
          <div className="space-y-24">
            {allEvents.map((event, index) => (
              <div 
                key={index} 
                className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-12 ${
                  index % 2 === 0 ? '' : 'md:flex-row-reverse'
                }`}
              >
                {/* Decorative number */}
                <div 
                  className={`absolute -top-8 md:-top-12 text-8xl md:text-9xl font-bold opacity-5 pointer-events-none ${
                    index % 2 === 0 ? 'left-0 md:left-[10%]' : 'right-0 md:right-[10%]'
                  }`}
                  style={{ 
                    color: theme?.colors?.primary
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* Image */}
                {event.photo && (
                  <div 
                    className="w-full md:w-1/2 relative group"
                    data-aos="fade-up"
                  >
                    <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-2xl transform transition-transform duration-500 group-hover:scale-105">
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
                      className={`hidden md:block absolute -bottom-6 w-32 h-32 rounded-full opacity-20 blur-2xl ${
                        index % 2 === 0 ? '-right-6' : '-left-6'
                      }`}
                      style={{ backgroundColor: theme?.colors?.primary }}
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
                      className="text-6xl md:text-8xl font-serif opacity-10 absolute -top-4 md:-top-8 -left-2 md:-left-6 pointer-events-none"
                      style={{ color: theme?.colors?.accent }}
                    >
                      "
                    </div>
                    
                    <div className="relative bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-gray-100">
                      <div 
                        className="inline-block text-xs md:text-sm font-bold uppercase tracking-widest mb-3 px-4 py-2 rounded-full"
                        style={{ 
                          backgroundColor: `${theme?.colors?.primary}15`,
                          color: theme?.colors?.primary 
                        }}
                      >
                        {event.date}
                      </div>
                      
                      <h3 
                        className="text-2xl md:text-3xl font-bold mb-4 leading-tight"
                        style={{ color: theme?.colors?.foreground }}
                      >
                        {event.title}
                      </h3>
                      
                      <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                        {event.description}
                      </p>

                      {/* Decorative corner accent */}
                      <div 
                        className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-full opacity-5"
                        style={{ backgroundColor: theme?.colors?.accent }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'

export function HeroBackgroundVariant({
  wedding,
  dateId,
  weddingNameId,
  theme,
  alignment,
  showTagline = true,
  tagline = "Join us as we tie the knot!",
  showCountdown = true,
  showRSVPButton = true,
  heroImageUrl
}: BaseHeroProps) {
  return (
    <SectionWrapper 
      theme={theme} 
      alignment={alignment} 
      background="primary"
      className="min-h-screen relative"
      id="hero"
    >
      {/* Fullscreen Background */}
      <div className="absolute inset-0 z-0">
        {heroImageUrl && (
          <Image
            src={heroImageUrl}
            alt="Wedding hero"
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Centered Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex items-center justify-center min-h-screen">
        <HeroTextContent
          wedding={wedding}
          dateId={dateId}
          weddingNameId={weddingNameId}
          theme={theme}
          alignment={alignment}
          showTagline={showTagline}
          tagline={tagline}
          showCountdown={showCountdown}
          showRSVPButton={showRSVPButton}
          isOverlay={true}
        />
      </div>
    </SectionWrapper>
  )
}
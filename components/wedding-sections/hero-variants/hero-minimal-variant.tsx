import React from 'react'
import { SectionWrapper } from '../section-wrapper'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'

interface HeroMinimalVariantProps extends BaseHeroProps {
  backgroundColor?: string
  showDecorations?: boolean
}

export function HeroMinimalVariant({
  wedding,
  dateId,
  weddingNameId,
  theme,
  alignment,
  showTagline = true,
  tagline = "Join us as we tie the knot!",
  showCountdown = true,
  showRSVPButton = true,
  backgroundColor,
  showDecorations = true
}: HeroMinimalVariantProps) {
  return (
    <SectionWrapper 
      theme={{
        ...theme,
        spacing: {
          section: 'p-0',
          container: 'w-full max-w-none h-full'
        }
      }} 
      alignment={alignment} 
      background="primary"
      className="h-[100dvh] max-h-[100dvh] relative overflow-hidden"
      id="hero"
    >
      {/* Optional decorative elements */}
      {showDecorations && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle geometric shapes */}
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-5" 
               style={{ backgroundColor: theme?.colors?.accent || '#a86b8f' }} />
          <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full opacity-5" 
               style={{ backgroundColor: theme?.colors?.secondary || '#8b9d6f' }} />
          <div className="absolute top-1/2 left-1/4 w-16 h-16 transform -translate-y-1/2 rotate-45 opacity-5" 
               style={{ backgroundColor: theme?.colors?.accent || '#a86b8f' }} />
        </div>
      )}
      
      {/* Centered Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex items-center justify-center h-full">
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
          isOverlay={false}
        />
      </div>
    </SectionWrapper>
  )
}
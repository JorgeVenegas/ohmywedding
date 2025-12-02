import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'

interface HeroStackedVariantProps extends BaseHeroProps {
  showDecorations?: boolean
  imageHeight?: 'small' | 'medium' | 'large'
  imageWidth?: 'full' | 'centered'
}

export function HeroStackedVariant({
  wedding,
  dateId,
  weddingNameId,
  theme,
  alignment,
  showTagline = true,
  tagline,
  showCountdown = true,
  showRSVPButton = true,
  heroImageUrl,
  showDecorations = true,
  imageHeight = 'medium',
  imageWidth = 'centered'
}: HeroStackedVariantProps) {
  const heightClasses = {
    small: 'h-48 md:h-64',
    medium: 'h-64 md:h-80',
    large: 'h-80 md:h-96'
  }

  const widthClasses = {
    full: 'w-full',
    centered: 'w-full max-w-6xl mx-auto'
  }

  const roundingClasses = {
    full: '',
    centered: 'rounded-2xl'
  }

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
      className="relative overflow-hidden h-[100dvh] max-h-[100dvh]"
      id="hero"
    >
      {/* Optional decorative elements */}
      {showDecorations && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle geometric shapes */}
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-10" 
               style={{ backgroundColor: theme?.colors?.accent || '#a86b8f' }} />
          <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full opacity-10" 
               style={{ backgroundColor: theme?.colors?.secondary || '#8b9d6f' }} />
          <div className="absolute top-1/2 right-1/4 w-16 h-16 transform -translate-y-1/2 rotate-45 opacity-10" 
               style={{ backgroundColor: theme?.colors?.accent || '#a86b8f' }} />
        </div>
      )}
      
      <div className="relative w-full h-full flex flex-col">
        {/* Content Section - Centered in remaining space */}
        <div className="flex-1 flex items-center justify-center px-4 pt-16 md:pt-20">
          <div className="max-w-6xl mx-auto">
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
        </div>

        {/* Image Section - Stuck to bottom */}
        {heroImageUrl && (
          <div className={`${widthClasses[imageWidth]} ${imageWidth === 'centered' ? 'px-4 pb-24' : 'pb-0'}`}>
            <div className={`relative w-full ${heightClasses[imageHeight]} ${roundingClasses[imageWidth]} overflow-hidden shadow-2xl`}>
              <Image
                src={heroImageUrl}
                alt="Wedding hero"
                fill
                className="object-cover"
                priority
              />
              {/* Optional subtle overlay for consistency */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          </div>
        )}
      </div>
    </SectionWrapper>
  )
}

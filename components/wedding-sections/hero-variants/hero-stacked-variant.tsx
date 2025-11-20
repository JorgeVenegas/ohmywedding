import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'

interface HeroStackedVariantProps extends BaseHeroProps {
  showDecorations?: boolean
  imageHeight?: 'small' | 'medium' | 'large' | 'full'
  imageWidth?: 'full' | 'centered'
}

export function HeroStackedVariant({
  wedding,
  dateId,
  weddingNameId,
  theme,
  alignment,
  showTagline = true,
  tagline = "Join us as we tie the knot!",
  showCountdown = true,
  showRSVPButton = true,
  heroImageUrl,
  showDecorations = true,
  imageHeight = 'medium',
  imageWidth = 'centered'
}: HeroStackedVariantProps) {
  const heightClasses = {
    small: 'h-64 md:h-80',
    medium: 'h-80 md:h-96',
    large: 'h-96 md:h-[32rem]',
    full: 'h-screen'
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
          section: 'py-0',
          container: 'w-full max-w-none'
        }
      }}
      alignment={alignment} 
      background="primary"
      className={`relative ${imageWidth === 'full' && imageHeight !== 'full' ? '' : 'min-h-screen'}`}
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
      
      <div className={'relative w-full pt-20 md:pt-32'}>
        {/* Content Section - Above */}
        <div className="flex items-center justify-center mb-12 md:mb-16 max-w-6xl mx-auto px-4">
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

        {/* Image Section - Below */}
        {heroImageUrl && (
          <div className={`${widthClasses[imageWidth]} ${imageWidth === 'centered' ? 'px-4 pb-16 md:pb-24' : ''}`}>
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

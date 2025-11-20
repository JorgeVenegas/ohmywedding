import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'

interface HeroFramedVariantProps extends BaseHeroProps {
  frameStyle?: 'circular' | 'rounded' | 'square' | 'polaroid'
  imageSize?: 'small' | 'medium' | 'large'
}

export function HeroFramedVariant({
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
  frameStyle = 'circular',
  imageSize = 'medium'
}: HeroFramedVariantProps) {
  const getSizeClasses = () => {
    switch (imageSize) {
      case 'small': return 'w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48'
      case 'large': return 'w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64'
      default: return 'w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56'
    }
  }

  const getFrameClasses = () => {
    const baseClasses = getSizeClasses()
    switch (frameStyle) {
      case 'circular':
        return `${baseClasses} rounded-full`
      case 'rounded':
        return `${baseClasses} rounded-3xl`
      case 'square':
        return `${baseClasses} rounded-none`
      case 'polaroid':
        return `${baseClasses} rounded-lg p-4 bg-white shadow-2xl`
      default:
        return `${baseClasses} rounded-full`
    }
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
      className="h-[100dvh] max-h-[100dvh] relative overflow-hidden"
      id="hero"
    >
      <div className="w-full h-[100dvh] max-w-6xl mx-auto px-4 flex flex-col items-center justify-center gap-6">
        {/* Framed Image */}
        <div className={`relative flex-shrink-0 ${getFrameClasses()} overflow-hidden`}>
          {heroImageUrl && (
            <Image
              src={heroImageUrl}
              alt="Wedding couple"
              fill
              className={`object-cover ${frameStyle === 'polaroid' ? 'rounded-md' : ''}`}
              priority
            />
          )}
          {/* Optional frame border */}
          <div className={`absolute inset-0 ${
            frameStyle === 'circular' ? 'rounded-full' : 
            frameStyle === 'rounded' ? 'rounded-3xl' : 
            frameStyle === 'polaroid' ? 'rounded-md' : ''
          } ring-4 ring-white/20 ring-offset-4 ring-offset-transparent`} />
        </div>
        
        {/* Text Content */}
        <div className="w-full max-w-4xl flex-shrink px-4">
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
    </SectionWrapper>
  )
}
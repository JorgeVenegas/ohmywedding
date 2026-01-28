import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'
import { resolveColor } from '@/lib/color-utils'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

interface HeroBackgroundVariantProps extends BaseHeroProps {
  overlayOpacity?: number
  backgroundGradient?: boolean
  gradientColor1?: string
  gradientColor2?: string
  imageBrightness?: number
}

export function HeroBackgroundVariant({
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
  overlayOpacity = 40,
  backgroundGradient = false,
  gradientColor1,
  gradientColor2,
  imageBrightness = 100
}: HeroBackgroundVariantProps) {
  // Resolve palette references to actual colors
  const resolvedGradientColor1 = resolveColor(gradientColor1, theme)
  const resolvedGradientColor2 = resolveColor(gradientColor2, theme)
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false })
  
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
      {/* Fullscreen Background */}
      <div className="absolute inset-0 h-[100dvh] w-full z-0">
        {heroImageUrl && (
          <Image
            src={heroImageUrl}
            alt="Wedding hero"
            fill
            className="object-cover"
            style={{ filter: `brightness(${imageBrightness}%)` }}
            priority
          />
        )}
        {backgroundGradient && resolvedGradientColor1 && resolvedGradientColor2 ? (
          <div 
            className="absolute inset-0 transition-opacity duration-300" 
            style={{ 
              background: `linear-gradient(135deg, ${resolvedGradientColor1} 0%, ${resolvedGradientColor2} 100%)`,
              opacity: overlayOpacity / 100 
            }}
          />
        ) : (
          <div 
            className="absolute inset-0 bg-black transition-opacity duration-300" 
            style={{ opacity: overlayOpacity / 100 }}
          />
        )}
      </div>
      
      {/* Centered Content */}
      <div 
        ref={ref}
        className={`relative z-10 w-full max-w-4xl mx-auto px-4 flex items-center justify-center h-full transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
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
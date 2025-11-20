import React from 'react'
import Image from 'next/image'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'

interface HeroSideBySideVariantProps extends BaseHeroProps {
  imagePosition?: 'left' | 'right'
}

export function HeroSideBySideVariant({
  wedding,
  dateId,
  weddingNameId,
  theme,
  alignment,
  showTagline = true,
  tagline = "Join us as we tie the knot!",
  showCountdown = true,
  showRSVPButton = true,
  heroImageUrl = 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=2387&q=80',
  imagePosition = 'left'
}: HeroSideBySideVariantProps) {
  const isImageLeft = imagePosition === 'left'

  return (
    <section 
      className="h-[100dvh] max-h-[100dvh] overflow-hidden"
      style={{ 
        backgroundColor: theme?.colors?.background || '#ffffff'
      }}
    >
      <div className="h-full flex flex-col lg:flex-row">
        {/* Image Section */}
        <div className={`w-full lg:w-1/2 relative min-h-[50dvh] lg:h-full ${
          isImageLeft ? 'order-1 lg:order-1' : 'order-1 lg:order-2'
        }`}>
          <div className="absolute inset-0 h-full w-full bg-gray-100">
            {heroImageUrl && (
              <Image
                src={heroImageUrl}
                alt={`${wedding.partner1_first_name} & ${wedding.partner2_first_name} wedding photo`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            )}
            {/* Subtle overlay */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10"
            />
          </div>
        </div>
        
        {/* Content Section */}
        <div className={`w-full lg:w-1/2 flex items-center justify-center min-h-[50dvh] lg:h-full ${
          isImageLeft ? 'order-2 lg:order-2' : 'order-2 lg:order-1'
        }`}>
          <div className="w-full max-w-xl mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-16">
            <div className="text-center lg:text-left">
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
        </div>
      </div>
    </section>
  )
}
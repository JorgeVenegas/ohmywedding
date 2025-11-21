import React from 'react'
import Image from 'next/image'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'
import { resolveColor } from '@/lib/color-utils'

interface HeroSideBySideVariantProps extends BaseHeroProps {
  imagePosition?: 'left' | 'right'
  backgroundGradient?: boolean
  gradientColor1?: string
  gradientColor2?: string
  imageBrightness?: number
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
  imagePosition = 'left',
  backgroundGradient = false,
  gradientColor1,
  gradientColor2,
  imageBrightness = 100
}: HeroSideBySideVariantProps) {
  const isImageLeft = imagePosition === 'left'
  
  // Resolve palette references to actual colors
  const resolvedGradientColor1 = resolveColor(gradientColor1, theme)
  const resolvedGradientColor2 = resolveColor(gradientColor2, theme)

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
                style={{ filter: `brightness(${imageBrightness}%)` }}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            )}
            {/* Gradient overlay */}
            {backgroundGradient && resolvedGradientColor1 && resolvedGradientColor2 ? (
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: `linear-gradient(135deg, ${resolvedGradientColor1} 0%, ${resolvedGradientColor2} 100%)`
                }}
              />
            ) : (
              <div 
                className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10"
              />
            )}
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
import React from 'react'
import Image from 'next/image'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'
import { resolveColor } from '@/lib/color-utils'

// Helper function to determine if a color is light
function getLuminance(hex: string): number {
  // Handle rgb format
  if (hex.startsWith('rgb')) {
    const match = hex.match(/(\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      const rgb = [parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255]
      return rgb.reduce((acc, c, i) => {
        c = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        return acc + c * [0.2126, 0.7152, 0.0722][i]
      }, 0)
    }
  }
  const rgb = hex.replace('#', '').match(/.{2}/g)?.map(c => parseInt(c, 16) / 255) || [0, 0, 0]
  return rgb.reduce((acc, c, i) => {
    c = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    return acc + c * [0.2126, 0.7152, 0.0722][i]
  }, 0)
}

function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.5
}

// Helper to create a light tint of a color
function getLightTint(hex: string, tintAmount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const newR = Math.round(r + (255 - r) * tintAmount)
  const newG = Math.round(g + (255 - g) * tintAmount)
  const newB = Math.round(b + (255 - b) * tintAmount)
  return `rgb(${newR}, ${newG}, ${newB})`
}

type BackgroundColorChoice = 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'

interface HeroSideBySideVariantProps extends BaseHeroProps {
  imagePosition?: 'left' | 'right'
  backgroundGradient?: boolean
  gradientColor1?: string
  gradientColor2?: string
  imageBrightness?: number
  overlayOpacity?: number
  useColorBackground?: boolean
  backgroundColorChoice?: BackgroundColorChoice
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
  imageBrightness = 100,
  overlayOpacity = 0,
  useColorBackground = false,
  backgroundColorChoice = 'primary'
}: HeroSideBySideVariantProps) {
  const isImageLeft = imagePosition === 'left'
  
  // Resolve palette references to actual colors
  const resolvedGradientColor1 = resolveColor(gradientColor1, theme)
  const resolvedGradientColor2 = resolveColor(gradientColor2, theme)

  // Get background color if using colored background (with light/lighter variants)
  const getBackgroundColor = () => {
    if (!useColorBackground) return theme?.colors?.background || '#ffffff'
    
    const primaryColor = theme?.colors?.primary || '#9CAF88'
    const secondaryColor = theme?.colors?.secondary || '#B8C5A6'
    const accentColor = theme?.colors?.accent || '#8B9A7A'
    
    switch (backgroundColorChoice) {
      case 'primary': return primaryColor
      case 'primary-light': return getLightTint(primaryColor, 0.5)
      case 'primary-lighter': return getLightTint(primaryColor, 0.88)
      case 'secondary': return secondaryColor
      case 'secondary-light': return getLightTint(secondaryColor, 0.5)
      case 'secondary-lighter': return getLightTint(secondaryColor, 0.88)
      case 'accent': return accentColor
      case 'accent-light': return getLightTint(accentColor, 0.5)
      case 'accent-lighter': return getLightTint(accentColor, 0.88)
      default: return primaryColor
    }
  }

  const bgColor = getBackgroundColor()
  const textColor = useColorBackground ? (isLightColor(bgColor) ? '#1f2937' : '#ffffff') : undefined

  // Create modified theme for colored background
  const effectiveTheme = useColorBackground && textColor ? {
    ...theme,
    colors: {
      primary: theme?.colors?.primary || '#9CAF88',
      secondary: theme?.colors?.secondary || '#B8C5A6',
      accent: theme?.colors?.accent || '#8B9A7A',
      background: theme?.colors?.background || '#ffffff',
      foreground: textColor,
      muted: textColor
    }
  } : theme

  return (
    <section 
      className="h-[100dvh] max-h-[100dvh] overflow-hidden"
      style={{ 
        backgroundColor: bgColor
      }}
    >
      <div className="h-full flex flex-col lg:flex-row">
        {/* Image Section */}
        <div className={`w-full lg:w-1/2 relative h-[40dvh] sm:h-[45dvh] lg:h-full ${
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
            {/* Dark overlay for opacity control */}
            {overlayOpacity > 0 && (
              <div 
                className="absolute inset-0 bg-black"
                style={{ opacity: overlayOpacity / 100 }}
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
        <div className={`w-full lg:w-1/2 flex items-center justify-center flex-1 lg:h-full overflow-y-auto ${
          isImageLeft ? 'order-2 lg:order-2' : 'order-2 lg:order-1'
        }`}>
          <div className="w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-16">
            <div className="text-center lg:text-left">
              <HeroTextContent
                wedding={wedding}
                dateId={dateId}
                weddingNameId={weddingNameId}
                theme={effectiveTheme}
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
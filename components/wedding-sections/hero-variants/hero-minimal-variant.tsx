import React from 'react'
import { SectionWrapper } from '../section-wrapper'
import { HeroTextContent } from './hero-text-content'
import { BaseHeroProps } from './types'
import { ThemeConfig } from '@/lib/wedding-config'
import { resolveColor } from '@/lib/color-utils'

interface HeroMinimalVariantProps extends BaseHeroProps {
  backgroundColor?: string
  backgroundGradient?: boolean
  gradientColor1?: string
  gradientColor2?: string
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
  backgroundGradient = false,
  gradientColor1,
  gradientColor2,
  showDecorations = true
}: HeroMinimalVariantProps) {
  // Resolve palette references to actual colors
  const resolvedBackgroundColor = resolveColor(backgroundColor, theme)
  const resolvedGradientColor1 = resolveColor(gradientColor1, theme)
  const resolvedGradientColor2 = resolveColor(gradientColor2, theme)
  // Function to adjust brightness for gradient
  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, Math.min(255, (num >> 16) + amt))
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
  }

  // Function to determine if we should use light or dark text based on background
  const getTextColor = (bgColor: string | undefined) => {
    if (!bgColor) return theme?.colors?.foreground || '#1f2937'
    
    // Remove # if present
    const hex = bgColor.replace('#', '')
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Return dark text for light backgrounds, light text for dark backgrounds
    return luminance > 0.5 ? '#1f2937' : '#ffffff'
  }

  // Determine text color based on background or gradient
  let textColor: string
  if (backgroundGradient && resolvedGradientColor1) {
    // For gradients, use the first color to determine contrast
    textColor = getTextColor(resolvedGradientColor1)
  } else if (resolvedBackgroundColor) {
    textColor = getTextColor(resolvedBackgroundColor)
  } else {
    textColor = theme?.colors?.foreground || '#1f2937'
  }
  
  const isLightText = textColor === '#ffffff'

  // Override theme colors for text contrast
  const contrastTheme: Partial<ThemeConfig> = {
    ...theme,
    colors: {
      primary: theme?.colors?.primary || '#a86b8f',
      secondary: theme?.colors?.secondary || '#8b9d6f',
      accent: theme?.colors?.accent || '#e8a76a',
      background: theme?.colors?.background || '#ffffff',
      foreground: textColor,
      muted: isLightText ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)',
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
      background={resolvedBackgroundColor && !backgroundGradient ? 'default' : 'primary'}
      className="h-[100dvh] max-h-[100dvh] relative overflow-hidden"
      id="hero"
      style={
        resolvedBackgroundColor && !backgroundGradient 
          ? { backgroundColor: resolvedBackgroundColor } 
          : backgroundGradient && resolvedGradientColor1 && resolvedGradientColor2
          ? { 
              background: `linear-gradient(135deg, ${resolvedGradientColor1} 0%, ${resolvedGradientColor2} 100%)` 
            }
          : resolvedBackgroundColor && backgroundGradient
          ? { 
              background: `linear-gradient(135deg, ${resolvedBackgroundColor} 0%, ${adjustBrightness(resolvedBackgroundColor, -20)} 100%)` 
            }
          : undefined
      }
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
          theme={contrastTheme}
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
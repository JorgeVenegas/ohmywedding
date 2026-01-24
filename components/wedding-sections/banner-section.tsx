"use client"

import React from 'react'
import Image from 'next/image'
import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'
import { useCustomize } from '@/components/contexts/customize-context'

export interface BannerSectionProps {
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  imageUrl?: string
  imagePosition?: { x: number; y: number }
  bannerHeight?: 'small' | 'medium' | 'large' | 'full'
  showText?: boolean
  title?: string
  subtitle?: string
  overlayOpacity?: number // 0-100
  backgroundGradient?: boolean
  gradientColor1?: string
  gradientColor2?: string
  imageBrightness?: number // 30-100
}

export function BannerSection({
  theme,
  imageUrl,
  imagePosition = { x: 50, y: 50 },
  bannerHeight = 'large',
  showText = true,
  title,
  subtitle,
  overlayOpacity = 40,
  backgroundGradient = false,
  gradientColor1,
  gradientColor2,
  imageBrightness = 100
}: BannerSectionProps) {
  const customizeContext = useCustomize()

  // Get customized configuration if available
  const customConfig = customizeContext?.getSectionConfig('banner') || {}

  // Use custom config values if available, otherwise fall back to props
  const effectiveImageUrl = customConfig.imageUrl ?? imageUrl
  const effectiveImagePosition = customConfig.imagePosition ?? imagePosition
  const effectiveBannerHeight = customConfig.bannerHeight ?? bannerHeight
  const effectiveShowText = customConfig.showText ?? showText
  const effectiveTitle = customConfig.title ?? title
  const effectiveSubtitle = customConfig.subtitle ?? subtitle
  const effectiveOverlayOpacity = customConfig.overlayOpacity ?? overlayOpacity
  const effectiveBackgroundGradient = customConfig.backgroundGradient ?? backgroundGradient
  const effectiveGradientColor1 = customConfig.gradientColor1 ?? gradientColor1
  const effectiveGradientColor2 = customConfig.gradientColor2 ?? gradientColor2
  const effectiveImageBrightness = customConfig.imageBrightness ?? imageBrightness

  // Helper to resolve palette colors
  const resolveColor = (colorValue: string | undefined, themeColors: any) => {
    if (!colorValue) return undefined
    if (colorValue.startsWith('palette:')) {
      const colorKey = colorValue.replace('palette:', '')
      if (colorKey.includes('-light')) {
        const baseKey = colorKey.split('-')[0]
        const baseColor = themeColors?.[baseKey] || '#9CAF88'
        return colorKey.endsWith('lighter') 
          ? getLightTint(baseColor, 0.88)
          : getLightTint(baseColor, 0.5)
      }
      return themeColors?.[colorKey] || '#9CAF88'
    }
    return colorValue
  }

  const getLightTint = (hex: string, tintAmount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    const newR = Math.round(r + (255 - r) * tintAmount)
    const newG = Math.round(g + (255 - g) * tintAmount)
    const newB = Math.round(b + (255 - b) * tintAmount)
    return `rgb(${newR}, ${newG}, ${newB})`
  }

  const color1 = resolveColor(effectiveGradientColor1, theme?.colors)
  const color2 = resolveColor(effectiveGradientColor2, theme?.colors)

  const onEditClick = (sectionId: string, sectionType: string) => {
    if (customizeContext) {
      const configToPass = {
        imageUrl: effectiveImageUrl,
        imagePosition: effectiveImagePosition,
        bannerHeight: effectiveBannerHeight,
        showText: effectiveShowText,
        title: effectiveTitle,
        subtitle: effectiveSubtitle,
        overlayOpacity: effectiveOverlayOpacity,
        backgroundGradient: effectiveBackgroundGradient,
        gradientColor1: effectiveGradientColor1,
        gradientColor2: effectiveGradientColor2,
        imageBrightness: effectiveImageBrightness
      }
      customizeContext.openCustomizer(sectionId, sectionType, configToPass)
    }
  }
  const content = !effectiveImageUrl ? (
    <section className="relative w-full h-[60vh] flex items-center justify-center bg-gray-100">
      <div className="text-center text-gray-400 px-6">
        <p className="text-lg">No banner image selected</p>
        <p className="text-sm mt-2">Add an image in the customization panel</p>
      </div>
    </section>
  ) : (
    <section 
      id="banner"
      className="relative w-full"
    >
      {/* Banner Image */}
      <div className={`relative w-full ${
        effectiveBannerHeight === 'small' ? 'h-[40vh] md:h-[50vh]' :
        effectiveBannerHeight === 'medium' ? 'h-[50vh] md:h-[60vh]' :
        effectiveBannerHeight === 'large' ? 'h-[60vh] md:h-[70vh] lg:h-[80vh]' :
        'h-screen'
      }`}>
        <Image
          src={effectiveImageUrl}
          alt={effectiveTitle || 'Banner'}
          fill
          className="object-cover"
          priority
          sizes="100vw"
          unoptimized
          style={{
            filter: `brightness(${effectiveImageBrightness}%)`,
            objectPosition: `${effectiveImagePosition.x}% ${effectiveImagePosition.y}%`
          }}
        />
        
        {/* Gradient Overlay */}
        {effectiveBackgroundGradient && color1 && color2 ? (
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${color1}, ${color2})`,
              opacity: effectiveShowText ? effectiveOverlayOpacity / 100 : effectiveOverlayOpacity / 100
            }}
          />
        ) : effectiveShowText ? (
          <div 
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"
            style={{ opacity: effectiveOverlayOpacity / 100 }}
          />
        ) : null}

        {/* Text Overlay - conditional */}
        {effectiveShowText && (effectiveTitle || effectiveSubtitle) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center px-6 max-w-4xl">
              {effectiveTitle && (
                <h2
                  className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 drop-shadow-lg"
                  style={{
                    fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 
                                theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
                  }}
                >
                  {effectiveTitle}
                </h2>
              )}
              {effectiveSubtitle && (
                <p 
                  className="text-xl md:text-2xl lg:text-3xl drop-shadow-lg opacity-90"
                  style={{
                    fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
                  }}
                >
                  {effectiveSubtitle}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )

  return (
    <EditableSectionWrapper
      sectionId="banner"
      sectionType="banner"
      onEditClick={onEditClick}
    >
      {content}
    </EditableSectionWrapper>
  )
}

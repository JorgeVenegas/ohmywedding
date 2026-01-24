"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { BaseGalleryProps } from './types'
import { useI18n } from '@/components/contexts/i18n-context'
import { getGalleryColorScheme } from './color-utils'

interface GalleryCollageVariantProps extends BaseGalleryProps {
  overlayOpacity?: number
  imageBrightness?: number
  useGradientOverlay?: boolean
  gradientColor1?: string
  gradientColor2?: string
  backgroundColorChoice?: 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'
}

export function GalleryCollageVariant({
  weddingNameId,
  theme,
  sectionTitle,
  sectionSubtitle,
  photos = [],
  titleAlignment = 'center',
  subtitleAlignment = 'center',
  gridColumns = 4,
  overlayOpacity = 0,
  imageBrightness = 100,
  useGradientOverlay = false,
  gradientColor1,
  gradientColor2,
  backgroundColorChoice = 'none'
}: GalleryCollageVariantProps) {
  const { t } = useI18n()
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Handle fade-in after mount
  useEffect(() => {
    if (selectedPhoto && !isClosing) {
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    }
  }, [selectedPhoto, isClosing])

  const handleClosePhoto = () => {
    setIsVisible(false)
    setIsClosing(true)
    setTimeout(() => {
      setSelectedPhoto(null)
      setIsClosing(false)
    }, 300)
  }

  const validPhotos = photos.filter(photo => photo.url)

  // Helper to resolve palette colors
  const resolveColor = (colorValue: string | undefined) => {
    if (!colorValue || !theme?.colors) return undefined
    if (colorValue.startsWith('palette:')) {
      const colorKey = colorValue.replace('palette:', '')
      if (colorKey.includes('-light')) {
        const baseKey = colorKey.split('-')[0] as keyof typeof theme.colors
        const baseColor = theme.colors[baseKey] || '#9CAF88'
        return colorKey.endsWith('lighter') 
          ? getLightTint(baseColor, 0.88)
          : getLightTint(baseColor, 0.5)
      }
      return theme.colors[colorKey as keyof typeof theme.colors] || '#9CAF88'
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

  const color1 = resolveColor(gradientColor1)
  const color2 = resolveColor(gradientColor2)

  // Resolve background color
  const getBackgroundColor = () => {
    if (!backgroundColorChoice || backgroundColorChoice === 'none') return undefined
    if (!theme?.colors) return undefined
    if (backgroundColorChoice.includes('-light')) {
      const baseKey = backgroundColorChoice.split('-')[0] as 'primary' | 'secondary' | 'accent'
      const baseColor = theme.colors[baseKey] || '#9CAF88'
      return backgroundColorChoice.endsWith('lighter') 
        ? getLightTint(baseColor, 0.88)
        : getLightTint(baseColor, 0.5)
    }
    return theme.colors[backgroundColorChoice as 'primary' | 'secondary' | 'accent']
  }

  const backgroundColor = getBackgroundColor()

  // Get text colors that contrast with background
  const { textColor, mutedTextColor, dividerColor, isColored } = getGalleryColorScheme(theme, backgroundColorChoice)

  if (validPhotos.length === 0) {
    return (
      <section id="gallery" className="w-full py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {sectionTitle || t('gallery.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('gallery.noPhotosYet')}. {t('gallery.uploadYourFirst')}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section 
        id="gallery"
        className="w-full relative"
        style={{ backgroundColor }}
      >
        {/* Section Header */}
        {(sectionTitle || sectionSubtitle) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
            <div className={`text-${titleAlignment}`}>
              {sectionTitle && (
                <h2
                  className="text-3xl md:text-5xl font-bold mb-4"
                  style={{
                    fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 
                                theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif',
                    color: textColor
                  }}
                >
                  {sectionTitle}
                </h2>
              )}
              {sectionTitle && (
                <div 
                  className={`w-24 h-1 rounded mb-6 ${titleAlignment === 'center' ? 'mx-auto' : titleAlignment === 'right' ? 'ml-auto' : ''}`}
                  style={{ backgroundColor: isColored ? dividerColor : (theme?.colors?.accent || '#e8a76a') }}
                />
              )}
              {sectionSubtitle && (
                <p className={`text-lg md:text-xl text-${subtitleAlignment}`} style={{ color: mutedTextColor }}>
                  {sectionSubtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Full-width grid container with overlay */}
        <div className="relative">
          {/* Full-width grid with no gaps - smart sizing with intercalated wide images */}
          <div 
            className={`grid w-full gap-0 auto-rows-auto ${
              gridColumns === 2 ? 'grid-cols-2' :
              gridColumns === 3 ? 'grid-cols-2 md:grid-cols-3' :
              gridColumns === 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
              gridColumns === 5 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' :
              'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
            }`}
            style={{
              filter: `brightness(${imageBrightness}%)`
            }}
          >
            {validPhotos.map((photo, index) => {
              const totalPhotos = validPhotos.length
              const cols = gridColumns
              const remainder = totalPhotos % cols
              const emptySpaces = remainder === 0 ? 0 : cols - remainder
              
              // Determine which images should be wide (span 2 columns)
              // Distribute them throughout: second image, middle, near end, etc.
              const wideImageIndices: number[] = []
              
              if (emptySpaces > 0) {
                // Calculate positions to place wide images (intercalated)
                const step = Math.floor(totalPhotos / emptySpaces)
                for (let i = 0; i < emptySpaces; i++) {
                  // Distribute: second, middle area, near end, etc.
                  let position = Math.min((i + 1) * step - 1, totalPhotos - 1)
                  // Avoid last position to keep it more natural
                  if (position === totalPhotos - 1 && emptySpaces > 1) {
                    position = totalPhotos - 2
                  }
                  wideImageIndices.push(position)
                }
              }
              
              const isWide = wideImageIndices.includes(index)
              
              return (
                <div 
                  key={photo.id} 
                  className={`relative overflow-hidden cursor-pointer group ${
                    isWide ? 'col-span-2 aspect-[2/1]' : 'aspect-square'
                  }`}
                  onClick={() => setSelectedPhoto(photo.url)}
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt || 'Gallery photo'}
                    fill
                    className="object-cover"
                    style={{
                      objectPosition: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center',
                      transform: photo.zoom && photo.zoom > 1 ? `scale(${photo.zoom})` : undefined,
                      transformOrigin: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : 'center'
                    }}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    unoptimized
                  />
                  
                  {/* Caption on hover */}
                  {photo.caption && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 z-10">
                      <p className="text-white text-center text-sm font-medium">
                        {photo.caption}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Section-wide overlay */}
          {useGradientOverlay && color1 && color2 ? (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${color1}, ${color2})`,
                opacity: overlayOpacity / 100
              }}
            />
          ) : overlayOpacity > 0 ? (
            <div 
              className="absolute inset-0 bg-black pointer-events-none"
              style={{
                opacity: overlayOpacity / 100
              }}
            />
          ) : null}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className={`fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleClosePhoto}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            onClick={handleClosePhoto}
          >
            <X className="w-6 h-6" />
          </button>
          <div className={`relative max-w-6xl max-h-[90vh] w-full h-full transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}>
            <Image
              src={selectedPhoto}
              alt="Full size photo"
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  )
}

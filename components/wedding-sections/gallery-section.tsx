"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Camera, Play } from 'lucide-react'
import { SectionWrapper } from './section-wrapper'
import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'
import { useI18n } from '@/components/contexts/i18n-context'

interface Photo {
  id: string
  url: string
  caption?: string
  alt?: string
  thumbnail?: string
}

interface Video {
  id: string
  url: string
  thumbnail: string
  title?: string
  duration?: string
}

interface GallerySectionProps {
  dateId: string
  weddingNameId: string
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  showEngagementPhotos?: boolean
  showVideoSupport?: boolean
  photos?: Photo[]
  videos?: Video[]
  maxDisplayPhotos?: number
  showViewAllButton?: boolean
  showDemoPhotos?: boolean // Show demo photos when no real photos are provided
}

export function GallerySection({
  dateId,
  weddingNameId,
  theme,
  alignment,
  showEngagementPhotos = true,
  showVideoSupport = false,
  photos = [],
  videos = [],
  maxDisplayPhotos = 6,
  showViewAllButton = true,
  showDemoPhotos = false
}: GallerySectionProps) {
  const { t } = useI18n()
  const displayPhotos = photos.slice(0, maxDisplayPhotos)
  const hasMorePhotos = photos.length > maxDisplayPhotos

  // Default photos if none provided - using reliable placeholder service
  const defaultPhotos: Photo[] = [
    { id: '1', url: 'https://picsum.photos/400/400?random=1', alt: 'Demo Photo 1' },
    { id: '2', url: 'https://picsum.photos/400/400?random=2', alt: 'Demo Photo 2' },
    { id: '3', url: 'https://picsum.photos/400/400?random=3', alt: 'Demo Photo 3' },
    { id: '4', url: 'https://picsum.photos/400/400?random=4', alt: 'Demo Photo 4' },
    { id: '5', url: 'https://picsum.photos/400/400?random=5', alt: 'Demo Photo 5' },
    { id: '6', url: 'https://picsum.photos/400/400?random=6', alt: 'Demo Photo 6' }
  ]

  const photosToShow = displayPhotos.length > 0 ? displayPhotos : 
                      (showDemoPhotos && photos.length === 0) ? defaultPhotos.slice(0, maxDisplayPhotos) : []
  const shouldShowPlaceholders = photos.length === 0 && showEngagementPhotos && !showDemoPhotos

  if (!showEngagementPhotos && (!showVideoSupport || videos.length === 0)) {
    return null
  }

  return (
    <SectionWrapper 
      theme={theme} 
      alignment={alignment} 
      background="muted"
      id="gallery"
    >
      {/* Section Header */}
      <div className="mb-16">
        <h2 
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ 
            fontFamily: theme?.fonts?.heading === 'script' ? 'cursive' : 
                        theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif',
            color: theme?.colors?.foreground || '#1f2937'
          }}
        >
          {t('gallery.title')}
        </h2>
        <div 
          className="w-24 h-1 mx-auto rounded mb-6"
          style={{ backgroundColor: theme?.colors?.accent || '#e8a76a' }}
        />
        <p 
          className="text-lg max-w-2xl mx-auto"
          style={{ 
            color: theme?.colors?.muted || '#6b7280',
            fontFamily: theme?.fonts?.body === 'serif' ? 'serif' : 'sans-serif'
          }}
        >
          {t('gallery.subtitle')}
        </p>
      </div>

      {/* Videos Section */}
      {showVideoSupport && videos.length > 0 && (
        <div className="mb-16">
          <h3 
            className="text-2xl font-semibold mb-8 text-center"
            style={{ 
              color: theme?.colors?.primary || '#a86b8f',
              fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
            }}
          >
            Our Story in Motion
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="relative group cursor-pointer">
                <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={video.thumbnail}
                    alt={video.title || 'Video thumbnail'}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <div 
                      className="w-16 h-16 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-lg"
                    >
                      <Play 
                        className="w-6 h-6 ml-1" 
                        style={{ color: theme?.colors?.primary || '#a86b8f' }}
                        fill="currentColor"
                      />
                    </div>
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  )}
                </div>
                {video.title && (
                  <p 
                    className="mt-2 text-center font-medium"
                    style={{ color: theme?.colors?.foreground }}
                  >
                    {video.title}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos Section */}
      {showEngagementPhotos && (
        <div>
          <h3 
            className="text-2xl font-semibold mb-8 text-center"
            style={{ 
              color: theme?.colors?.secondary || '#8b9d6f',
              fontFamily: theme?.fonts?.heading === 'serif' ? 'serif' : 'sans-serif'
            }}
          >
            {t('gallery.capturedMoments')}
          </h3>
          
          {photosToShow.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {photosToShow.map((photo, index) => (
                <div key={photo.id} className="relative group">
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src={photo.url}
                      alt={photo.alt || `Photo ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
                  </div>
                  {photo.caption && (
                    <p 
                      className="mt-2 text-sm text-center"
                      style={{ color: theme?.colors?.muted || '#6b7280' }}
                    >
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : shouldShowPlaceholders ? (
            // Show placeholder message when no photos are available
            <div className="text-center py-12">
              <Camera 
                className="w-16 h-16 mx-auto mb-4" 
                style={{ color: theme?.colors?.muted || '#6b7280' }}
              />
              <h4 
                className="text-xl font-semibold mb-2"
                style={{ color: theme?.colors?.foreground || '#1f2937' }}
              >
                {t('gallery.photosComingSoon')}
              </h4>
              <p 
                className="text-base max-w-md mx-auto"
                style={{ color: theme?.colors?.muted || '#6b7280' }}
              >
                {t('gallery.checkBackSoon')}
              </p>
            </div>
          ) : null}

          {/* View All Button */}
          {showViewAllButton && (hasMorePhotos || photos.length > 0) && (
            <div className="text-center">
              <Button 
                asChild 
                variant="outline"
                size="lg"
                className="px-8 py-3 rounded-full border-2"
                style={{ 
                  borderColor: theme?.colors?.primary || '#a86b8f',
                  color: theme?.colors?.primary || '#a86b8f'
                }}
              >
                <Link href={`/${weddingNameId}/gallery`}>
                  <Camera className="w-5 h-5 mr-2" />
                  {t('gallery.viewAll')}
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </SectionWrapper>
  )
}
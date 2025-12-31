import React from 'react'
import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

interface SectionWrapperProps {
  children: React.ReactNode
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  className?: string
  id?: string
  background?: 'default' | 'muted' | 'primary' | 'secondary'
  style?: React.CSSProperties
}

export function SectionWrapper({ 
  children, 
  theme, 
  alignment, 
  className = '', 
  id,
  background = 'default',
  style
}: SectionWrapperProps) {
  const getBackgroundClass = () => {
    switch (background) {
      case 'muted':
        return 'bg-gray-50'
      case 'primary':
        return 'bg-gradient-to-br from-orange-50 via-green-50 to-orange-100'
      case 'secondary':
        return 'bg-gradient-to-br from-green-50 via-orange-50 to-green-100'
      default:
        return 'bg-white'
    }
  }

  const getTextAlignClass = () => {
    switch (alignment?.text) {
      case 'left': return 'text-left'
      case 'right': return 'text-right'
      case 'center':
      default: return 'text-center'
    }
  }

  const getContentAlignClass = () => {
    switch (alignment?.content) {
      case 'left': return 'items-start'
      case 'right': return 'items-end'
      case 'center':
      default: return 'items-center'
    }
  }

  const sectionStyle = {
    '--primary-color': theme?.colors?.primary || '#a86b8f',
    '--secondary-color': theme?.colors?.secondary || '#8b9d6f',
    '--accent-color': theme?.colors?.accent || '#e8a76a',
    '--background-color': theme?.colors?.background || '#ffffff',
    '--foreground-color': theme?.colors?.foreground || '#1f2937',
    '--muted-color': theme?.colors?.muted || '#6b7280',
  } as React.CSSProperties

  return (
    <section 
      id={id}
      className={`${theme?.spacing?.section || 'py-6 sm:py-8 md:py-10 px-4'} ${!style?.backgroundColor ? getBackgroundClass() : ''} ${className}`}
      style={{ ...sectionStyle, ...style }}
    >
      <div className={`${theme?.spacing?.container || 'max-w-4xl mx-auto'} ${getTextAlignClass()} ${getContentAlignClass()} flex flex-col`}>
        {children}
      </div>
    </section>
  )
}
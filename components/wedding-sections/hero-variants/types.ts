import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'
import { type Wedding } from '@/lib/wedding-data'

export interface BaseHeroProps {
  wedding: Wedding
  dateId: string
  weddingNameId: string
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  showCoverImage?: boolean
  showTagline?: boolean
  tagline?: string
  coverImageUrl?: string
  showCountdown?: boolean
  showRSVPButton?: boolean
  heroImageUrl?: string
}

export interface HeroContentProps {
  wedding: Wedding
  dateId: string
  weddingNameId: string
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  showTagline?: boolean
  tagline?: string
  showCountdown?: boolean
  showRSVPButton?: boolean
  isOverlay?: boolean
}
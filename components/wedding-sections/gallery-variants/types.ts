import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export interface Photo {
  id: string
  url: string
  caption?: string
  alt?: string
  thumbnail?: string
}

export interface BaseGalleryProps {
  weddingNameId: string
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  sectionTitle?: string
  sectionSubtitle?: string
  photos?: Photo[]
  backgroundColorChoice?: 'none' | 'primary' | 'secondary' | 'accent' | 'primary-light' | 'secondary-light' | 'accent-light' | 'primary-lighter' | 'secondary-lighter' | 'accent-lighter'
  titleAlignment?: 'left' | 'center' | 'right'
  subtitleAlignment?: 'left' | 'center' | 'right'
}

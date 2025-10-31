import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export interface Photo {
  id: string
  url: string
  caption?: string
  alt?: string
}

export interface TimelineEvent {
  date: string
  title: string
  description: string
  photo?: string
}

export interface BaseOurStoryProps {
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  showHowWeMet?: boolean
  showProposal?: boolean
  showPhotos?: boolean
  howWeMetText?: string
  proposalText?: string
  photos?: Photo[]
  timeline?: TimelineEvent[]
}
import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export interface CustomQuestion {
  id: string
  question: string
  type: 'text' | 'textarea' | 'select' | 'number'
  options?: string[]
  required?: boolean
}

export interface BaseRSVPProps {
  dateId: string
  weddingNameId: string
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  sectionTitle?: string
  sectionSubtitle?: string
  showMealPreferences?: boolean
  showCustomQuestions?: boolean
  customQuestions?: CustomQuestion[]
  embedForm?: boolean
}
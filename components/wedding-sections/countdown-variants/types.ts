import { ThemeConfig, AlignmentConfig } from '@/lib/wedding-config'

export interface BaseCountdownProps {
  weddingDate: string
  theme?: Partial<ThemeConfig>
  alignment?: Partial<AlignmentConfig>
  showDays?: boolean
  showHours?: boolean
  showMinutes?: boolean
  showSeconds?: boolean
  message?: string
}

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}
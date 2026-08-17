export interface AIGuestSummary {
  total: number
  accepted: number
  declined: number
  pending: number
  vip_count: number
  dietary_summary: Record<string, number>
}

export interface AIVendor {
  name: string
  category: string
  contact?: string
  status: 'paid' | 'partial' | 'unpaid' | 'unknown'
  total_amount: number
  paid_amount: number
  remaining: number
}

export interface AITimelineEntry {
  time: string
  title: string
  location?: string
  notes?: string
  is_public?: boolean
}

export interface AIHotel {
  name: string
  address?: string
  contact?: string
  notes?: string
}

export interface AIFaqEntry {
  question: string
  answer: string
}

export interface AITaskSummary {
  total: number
  completed: number
  pending: number
  overdue: number
}

export interface AIBudgetSummary {
  total: number
  spent: number
  remaining: number
  currency: string
}

export interface AIWeddingSnapshot {
  wedding: {
    id: string
    name: string
    slug: string
    date: string | null
    timezone: string
    venue: string | null
    dress_code: string | null
  }
  couple: {
    name1: string | null
    name2: string | null
    email: string | null
  }
  guests: AIGuestSummary
  vendors: AIVendor[]
  tasks: AITaskSummary
  timeline: AITimelineEntry[]
  hotels: AIHotel[]
  faq: AIFaqEntry[]
  budget: AIBudgetSummary | null
  updated_at: string
}

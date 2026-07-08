export type EventStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled'
export type TimelineCategory = 'payment' | 'save_the_date' | 'invitations' | 'communications' | 'logistics' | 'other'
export type TimelineItemSource = 'event' | 'payment'

export interface WeddingEvent {
  id: string
  wedding_id: string
  title: string
  description: string | null
  start_date: string | null
  due_date: string
  completed_at: string | null
  category: TimelineCategory
  status: EventStatus
  reminder_days_before: number
  assignee_email: string | null
  reviewer_email: string | null
  created_at: string
  updated_at: string
}

export interface SupplierPayment {
  id: string
  supplier_id: string
  wedding_id: string
  amount: number
  payment_date: string
  notes: string | null
}

export interface Supplier {
  id: string
  name: string
  payments: SupplierPayment[]
}

export interface TimelineItem {
  id: string
  source: TimelineItemSource
  title: string
  description: string | null
  date: string
  start_date?: string | null
  category: TimelineCategory
  status?: EventStatus
  completed_at?: string | null
  assignee_email?: string | null
  reviewer_email?: string | null
  payment_amount?: number | null
  supplier_name?: string | null
  supplier_id?: string | null
  reminder_days_before?: number
}

export type TimelineGroup = 'overdue' | 'today' | 'thisWeek' | 'thisMonth' | 'later' | 'completed'
export type TimelineFilter = 'all' | 'today' | 'thisWeek' | 'thisMonth'

export function mergeTimelineItems(events: WeddingEvent[], suppliers: Supplier[]): TimelineItem[] {
  const eventItems: TimelineItem[] = events.map(e => ({
    id: e.id,
    source: 'event',
    title: e.title,
    description: e.description,
    date: e.due_date,
    start_date: e.start_date,
    category: e.category,
    status: e.status,
    completed_at: e.completed_at,
    assignee_email: e.assignee_email,
    reviewer_email: e.reviewer_email,
    reminder_days_before: e.reminder_days_before,
  }))

  const paymentItems: TimelineItem[] = suppliers.flatMap(s =>
    s.payments.map(p => ({
      id: p.id,
      source: 'payment' as TimelineItemSource,
      title: s.name,
      description: p.notes,
      date: p.payment_date,
      category: 'payment' as TimelineCategory,
      payment_amount: p.amount,
      supplier_name: s.name,
      supplier_id: s.id,
    }))
  )

  return [...eventItems, ...paymentItems].sort((a, b) => a.date.localeCompare(b.date))
}

export function classifyItem(item: TimelineItem, todayStr: string): TimelineGroup {
  if (item.source === 'event' && (item.status === 'completed' || item.status === 'cancelled')) {
    return 'completed'
  }

  const today = new Date(todayStr)
  const date = new Date(item.date)

  // Strip time for comparison
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  if (date < today) return 'overdue'
  if (date.getTime() === today.getTime()) return 'today'

  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + 7)
  if (date < weekEnd) return 'thisWeek'

  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
  if (date < monthEnd) return 'thisMonth'

  return 'later'
}

export function applyFilter(items: TimelineItem[], filter: TimelineFilter, todayStr: string): TimelineItem[] {
  if (filter === 'all') return items
  return items.filter(item => classifyItem(item, todayStr) === filter)
}

export const CATEGORY_COLORS: Record<TimelineCategory, string> = {
  payment: 'bg-green-500',
  save_the_date: 'bg-blue-500',
  invitations: 'bg-purple-500',
  communications: 'bg-yellow-500',
  logistics: 'bg-orange-500',
  other: 'bg-gray-400',
}

export const STATUS_COLORS: Record<EventStatus, string> = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

"use client"

import { AlertCircle, Pencil, Trash2, DollarSign, CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/contexts/i18n-context"
import {
  TimelineItem,
  EventStatus,
  CATEGORY_COLORS,
  STATUS_COLORS,
  classifyItem,
} from "../types"

interface EventCardProps {
  item: TimelineItem
  today: string
  onEdit?: (item: TimelineItem) => void
  onDelete?: (item: TimelineItem) => void
  onStatusChange?: (item: TimelineItem, status: EventStatus) => void
  onEditPayment?: (item: TimelineItem) => void
}

const STATUS_ICONS: Record<EventStatus, typeof CheckCircle2> = {
  todo: Clock,
  in_progress: RotateCcw,
  completed: CheckCircle2,
  cancelled: XCircle,
}

export function EventCard({ item, today, onEdit, onDelete, onStatusChange, onEditPayment }: EventCardProps) {
  const { t } = useTranslation()
  const group = classifyItem(item, today)
  const isOverdue = group === 'overdue'

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)

  if (item.source === 'payment') {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 group">
        <div className="mt-1 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              <DollarSign className="h-3 w-3" />
              {t('admin.timeline.categories.payment')}
            </span>
            {item.payment_amount != null && (
              <span className="text-sm font-semibold text-green-700">{formatCurrency(item.payment_amount)}</span>
            )}
          </div>
          <p className="text-sm font-medium mt-1 truncate">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{formatDate(item.date)}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {onEditPayment && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditPayment(item)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  const status = item.status ?? 'todo'
  const StatusIcon = STATUS_ICONS[status]
  const nextStatuses: EventStatus[] = status === 'todo'
    ? ['in_progress', 'completed', 'cancelled']
    : status === 'in_progress'
    ? ['todo', 'completed', 'cancelled']
    : ['todo']

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 group">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${CATEGORY_COLORS[item.category]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
            <StatusIcon className="h-3 w-3 inline mr-1" />
            {t(`admin.timeline.statuses.${status}` as Parameters<typeof t>[0])}
          </span>
          <span className="text-xs text-muted-foreground">
            {t(`admin.timeline.categories.${item.category}` as Parameters<typeof t>[0])}
          </span>
          {isOverdue && status !== 'completed' && status !== 'cancelled' && (
            <span className="inline-flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              Overdue
            </span>
          )}
        </div>
        <p className={`text-sm font-medium mt-1 ${status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
          {(item.assignee_email || item.reviewer_email) && (
            <div className="flex gap-1">
              {item.assignee_email && (
                <span className="text-xs bg-muted rounded px-1.5 py-0.5" title={item.assignee_email}>
                  {item.assignee_email.split('@')[0].slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>
        {onStatusChange && nextStatuses.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {nextStatuses.map(s => (
              <button
                key={s}
                onClick={() => onStatusChange(item, s)}
                className={`text-xs px-2 py-0.5 rounded-full border hover:bg-accent transition-colors ${STATUS_COLORS[s]}`}
              >
                → {t(`admin.timeline.statuses.${s}` as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {onEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

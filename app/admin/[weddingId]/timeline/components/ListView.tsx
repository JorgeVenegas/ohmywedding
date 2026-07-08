"use client"

import { useTranslation } from "@/components/contexts/i18n-context"
import { TimelineItem, TimelineGroup, EventStatus, classifyItem } from "../types"
import { EventCard } from "./EventCard"

const GROUP_ORDER: TimelineGroup[] = ['overdue', 'today', 'thisWeek', 'thisMonth', 'later', 'completed']

interface ListViewProps {
  items: TimelineItem[]
  today: string
  onEdit: (item: TimelineItem) => void
  onDelete: (item: TimelineItem) => void
  onStatusChange: (item: TimelineItem, status: EventStatus) => void
  onEditPayment: (item: TimelineItem) => void
}

export function ListView({ items, today, onEdit, onDelete, onStatusChange, onEditPayment }: ListViewProps) {
  const { t } = useTranslation()

  const grouped: Record<TimelineGroup, TimelineItem[]> = {
    overdue: [],
    today: [],
    thisWeek: [],
    thisMonth: [],
    later: [],
    completed: [],
  }

  for (const item of items) {
    const group = classifyItem(item, today)
    grouped[group].push(item)
  }

  const groupLabels: Record<TimelineGroup, string> = {
    overdue: t('admin.timeline.groups.overdue'),
    today: t('admin.timeline.groups.today'),
    thisWeek: t('admin.timeline.groups.thisWeek'),
    thisMonth: t('admin.timeline.groups.thisMonth'),
    later: t('admin.timeline.groups.later'),
    completed: t('admin.timeline.groups.completed'),
  }

  const visibleGroups = GROUP_ORDER.filter(g => grouped[g].length > 0)

  if (visibleGroups.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm font-medium">{t('admin.timeline.noEvents')}</p>
        <p className="text-xs mt-1">{t('admin.timeline.noEventsDescription')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {visibleGroups.map(group => (
        <div key={group}>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${group === 'overdue' ? 'text-destructive' : 'text-muted-foreground'}`}>
            {groupLabels[group]}
            <span className="ml-2 font-normal">({grouped[group].length})</span>
          </h3>
          <div className="space-y-2">
            {grouped[group].map(item => (
              <EventCard
                key={item.id}
                item={item}
                today={today}
                onEdit={item.source === 'event' ? onEdit : undefined}
                onDelete={onDelete}
                onStatusChange={item.source === 'event' ? onStatusChange : undefined}
                onEditPayment={item.source === 'payment' ? onEditPayment : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

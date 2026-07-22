"use client"

import { useState, useEffect } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WeddingDatePicker } from "@/components/ui/wedding-date-picker"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/components/contexts/i18n-context"
import { WeddingEvent, TimelineCategory, EventStatus } from "../types"

const CATEGORIES: TimelineCategory[] = [
  'payment', 'save_the_date', 'invitations', 'communications', 'logistics', 'other',
]
const STATUSES: EventStatus[] = ['todo', 'in_progress', 'completed', 'cancelled']

interface AddEditEventModalProps {
  open: boolean
  event: WeddingEvent | null
  collaboratorEmails: string[]
  onClose: () => void
  onSave: (data: Partial<WeddingEvent>) => Promise<void>
}

export function AddEditEventModal({
  open, event, collaboratorEmails, onClose, onSave,
}: AddEditEventModalProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other' as TimelineCategory,
    status: 'todo' as EventStatus,
    start_date: '',
    due_date: '',
    reminder_days_before: 7,
    assignee_email: '',
    reviewer_email: '',
  })

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title,
        description: event.description ?? '',
        category: event.category,
        status: event.status,
        start_date: event.start_date ?? '',
        due_date: event.due_date,
        reminder_days_before: event.reminder_days_before,
        assignee_email: event.assignee_email ?? '',
        reviewer_email: event.reviewer_email ?? '',
      })
    } else {
      setForm({
        title: '',
        description: '',
        category: 'other',
        status: 'todo',
        start_date: '',
        due_date: '',
        reminder_days_before: 7,
        assignee_email: '',
        reviewer_email: '',
      })
    }
  }, [event, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.due_date) return
    setSaving(true)
    try {
      await onSave({
        title: form.title,
        description: form.description || null,
        category: form.category,
        status: form.status,
        start_date: form.start_date || null,
        due_date: form.due_date,
        reminder_days_before: form.reminder_days_before,
        assignee_email: form.assignee_email || null,
        reviewer_email: form.reviewer_email || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {event ? t('admin.timeline.editEvent') : t('admin.timeline.addEvent')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="title">{t('admin.timeline.fields.title')} *</Label>
            <Input
              id="title"
              placeholder={t('admin.timeline.fields.titlePlaceholder')}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('admin.timeline.fields.category')}</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as TimelineCategory }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>
                      {t(`admin.timeline.categories.${c}` as Parameters<typeof t>[0])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('admin.timeline.fields.status')}</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as EventStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      {t(`admin.timeline.statuses.${s}` as Parameters<typeof t>[0])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start_date">{t('admin.timeline.fields.startDate')}</Label>
              <WeddingDatePicker
                value={form.start_date}
                onChange={date => setForm(f => ({ ...f, start_date: date }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="due_date">{t('admin.timeline.fields.dueDate')} *</Label>
              <WeddingDatePicker
                value={form.due_date}
                onChange={date => setForm(f => ({ ...f, due_date: date }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">{t('admin.timeline.fields.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('admin.timeline.fields.descriptionPlaceholder')}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('admin.timeline.fields.assignee')}</Label>
              <Select
                value={form.assignee_email || '__none__'}
                onValueChange={v => setForm(f => ({ ...f, assignee_email: v === '__none__' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.timeline.fields.unassigned')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('admin.timeline.fields.unassigned')}</SelectItem>
                  {collaboratorEmails.map(email => (
                    <SelectItem key={email} value={email}>{email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('admin.timeline.fields.reviewer')}</Label>
              <Select
                value={form.reviewer_email || '__none__'}
                onValueChange={v => setForm(f => ({ ...f, reviewer_email: v === '__none__' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.timeline.fields.unassigned')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('admin.timeline.fields.unassigned')}</SelectItem>
                  {collaboratorEmails.map(email => (
                    <SelectItem key={email} value={email}>{email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reminder_days">{t('admin.timeline.fields.reminderDays')}</Label>
            <Input
              id="reminder_days"
              type="number"
              min={0}
              value={form.reminder_days_before}
              onChange={e => setForm(f => ({ ...f, reminder_days_before: Number(e.target.value) }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.title || !form.due_date}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

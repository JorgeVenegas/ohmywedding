"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useTranslation } from '@/components/contexts/i18n-context'
import type { Guest } from "../types"

interface GroupForMessage {
  id: string
  name: string | null
  message: string | null
  rsvp_submitted_at: string | null
  guests: Guest[]
}

interface MessageViewingModalProps {
  isOpen: boolean
  group: GroupForMessage | null
  onClose: () => void
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-700'
    case 'declined':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-yellow-100 text-yellow-700'
  }
}

export function MessageViewingModal({
  isOpen,
  group,
  onClose,
}: MessageViewingModalProps) {
  const { t } = useTranslation()
  if (!isOpen || !group) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {t('admin.invitations.messageModal.title', { name: group.name || '(Unnamed Group)' })}
            </h2>
            {group.rsvp_submitted_at && (
              <p className="text-sm text-muted-foreground mt-1">
                {t('admin.invitations.messageModal.submittedOn', { date: new Date(group.rsvp_submitted_at).toLocaleString() })}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <p className="text-foreground whitespace-pre-wrap">
              {group.message || t('admin.invitations.messageModal.noMessage')}
            </p>
          </div>

          {/* Guest List */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('admin.invitations.messageModal.guestsInGroup')}</h3>
            <div className="space-y-2">
              {group.guests.map(guest => (
                <div key={guest.id} className="flex items-center justify-between px-3 py-2 bg-muted/20 rounded-md">
                  <span className="text-sm text-foreground">{guest.name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadgeClass(guest.confirmation_status)}`}>
                    {guest.confirmation_status === 'confirmed' ? t('admin.invitations.messageModal.attending') : guest.confirmation_status === 'declined' ? t('admin.invitations.messageModal.notAttending') : t('common.pending')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  )
}

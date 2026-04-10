"use client"

import { X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTranslation } from '@/components/contexts/i18n-context'
import type { Guest } from "../types"

export interface SendInvitesConfig {
  skipAlreadySent: boolean
  onlyConfirmed: boolean
  onlyPending: boolean
}

interface SendInvitesModalProps {
  isOpen: boolean
  onClose: () => void
  allGuests: Guest[]
  config: SendInvitesConfig
  setConfig: React.Dispatch<React.SetStateAction<SendInvitesConfig>>
  onSend: () => void
}

export function SendInvitesModal({
  isOpen,
  onClose,
  allGuests,
  config,
  setConfig,
  onSend,
}: SendInvitesModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const getFilteredCount = () => {
    let filteredList = allGuests
    if (config.skipAlreadySent) {
      filteredList = filteredList.filter(g => !g.invitation_sent)
    }
    if (config.onlyConfirmed) {
      filteredList = filteredList.filter(g => g.confirmation_status === 'confirmed')
    }
    if (config.onlyPending) {
      filteredList = filteredList.filter(g => g.confirmation_status === 'pending')
    }
    return filteredList.length
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">{t('admin.invitations.sendModal.title')}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('admin.invitations.sendModal.description')}
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.skipAlreadySent}
                onChange={(e) => setConfig(prev => ({ ...prev, skipAlreadySent: e.target.checked }))}
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <span className="text-sm font-medium text-foreground">{t('admin.invitations.sendModal.skipAlreadySent')}</span>
                <p className="text-xs text-muted-foreground">{t('admin.invitations.sendModal.skipAlreadySentHelp')}</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.onlyConfirmed}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  onlyConfirmed: e.target.checked,
                  onlyPending: e.target.checked ? false : prev.onlyPending
                }))}
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <span className="text-sm font-medium text-foreground">{t('admin.invitations.sendModal.onlyConfirmed')}</span>
                <p className="text-xs text-muted-foreground">{t('admin.invitations.sendModal.onlyConfirmedHelp')}</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.onlyPending}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  onlyPending: e.target.checked,
                  onlyConfirmed: e.target.checked ? false : prev.onlyConfirmed
                }))}
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <span className="text-sm font-medium text-foreground">{t('admin.invitations.sendModal.onlyPending')}</span>
                <p className="text-xs text-muted-foreground">{t('admin.invitations.sendModal.onlyPendingHelp')}</p>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground mb-4">
              <strong className="text-foreground">{getFilteredCount()}</strong> {t('admin.invitations.sendModal.guestsWillReceive')}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            className="flex-1"
            onClick={onSend}
          >
            <Send className="w-4 h-4 mr-2" />
            {t('admin.invitations.sendModal.sendInvites')}
          </Button>
        </div>
      </Card>
    </div>
  )
}

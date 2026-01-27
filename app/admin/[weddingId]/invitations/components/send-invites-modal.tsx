"use client"

import { X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
          <h2 className="text-xl font-semibold text-foreground">Send Invitations</h2>
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
            Configure which guests should receive invitations.
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
                <span className="text-sm font-medium text-foreground">Skip already sent</span>
                <p className="text-xs text-muted-foreground">Don&apos;t send to guests who already received an invite</p>
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
                <span className="text-sm font-medium text-foreground">Only confirmed guests</span>
                <p className="text-xs text-muted-foreground">Send only to guests who have confirmed attendance</p>
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
                <span className="text-sm font-medium text-foreground">Only pending guests</span>
                <p className="text-xs text-muted-foreground">Send only to guests who haven&apos;t responded yet</p>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground mb-4">
              <strong className="text-foreground">{getFilteredCount()}</strong> guest(s) will receive invitations
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={onSend}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Invites
          </Button>
        </div>
      </Card>
    </div>
  )
}

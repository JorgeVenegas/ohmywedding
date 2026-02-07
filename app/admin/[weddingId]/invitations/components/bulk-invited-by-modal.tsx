"use client"

import { X, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Guest } from "../types"
import type { PartnerOption } from "../types"

interface BulkInvitedByModalProps {
  isOpen: boolean
  onClose: () => void
  selectedGuestIds: Set<string>
  allGuests: Guest[]
  partnerOptions: PartnerOption[]
  bulkInvitedBy: string[]
  setBulkInvitedBy: React.Dispatch<React.SetStateAction<string[]>>
  onUpdate: () => void
  isSubmitting?: boolean
}

export function BulkInvitedByModal({
  isOpen,
  onClose,
  selectedGuestIds,
  allGuests,
  partnerOptions,
  bulkInvitedBy,
  setBulkInvitedBy,
  onUpdate,
  isSubmitting = false,
}: BulkInvitedByModalProps) {
  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    setBulkInvitedBy([])
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Update Invited By
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set who invited the selected {selectedGuestIds.size} guest{selectedGuestIds.size !== 1 ? 's' : ''}.
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Invited By
            </label>
            <div className="flex flex-wrap gap-2">
              {partnerOptions.map((partner) => (
                <button
                  key={partner.key}
                  type="button"
                  onClick={() => setBulkInvitedBy(prev =>
                    prev.includes(partner.key)
                      ? prev.filter(k => k !== partner.key)
                      : [...prev, partner.key]
                  )}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${bulkInvitedBy.includes(partner.key)
                      ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                    }`}
                >
                  {partner.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Select one or both partners, or leave empty to clear.
            </p>
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Selected guests:</p>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {Array.from(selectedGuestIds).map(id => {
                const guest = allGuests.find(g => g.id === id)
                return guest ? (
                  <span key={id} className="px-2 py-0.5 text-xs bg-muted rounded-full">
                    {guest.name}
                  </span>
                ) : null
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={onUpdate}
              disabled={isSubmitting}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Updating...' : 'Update Invited By'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

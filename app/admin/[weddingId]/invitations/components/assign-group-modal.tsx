"use client"

import { X, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Guest, GuestGroup } from "../types"

interface AssignGroupModalProps {
  isOpen: boolean
  onClose: () => void
  selectedGuestIds: Set<string>
  allGuests: Guest[]
  guestGroups: GuestGroup[]
  assignToGroupId: string | 'new'
  setAssignToGroupId: (id: string | 'new') => void
  newGroupName: string
  setNewGroupName: (name: string) => void
  onAssign: () => void
  isSubmitting?: boolean
}

export function AssignGroupModal({
  isOpen,
  onClose,
  selectedGuestIds,
  allGuests,
  guestGroups,
  assignToGroupId,
  setAssignToGroupId,
  newGroupName,
  setNewGroupName,
  onAssign,
  isSubmitting = false,
}: AssignGroupModalProps) {
  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    setNewGroupName('')
    setAssignToGroupId('new')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Assign {selectedGuestIds.size} Guest{selectedGuestIds.size !== 1 ? 's' : ''} to Group
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Group
            </label>
            <select
              value={assignToGroupId}
              onChange={(e) => setAssignToGroupId(e.target.value as string | 'new')}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="new">Create New Group</option>
              {guestGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.guests.length} guests)
                </option>
              ))}
            </select>
          </div>

          {assignToGroupId === 'new' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Group Name *
              </label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., The Smith Family"
              />
            </div>
          )}

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
              onClick={onAssign}
              disabled={(assignToGroupId === 'new' && !newGroupName.trim()) || isSubmitting}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Assigning...' : 'Assign to Group'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

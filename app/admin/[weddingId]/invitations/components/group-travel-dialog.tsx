"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { X, Plane, Ticket, Check } from "lucide-react"
import { GuestGroup, GroupTravelForm } from "../types"

interface GroupTravelDialogProps {
  isOpen: boolean
  groupTravelForm: GroupTravelForm
  setGroupTravelForm: React.Dispatch<React.SetStateAction<GroupTravelForm>>
  guestGroups: GuestGroup[]
  selectedGuestIds: Set<string>
  onClose: () => void
  onSubmit: () => void
  isSubmitting?: boolean
}

export function GroupTravelDialog({
  isOpen,
  groupTravelForm,
  setGroupTravelForm,
  guestGroups,
  selectedGuestIds,
  onClose,
  onSubmit,
  isSubmitting = false,
}: GroupTravelDialogProps) {
  if (!isOpen) return null

  const isSubmitDisabled =
    (groupTravelForm.isTraveling &&
    groupTravelForm.travelArrangement === 'no_ticket_needed' &&
    !groupTravelForm.noTicketReason.trim()) || isSubmitting

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Set Travel Info for Group</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {groupTravelForm.groupId ? 'Group:' : 'Selected Guests:'}
            </p>
            <p className="font-medium">{groupTravelForm.groupName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {groupTravelForm.groupId
                ? `${guestGroups.find((g) => g.id === groupTravelForm.groupId)?.guests.length || 0} guest(s) will be updated`
                : `${selectedGuestIds.size} guest(s) will be updated`}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Guest(s) traveling?</label>
              <Switch
                checked={groupTravelForm.isTraveling}
                onCheckedChange={(checked) =>
                  setGroupTravelForm((prev) => ({ ...prev, isTraveling: checked }))
                }
              />
            </div>

            {groupTravelForm.isTraveling && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Traveling from</label>
                  <Input
                    value={groupTravelForm.travelingFrom}
                    onChange={(e) =>
                      setGroupTravelForm((prev) => ({
                        ...prev,
                        travelingFrom: e.target.value,
                      }))
                    }
                    placeholder="e.g., New York, USA"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Travel arrangement <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        setGroupTravelForm((prev) => ({
                          ...prev,
                          travelArrangement: 'will_buy_ticket',
                        }))
                      }
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        groupTravelForm.travelArrangement === 'will_buy_ticket'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Ticket className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Will purchase ticket</p>
                          <p className="text-xs text-muted-foreground">
                            Guest will need to upload proof of purchase
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        setGroupTravelForm((prev) => ({
                          ...prev,
                          travelArrangement: 'no_ticket_needed',
                        }))
                      }
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        groupTravelForm.travelArrangement === 'no_ticket_needed'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Does not need ticket</p>
                          <p className="text-xs text-muted-foreground">
                            Guest must provide a reason
                          </p>
                        </div>
                      </div>
                    </button>

                    {groupTravelForm.travelArrangement && (
                      <button
                        onClick={() =>
                          setGroupTravelForm((prev) => ({
                            ...prev,
                            travelArrangement: null,
                          }))
                        }
                        className="w-full p-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm text-muted-foreground"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                </div>

                {groupTravelForm.travelArrangement === 'no_ticket_needed' && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Reason</label>
                    <textarea
                      value={groupTravelForm.noTicketReason}
                      onChange={(e) =>
                        setGroupTravelForm((prev) => ({
                          ...prev,
                          noTicketReason: e.target.value,
                        }))
                      }
                      placeholder="e.g., Driving, Already have ticket, etc."
                      className="w-full px-3 py-2 border border-border rounded-lg resize-none"
                      rows={2}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={onSubmit}
              disabled={isSubmitDisabled}
            >
              <Check className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Applying...' : 'Apply to Group'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

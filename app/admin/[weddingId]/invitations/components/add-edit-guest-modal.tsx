"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { X, Tag, Plus, FileText } from "lucide-react"
import { GuestGroup, PREDEFINED_TAGS, TAG_COLORS } from "../types"
import type { PartnerOption } from "../types"

interface GuestForm {
  name: string
  phoneNumber: string
  tags: string[]
  confirmationStatus: 'pending' | 'confirmed' | 'declined'
  dietaryRestrictions: string
  notes: string
  invitedBy: string[]
  isTraveling: boolean
  travelingFrom: string
  travelArrangement: 'will_buy_ticket' | 'no_ticket_needed' | null
  noTicketReason: string
  ticketAttachmentUrl: string | null
}

interface EditingGuest {
  id: string
}

interface AddEditGuestModalProps {
  isOpen: boolean
  editingGuest: EditingGuest | null
  guestForm: GuestForm
  setGuestForm: React.Dispatch<React.SetStateAction<GuestForm>>
  guestGroups: GuestGroup[]
  selectedGroupId: string | null
  setSelectedGroupId: (id: string | null) => void
  isCreatingNewGroup: boolean
  setIsCreatingNewGroup: (value: boolean) => void
  newGroupNameForGuest: string
  setNewGroupNameForGuest: (value: string) => void
  partnerOptions: PartnerOption[]
  allTags?: string[]
  onClose: () => void
  onSubmit: () => void
  onSaveAndAddAnother?: () => void
  toggleGuestTag: (tag: string) => void
  isSubmitting?: boolean
}

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || TAG_COLORS.default
}

export function AddEditGuestModal({
  isOpen,
  editingGuest,
  guestForm,
  setGuestForm,
  guestGroups,
  selectedGroupId,
  setSelectedGroupId,
  isCreatingNewGroup,
  setIsCreatingNewGroup,
  newGroupNameForGuest,
  setNewGroupNameForGuest,
  partnerOptions,
  allTags = [],
  onClose,
  onSubmit,
  onSaveAndAddAnother,
  toggleGuestTag,
  isSubmitting = false,
}: AddEditGuestModalProps) {
  const [customTagInput, setCustomTagInput] = useState('')

  if (!isOpen) return null

  // Merge predefined + existing custom tags from the system
  const customTags = allTags.filter(t => !PREDEFINED_TAGS.includes(t))
  const displayTags = [...PREDEFINED_TAGS, ...customTags]

  const handleAddCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase()
    if (!tag) return
    if (!guestForm.tags.includes(tag)) {
      toggleGuestTag(tag)
    }
    setCustomTagInput('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <h2 className="text-xl font-semibold text-foreground">
            {editingGuest ? "Edit Guest" : "Add Guest"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Guest Name *
            </label>
            <Input
              value={guestForm.name}
              onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Phone Number
            </label>
            <Input
              type="tel"
              value={guestForm.phoneNumber}
              onChange={(e) => setGuestForm({ ...guestForm, phoneNumber: e.target.value })}
              placeholder="+1 555 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Group *
            </label>
            {!isCreatingNewGroup ? (
              <div className="space-y-2">
                <select
                  value={selectedGroupId || ""}
                  onChange={(e) => setSelectedGroupId(e.target.value || null)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                >
                  <option value="">Select a group...</option>
                  {guestGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNewGroup(true)
                    setSelectedGroupId(null)
                  }}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Create new group
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  value={newGroupNameForGuest}
                  onChange={(e) => setNewGroupNameForGuest(e.target.value)}
                  placeholder="Enter new group name"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNewGroup(false)
                    setNewGroupNameForGuest("")
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Select existing group instead
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              All guests must belong to a group. If no group is selected, one will be created automatically.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {displayTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleGuestTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    guestForm.tags.includes(tag)
                      ? getTagColor(tag)
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomTag()
                  }
                }}
                placeholder="Add custom tag..."
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Confirmation Status
            </label>
            <select
              value={guestForm.confirmationStatus}
              onChange={(e) =>
                setGuestForm({
                  ...guestForm,
                  confirmationStatus: e.target.value as 'pending' | 'confirmed' | 'declined',
                })
              }
              className="w-full h-9 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Dietary Restrictions
            </label>
            <Input
              value={guestForm.dietaryRestrictions}
              onChange={(e) =>
                setGuestForm({ ...guestForm, dietaryRestrictions: e.target.value })
              }
              placeholder="e.g., Vegetarian, Gluten-free"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <Input
              value={guestForm.notes}
              onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
              placeholder="Optional notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Invited By
            </label>
            <div className="flex flex-wrap gap-2">
              {partnerOptions.map((partner) => (
                <button
                  key={partner.key}
                  type="button"
                  onClick={() =>
                    setGuestForm((prev) => ({
                      ...prev,
                      invitedBy: prev.invitedBy.includes(partner.key)
                        ? prev.invitedBy.filter((k) => k !== partner.key)
                        : [...prev.invitedBy, partner.key],
                    }))
                  }
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    guestForm.invitedBy.includes(partner.key)
                      ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {partner.name}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Information Section - Always visible for admin to pre-configure */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Travel Information</h3>

            <div className="flex items-center gap-2">
              <Switch
                checked={guestForm.isTraveling}
                onCheckedChange={(checked) =>
                  setGuestForm({ ...guestForm, isTraveling: checked })
                }
              />
              <label className="text-sm font-medium text-foreground">
                Guest is traveling
              </label>
            </div>

            {guestForm.isTraveling && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Traveling From
                  </label>
                  <Input
                    value={guestForm.travelingFrom}
                    onChange={(e) =>
                      setGuestForm({ ...guestForm, travelingFrom: e.target.value })
                    }
                    placeholder="City or location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Travel Arrangement
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() =>
                        setGuestForm({ ...guestForm, travelArrangement: 'will_buy_ticket' })
                      }
                      className={`w-full px-3 py-2 rounded-lg border-2 transition-colors text-sm text-left ${
                        guestForm.travelArrangement === 'will_buy_ticket'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-border bg-background text-foreground hover:border-primary/50'
                      }`}
                    >
                      Will purchase ticket (requires verification)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setGuestForm({ ...guestForm, travelArrangement: 'no_ticket_needed' })
                      }
                      className={`w-full px-3 py-2 rounded-lg border-2 transition-colors text-sm text-left ${
                        guestForm.travelArrangement === 'no_ticket_needed'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-border bg-background text-foreground hover:border-primary/50'
                      }`}
                    >
                      Does not need ticket (requires reason)
                    </button>
                  </div>
                </div>

                {guestForm.travelArrangement === 'no_ticket_needed' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Reason for No Ticket
                    </label>
                    <Input
                      value={guestForm.noTicketReason}
                      onChange={(e) =>
                        setGuestForm({ ...guestForm, noTicketReason: e.target.value })
                      }
                      placeholder="e.g., Lives at destination, traveling by car, etc."
                    />
                  </div>
                )}

                {guestForm.ticketAttachmentUrl && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Ticket uploaded</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => window.open(guestForm.ticketAttachmentUrl!, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {!editingGuest && onSaveAndAddAnother && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onSaveAndAddAnother}
              disabled={!guestForm.name || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save & Add Another'}
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={onSubmit}
            disabled={!guestForm.name || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : `${editingGuest ? "Update" : "Add"} Guest`}
          </Button>
        </div>
      </Card>
    </div>
  )
}

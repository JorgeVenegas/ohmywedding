"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Tag, Plus } from "lucide-react"
import { Guest, PREDEFINED_TAGS, TAG_COLORS } from "../types"

interface TempGuestForm {
  name: string
  phoneNumber: string
  tags: string[]
  confirmationStatus: 'pending' | 'confirmed' | 'declined'
  dietaryRestrictions: string
  notes: string
}

interface GuestInGroupModal {
  id: string
  name: string
  phoneNumber: string
  tags: string[]
  confirmationStatus: 'pending' | 'confirmed' | 'declined'
  dietaryRestrictions: string
  notes: string
}

interface GroupForm {
  name: string
  phoneNumber: string
  tags: string[]
  notes: string
  invitedBy: string[]
}

interface EditingGroup {
  id: string
  guests?: Guest[]
}

interface AddEditGroupModalProps {
  isOpen: boolean
  editingGroup: EditingGroup | null
  groupForm: GroupForm
  setGroupForm: React.Dispatch<React.SetStateAction<GroupForm>>
  partnerOptions: string[]
  guestsInGroupModal: GuestInGroupModal[]
  isAddingGuestInModal: boolean
  setIsAddingGuestInModal: (value: boolean) => void
  tempGuestForm: TempGuestForm
  setTempGuestForm: React.Dispatch<React.SetStateAction<TempGuestForm>>
  onClose: () => void
  onSubmit: () => void
  addGuestToGroupModal: () => void
  removeGuestFromGroupModal: (id: string) => void
  toggleTag: (tag: string) => void
  toggleTempGuestTag: (tag: string) => void
}

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || TAG_COLORS.default
}

export function AddEditGroupModal({
  isOpen,
  editingGroup,
  groupForm,
  setGroupForm,
  partnerOptions,
  guestsInGroupModal,
  isAddingGuestInModal,
  setIsAddingGuestInModal,
  tempGuestForm,
  setTempGuestForm,
  onClose,
  onSubmit,
  addGuestToGroupModal,
  removeGuestFromGroupModal,
  toggleTag,
  toggleTempGuestTag,
}: AddEditGroupModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <h2 className="text-xl font-semibold text-foreground">
            {editingGroup ? "Edit Group" : "Add Guest Group"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Group Name *
            </label>
            <Input
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              placeholder="e.g., The Smith Family"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Phone Number
            </label>
            {editingGroup && editingGroup.guests && editingGroup.guests.some((g: Guest) => g.phone_number) ? (
              <select
                value={groupForm.phoneNumber}
                onChange={(e) => setGroupForm({ ...groupForm, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">Select from guest phones or leave empty</option>
                {editingGroup.guests
                  .filter((g: Guest) => g.phone_number)
                  .map((g: Guest) => (
                    <option key={g.id} value={g.phone_number || ""}>
                      {g.name}: {g.phone_number}
                    </option>
                  ))}
              </select>
            ) : (
              <Input
                value={groupForm.phoneNumber}
                onChange={(e) => setGroupForm({ ...groupForm, phoneNumber: e.target.value })}
                placeholder="e.g., +1 555 123 4567"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    groupForm.tags.includes(tag)
                      ? getTagColor(tag)
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <Input
              value={groupForm.notes}
              onChange={(e) => setGroupForm({ ...groupForm, notes: e.target.value })}
              placeholder="Optional notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Invited By
            </label>
            <div className="flex flex-wrap gap-2">
              {partnerOptions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    setGroupForm((prev) => ({
                      ...prev,
                      invitedBy: prev.invitedBy.includes(name)
                        ? prev.invitedBy.filter((n) => n !== name)
                        : [...prev.invitedBy, name],
                    }))
                  }
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    groupForm.invitedBy.includes(name)
                      ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Guests Section - Only show when creating a new group */}
          {!editingGroup && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">
                  Guests ({guestsInGroupModal.length})
                </label>
                {!isAddingGuestInModal && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingGuestInModal(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Guest
                  </Button>
                )}
              </div>

              {/* List of added guests */}
              {guestsInGroupModal.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {guestsInGroupModal.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {guest.name}
                        </div>
                        {guest.phoneNumber && (
                          <div className="text-xs text-muted-foreground">
                            {guest.phoneNumber}
                          </div>
                        )}
                        {guest.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {guest.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={() => removeGuestFromGroupModal(guest.id)}
                      >
                        <X className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add guest form */}
              {isAddingGuestInModal && (
                <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border">
                  <div>
                    <Input
                      value={tempGuestForm.name}
                      onChange={(e) =>
                        setTempGuestForm({ ...tempGuestForm, name: e.target.value })
                      }
                      placeholder="Guest name *"
                      autoFocus
                    />
                  </div>

                  <div>
                    <Input
                      value={tempGuestForm.phoneNumber}
                      onChange={(e) =>
                        setTempGuestForm({ ...tempGuestForm, phoneNumber: e.target.value })
                      }
                      placeholder="Phone number (optional)"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {PREDEFINED_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTempGuestTag(tag)}
                          className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                            tempGuestForm.tags.includes(tag)
                              ? getTagColor(tag)
                              : "bg-background text-muted-foreground border-border hover:border-primary/50"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <select
                      value={tempGuestForm.confirmationStatus}
                      onChange={(e) =>
                        setTempGuestForm({
                          ...tempGuestForm,
                          confirmationStatus: e.target.value as 'pending' | 'confirmed' | 'declined',
                        })
                      }
                      className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>

                  <div>
                    <Input
                      value={tempGuestForm.dietaryRestrictions}
                      onChange={(e) =>
                        setTempGuestForm({
                          ...tempGuestForm,
                          dietaryRestrictions: e.target.value,
                        })
                      }
                      placeholder="Dietary restrictions (optional)"
                      className="text-xs"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setIsAddingGuestInModal(false)
                        setTempGuestForm({
                          name: "",
                          phoneNumber: "",
                          tags: [],
                          confirmationStatus: "pending",
                          dietaryRestrictions: "",
                          notes: "",
                        })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={addGuestToGroupModal}
                      disabled={!tempGuestForm.name.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 p-6 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={onSubmit}
            disabled={!groupForm.name}
          >
            {editingGroup ? "Update" : "Add"} Group
          </Button>
        </div>
      </Card>
    </div>
  )
}

"use client"

import {
  Users,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MailCheck,
  Send,
  Plane,
  Ticket,
  X,
  Edit2,
  Trash2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Guest, ColumnVisibility, TAG_COLORS, resolveInvitedBy } from "../types"

export type SortColumn = 'name' | 'group' | 'status' | null
export type SortDirection = 'asc' | 'desc'

interface GuestsTableFlatProps {
  filteredGuests: Guest[]
  totalGuests: number
  selectedGuestIds: Set<string>
  toggleSelectAll: () => void
  toggleGuestSelection: (id: string) => void
  visibleColumns: ColumnVisibility
  sortColumn: SortColumn
  sortDirection: SortDirection
  handleSort: (column: 'name' | 'group' | 'status') => void
  handleUpdateGuestStatus: (guest: Guest, status: 'pending' | 'confirmed' | 'declined') => void
  openEditGuest: (guest: Guest) => void
  handleDeleteGuest: (guestId: string) => void
  handleSendGuestInvite: (guest: Guest) => void
  updateGuestInvitationStatus: (guestId: string, sent: boolean) => void
  partnerNames: { partner1: string; partner2: string }
}

function getTagColor(tag: string): string {
  return TAG_COLORS[tag.toLowerCase()] || TAG_COLORS.default
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

export function GuestsTableFlat({
  filteredGuests,
  totalGuests,
  selectedGuestIds,
  toggleSelectAll,
  toggleGuestSelection,
  visibleColumns,
  sortColumn,
  sortDirection,
  handleSort,
  handleUpdateGuestStatus,
  openEditGuest,
  handleDeleteGuest,
  handleSendGuestInvite,
  updateGuestInvitationStatus,
  partnerNames,
}: GuestsTableFlatProps) {
  return (
    <Card className="border border-border overflow-hidden shadow-sm">
      {filteredGuests.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No guests found</h3>
          <p className="text-muted-foreground">
            {totalGuests === 0 ? "Add your first guest to get started" : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/20 border-b border-border">
              <tr>
                <th className="px-2 py-2 text-left w-8">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-4 h-4 border rounded flex items-center justify-center ${selectedGuestIds.size === filteredGuests.length && filteredGuests.length > 0
                        ? 'bg-primary border-primary'
                        : selectedGuestIds.size > 0
                          ? 'bg-primary/50 border-primary'
                          : 'border-border'
                      }`}
                  >
                    {selectedGuestIds.size === filteredGuests.length && filteredGuests.length > 0 && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                    {selectedGuestIds.size > 0 && selectedGuestIds.size < filteredGuests.length && (
                      <div className="w-2 h-0.5 bg-primary-foreground" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                  >
                    Name
                    {sortColumn === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </button>
                </th>
                {visibleColumns.phone && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Phone
                  </th>
                )}
                {visibleColumns.group && (
                  <th className="px-3 py-2 text-left">
                    <button
                      onClick={() => handleSort('group')}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                    >
                      Group
                      {sortColumn === 'group' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                )}
                {visibleColumns.tags && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tags
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="px-3 py-2 text-left">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                    >
                      Status
                      {sortColumn === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                )}
                {visibleColumns.dietary && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Dietary
                  </th>
                )}
                {visibleColumns.invitedBy && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Invited By
                  </th>
                )}
                {visibleColumns.inviteSent && (
                  <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Invite
                  </th>
                )}
                {visibleColumns.travelInfo && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Travel Info
                  </th>
                )}
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest, index) => (
                <tr
                  key={guest.id}
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${index % 2 === 0 ? "bg-background" : "bg-muted/10"
                    } ${selectedGuestIds.has(guest.id) ? "bg-primary/5" : ""}`}
                >
                  <td className="px-2 py-2">
                    <button
                      onClick={() => toggleGuestSelection(guest.id)}
                      className={`w-4 h-4 border rounded flex items-center justify-center ${selectedGuestIds.has(guest.id) ? 'bg-primary border-primary' : 'border-border'
                        }`}
                    >
                      {selectedGuestIds.has(guest.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                    </button>
                  </td>
                  <td className="px-3 py-2 font-medium text-foreground">{guest.name}</td>
                  {visibleColumns.phone && (
                    <td className="px-3 py-2 text-muted-foreground">{guest.phone_number || "-"}</td>
                  )}
                  {visibleColumns.group && (
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {guest.groupName !== undefined && guest.groupName !== null ? (
                          <span className="text-muted-foreground">{guest.groupName}</span>
                        ) : guest.guest_group_id ? (
                          <>
                            <span className="italic text-muted-foreground">(Unnamed Group)</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 border border-amber-300">
                                    <span className="text-amber-600 text-xs font-bold">!</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">This group needs a name</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        ) : (
                          <span className="italic text-muted-foreground/50">Ungrouped</span>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.tags && (
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {guest.allTags?.map(tag => (
                          <span
                            key={tag}
                            className={`px-1.5 py-0.5 text-[10px] rounded-full border ${getTagColor(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                        {(!guest.allTags || guest.allTags.length === 0) && "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="px-3 py-2">
                      <select
                        value={guest.confirmation_status}
                        onChange={(e) => handleUpdateGuestStatus(guest, e.target.value as 'pending' | 'confirmed' | 'declined')}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer border-0 ${getStatusBadgeClass(guest.confirmation_status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                  )}
                  {visibleColumns.dietary && (
                    <td className="px-3 py-2 text-muted-foreground">
                      {guest.dietary_restrictions || "-"}
                    </td>
                  )}
                  {visibleColumns.invitedBy && (
                    <td className="px-3 py-2">
                      {guest.invited_by && guest.invited_by.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {guest.invited_by.map(ref => (
                            <span
                              key={ref}
                              className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200"
                            >
                              {resolveInvitedBy(ref, partnerNames)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.inviteSent && (
                    <td className="px-3 py-2 text-center">
                      {guest.invitation_sent ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateGuestInvitationStatus(guest.id, false)
                          }}
                          className="inline-flex items-center gap-1 text-[10px] text-green-600 hover:text-green-700 cursor-pointer transition-colors"
                          title="Click to mark as not sent"
                        >
                          <MailCheck className="w-3.5 h-3.5" />
                          Sent
                        </button>
                      ) : guest.phone_number ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => handleSendGuestInvite(guest)}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Send
                        </Button>
                      ) : null}
                    </td>
                  )}
                  {visibleColumns.travelInfo && (
                    <td className="px-3 py-2">
                      {guest.confirmation_status === 'confirmed' && guest.is_traveling ? (
                        <TooltipProvider>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                  <Plane className="w-3 h-3 text-blue-700" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Guest is traveling{guest.traveling_from ? ` from ${guest.traveling_from}` : ''}</p>
                              </TooltipContent>
                            </Tooltip>
                            {guest.travel_arrangement === 'will_buy_ticket' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                    <Ticket className="w-3 h-3 text-blue-700" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Travel arrangement: Will purchase ticket</p>
                                  <p className="text-xs opacity-80">(verification required)</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {guest.travel_arrangement === 'no_ticket_needed' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 border border-purple-200 cursor-help">
                                    <X className="w-3 h-3 text-purple-700" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Travel arrangement: No ticket needed</p>
                                  {guest.no_ticket_reason && <p className="text-xs opacity-80 mt-1">{guest.no_ticket_reason}</p>}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {guest.ticket_attachment_url && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 border border-green-200 cursor-help">
                                    <Check className="w-3 h-3 text-green-700" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Travel ticket uploaded and verified</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openEditGuest(guest)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleDeleteGuest(guest.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

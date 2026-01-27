"use client"

import React from "react"
import {
  Users2,
  Check,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  Plus,
  Phone,
  Send,
  Mail,
  MailCheck,
  MoreVertical,
  Copy,
  Link,
  Eye,
  EyeOff,
  UserPlus,
  Plane,
  Ticket,
  X,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Guest, GuestGroup, ColumnVisibility, TAG_COLORS } from "../types"

export type SortColumn = 'name' | 'group' | 'status' | null
export type SortDirection = 'asc' | 'desc'

interface GuestsTableGroupsProps {
  filteredGroups: GuestGroup[]
  ungroupedGuests: Guest[]
  guestGroupsCount: number
  expandedGroups: Set<string>
  toggleGroupExpansion: (groupId: string) => void
  showUngroupedExpanded: boolean
  setShowUngroupedExpanded: (expanded: boolean) => void
  selectedGuestIds: Set<string>
  toggleSelectGroup: (groupGuests: Guest[]) => void
  toggleGuestSelection: (guestId: string) => void
  isGroupFullySelected: (groupGuests: Guest[]) => boolean
  isGroupPartiallySelected: (groupGuests: Guest[]) => boolean
  visibleColumns: ColumnVisibility
  sortColumn: SortColumn
  sortDirection: SortDirection
  handleSort: (column: 'name' | 'group' | 'status') => void
  handleUpdateGuestStatus: (guest: Guest, status: 'pending' | 'confirmed' | 'declined') => void
  handleGroupStatusUpdate: (group: GuestGroup, status: 'pending' | 'confirmed' | 'declined') => void
  openEditGuest: (guest: Guest) => void
  openEditGroup: (group: GuestGroup) => void
  openAddGuestToGroup: (groupId: string) => void
  handleDeleteGuest: (guestId: string) => void
  handleDeleteGroup: (groupId: string) => void
  handleSendGuestInvite: (guest: Guest) => void
  handleSendGroupInvite: (group: GuestGroup) => void
  handleCopyRSVPLink: (group: GuestGroup) => void
  updateGuestInvitationStatus: (guestId: string, sent: boolean) => void
  updateGroupInvitationStatus: (groupId: string, sent: boolean) => void
  openGroupTravelDialog: (group: GuestGroup) => void
  setSelectedGroupForMessage: (group: GuestGroup | null) => void
  setShowMessageModal: (show: boolean) => void
  getInvitationUrl: (groupId?: string) => string
  navigateToGroupDetails: (groupId: string) => void
}

function getTagColor(tag: string): string {
  return TAG_COLORS[tag.toLowerCase()] || TAG_COLORS.default
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-700 border border-green-200'
    case 'declined':
      return 'bg-red-100 text-red-700 border border-red-200'
    default:
      return 'bg-amber-100 text-amber-700 border border-amber-200'
  }
}

export function GuestsTableGroups({
  filteredGroups,
  ungroupedGuests,
  guestGroupsCount,
  expandedGroups,
  toggleGroupExpansion,
  showUngroupedExpanded,
  setShowUngroupedExpanded,
  selectedGuestIds,
  toggleSelectGroup,
  toggleGuestSelection,
  isGroupFullySelected,
  isGroupPartiallySelected,
  visibleColumns,
  sortColumn,
  sortDirection,
  handleSort,
  handleUpdateGuestStatus,
  handleGroupStatusUpdate,
  openEditGuest,
  openEditGroup,
  openAddGuestToGroup,
  handleDeleteGuest,
  handleDeleteGroup,
  handleSendGuestInvite,
  handleSendGroupInvite,
  handleCopyRSVPLink,
  updateGuestInvitationStatus,
  updateGroupInvitationStatus,
  openGroupTravelDialog,
  setSelectedGroupForMessage,
  setShowMessageModal,
  getInvitationUrl,
  navigateToGroupDetails,
}: GuestsTableGroupsProps) {
  return (
    <Card className="border border-border overflow-hidden shadow-sm">
      {filteredGroups.length === 0 && ungroupedGuests.length === 0 ? (
        <div className="p-12 text-center">
          <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No groups found</h3>
          <p className="text-muted-foreground">
            {guestGroupsCount === 0 ? "Create your first group to get started" : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/20 border-b border-border">
              <tr>
                <th className="px-2 py-2 w-8"></th>
                <th className="px-2 py-2 w-8"></th>
                <th className="px-3 py-2 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                  >
                    Group Name
                    {sortColumn === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Guests
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    Confirmed
                  </span>
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Pending
                  </span>
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <span className="inline-flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-600" />
                    Declined
                  </span>
                </th>
                {visibleColumns.tags && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tags
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
              {filteredGroups.map((group, index) => {
                const confirmedCount = group.guests.filter(g => g.confirmation_status === 'confirmed').length
                const pendingCount = group.guests.filter(g => g.confirmation_status === 'pending').length
                const declinedCount = group.guests.filter(g => g.confirmation_status === 'declined').length
                const allGroupTags = [...new Set([
                  ...(group.tags || []),
                  ...group.guests.flatMap(g => g.tags || [])
                ])]
                const allGroupInvitedBy = [...new Set([
                  ...(group.invited_by || []),
                  ...group.guests.flatMap(g => g.invited_by || [])
                ])]
                const allGuestsInvited = group.guests.length > 0 && group.guests.every(g => g.invitation_sent)
                const someGuestsInvited = group.guests.some(g => g.invitation_sent)
                const isExpanded = expandedGroups.has(group.id)

                return (
                  <React.Fragment key={group.id}>
                    {/* Group Row */}
                    <tr
                      className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${index % 2 === 0 ? "bg-background" : "bg-muted/10"
                        } ${isExpanded ? "bg-muted/40" : ""} ${isGroupFullySelected(group.guests) ? "bg-primary/5" : ""}`}
                      onClick={() => toggleGroupExpansion(group.id)}
                    >
                      <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelectGroup(group.guests)}
                          className={`w-4 h-4 border rounded flex items-center justify-center ${isGroupFullySelected(group.guests)
                              ? 'bg-primary border-primary'
                              : isGroupPartiallySelected(group.guests)
                                ? 'bg-primary/50 border-primary'
                                : 'border-border'
                            }`}
                        >
                          {isGroupFullySelected(group.guests) && <Check className="w-3 h-3 text-primary-foreground" />}
                          {isGroupPartiallySelected(group.guests) && <div className="w-2 h-0.5 bg-primary-foreground" />}
                        </button>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{group.name}</span>
                            {/* Opened indicator */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${group.open_count > 0
                                      ? 'bg-blue-100 border border-blue-200'
                                      : 'bg-gray-100 border border-gray-200'
                                    }`}>
                                    {group.open_count > 0 ? (
                                      <Eye className="w-3 h-3 text-blue-600" />
                                    ) : (
                                      <EyeOff className="w-3 h-3 text-gray-400" />
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {group.open_count > 0 ? (
                                    <>
                                      <p>Opened {group.open_count} time{group.open_count > 1 ? 's' : ''}</p>
                                      {group.first_opened_at && (
                                        <p className="text-xs opacity-80">
                                          First opened: {new Date(group.first_opened_at).toLocaleDateString()}
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p>Not opened yet</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {group.message && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedGroupForMessage(group)
                                        setShowMessageModal(true)
                                      }}
                                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 border border-blue-200 cursor-pointer transition-colors"
                                    >
                                      <Mail className="w-3 h-3 text-blue-700" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Has message - click to view</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {group.phone_number && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {group.phone_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-muted text-xs font-medium">
                          {group.guests.length}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {confirmedCount > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            {confirmedCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {pendingCount > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                            {pendingCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {declinedCount > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            {declinedCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      {visibleColumns.tags && (
                        <td className="px-3 py-2">
                          <div className="flex gap-1 flex-wrap">
                            {allGroupTags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className={`px-1.5 py-0.5 text-[10px] rounded-full border ${getTagColor(tag)}`}
                              >
                                {tag}
                              </span>
                            ))}
                            {allGroupTags.length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground">
                                +{allGroupTags.length - 3}
                              </span>
                            )}
                            {allGroupTags.length === 0 && "-"}
                          </div>
                        </td>
                      )}
                      {visibleColumns.invitedBy && (
                        <td className="px-3 py-2">
                          {allGroupInvitedBy.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {allGroupInvitedBy.map(name => (
                                <span
                                  key={name}
                                  className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.inviteSent && (
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            {/* Status Indicator - Clickable to toggle */}
                            {allGuestsInvited ? (
                              <button
                                onClick={() => updateGroupInvitationStatus(group.id, false)}
                                className="hover:opacity-70 transition-opacity"
                                title="Click to mark as not sent"
                              >
                                <MailCheck className="w-3.5 h-3.5 text-green-600" />
                              </button>
                            ) : someGuestsInvited ? (
                              <button
                                onClick={() => updateGroupInvitationStatus(group.id, true)}
                                className="hover:opacity-70 transition-opacity"
                                title="Click to mark as sent"
                              >
                                <Mail className="w-3.5 h-3.5 text-amber-600" />
                              </button>
                            ) : (
                              <span title="No invites sent">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                              </span>
                            )}

                            <div className="w-px h-4 bg-border" />

                            {/* Action Buttons */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                const rsvpUrl = getInvitationUrl(group.id)
                                window.open(rsvpUrl, '_blank')
                              }}
                              title="Open RSVP page"
                            >
                              <Link className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyRSVPLink(group)
                              }}
                              title="Copy RSVP link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            {!allGuestsInvited && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSendGroupInvite(group)
                                }}
                                title="Send invite"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.travelInfo && (
                        <td className="px-3 py-2">
                          {(() => {
                            const travelingGuests = group.guests.filter(g => g.is_traveling)
                            if (travelingGuests.length === 0) {
                              return <span className="text-muted-foreground text-[10px]">-</span>
                            }

                            const willBuyTicket = travelingGuests.some(g => g.travel_arrangement === 'will_buy_ticket')
                            const noTicketNeeded = travelingGuests.some(g => g.travel_arrangement === 'no_ticket_needed')
                            const hasTicketUploaded = travelingGuests.some(g => g.ticket_attachment_url)

                            return (
                              <TooltipProvider>
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                        <Plane className="w-3 h-3 text-blue-700" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{travelingGuests.length} guest{travelingGuests.length > 1 ? 's' : ''} traveling</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  {willBuyTicket && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                          <Ticket className="w-3 h-3 text-blue-700" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Some guests will purchase tickets</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {noTicketNeeded && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 border border-purple-200 cursor-help">
                                          <X className="w-3 h-3 text-purple-700" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Some guests don&apos;t need tickets</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {hasTicketUploaded && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 border border-green-200 cursor-help">
                                          <Check className="w-3 h-3 text-green-700" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Some guests have uploaded tickets</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TooltipProvider>
                            )
                          })()}
                        </td>
                      )}
                      <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigateToGroupDetails(group.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyRSVPLink(group)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy RSVP Link
                            </DropdownMenuItem>
                            {group.message && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedGroupForMessage(group)
                                setShowMessageModal(true)
                              }}>
                                <Mail className="w-4 h-4 mr-2" />
                                View Message
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openAddGuestToGroup(group.id)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add Guest
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditGroup(group)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Group
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleGroupStatusUpdate(group, 'confirmed')}
                              className="text-green-600"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Confirm All
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleGroupStatusUpdate(group, 'pending')}
                              className="text-amber-600"
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Set All Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleGroupStatusUpdate(group, 'declined')}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Decline All
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openGroupTravelDialog(group)}>
                              <Plane className="w-4 h-4 mr-2" />
                              Set Travel Info
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!allGuestsInvited && (
                              <DropdownMenuItem onClick={() => handleSendGroupInvite(group)}>
                                <Send className="w-4 h-4 mr-2" />
                                Send Invites
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteGroup(group.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>

                    {/* Expanded Guest Rows */}
                    {isExpanded && (
                      <>
                        {group.guests.length === 0 ? (
                          <tr className="bg-muted/20">
                            <td colSpan={11} className="px-8 py-4 text-center text-muted-foreground">
                              <p className="mb-2">No guests in this group</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openAddGuestToGroup(group.id)
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Guest
                              </Button>
                            </td>
                          </tr>
                        ) : (
                          group.guests.map((guest) => (
                            <tr
                              key={guest.id}
                              className={`border-b border-border bg-muted/20 hover:bg-muted/40 transition-colors ${selectedGuestIds.has(guest.id) ? "bg-primary/5" : ""
                                }`}
                            >
                              <td className="px-2 py-2 text-center">
                                <button
                                  onClick={() => toggleGuestSelection(guest.id)}
                                  className={`w-4 h-4 border rounded flex items-center justify-center ${selectedGuestIds.has(guest.id) ? 'bg-primary border-primary' : 'border-border'
                                    }`}
                                >
                                  {selectedGuestIds.has(guest.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                                </button>
                              </td>
                              <td className="px-2 py-2"></td>
                              <td className="px-3 py-2 pl-4">
                                <span className="text-foreground">{guest.name}</span>
                              </td>
                              <td className="px-3 py-2 text-center text-muted-foreground text-xs">
                                {guest.phone_number || "-"}
                              </td>
                              <td colSpan={3} className="px-3 py-2 text-center">
                                <select
                                  value={guest.confirmation_status}
                                  onChange={(e) => handleUpdateGuestStatus(guest, e.target.value as 'pending' | 'confirmed' | 'declined')}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer border-0 ${getStatusBadgeClass(guest.confirmation_status)}`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="declined">Declined</option>
                                </select>
                              </td>
                              {visibleColumns.tags && (
                                <td className="px-3 py-2">
                                  <div className="flex gap-1 flex-wrap">
                                    {guest.tags?.map(tag => (
                                      <span
                                        key={tag}
                                        className={`px-1.5 py-0.5 text-[10px] rounded-full border ${getTagColor(tag)}`}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {(!guest.tags || guest.tags.length === 0) && "-"}
                                  </div>
                                </td>
                              )}
                              {visibleColumns.invitedBy && (
                                <td className="px-3 py-2">
                                  {guest.invited_by && guest.invited_by.length > 0 ? (
                                    <div className="flex gap-1 flex-wrap">
                                      {guest.invited_by.map(name => (
                                        <span
                                          key={name}
                                          className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200"
                                        >
                                          {name}
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
                                    </button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-[10px]"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleSendGuestInvite(guest)
                                      }}
                                    >
                                      <Send className="w-3 h-3" />
                                    </Button>
                                  )}
                                </td>
                              )}
                              {visibleColumns.travelInfo && (
                                <td className="px-3 py-2">
                                  {guest.is_traveling ? (
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
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openEditGuest(guest)
                                    }}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteGuest(guest.id)
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </>
                    )}
                  </React.Fragment>
                )
              })}

              {/* Ungrouped Guests Section */}
              {ungroupedGuests.length > 0 && (
                <>
                  <tr
                    className={`border-b border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 transition-colors cursor-pointer ${isGroupFullySelected(ungroupedGuests) ? "bg-primary/5" : ""}`}
                    onClick={() => setShowUngroupedExpanded(!showUngroupedExpanded)}
                  >
                    <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelectGroup(ungroupedGuests)}
                        className={`w-4 h-4 border rounded flex items-center justify-center ${isGroupFullySelected(ungroupedGuests)
                            ? 'bg-primary border-primary'
                            : isGroupPartiallySelected(ungroupedGuests)
                              ? 'bg-primary/50 border-primary'
                              : 'border-amber-400'
                          }`}
                      >
                        {isGroupFullySelected(ungroupedGuests) && <Check className="w-3 h-3 text-primary-foreground" />}
                        {isGroupPartiallySelected(ungroupedGuests) && <div className="w-2 h-0.5 bg-primary-foreground" />}
                      </button>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {showUngroupedExpanded ? (
                        <ChevronDown className="w-4 h-4 text-amber-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-amber-600" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <div>
                          <div className="font-medium text-amber-800">Ungrouped Guests</div>
                          <div className="text-xs text-amber-600">Legacy - needs group assignment</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        {ungroupedGuests.length}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {ungroupedGuests.filter(g => g.confirmation_status === 'confirmed').length > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          {ungroupedGuests.filter(g => g.confirmation_status === 'confirmed').length}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {ungroupedGuests.filter(g => g.confirmation_status === 'pending').length > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                          {ungroupedGuests.filter(g => g.confirmation_status === 'pending').length}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {ungroupedGuests.filter(g => g.confirmation_status === 'declined').length > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                          {ungroupedGuests.filter(g => g.confirmation_status === 'declined').length}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    {visibleColumns.tags && <td className="px-3 py-2">-</td>}
                    {visibleColumns.invitedBy && <td className="px-3 py-2">-</td>}
                    {visibleColumns.inviteSent && <td className="px-3 py-2">-</td>}
                    {visibleColumns.travelInfo && <td className="px-3 py-2">-</td>}
                    <td className="px-3 py-2"></td>
                  </tr>
                  {showUngroupedExpanded && ungroupedGuests.map((guest) => (
                    <tr
                      key={guest.id}
                      className={`border-b border-amber-200 bg-amber-50/30 hover:bg-amber-100/30 transition-colors ${selectedGuestIds.has(guest.id) ? "bg-primary/5" : ""
                        }`}
                    >
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => toggleGuestSelection(guest.id)}
                          className={`w-4 h-4 border rounded flex items-center justify-center ${selectedGuestIds.has(guest.id) ? 'bg-primary border-primary' : 'border-border'
                            }`}
                        >
                          {selectedGuestIds.has(guest.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                        </button>
                      </td>
                      <td className="px-2 py-2"></td>
                      <td className="px-3 py-2 pl-4">
                        <span className="text-foreground">{guest.name}</span>
                      </td>
                      <td className="px-3 py-2 text-center text-muted-foreground text-xs">
                        {guest.phone_number || "-"}
                      </td>
                      <td colSpan={3} className="px-3 py-2 text-center">
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
                      {visibleColumns.tags && (
                        <td className="px-3 py-2">
                          <div className="flex gap-1 flex-wrap">
                            {guest.tags?.map(tag => (
                              <span
                                key={tag}
                                className={`px-1.5 py-0.5 text-[10px] rounded-full border ${getTagColor(tag)}`}
                              >
                                {tag}
                              </span>
                            ))}
                            {(!guest.tags || guest.tags.length === 0) && "-"}
                          </div>
                        </td>
                      )}
                      {visibleColumns.invitedBy && (
                        <td className="px-3 py-2">
                          {guest.invited_by && guest.invited_by.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {guest.invited_by.map(name => (
                                <span
                                  key={name}
                                  className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200"
                                >
                                  {name}
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
                            <span className="inline-flex items-center gap-1 text-[10px] text-green-600">
                              <MailCheck className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => handleSendGuestInvite(guest)}
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          )}
                        </td>
                      )}
                      {visibleColumns.travelInfo && (
                        <td className="px-3 py-2">
                          {guest.is_traveling ? (
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
                            className="h-6 w-6 p-0"
                            onClick={() => openEditGuest(guest)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleDeleteGuest(guest.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

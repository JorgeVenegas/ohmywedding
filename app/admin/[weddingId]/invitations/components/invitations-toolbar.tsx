"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users2,
  LayoutList,
  Search,
  X,
  Check,
  Columns,
  CheckCircle2,
  Clock,
  XCircle,
  FolderPlus,
  Plane,
  UserCheck,
  Trash2,
} from "lucide-react"
import type { GuestGroup, Guest, ColumnVisibility } from "../types"

export interface InvitationsToolbarProps {
  // View mode
  viewMode: 'flat' | 'groups'
  setViewMode: (mode: 'flat' | 'groups') => void
  // Filters
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: 'all' | 'pending' | 'confirmed' | 'declined'
  setStatusFilter: (filter: 'all' | 'pending' | 'confirmed' | 'declined') => void
  tagFilter: string
  setTagFilter: (filter: string) => void
  groupFilter: string
  setGroupFilter: (filter: string) => void
  invitedByFilter: string
  setInvitedByFilter: (filter: string) => void
  openedFilter: 'all' | 'opened' | 'not-opened'
  setOpenedFilter: (filter: 'all' | 'opened' | 'not-opened') => void
  // Filter data
  allTags: string[]
  guestGroups: GuestGroup[]
  partnerOptions: string[]
  // Filter counts
  filteredGroupsCount: number
  totalGroupsCount: number
  filteredGuestsCount: number
  totalGuestsCount: number
  // Column visibility
  visibleColumns: ColumnVisibility
  toggleColumn: (key: keyof ColumnVisibility) => void
  showColumnMenu: boolean
  setShowColumnMenu: (show: boolean) => void
  // Selection
  selectedGuestIds: Set<string>
  allGuests: Guest[]
  // Selection actions
  onBulkStatusUpdate: (status: 'pending' | 'confirmed' | 'declined') => void
  onBulkDelete: () => void
  onAssignGroup: () => void
  clearSelection: () => void
  // Travel form setup
  setGroupTravelForm: (form: {
    groupId: string
    groupName: string
    isTraveling: boolean
    travelingFrom: string
    travelArrangement: 'will_buy_ticket' | 'no_ticket_needed' | null
    noTicketReason: string
  }) => void
  setShowGroupTravelDialog: (show: boolean) => void
  // Invited by setup
  setBulkInvitedBy: (invitedBy: string[]) => void
  setShowBulkInvitedByModal: (show: boolean) => void
}

export function InvitationsToolbarContent({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  tagFilter,
  setTagFilter,
  groupFilter,
  setGroupFilter,
  invitedByFilter,
  setInvitedByFilter,
  openedFilter,
  setOpenedFilter,
  allTags,
  guestGroups,
  partnerOptions,
  filteredGroupsCount,
  totalGroupsCount,
  filteredGuestsCount,
  totalGuestsCount,
  visibleColumns,
  toggleColumn,
  showColumnMenu,
  setShowColumnMenu,
  selectedGuestIds,
  allGuests,
  onBulkStatusUpdate,
  onBulkDelete,
  onAssignGroup,
  clearSelection,
  setGroupTravelForm,
  setShowGroupTravelDialog,
  setBulkInvitedBy,
  setShowBulkInvitedByModal,
}: InvitationsToolbarProps) {
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || tagFilter !== 'all' || groupFilter !== 'all' || invitedByFilter !== 'all' || openedFilter !== 'all'

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setTagFilter('all')
    setGroupFilter('all')
    setInvitedByFilter('all')
    setOpenedFilter('all')
  }

  const handleTravelInfo = () => {
    const selectedGuests = allGuests.filter(g => selectedGuestIds.has(g.id))
    const firstGuest = selectedGuests[0]
    setGroupTravelForm({
      groupId: '',
      groupName: `${selectedGuests.length} Selected Guest${selectedGuests.length !== 1 ? 's' : ''}`,
      isTraveling: firstGuest?.is_traveling || false,
      travelingFrom: firstGuest?.traveling_from || "",
      travelArrangement: firstGuest?.travel_arrangement || null,
      noTicketReason: firstGuest?.no_ticket_reason || "",
    })
    setShowGroupTravelDialog(true)
  }

  const handleInvitedBy = () => {
    const selectedGuests = allGuests.filter(g => selectedGuestIds.has(g.id))
    if (selectedGuests.length === 1) {
      setBulkInvitedBy(selectedGuests[0].invited_by || [])
    } else if (selectedGuests.length > 1) {
      const firstInvitedBy = new Set(selectedGuests[0].invited_by || [])
      const commonInvitedBy = [...firstInvitedBy].filter(name =>
        selectedGuests.every(g => (g.invited_by || []).includes(name))
      )
      setBulkInvitedBy(commonInvitedBy)
    } else {
      setBulkInvitedBy([])
    }
    setShowBulkInvitedByModal(true)
  }

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      {/* Left: View Toggle and Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-lg bg-muted/30 p-0.5">
            <button
              onClick={() => setViewMode('groups')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${viewMode === 'groups'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              title="Groups table"
            >
              <Users2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Groups</span>
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${viewMode === 'flat'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              title="Flat guest list"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guests</span>
            </button>
        </div>

        {/* Inline Filters */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 w-36 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
        >
          <option value="all">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
          {viewMode === 'flat' && (
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="all">All Groups</option>
              <option value="ungrouped">Ungrouped</option>
              {guestGroups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          )}
          <select
            value={invitedByFilter}
            onChange={(e) => setInvitedByFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="all">All Invited By</option>
            {partnerOptions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={openedFilter}
            onChange={(e) => setOpenedFilter(e.target.value as typeof openedFilter)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="all">All Opens</option>
            <option value="opened">Opened</option>
            <option value="not-opened">Not Opened</option>
          </select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-2"
              onClick={handleClearFilters}
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {viewMode === 'groups'
              ? `${filteredGroupsCount}/${totalGroupsCount} groups`
              : `${filteredGuestsCount}/${totalGuestsCount} guests`
            }
          </span>

          {/* Column Visibility Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-2"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
            >
              <Columns className="w-3.5 h-3.5 mr-1" />
              Columns
            </Button>
            {showColumnMenu && (
              <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg z-10 min-w-[140px]">
                {(['phone', 'group', 'tags', 'status', 'invitedBy', 'inviteSent', 'travelInfo'] as const).map((key) => (
                  <button
                    key={key}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted flex items-center gap-2"
                    onClick={() => toggleColumn(key)}
                  >
                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${visibleColumns[key] ? 'bg-primary border-primary' : 'border-border'}`}>
                      {visibleColumns[key] && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </div>
                    <span className="capitalize">
                      {key === 'inviteSent' ? 'Invite Sent' :
                        key === 'invitedBy' ? 'Invited By' :
                          key === 'travelInfo' ? 'Travel Info' :
                            key}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selection Actions */}
          {selectedGuestIds.size > 0 && (
            <>
              <div className="h-5 w-px bg-border mx-1" />
              <span className="text-xs font-medium text-foreground">
                {selectedGuestIds.size} selected
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => onBulkStatusUpdate('confirmed')}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  onClick={() => onBulkStatusUpdate('pending')}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onBulkStatusUpdate('declined')}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Decline
                </Button>
              </div>
              <div className="h-5 w-px bg-border mx-1" />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onAssignGroup}
              >
                <FolderPlus className="w-3 h-3 mr-1" />
                Assign Group
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={handleTravelInfo}
              >
                <Plane className="w-3 h-3 mr-1" />
                Travel Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                onClick={handleInvitedBy}
              >
                <UserCheck className="w-3 h-3 mr-1" />
                Invited By
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onBulkDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={clearSelection}
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>

  )
}

export function InvitationsToolbar(props: InvitationsToolbarProps) {
  return (
    <div className="bg-background py-3 border-b border-border/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InvitationsToolbarContent {...props} />
      </div>
    </div>
  )
}

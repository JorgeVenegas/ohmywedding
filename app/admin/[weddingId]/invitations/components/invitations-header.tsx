"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  Plus,
  ChevronDown,
  UserPlus,
  FolderPlus,
  Upload,
  Download,
  Send,
  Settings,
} from "lucide-react"

export interface InvitationsHeaderProps {
  // Stats
  guestGroupsCount: number
  filteredGroupsCount: number
  displayedGuestCount: number
  totalGuests: number
  confirmedGuests: number
  pendingGuests: number
  declinedGuests: number
  hasActiveFilters: boolean
  // Dropdown state
  addDropdownOpen: boolean
  setAddDropdownOpen: (open: boolean) => void
  // Actions
  onAddGuest: () => void
  onAddGroup: () => void
  onImportCsv: () => void
  onExportCsv: () => void
  onOpenInviteSettings: () => void
  onOpenSendInvites: () => void
  // CSV file input handler
  onCsvFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function InvitationsHeaderContent({
  guestGroupsCount,
  filteredGroupsCount,
  displayedGuestCount,
  totalGuests,
  confirmedGuests,
  pendingGuests,
  declinedGuests,
  hasActiveFilters,
  addDropdownOpen,
  setAddDropdownOpen,
  onAddGuest,
  onAddGroup,
  onImportCsv,
  onExportCsv,
  onOpenInviteSettings,
  onOpenSendInvites,
  onCsvFileSelect,
}: InvitationsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Invitations & Guests</h1>
        <p className="text-sm text-muted-foreground">Manage your guest groups and track confirmations</p>
      </div>
      {/* Stats and Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {hasActiveFilters ? `${filteredGroupsCount}/` : ''}{guestGroupsCount} groups
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium">
            <span className="text-foreground font-semibold">{displayedGuestCount}</span>
            <span className="text-muted-foreground">guests{hasActiveFilters && totalGuests !== displayedGuestCount ? ` of ${totalGuests}` : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-green-600">{confirmedGuests}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-amber-600">{pendingGuests}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-red-600">{declinedGuests}</span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Add Actions Dropdown */}
          <DropdownMenu open={addDropdownOpen} onOpenChange={setAddDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add
                <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onAddGuest}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Guest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddGroup}>
                <FolderPlus className="w-4 h-4 mr-2" />
                Add Group
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  onImportCsv()
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportCsv}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Hidden file input for CSV import */}
          <input
            id="csv-import-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onCsvFileSelect}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={onOpenInviteSettings}
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Invite Settings
          </Button>
          <Button
            size="sm"
            className="h-8 bg-blue-600 hover:bg-blue-700"
            onClick={onOpenSendInvites}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Send Invites
          </Button>
        </div>
      </div>
    </div>
  )
}

export function InvitationsHeader(props: InvitationsHeaderProps) {
  return (
    <div className="sticky top-[57px] z-20 bg-background/95 backdrop-blur border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <InvitationsHeaderContent {...props} />
      </div>
    </div>
  )
}

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
  Settings,
} from "lucide-react"
import { useTranslation } from "@/components/contexts/i18n-context"

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
  showInviteSettings?: boolean
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
  showInviteSettings = false,
  onCsvFileSelect,
}: InvitationsHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
      {/* Title */}
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-1">{t('admin.invitations.title')}</p>
        <h1 className="text-2xl font-serif text-[#420c14]">{t('admin.invitations.title')}</h1>
        <p className="text-sm text-[#420c14]/60 mt-0.5">{t('admin.invitations.subtitle')}</p>
      </div>

      {/* Stats + buttons — single DOM instance, wraps to two lines on mobile */}
      <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-4 md:flex-shrink-0">
        {/* Stats pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#420c14]/5 text-xs font-medium">
            <Users className="w-3 h-3 text-[#420c14]/40" />
            <span className="text-[#420c14]/60">
              {hasActiveFilters ? `${filteredGroupsCount}/` : ''}{guestGroupsCount} {t('admin.invitations.header.groups')}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#420c14]/5 text-xs font-medium">
            <span className="text-[#420c14] font-semibold">{displayedGuestCount}</span>
            <span className="text-[#420c14]/50">{t('admin.invitations.header.guests')}{hasActiveFilters && totalGuests !== displayedGuestCount ? ` / ${totalGuests}` : ''}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-green-600 font-semibold">{confirmedGuests}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-amber-600 font-semibold">{pendingGuests}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-red-600 font-semibold">{declinedGuests}</span>
          </div>
        </div>
        {/* Action buttons — same instance for mobile + desktop */}
        <div className="flex items-center gap-2">
          <DropdownMenu open={addDropdownOpen} onOpenChange={setAddDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 md:h-8">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {t('admin.invitations.header.add')}
                <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onAddGuest}>
                <UserPlus className="w-4 h-4 mr-2" />
                {t('admin.invitations.header.addGuest')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddGroup}>
                <FolderPlus className="w-4 h-4 mr-2" />
                {t('admin.invitations.header.addGroup')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={e => { e.preventDefault(); onImportCsv() }}>
                <Upload className="w-4 h-4 mr-2" />
                {t('admin.invitations.header.importCsv')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportCsv}>
                <Download className="w-4 h-4 mr-2" />
                {t('admin.invitations.header.exportCsv')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input id="csv-import-input" type="file" accept=".csv" className="hidden" onChange={onCsvFileSelect} />
          {showInviteSettings && (
            <Button variant="outline" size="sm" className="h-9 md:h-8" onClick={onOpenInviteSettings}>
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">{t('admin.invitations.header.inviteSettings')}</span>
              <span className="sm:hidden">Config.</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function InvitationsHeader(props: InvitationsHeaderProps) {
  return (
    <div className="sticky top-[52px] z-20 bg-background/95 backdrop-blur border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <InvitationsHeaderContent {...props} />
      </div>
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/components/contexts/i18n-context"
import { Search, UserPlus, Check, Users2, ChevronDown, ChevronRight } from "lucide-react"
import type { SeatingGuest, SeatingTable } from "../types"

interface GuestAssignmentPanelProps {
  guests: SeatingGuest[]
  allGuests: SeatingGuest[]
  selectedTableId: string | null
  onAssignGuest: (guestId: string, tableId: string) => void
  tables: SeatingTable[]
}

export function GuestAssignmentPanel({
  guests,
  allGuests,
  selectedTableId,
  onAssignGuest,
  tables,
}: GuestAssignmentPanelProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Only show confirmed unassigned guests
  const filteredGuests = useMemo(() => {
    let list = guests.filter((g) => g.confirmation_status === "confirmed")
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.group_name && g.group_name.toLowerCase().includes(q))
      )
    }
    return list
  }, [guests, search])

  // Group guests by their guest_group_id
  const groupedGuests = useMemo(() => {
    const groups: Record<string, { name: string; guests: SeatingGuest[] }> = {}
    const ungrouped: SeatingGuest[] = []

    for (const guest of filteredGuests) {
      if (guest.guest_group_id) {
        if (!groups[guest.guest_group_id]) {
          groups[guest.guest_group_id] = {
            name: guest.group_name || 'Group',
            guests: [],
          }
        }
        groups[guest.guest_group_id].guests.push(guest)
      } else {
        ungrouped.push(guest)
      }
    }

    return { groups, ungrouped }
  }, [filteredGuests])

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const handleAssignGroup = (groupGuests: SeatingGuest[]) => {
    if (!selectedTableId) return
    for (const guest of groupGuests) {
      onAssignGuest(guest.id, selectedTableId)
    }
  }

  const selectedTable = tables.find(t => t.id === selectedTableId)

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden rounded-2xl shadow-xl border border-gray-100/80">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-900">
              {t('admin.seating.guests.unassigned')}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {filteredGuests.length} {t('admin.seating.guests.guests')}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.seating.guests.search')}
            className="h-8 text-xs pl-8 bg-gray-50 border-gray-100 focus:bg-white focus:border-gray-300 rounded-lg"
          />
        </div>

        {/* Selected table indicator */}
        {selectedTable ? (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] text-indigo-700 font-medium">
              {t('admin.seating.guests.assignToTable')}: <span className="font-bold">{selectedTable.name}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
            <span className="text-[11px] text-gray-400">
              {t('admin.seating.guests.selectTableFirst')}
            </span>
          </div>
        )}
      </div>

      {/* Guest List */}
      <div className="flex-1 overflow-y-auto border-t border-gray-50">
        {filteredGuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-600">{t('admin.seating.guests.allAssigned')}</p>
          </div>
        ) : (
          <div>
            {/* Grouped guests */}
            {Object.entries(groupedGuests.groups).map(([groupId, group]) => {
              const isCollapsed = collapsedGroups.has(groupId)
              return (
                <div key={groupId} className="border-b border-gray-100">
                  {/* Group header */}
                  <div
                    className="flex items-center gap-1 pl-0 pr-3 py-2 border-l-4 bg-[#d4a574]/10 hover:bg-[#d4a574]/15 transition-colors"
                    style={{ borderLeftColor: '#d4a574' }}
                  >
                    <button
                      className="flex items-center gap-1.5 flex-1 text-left pl-2.5"
                      onClick={() => toggleGroupCollapse(groupId)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      )}
                      <Users2 className="w-3 h-3 text-[#b8895e] opacity-80" />
                      <span className="text-[11px] font-semibold text-[#7a5a3a] tracking-wide">
                        {group.name}
                      </span>
                      <span className="text-[10px] font-semibold ml-auto mr-1 px-1.5 py-0.5 rounded-full bg-[#d4a574]/20 text-[#8a6040]">
                        {group.guests.length}
                      </span>
                    </button>

                    {/* Assign entire group button */}
                    {selectedTableId && (
                      <button
                        className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                        onClick={() => handleAssignGroup(group.guests)}
                        title={t('admin.seating.guests.assignGroup')}
                      >
                        <UserPlus className="w-2.5 h-2.5" />
                        All
                      </button>
                    )}
                  </div>

                  {/* Group members */}
                  {!isCollapsed && (
                    <div>
                      {group.guests.map((guest) => (
                        <GuestItem
                          key={guest.id}
                          guest={guest}
                          selectedTableId={selectedTableId}
                          onAssign={onAssignGuest}
                          tables={tables}
                          indent
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Ungrouped guests */}
            {groupedGuests.ungrouped.length > 0 && Object.keys(groupedGuests.groups).length > 0 && (
              <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Individual
                </span>
              </div>
            )}
            {groupedGuests.ungrouped.map((guest) => (
              <GuestItem
                key={guest.id}
                guest={guest}
                selectedTableId={selectedTableId}
                onAssign={onAssignGuest}
                tables={tables}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function GuestItem({
  guest,
  selectedTableId,
  onAssign,
  tables,
  indent,
}: {
  guest: SeatingGuest
  selectedTableId: string | null
  onAssign: (guestId: string, tableId: string) => void
  tables: SeatingTable[]
  indent?: boolean
}) {
  const [showTablePicker, setShowTablePicker] = useState(false)

  const handleClick = () => {
    if (selectedTableId) {
      onAssign(guest.id, selectedTableId)
    } else {
      setShowTablePicker(!showTablePicker)
    }
  }

  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        className={`w-full text-left px-3 py-2 hover:bg-indigo-50/50 flex items-center gap-2 text-xs group transition-colors ${indent ? 'pl-8' : ''}`}
        onClick={handleClick}
      >
        {/* Avatar circle */}
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-semibold text-gray-500 uppercase">
            {guest.name.charAt(0)}
          </span>
        </div>

        <span className="flex-1 truncate text-gray-700 font-medium">{guest.name}</span>

        {selectedTableId && (
          <UserPlus className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {/* Table picker dropdown (when no table selected on canvas) */}
      {showTablePicker && !selectedTableId && (
        <div className="px-3 pb-2 pt-1 bg-gray-50/50">
          <div className="flex flex-wrap gap-1">
            {tables.map((table) => (
              <button
                key={table.id}
                className="text-[10px] px-2 py-1 bg-white border border-gray-200 rounded-md hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors font-medium"
                onClick={() => {
                  onAssign(guest.id, table.id)
                  setShowTablePicker(false)
                }}
              >
                {table.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

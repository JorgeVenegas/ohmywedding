"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/components/contexts/i18n-context"
import { Search, Users, LayoutGrid } from "lucide-react"
import type { Dish } from "../types"
import { CATEGORY_COLORS } from "../types"

interface GuestInfo {
  id: string
  name: string
  guest_group_id: string | null
  groupName?: string
}

interface GroupInfo {
  id: string
  name: string | null
  guestCount: number
}

interface TableInfo {
  id: string
  name: string
  guestCount: number
}

interface AssignDishModalProps {
  open: boolean
  onClose: () => void
  dishes: Dish[]
  guests: GuestInfo[]
  groups: GroupInfo[]
  tables: TableInfo[]
  onAssign: (dishId: string, payload: { guest_ids?: string[]; group_id?: string; table_id?: string }) => void
  assigning?: boolean
}

type AssignMode = 'guests' | 'group' | 'table'

export function AssignDishModal({ open, onClose, dishes, guests, groups, tables, onAssign, assigning }: AssignDishModalProps) {
  const { t } = useTranslation()
  const [selectedDish, setSelectedDish] = useState<string>("")
  const [mode, setMode] = useState<AssignMode>('guests')
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set())
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [search, setSearch] = useState("")

  const filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.groupName || '').toLowerCase().includes(search.toLowerCase())
  )

  const toggleGuest = (guestId: string) => {
    setSelectedGuests(prev => {
      const next = new Set(prev)
      if (next.has(guestId)) next.delete(guestId)
      else next.add(guestId)
      return next
    })
  }

  const handleAssign = () => {
    if (!selectedDish) return
    if (mode === 'guests' && selectedGuests.size > 0) {
      onAssign(selectedDish, { guest_ids: Array.from(selectedGuests) })
    } else if (mode === 'group' && selectedGroup) {
      onAssign(selectedDish, { group_id: selectedGroup })
    } else if (mode === 'table' && selectedTable) {
      onAssign(selectedDish, { table_id: selectedTable })
    }
  }

  const canAssign = selectedDish && (
    (mode === 'guests' && selectedGuests.size > 0) ||
    (mode === 'group' && selectedGroup) ||
    (mode === 'table' && selectedTable)
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] duration-300">
        <DialogHeader>
          <DialogTitle>{t('admin.dishes.assignMenu')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Dish selector */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.dishes.selectMenu')}</label>
            <select
              value={selectedDish}
              onChange={(e) => setSelectedDish(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">{t('admin.dishes.chooseMenu')}</option>
              {dishes.map(dish => (
                <option key={dish.id} value={dish.id}>
                  {dish.name} ({t(`admin.dishes.categories.${dish.category}`)})
                </option>
              ))}
            </select>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setMode('guests')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'guests' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Users className="w-3.5 h-3.5" />
              {t('admin.dishes.byGuests')}
            </button>
            <button
              onClick={() => setMode('group')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'group' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Users className="w-3.5 h-3.5" />
              {t('admin.dishes.byGroup')}
            </button>
            <button
              onClick={() => setMode('table')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'table' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {t('admin.dishes.byTable')}
            </button>
          </div>

          {/* Guest selection */}
          {mode === 'guests' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('admin.dishes.searchGuests')}
                  className="pl-9"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                {filteredGuests.map(guest => (
                  <label
                    key={guest.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGuests.has(guest.id)}
                      onChange={() => toggleGuest(guest.id)}
                      className="rounded border-input"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{guest.name}</div>
                      {guest.groupName && (
                        <span className="text-xs text-muted-foreground">{guest.groupName}</span>
                      )}
                    </div>
                  </label>
                ))}
                {filteredGuests.length === 0 && (
                  <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                    {t('common.noResults')}
                  </div>
                )}
              </div>
              {selectedGuests.size > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedGuests.size} {t('admin.dishes.guestsSelected')}
                </p>
              )}
            </div>
          )}

          {/* Group selection */}
          {mode === 'group' && (
            <div>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">{t('admin.dishes.chooseGroup')}</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name || t('admin.invitations.defaults.unnamedGroup')} ({group.guestCount} {t('admin.seating.guests.guests')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Table selection */}
          {mode === 'table' && (
            <div>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">{t('admin.dishes.chooseTable')}</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>
                    {table.name} ({table.guestCount} {t('admin.seating.guests.guests')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected dish preview */}
          {selectedDish && (
            <div className="p-3 bg-muted/50 rounded-lg">
              {(() => {
                const dish = dishes.find(d => d.id === selectedDish)
                if (!dish) return null
                return (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[dish.category]}`}>
                      {t(`admin.dishes.categories.${dish.category}`)}
                    </span>
                    <span className="text-sm font-medium">{dish.name}</span>
                    {dish.is_vegetarian && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">🌿</span>}
                    {dish.is_vegan && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">🌱</span>}
                    {dish.is_gluten_free && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">GF</span>}
                  </div>
                )
              })()}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={assigning}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAssign} disabled={!canAssign || assigning}>
              {assigning ? t('admin.settings.saving') : t('admin.dishes.assign')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

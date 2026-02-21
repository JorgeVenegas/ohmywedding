"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/components/contexts/i18n-context"
import { X, ArrowRight, Users2, Check, Search, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { SeatingTable } from "../types"

interface MoveGuestDialogProps {
  isOpen: boolean
  currentTable: { id: string; name: string }
  guests: { id: string; name: string; guest_id: string }[]
  initialGuestId?: string | null
  tables: SeatingTable[]
  onMoveGuest: (guestId: string, newTableId: string) => void
  onClose: () => void
}

export function MoveGuestDialog({
  isOpen,
  currentTable,
  guests,
  initialGuestId,
  tables,
  onMoveGuest,
  onClose,
}: MoveGuestDialogProps) {
  const { t } = useTranslation()

  const buildInitialSelected = () => {
    if (initialGuestId) return new Set([initialGuestId])
    if (guests.length === 1) return new Set([guests[0].guest_id])
    return new Set<string>()
  }

  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(buildInitialSelected)
  const [targetTableId, setTargetTableId] = useState<string | null>(null)
  const [tableSearch, setTableSearch] = useState("")
  const [showAllGuests, setShowAllGuests] = useState(false)

  // Reset state when dialog opens / initial guest changes
  useEffect(() => {
    if (isOpen) {
      setSelectedGuestIds(buildInitialSelected())
      setTargetTableId(null)
      setTableSearch("")
      setShowAllGuests(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialGuestId])

  const otherTables = useMemo(
    () => tables.filter(t => t.id !== currentTable.id),
    [tables, currentTable.id]
  )

  const filteredTables = useMemo(() => {
    if (!tableSearch.trim()) return otherTables
    const q = tableSearch.toLowerCase()
    return otherTables.filter(t => t.name.toLowerCase().includes(q))
  }, [otherTables, tableSearch])

  // Guests visible in the list — initially only selected ones; "Add more" reveals the rest
  const visibleGuests = showAllGuests
    ? guests
    : guests.filter(g => selectedGuestIds.has(g.guest_id))

  const hiddenCount = guests.length - visibleGuests.length

  const toggleGuest = (guestId: string) => {
    setSelectedGuestIds(prev => {
      const next = new Set(prev)
      if (next.has(guestId)) next.delete(guestId)
      else next.add(guestId)
      return next
    })
  }

  const handleMove = () => {
    if (!targetTableId || selectedGuestIds.size === 0) return
    for (const guestId of selectedGuestIds) {
      onMoveGuest(guestId, targetTableId)
    }
    onClose()
  }

  const targetTable = otherTables.find(t => t.id === targetTableId)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Right-side drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-[420px] bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">
                  {t('admin.seating.table.moveGuest')}
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {t('admin.seating.moveDialog.from')}{" "}
                  <span className="font-semibold text-gray-600">{currentTable.name}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Step 1 — Guests */}
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {t('admin.seating.moveDialog.selectGuests')}
                </p>

                <div className="space-y-1.5">
                  {visibleGuests.map(g => {
                    const isSelected = selectedGuestIds.has(g.guest_id)
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGuest(g.guest_id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors border ${
                          isSelected
                            ? 'bg-primary/8 border-primary/25 text-primary'
                            : 'bg-gray-50 border-transparent text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                            isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium truncate">{g.name}</span>
                      </button>
                    )
                  })}

                  {/* Add more guests button */}
                  {hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAllGuests(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-50 border border-dashed border-gray-200 transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      {t('admin.seating.moveDialog.addMore')} ({hiddenCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Arrow divider */}
              {selectedGuestIds.size > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}

              {/* Step 2 — Destination table */}
              {selectedGuestIds.size > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                    {t('admin.seating.moveDialog.selectTable')}
                  </p>

                  {/* Table search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <Input
                      value={tableSearch}
                      onChange={e => setTableSearch(e.target.value)}
                      placeholder={t('admin.seating.moveDialog.searchTables')}
                      className="pl-8 h-8 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    {filteredTables.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">
                        {t('admin.seating.moveDialog.noTablesFound')}
                      </p>
                    )}
                    {filteredTables.map(table => {
                      const isTarget = targetTableId === table.id
                      return (
                        <button
                          key={table.id}
                          onClick={() => setTargetTableId(table.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors border ${
                            isTarget
                              ? 'bg-primary/8 border-primary/25 text-primary font-semibold'
                              : 'bg-gray-50 border-transparent text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                              isTarget ? 'bg-primary border-primary' : 'bg-white border-gray-300'
                            }`}
                          >
                            {isTarget && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="font-medium truncate flex-1 text-left">{table.name}</span>
                          <span className={`text-[10px] flex-shrink-0 ${isTarget ? 'text-primary' : 'text-gray-400'}`}>
                            {table.capacity} cap
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100">
              {(selectedGuestIds.size > 0 || targetTable) && (
                <p className="text-[11px] text-gray-400 mb-3">
                  <span className="font-semibold text-gray-700">{selectedGuestIds.size}</span>{" "}
                  {t('admin.seating.moveDialog.selected')}
                  {targetTable && (
                    <>
                      {" → "}
                      <span className="font-semibold text-gray-700">{targetTable.name}</span>
                    </>
                  )}
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="h-9 text-xs flex-1">
                  {t('admin.seating.moveDialog.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleMove}
                  disabled={!targetTableId || selectedGuestIds.size === 0}
                  className="h-9 text-xs flex-[2] bg-primary hover:bg-primary/90"
                >
                  <Users2 className="w-3.5 h-3.5 mr-1.5" />
                  {t('admin.seating.moveDialog.move')} ({selectedGuestIds.size})
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

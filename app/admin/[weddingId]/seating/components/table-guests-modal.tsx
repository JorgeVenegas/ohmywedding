"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/contexts/i18n-context"
import { X, ArrowRight, UserMinus } from "lucide-react"
import type { TableWithAssignments, SeatingTable } from "../types"

interface TableGuestsModalProps {
  table: TableWithAssignments | null
  tables: SeatingTable[]
  onClose: () => void
  onMoveGuest: (guestId: string, newTableId: string) => void
  onUnassignGuest: (guestId: string) => void
}

export function TableGuestsModal({
  table,
  tables,
  onClose,
  onMoveGuest,
  onUnassignGuest,
}: TableGuestsModalProps) {
  const { t } = useTranslation()
  const [movingGuestId, setMovingGuestId] = useState<string | null>(null)

  if (!table) return null

  const otherTables = tables.filter((t) => t.id !== table.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold text-lg">{table.name}</h2>
            <p className="text-sm text-muted-foreground">
              {table.occupancy}/{table.capacity} {t('admin.seating.table.guests').toLowerCase()}
              {table.isOverfilled && (
                <span className="text-red-600 ml-2">⚠ {t('admin.seating.table.overfilled')}</span>
              )}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Guest List */}
        <div className="flex-1 overflow-y-auto p-5">
          {table.assignedGuests.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              {t('admin.seating.table.noGuests')}
            </p>
          ) : (
            <div className="space-y-2">
              {table.assignedGuests.map((assignment, i) => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {/* Seat Number */}
                  <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary text-xs font-semibold rounded-full flex-shrink-0">
                    {i + 1}
                  </span>

                  {/* Name */}
                  <span className="flex-1 font-medium text-sm">
                    {assignment.guests?.name || 'Unknown'}
                  </span>

                  {/* Status badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      assignment.guests?.confirmation_status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {assignment.guests?.confirmation_status || '—'}
                  </span>

                  {/* Move menu */}
                  {movingGuestId === assignment.guest_id ? (
                    <div className="flex flex-col gap-0.5 bg-white border rounded-lg p-2 shadow-sm">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {t('admin.seating.table.moveGuest')}
                      </p>
                      {otherTables.map((ot) => (
                        <button
                          key={ot.id}
                          className="text-left text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                          onClick={() => {
                            onMoveGuest(assignment.guest_id, ot.id)
                            setMovingGuestId(null)
                          }}
                        >
                          → {ot.name}
                        </button>
                      ))}
                      <button
                        className="text-xs text-gray-500 hover:bg-gray-50 px-2 py-1 rounded mt-1"
                        onClick={() => setMovingGuestId(null)}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setMovingGuestId(assignment.guest_id)}
                        title={t('admin.seating.table.moveGuest')}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        onClick={() => onUnassignGuest(assignment.guest_id)}
                        title={t('admin.seating.table.removeGuest')}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

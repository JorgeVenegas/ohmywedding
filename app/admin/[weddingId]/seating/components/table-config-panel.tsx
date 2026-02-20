"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/components/contexts/i18n-context"
import { X, Copy, Trash2, Eye, UserMinus, ArrowRight, ChevronDown, ChevronRight } from "lucide-react"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import type { TableWithAssignments, SeatingTable } from "../types"
import { motion, AnimatePresence } from "framer-motion"

interface TableConfigPanelProps {
  table: TableWithAssignments
  tables: SeatingTable[]
  onUpdateTable: (updates: Partial<SeatingTable>) => void
  onDeleteTable: () => void
  onDuplicateTable: () => void
  onMirrorDuplicate: (axis: 'h' | 'v') => void
  onClose: () => void
  onUnassignGuest: (guestId: string) => void
  onMoveGuest: (guestId: string, newTableId: string) => void
  onViewGuests: () => void
}

// 40px per seat for table auto-sizing; 20px snap grid
const SEAT_UNIT = 40
const SNAP = 20

function snap20(v: number) {
  return Math.round(v / SNAP) * SNAP
}

/**
 * Compute ideal rectangular table width/height from seat distribution.
 * width  = side_a × SEAT_UNIT + 40  (long dimension)
 * height = head_a × SEAT_UNIT + 40  if heads > 0, else 80
 * Equal side & head counts → square table ✓
 */
function computeRectSize(side_a: number, head_a: number): { width: number; height: number } {
  const width  = snap20(Math.max(80, side_a * SEAT_UNIT + 40))
  const height = head_a > 0
    ? snap20(Math.max(60, head_a * SEAT_UNIT + 40))
    : 80
  return { width, height }
}

/**
 * When capacity changes, distribute seats smartly:
 * - If heads currently > 0: maintain side/head ratio
 * - Otherwise: put everything on long sides
 */
function smartDistribute(
  capacity: number,
  currentSide: number,
  currentHead: number,
): { side: number; head: number } {
  if (currentHead <= 0) {
    return { side: Math.max(1, Math.round(capacity / 2)), head: 0 }
  }
  const total = currentSide * 2 + currentHead * 2
  const sideRatio = total > 0 ? (currentSide * 2) / total : 0.8
  const newSide = Math.max(1, Math.round(capacity * sideRatio / 2))
  const newHead = Math.max(0, Math.round((capacity - newSide * 2) / 2))
  return { side: newSide, head: newHead }
}

export function TableConfigPanel({
  table,
  tables,
  onUpdateTable,
  onDeleteTable,
  onDuplicateTable,
  onMirrorDuplicate,
  onClose,
  onUnassignGuest,
  onMoveGuest,
  onViewGuests,
}: TableConfigPanelProps) {
  const { t } = useTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [movingGuestId, setMovingGuestId] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedSeats, setAdvancedSeats] = useState(false)

  const otherTables = tables.filter((t) => t.id !== table.id)
  const currentSide = table.side_a_count ?? Math.ceil(table.capacity / 2)
  const currentHead = table.head_a_count ?? 0

  const handleSideChange = (v: number) => {
    const side = Math.max(0, v)
    const head = table.head_a_count ?? 0
    const newCap = side * 2 + head * 2
    const { width, height } = computeRectSize(side, head)
    onUpdateTable({ side_a_count: side, side_b_count: side, capacity: newCap, width, height })
  }

  const handleHeadChange = (v: number) => {
    const head = Math.max(0, v)
    const side = table.side_a_count ?? Math.ceil(table.capacity / 2)
    const newCap = side * 2 + head * 2
    const { width, height } = computeRectSize(side, head)
    onUpdateTable({ head_a_count: head, head_b_count: head, capacity: newCap, width, height })
  }

  const handleCapacityChange = (cap: number) => {
    const capacity = Math.max(1, cap)
    if (table.shape !== 'rectangular') {
      onUpdateTable({ capacity })
      return
    }
    const { side, head } = smartDistribute(capacity, currentSide, currentHead)
    const { width, height } = computeRectSize(side, head)
    onUpdateTable({
      capacity,
      side_a_count: side, side_b_count: side,
      head_a_count: head, head_b_count: head,
      width, height,
    })
  }

  const handleAdvancedSeatChange = (key: 'side_a_count' | 'side_b_count' | 'head_a_count' | 'head_b_count', v: number) => {
    const val = Math.max(0, v)
    const updated = { ...table, [key]: val } as SeatingTable
    const newCap = (updated.side_a_count ?? 0) + (updated.side_b_count ?? 0) +
                   (updated.head_a_count ?? 0) + (updated.head_b_count ?? 0)
    const newSide = Math.max(updated.side_a_count ?? 0, updated.side_b_count ?? 0)
    const newHead = Math.max(updated.head_a_count ?? 0, updated.head_b_count ?? 0)
    const { width, height } = computeRectSize(newSide, newHead)
    onUpdateTable({ [key]: val, capacity: newCap, width, height } as Partial<SeatingTable>)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className="w-80 h-full bg-white flex flex-col overflow-hidden rounded-2xl shadow-xl border border-gray-100/80"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              {table.shape === 'sweetheart' ? '♥ Couple' : table.shape}
            </p>
            <h3 className="font-semibold text-sm text-gray-900">{table.name}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 space-y-3">
            {/* Name */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-gray-500">{t('admin.seating.table.name')}</Label>
              <Input
                value={table.name}
                onChange={(e) => onUpdateTable({ name: e.target.value })}
                className="h-8 text-sm bg-gray-50 border-gray-100 focus:bg-white"
              />
            </div>

            {/* Shape */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-gray-500">{t('admin.seating.table.shape')}</Label>
              <div className="flex gap-1">
                <Button
                  variant={table.shape === 'round' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateTable({ shape: 'round', width: 120, height: 120 })}
                  className="flex-1 text-xs h-8"
                >{t('admin.seating.table.round')}</Button>
                <Button
                  variant={table.shape === 'rectangular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const side = Math.ceil(table.capacity / 2)
                    const { width, height } = computeRectSize(side, 0)
                    onUpdateTable({ shape: 'rectangular', side_a_count: side, side_b_count: side, head_a_count: 0, head_b_count: 0, width, height })
                  }}
                  className="flex-1 text-xs h-8"
                >{t('admin.seating.table.rectangular')}</Button>
                <Button
                  variant={table.shape === 'sweetheart' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateTable({ shape: 'sweetheart', width: 160, height: 40, capacity: 2, side_a_count: 2, side_b_count: 0 })}
                  className="flex-1 text-xs h-8 gap-0.5"
                >♥</Button>
              </div>
            </div>

            {/* Quick Rotation */}
            {(table.shape === 'rectangular' || table.shape === 'sweetheart') && (
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-gray-500">
                  {t('admin.seating.table.rotation')} <span className="text-gray-400 font-normal">({table.rotation}°)</span>
                </Label>
                <div className="flex gap-1">
                  {[0, 45, 90, 135].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => onUpdateTable({ rotation: deg })}
                      className={`flex-1 h-7 rounded-lg text-[11px] font-medium transition-colors border ${
                        table.rotation === deg
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Capacity */}
            {table.shape !== 'sweetheart' && (
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-gray-500">
                  {t('admin.seating.table.capacity')}
                  <span className="text-gray-400 font-normal ml-1">({table.occupancy}/{table.capacity})</span>
                </Label>
                <Input
                  type="number" min={1} max={30}
                  value={table.capacity}
                  onChange={(e) => handleCapacityChange(parseInt(e.target.value) || 1)}
                  className="h-8 text-sm bg-gray-50 border-gray-100 focus:bg-white"
                />
                {table.isOverfilled && (
                  <p className="text-[11px] text-red-500">{t('admin.seating.table.overfilledWarning')}</p>
                )}
              </div>
            )}

            {/* Seat Layout */}
            {(table.shape === 'rectangular' || table.shape === 'sweetheart') && (
              <div className="space-y-1.5">
                {table.shape === 'sweetheart' ? (
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-medium text-gray-500">Front Seats</Label>
                    <Input
                      type="number" min={1} max={6}
                      value={table.side_a_count ?? 2}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 1
                        onUpdateTable({ side_a_count: v, capacity: v })
                      }}
                      className="h-7 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-medium text-gray-500">Seat Distribution</Label>
                      <button
                        className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                        onClick={() => setAdvancedSeats(!advancedSeats)}
                      >
                        {advancedSeats ? 'Simple' : 'Per side ↗'}
                      </button>
                    </div>

                    {/* Visual seat diagram */}
                    <SeatDiagram
                      sideA={table.side_a_count ?? Math.ceil(table.capacity / 2)}
                      sideB={table.side_b_count ?? Math.floor(table.capacity / 2)}
                      headA={table.head_a_count ?? 0}
                      headB={table.head_b_count ?? 0}
                    />

                    {advancedSeats ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { key: 'side_a_count' as const, label: 'Top' },
                          { key: 'side_b_count' as const, label: 'Bottom' },
                          { key: 'head_a_count' as const, label: 'Head Left' },
                          { key: 'head_b_count' as const, label: 'Head Right' },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-0.5">
                            <p className="text-[10px] text-gray-400">{label}</p>
                            <Input
                              type="number" min={0} max={20}
                              value={table[key] as number ?? 0}
                              onChange={(e) => handleAdvancedSeatChange(key, parseInt(e.target.value) || 0)}
                              className="h-7 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-gray-400">Long sides (each)</p>
                          <Input
                            type="number" min={0} max={20}
                            value={table.side_a_count ?? Math.ceil(table.capacity / 2)}
                            onChange={(e) => handleSideChange(parseInt(e.target.value) || 0)}
                            className="h-7 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-gray-400">Head ends (each)</p>
                          <Input
                            type="number" min={0} max={10}
                            value={table.head_a_count ?? 0}
                            onChange={(e) => handleHeadChange(parseInt(e.target.value) || 0)}
                            className="h-7 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Advanced (collapsible) */}
            <div>
              <button
                className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Advanced
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-3 pl-3 border-l-2 border-gray-50">
                      {(table.shape === 'rectangular' || table.shape === 'sweetheart') && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400">Fine rotation ({table.rotation}°)</p>
                          <input
                            type="range" min={0} max={360} step={1}
                            value={table.rotation}
                            onChange={(e) => onUpdateTable({ rotation: parseInt(e.target.value) })}
                            className="w-full h-1.5 rounded-full appearance-none bg-gray-100 cursor-pointer accent-amber-500"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-gray-400">{t('admin.seating.table.width')}</p>
                          <Input
                            type="number" min={20} max={400} step={20} value={table.width}
                            onChange={(e) => {
                              const w = Math.max(20, snap20(parseInt(e.target.value) || 20))
                              onUpdateTable(table.shape === 'round' ? { width: w, height: w } : { width: w })
                            }}
                            className="h-7 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                          />
                        </div>
                        {table.shape !== 'round' && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-gray-400">{t('admin.seating.table.height')}</p>
                            <Input
                              type="number" min={20} max={400} step={20} value={table.height}
                              onChange={(e) => onUpdateTable({ height: Math.max(20, snap20(parseInt(e.target.value) || 20)) })}
                              className="h-7 text-xs bg-gray-50 border-gray-100 focus:bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Guests */}
          <div className="border-t border-gray-50 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-gray-500">
                {t('admin.seating.table.guests')}
                <span className="text-gray-400 font-normal ml-1">({table.occupancy})</span>
              </p>
              {table.occupancy > 0 && (
                <button onClick={onViewGuests} className="flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-700 font-medium">
                  <Eye className="w-3 h-3" />
                  {t('admin.seating.table.viewGuests')}
                </button>
              )}
            </div>

            {table.assignedGuests.length === 0 ? (
              <p className="text-[11px] text-gray-400 py-1">{t('admin.seating.table.noGuests')}</p>
            ) : (
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {table.assignedGuests.map((a) => (
                  <div key={a.id} className="flex items-center gap-1 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-indigo-600 uppercase">
                        {(a.guests?.name || 'U').charAt(0)}
                      </span>
                    </div>
                    <span className="flex-1 truncate text-gray-700">{a.guests?.name || 'Unknown'}</span>
                    {movingGuestId === a.guest_id ? (
                      <div className="flex flex-wrap gap-0.5 max-w-28">
                        {otherTables.map((ot) => (
                          <button key={ot.id}
                            className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 truncate max-w-20"
                            onClick={() => { onMoveGuest(a.guest_id, ot.id); setMovingGuestId(null) }}
                          >→ {ot.name}</button>
                        ))}
                        <button className="text-[9px] text-gray-400 hover:text-gray-600" onClick={() => setMovingGuestId(null)}>✕</button>
                      </div>
                    ) : (
                      <>
                        <button className="p-0.5 text-gray-300 hover:text-indigo-500 transition-colors"
                          onClick={() => setMovingGuestId(a.guest_id)} title={t('admin.seating.table.moveGuest')}>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button className="p-0.5 text-gray-300 hover:text-red-400 transition-colors"
                          onClick={() => onUnassignGuest(a.guest_id)} title={t('admin.seating.table.removeGuest')}>
                          <UserMinus className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs border-gray-200 hover:border-primary/40 hover:text-primary hover:bg-primary/5" onClick={onDuplicateTable}>
              <Copy className="w-3 h-3 mr-1" />
              {t('admin.seating.table.duplicate')}
            </Button>
            <Button variant="destructive" size="sm" className="flex-1 h-8 text-xs" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="w-3 h-3 mr-1" />
              {t('admin.seating.table.delete')}
            </Button>
          </div>
        </div>
      </motion.div>

      <ConfirmDeleteDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => { onDeleteTable(); setShowDeleteConfirm(false) }}
        onCancel={() => setShowDeleteConfirm(false)}
        componentType="table"
      />
    </>
  )
}

// Visual seat diagram showing distribution around the table
function SeatDiagram({ sideA, sideB, headA, headB }: { sideA: number; sideB: number; headA: number; headB: number }) {
  const maxSide = Math.max(sideA, sideB, 1)
  const tableW = Math.min(80, maxSide * 10 + 16)
  const tableH = 14
  const seatSize = 5
  const hasHeads = headA > 0 || headB > 0
  const totalW = tableW + (hasHeads ? 28 : 0)
  const offsetX = hasHeads ? 14 : 0

  return (
    <div className="flex items-center justify-center py-1">
      <svg width={totalW} height={tableH + 24} viewBox={`0 0 ${totalW} ${tableH + 24}`}>
        <g transform={`translate(${offsetX},12)`}>
          <rect x={0} y={0} width={tableW} height={tableH} rx={3} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={1} />
          {Array.from({ length: sideA }).map((_, i) => {
            const sp = tableW / (sideA + 1)
            return <rect key={`a${i}`} x={sp * (i + 1) - seatSize / 2} y={-(seatSize + 2)} width={seatSize} height={seatSize} rx={1.5} fill="#6366f1" />
          })}
          {Array.from({ length: sideB }).map((_, i) => {
            const sp = tableW / (sideB + 1)
            return <rect key={`b${i}`} x={sp * (i + 1) - seatSize / 2} y={tableH + 2} width={seatSize} height={seatSize} rx={1.5} fill="#6366f1" />
          })}
          {hasHeads && Array.from({ length: headA }).map((_, i) => {
            const sp = tableH / (headA + 1)
            return <rect key={`ha${i}`} x={-(seatSize + 2)} y={sp * (i + 1) - seatSize / 2} width={seatSize} height={seatSize} rx={1.5} fill="#f59e0b" />
          })}
          {hasHeads && Array.from({ length: headB }).map((_, i) => {
            const sp = tableH / (headB + 1)
            return <rect key={`hb${i}`} x={tableW + 2} y={sp * (i + 1) - seatSize / 2} width={seatSize} height={seatSize} rx={1.5} fill="#f59e0b" />
          })}
        </g>
      </svg>
    </div>
  )
}

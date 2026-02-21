"use client"

import { use, useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/components/contexts/i18n-context"
import { useSeating } from "@/hooks/use-seating"
import { PremiumUpgradePrompt } from "@/components/ui/premium-gate"
import { useSubscriptionContext } from "@/components/contexts/subscription-context"
import { Header } from "@/components/header"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { SeatingToolbar } from "./components/seating-toolbar"
import { SeatingStatsBar } from "./components/seating-stats-bar"
import { TableConfigPanel } from "./components/table-config-panel"
import { MultiTablePanel } from "./components/multi-table-panel"
import { GuestAssignmentPanel } from "./components/guest-assignment-panel"
import { TableGuestsModal } from "./components/table-guests-modal"
import { PrintView } from "./components/print-view"
import { UnsavedChangesDialog } from "./components/unsaved-changes-dialog"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import type { SeatingTable } from "./types"

// Dynamic import for canvas (SSR incompatible)
const SeatingCanvas = dynamic(() => import("./components/seating-canvas").then(m => ({ default: m.SeatingCanvas })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
})

interface SeatingPageProps {
  params: Promise<{ weddingId: string }>
}

export default function SeatingPage({ params }: SeatingPageProps) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)
  const { t } = useTranslation()
  const { canAccessFeature, loading: subLoading } = useSubscriptionContext()

  const seating = useSeating({ weddingId: decodedWeddingId })

  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [showGuestsModal, setShowGuestsModal] = useState(false)
  const [guestsModalTableId, setGuestsModalTableId] = useState<string | null>(null)
  const [showPrintView, setShowPrintView] = useState(false)
  const [showGuestPanel, setShowGuestPanel] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [fitToScreenTrigger, setFitToScreenTrigger] = useState(0)
  const bypassBeforeUnloadRef = useRef(false)

  // For single-table operations: only valid when exactly one table is selected
  const selectedTableId = selectedTableIds.length === 1 ? selectedTableIds[0] : null
  const selectedTable = selectedTableId ? (seating.tablesWithAssignments.find(t => t.id === selectedTableId) || null) : null
  const selectedElement = selectedElementId ? (seating.venueElements.find(e => e.id === selectedElementId) || null) : null

  // Feature gate
  if (!subLoading && !canAccessFeature('seating_enabled')) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="page-container py-20">
          <PremiumUpgradePrompt
            feature="seating_enabled"
            weddingId={decodedWeddingId}
          />
        </div>
      </main>
    )
  }

  const handleSave = async () => {
    const success = await seating.saveLayout()
    if (success) {
      setLastSavedAt(new Date())
      toast.success(t('admin.seating.notifications.layoutSaved'))
    } else {
      toast.error(t('admin.seating.notifications.error'))
    }
  }

  const handleDiscard = () => {
    seating.discardChanges()
    setLastSavedAt(null)
    toast.info('Changes discarded')
  }

  const handleAutoAssign = async () => {
    const count = await seating.autoAssign(true)
    if (count > 0) {
      toast.success(`${count} ${t('admin.seating.notifications.autoAssigned')}`)
    } else {
      toast.info(t('admin.seating.guests.allAssigned'))
    }
  }

  const handleAddTable = async (shape: 'round' | 'rectangular' | 'sweetheart') => {
    const table = await seating.addTable(shape)
    if (table) {
      setSelectedTableIds([table.id])
      toast.success(t('admin.seating.notifications.tableSaved'))
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    const success = await seating.deleteTable(tableId)
    if (success) {
      setSelectedTableIds(ids => ids.filter(id => id !== tableId))
      toast.success(t('admin.seating.notifications.tableDeleted'))
    }
  }

  const handleDuplicateTable = async (tableId: string) => {
    const newTable = await seating.duplicateTable(tableId)
    if (newTable) {
      setSelectedTableIds([newTable.id])
      toast.success(t('admin.seating.notifications.tableSaved'))
    }
  }

  const handleAlignTables = (alignment: string) => {
    const selected = seating.tablesWithAssignments.filter(t => selectedTableIds.includes(t.id))
    if (selected.length < 2) return

    if (alignment === 'left') {
      const minX = Math.min(...selected.map(t => t.position_x))
      selected.forEach(t => seating.updateTable(t.id, { position_x: minX }))
    } else if (alignment === 'right') {
      const maxR = Math.max(...selected.map(t => t.position_x + t.width))
      selected.forEach(t => seating.updateTable(t.id, { position_x: maxR - t.width }))
    } else if (alignment === 'center-h') {
      const minX = Math.min(...selected.map(t => t.position_x))
      const maxR = Math.max(...selected.map(t => t.position_x + t.width))
      const cx = (minX + maxR) / 2
      selected.forEach(t => seating.updateTable(t.id, { position_x: Math.round(cx - t.width / 2) }))
    } else if (alignment === 'top') {
      const minY = Math.min(...selected.map(t => t.position_y))
      selected.forEach(t => seating.updateTable(t.id, { position_y: minY }))
    } else if (alignment === 'bottom') {
      const maxB = Math.max(...selected.map(t => t.position_y + t.height))
      selected.forEach(t => seating.updateTable(t.id, { position_y: maxB - t.height }))
    } else if (alignment === 'center-v') {
      const minY = Math.min(...selected.map(t => t.position_y))
      const maxB = Math.max(...selected.map(t => t.position_y + t.height))
      const cy = (minY + maxB) / 2
      selected.forEach(t => seating.updateTable(t.id, { position_y: Math.round(cy - t.height / 2) }))
    } else if (alignment === 'distribute-h' && selected.length >= 3) {
      const sorted = [...selected].sort((a, b) => a.position_x - b.position_x)
      const totalW = sorted.reduce((s, t) => s + t.width, 0)
      const span = (sorted[sorted.length - 1].position_x + sorted[sorted.length - 1].width) - sorted[0].position_x
      const gap = (span - totalW) / (sorted.length - 1)
      let x = sorted[0].position_x
      sorted.forEach(t => { seating.updateTable(t.id, { position_x: Math.round(x) }); x += t.width + gap })
    } else if (alignment === 'distribute-v' && selected.length >= 3) {
      const sorted = [...selected].sort((a, b) => a.position_y - b.position_y)
      const totalH = sorted.reduce((s, t) => s + t.height, 0)
      const span = (sorted[sorted.length - 1].position_y + sorted[sorted.length - 1].height) - sorted[0].position_y
      const gap = (span - totalH) / (sorted.length - 1)
      let y = sorted[0].position_y
      sorted.forEach(t => { seating.updateTable(t.id, { position_y: Math.round(y) }); y += t.height + gap })
    }
  }

  const handleAssignGuest = async (guestId: string, tableId: string) => {
    const success = await seating.assignGuest(guestId, tableId)
    if (success) {
      toast.success(t('admin.seating.notifications.guestAssigned'))
    }
  }

  const handleUnassignGuest = async (guestId: string) => {
    const success = await seating.unassignGuest(guestId)
    if (success) {
      toast.success(t('admin.seating.notifications.guestRemoved'))
    }
  }

  const handleMoveGuest = async (guestId: string, newTableId: string) => {
    const success = await seating.moveGuest(guestId, newTableId)
    if (success) {
      toast.success(t('admin.seating.notifications.guestMoved'))
    }
  }

  const handleViewTableGuests = (tableId: string) => {
    setGuestsModalTableId(tableId)
    setShowGuestsModal(true)
  }

  // Keep selectedTableIds in sync when tables are removed externally
  const validIds = seating.tables.map(t => t.id)

  // Ctrl+Z / Cmd+Z undo; Ctrl+Y / Ctrl+Shift+Z redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      // Don't hijack undo/redo from text inputs
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        seating.undo()
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault()
        seating.redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [seating.undo, seating.redo])

  // Prevent leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (seating.hasUnsavedChanges && !bypassBeforeUnloadRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [seating.hasUnsavedChanges])

  // Handle back-to-dashboard link click with unsaved changes guard
  const handleBackToDashboard = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (seating.hasUnsavedChanges) {
      e.preventDefault()
      setPendingNavigation(e.currentTarget.href)
      setShowUnsavedDialog(true)
    }
  }

  const handleDuplicateSelectedTables = () => {
    const newTables = seating.duplicateTables(selectedTableIds)
    if (newTables.length) {
      setSelectedTableIds(newTables.map(t => t.id))
      toast.success(`${newTables.length} table${newTables.length > 1 ? 's' : ''} duplicated`)
    }
  }

  const handleMirrorDuplicateTables = (axis: 'h' | 'v') => {
    const newTables = seating.mirrorDuplicateTables(selectedTableIds, axis)
    if (newTables.length) {
      setSelectedTableIds(newTables.map(t => t.id))
      toast.success(`${newTables.length} table${newTables.length > 1 ? 's' : ''} mirrored`)
    }
  }

  const handleTableDragEnd = (tableId: string, x: number, y: number) => {
    seating.updateTable(tableId, { position_x: x, position_y: y })
  }

  const handleTableResize = (tableId: string, width: number, height: number, x: number, y: number) => {
    seating.updateTable(tableId, { width, height, position_x: Math.round(x), position_y: Math.round(y) })
  }

  const handleElementDragEnd = (elementId: string, x: number, y: number) => {
    seating.updateVenueElement(elementId, { position_x: x, position_y: y })
  }

  const handleElementResize = (elementId: string, width: number, height: number, x: number, y: number, rotation: number) => {
    seating.updateVenueElement(elementId, { width, height, position_x: Math.round(x), position_y: Math.round(y), rotation })
  }

  const ELEMENT_COLORS = [
    '#ddd6fe','#fbcfe8','#bfdbfe','#fed7aa','#d9f99d',
    '#fecaca','#a7f3d0','#fde68a','#e0e7ff','#f3f4f6',
    '#7c3aed','#db2777','#2563eb','#ea580c','#65a30d',
    '#374151',
  ]

  if (showPrintView) {
    return (
      <PrintView
        tables={seating.tablesWithAssignments}
        venueElements={seating.venueElements}
        onClose={() => setShowPrintView(false)}
      />
    )
  }

  return (
    <main className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Main Content Area — canvas fills everything, panels float over it */}
      <div className="flex-1 relative overflow-hidden min-w-0">
        {/* Guest Assignment Panel — floats over canvas, left side */}
        <AnimatePresence initial={false}>
          {showGuestPanel && (
            <motion.div
              key="guest-panel"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-14 left-3 bottom-16 z-20 w-72 pointer-events-auto flex flex-col"
            >
              <GuestAssignmentPanel
                guests={seating.unassignedGuests}
                allGuests={seating.guests}
                assignments={seating.assignments}
                selectedTableId={selectedTableId}
                onAssignGuest={handleAssignGuest}
                tables={seating.tables}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Panel — floats over canvas, right side */}
        <AnimatePresence mode="wait">
          {(selectedTableIds.length >= 2 || selectedTable) && (
            <motion.div
              key={selectedTableIds.length >= 2 ? 'multi-panel' : `table-${selectedTable!.id}`}
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-14 right-3 bottom-16 z-20 pointer-events-auto flex flex-col"
            >
              {selectedTableIds.length >= 2 ? (
                <MultiTablePanel
                  tables={seating.tablesWithAssignments}
                  selectedTableIds={selectedTableIds}
                  onAlign={handleAlignTables}
                  onDuplicate={handleDuplicateSelectedTables}
                  onMirrorDuplicate={handleMirrorDuplicateTables}
                  onClose={() => setSelectedTableIds([])}
                />
              ) : selectedTable ? (
                <TableConfigPanel
                  table={selectedTable}
                  tables={seating.tables}
                  onUpdateTable={(updates) => seating.updateTable(selectedTable.id, updates)}
                  onDeleteTable={() => handleDeleteTable(selectedTable.id)}
                  onDuplicateTable={() => handleDuplicateTable(selectedTable.id)}
                  onMirrorDuplicate={(axis) => {
                    const newTables = seating.mirrorDuplicateTables([selectedTable.id], axis)
                    if (newTables.length) {
                      setSelectedTableIds(newTables.map(t => t.id))
                      toast.success('Table mirrored')
                    }
                  }}
                  onClose={() => setSelectedTableIds([])}
                  onUnassignGuest={handleUnassignGuest}
                  onMoveGuest={handleMoveGuest}
                  onViewGuests={() => handleViewTableGuests(selectedTable.id)}
                />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toolbar — bottom center, constrained to viewport */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto w-max max-w-[calc(100vw-1.5rem)]">
            <SeatingToolbar
              onAddRoundTable={() => handleAddTable('round')}
              onAddRectTable={() => handleAddTable('rectangular')}
              onAddSweetheart={() => handleAddTable('sweetheart')}
              onAddVenueElement={seating.addVenueElement}
              onAutoAssign={handleAutoAssign}
              onPrint={() => setShowPrintView(true)}
              onSave={handleSave}
              onDiscard={handleDiscard}
              saving={seating.saving}
              hasUnsavedChanges={seating.hasUnsavedChanges}
              lastSavedAt={lastSavedAt}
              zoom={zoom}
              onZoomIn={() => setZoom(z => Math.min(z * 1.2, 3))}
              onZoomOut={() => setZoom(z => Math.max(z / 1.2, 0.25))}
              onFitToScreen={() => setFitToScreenTrigger(n => n + 1)}
              onUndo={seating.undo}
              canUndo={seating.canUndo}
              onRedo={seating.redo}
              canRedo={seating.canRedo}
            />
        </div>

        {/* Canvas — fills the full area */}
        {seating.loading ? (
            <div className="flex-1 flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t('admin.seating.description')}</p>
              </div>
            </div>
          ) : (
            <SeatingCanvas
              tables={seating.tablesWithAssignments}
              venueElements={seating.venueElements}
              selectedTableIds={selectedTableIds.filter(id => validIds.includes(id))}
              onSelectTables={(ids) => { setSelectedTableIds(ids); if (ids.length) setSelectedElementId(null) }}
              onTableDragEnd={handleTableDragEnd}
              onTableResize={handleTableResize}
              onElementDragEnd={handleElementDragEnd}
              onElementResize={handleElementResize}
              onViewTableGuests={handleViewTableGuests}
              zoom={zoom}
              onZoomChange={setZoom}
              onSelectElement={(id) => { setSelectedElementId(id); if (id) setSelectedTableIds([]) }}
              onTableDelete={handleDeleteTable}
              onTableDuplicate={handleDuplicateTable}
              fitToScreenTrigger={fitToScreenTrigger}
            />
          )}

        {/* Venue element properties bar */}
        <AnimatePresence>
          {selectedElement && (
            <motion.div
              key="el-color-picker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-white rounded-xl shadow-lg border border-gray-200/60 px-3 py-2.5 flex flex-wrap items-center gap-2"
            >
              {/* Label input */}
              <input
                className="text-xs px-2 py-1 rounded-md border border-gray-200 focus:border-indigo-400 focus:outline-none w-28"
                placeholder="Label…"
                value={selectedElement.label ?? ''}
                onChange={e => seating.updateVenueElement(selectedElement.id, { label: e.target.value || null })}
              />
              <div className="w-px h-4 bg-gray-200" />
              {/* Shape toggle */}
              <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg p-0.5">
                <button
                  className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold transition-colors ${selectedElement.element_shape === 'rect' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Rectangle shape"
                  onClick={() => seating.updateVenueElement(selectedElement.id, { element_shape: 'rect' })}
                >□</button>
                <button
                  className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold transition-colors ${selectedElement.element_shape === 'circle' ? 'bg-white shadow text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Circle shape"
                  onClick={() => seating.updateVenueElement(selectedElement.id, { element_shape: 'circle' })}
                >○</button>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              {/* Color picker */}
              <span className="text-[11px] font-medium text-gray-500">Color</span>
              <div className="flex items-center gap-1">
                {ELEMENT_COLORS.map(c => (
                  <button
                    key={c}
                    title={c}
                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                      selectedElement.color === c ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => seating.updateVenueElement(selectedElement.id, { color: c })}
                  />
                ))}
                <label className="relative w-5 h-5 rounded-full overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-500 transition-colors" title="Custom color">
                  <input
                    type="color"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    value={selectedElement.color ?? '#e5e7eb'}
                    onChange={e => seating.updateVenueElement(selectedElement.id, { color: e.target.value })}
                  />
                  <div className="w-full h-full" style={{ background: selectedElement.color ?? 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
                </label>
                {selectedElement.color && (
                  <button
                    className="text-[10px] text-gray-400 hover:text-gray-600 ml-0.5"
                    onClick={() => seating.updateVenueElement(selectedElement.id, { color: null })}
                    title="Reset to default"
                  >✕</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Stats Bar — now at top, centered */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
          <SeatingStatsBar
            stats={seating.stats}
            showGuestPanel={showGuestPanel}
            onToggleGuestPanel={() => setShowGuestPanel(!showGuestPanel)}
          />
        </div>

        {/* Back to Dashboard — top-left floating button */}
        <Link
          href={getCleanAdminUrl(decodedWeddingId, 'dashboard')}
          onClick={handleBackToDashboard}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-gray-200/60 text-gray-600 hover:text-gray-900 hover:bg-white transition-colors text-xs font-medium pointer-events-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('admin.seating.backToDashboard')}</span>
        </Link>
      </div>

      {/* Table Guests Modal */}
      {showGuestsModal && guestsModalTableId && (
        <TableGuestsModal
          table={seating.tablesWithAssignments.find(t => t.id === guestsModalTableId) || null}
          tables={seating.tables}
          onClose={() => {
            setShowGuestsModal(false)
            setGuestsModalTableId(null)
          }}
          onMoveGuest={handleMoveGuest}
          onUnassignGuest={handleUnassignGuest}
        />
      )}

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onSave={async () => {
          await handleSave()
          setShowUnsavedDialog(false)
          if (pendingNavigation) { bypassBeforeUnloadRef.current = true; window.location.href = pendingNavigation }
        }}
        onDiscard={() => {
          setShowUnsavedDialog(false)
          if (pendingNavigation) { bypassBeforeUnloadRef.current = true; window.location.href = pendingNavigation }
        }}
        onCancel={() => {
          setShowUnsavedDialog(false)
          setPendingNavigation(null)
        }}
      />
    </main>
  )
}

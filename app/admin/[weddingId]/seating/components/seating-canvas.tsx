"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import { Stage, Layer, Rect, Circle, Ellipse, Text, Group, Line, Transformer } from "react-konva"
import type Konva from "konva"
import type { ReactElement } from "react"
import type { TableWithAssignments, VenueElement } from "../types"
import { VENUE_ELEMENT_LABELS } from "../types"
import { Copy, Trash2 } from "lucide-react"

interface SeatingCanvasProps {
  tables: TableWithAssignments[]
  venueElements: VenueElement[]
  selectedTableIds: string[]
  onSelectTables: (ids: string[]) => void
  selectedVenueElementIds: string[]
  onSelectVenueElements: (ids: string[]) => void
  onTableDragEnd: (tableId: string, x: number, y: number) => void
  onTableResize: (tableId: string, width: number, height: number, x: number, y: number) => void
  onElementDragEnd: (elementId: string, x: number, y: number) => void
  onElementResize: (elementId: string, width: number, height: number, x: number, y: number, rotation: number) => void
  onViewTableGuests: (tableId: string) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onTableDelete?: (id: string) => void
  onTableDuplicate?: (id: string) => void
  fitToScreenTrigger?: number
}

const GRID_SIZE = 20
const CANVAS_WIDTH = 3000
const CANVAS_HEIGHT = 2000

function getTableColor(table: TableWithAssignments): string {
  if (table.shape === 'sweetheart') return "#fef9ee" // warm cream for sweetheart
  return "#faf7f3" // consistent warm off-white for all tables
}

function getStatusColor(table: TableWithAssignments): string {
  if (table.isOverfilled) return "#ef4444"       // red
  if (table.occupancy >= table.capacity) return "#22c55e"  // green
  if (table.occupancy > 0) return "#f59e0b"      // amber
  return "#d1d5db"                                // gray (empty)
}

function getTableStroke(table: TableWithAssignments, selected: boolean): string {
  if (selected) return "#3b82f6"
  if (table.shape === 'sweetheart') return "#d97706"
  return "#d4a574" // warm rose gold border for all tables
}

export function SeatingCanvas({
  tables,
  venueElements,
  selectedTableIds,
  onSelectTables,
  selectedVenueElementIds,
  onSelectVenueElements,
  onTableDragEnd,
  onTableResize,
  onElementDragEnd,
  onElementResize,
  onViewTableGuests,
  zoom,
  onZoomChange,
  onTableDelete,
  onTableDuplicate,
  fitToScreenTrigger,
}: SeatingCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const tableTransformerRef = useRef<Konva.Transformer>(null)
  const isPanningRef = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })
  const isSpaceHeldRef = useRef(false)
  const isShiftHeldRef = useRef(false)
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null)
  const didDragSelectRef = useRef(false)
  // Group drag: track leader + peer start-centers so all move together
  const groupDragRef = useRef<{
    leaderId: string
    leaderStartCx: number
    leaderStartCy: number
    peers: Record<string, { startCx: number; startCy: number }>
  } | null>(null)
  // Element group drag: same pattern for venue elements
  const elementGroupDragRef = useRef<{
    leaderId: string
    leaderStartCx: number
    leaderStartCy: number
    peers: Record<string, { startCx: number; startCy: number }>
  } | null>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [isSpaceHeld, setIsSpaceHeld] = useState(false)
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [hoveredTable, setHoveredTable] = useState<{ id: string } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const hideMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTableHover = useCallback((id: string | null) => {
    if (id) {
      if (hideMenuTimerRef.current) clearTimeout(hideMenuTimerRef.current)
      setHoveredTable({ id })
    } else {
      hideMenuTimerRef.current = setTimeout(() => setHoveredTable(null), 180)
    }
  }, [])

  // Resize handler
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Fit-to-screen: calculate bounding box of all tables & elements, zoom to fit
  useEffect(() => {
    if (fitToScreenTrigger === undefined || fitToScreenTrigger === 0) return
    const allItems = [
      ...tables.map(t => ({
        x: t.position_x, y: t.position_y,
        w: t.width, h: t.shape === 'round' ? t.width : t.height
      })),
      ...venueElements.map(e => ({
        x: e.position_x, y: e.position_y, w: e.width, h: e.height
      })),
    ]
    if (allItems.length === 0) {
      onZoomChange(1)
      setStagePos({ x: 0, y: 0 })
      return
    }
    const PADDING = 80 // px padding around the bounding box
    const minX = Math.min(...allItems.map(i => i.x)) - PADDING
    const minY = Math.min(...allItems.map(i => i.y)) - PADDING
    const maxX = Math.max(...allItems.map(i => i.x + i.w)) + PADDING
    const maxY = Math.max(...allItems.map(i => i.y + i.h)) + PADDING
    const bboxW = maxX - minX
    const bboxH = maxY - minY
    const scaleX = stageSize.width / bboxW
    const scaleY = stageSize.height / bboxH
    const newZoom = Math.max(0.25, Math.min(2, Math.min(scaleX, scaleY)))
    const newX = (stageSize.width - bboxW * newZoom) / 2 - minX * newZoom
    const newY = (stageSize.height - bboxH * newZoom) / 2 - minY * newZoom
    onZoomChange(newZoom)
    setStagePos({ x: newX, y: newY })
    if (stageRef.current) {
      stageRef.current.position({ x: newX, y: newY })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitToScreenTrigger])

  // Keyboard modifiers: Space = pan, Shift tracked for multi-select, Escape = deselect
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { isSpaceHeldRef.current = true; setIsSpaceHeld(true) }
      isShiftHeldRef.current = e.shiftKey
      if (e.code === 'Escape') onSelectTables([])
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') { isSpaceHeldRef.current = false; setIsSpaceHeld(false) }
      isShiftHeldRef.current = e.shiftKey
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [onSelectTables])

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      if (!stage) return

      const scaleBy = 1.08
      const oldScale = zoom
      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      }

      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
      const clampedScale = Math.max(0.25, Math.min(3, newScale))

      onZoomChange(clampedScale)
      setStagePos({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      })
    },
    [zoom, stagePos, onZoomChange]
  )

  // Attach Transformer to selected venue element (only when exactly one is selected)
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return
    const focusId = selectedVenueElementIds.length === 1 ? selectedVenueElementIds[0] : null
    if (focusId) {
      const node = stageRef.current.findOne(`#vel-${focusId}`)
      if (node) {
        transformerRef.current.nodes([node as Konva.Node])
        transformerRef.current.getLayer()?.batchDraw()
      }
    } else {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selectedVenueElementIds])

  // Attach Transformer to selected table (only for single selection; multi uses alignment panel)
  useEffect(() => {
    if (!tableTransformerRef.current || !stageRef.current) return
    if (selectedTableIds.length === 1) {
      const node = stageRef.current.findOne(`#tbl-${selectedTableIds[0]}`)
      if (node) {
        tableTransformerRef.current.nodes([node as Konva.Node])
        tableTransformerRef.current.getLayer()?.batchDraw()
        return
      }
    }
    tableTransformerRef.current.nodes([])
    tableTransformerRef.current.getLayer()?.batchDraw()
  }, [selectedTableIds])

  // Convert screen pointer position to world/canvas coordinate
  const screenToWorld = (pos: { x: number; y: number }) => ({
    x: (pos.x - (stageRef.current?.x() ?? stagePos.x)) / zoom,
    y: (pos.y - (stageRef.current?.y() ?? stagePos.y)) / zoom,
  })

  // ── Group drag handlers ──
  // Called when a table drag starts: records start-centers of all selected peers
  const handleTableDragStart = useCallback((tableId: string, cx: number, cy: number) => {
    if (!selectedTableIds.includes(tableId) || selectedTableIds.length < 2) return
    const peers: Record<string, { startCx: number; startCy: number }> = {}
    for (const id of selectedTableIds) {
      if (id === tableId) continue
      const node = stageRef.current?.findOne(`#tbl-${id}`)
      if (node) peers[id] = { startCx: node.x(), startCy: node.y() }
    }
    groupDragRef.current = { leaderId: tableId, leaderStartCx: cx, leaderStartCy: cy, peers }
  }, [selectedTableIds])

  // Called on every drag-move: moves peer nodes directly in Konva (no React state)
  const handleTableDragMove = useCallback((tableId: string, cx: number, cy: number) => {
    const g = groupDragRef.current
    if (!g || g.leaderId !== tableId) return
    const dx = cx - g.leaderStartCx
    const dy = cy - g.leaderStartCy
    for (const [id, start] of Object.entries(g.peers)) {
      const node = stageRef.current?.findOne(`#tbl-${id}`)
      if (node) node.position({ x: start.startCx + dx, y: start.startCy + dy })
    }
  }, [])

  // Called when the leading table finishes dragging
  const handleTableGroupDragEnd = useCallback((tableId: string, snappedX: number, snappedY: number) => {
    onTableDragEnd(tableId, snappedX, snappedY)
    const g = groupDragRef.current
    if (!g || g.leaderId !== tableId) { groupDragRef.current = null; return }
    // Determine snapped center of the leader
    const leaderTable = tables.find(t => t.id === tableId)
    if (!leaderTable) { groupDragRef.current = null; return }
    const leaderHw = leaderTable.width / 2
    const leaderHh = leaderTable.shape === 'round' ? leaderHw : leaderTable.height / 2
    const snappedLeaderCx = snappedX + leaderHw
    const snappedLeaderCy = snappedY + leaderHh
    const dcx = snappedLeaderCx - g.leaderStartCx
    const dcy = snappedLeaderCy - g.leaderStartCy
    for (const [id, start] of Object.entries(g.peers)) {
      const peer = tables.find(t => t.id === id)
      if (!peer) continue
      const pHw = peer.width / 2
      const pHh = peer.shape === 'round' ? pHw : peer.height / 2
      const peerSnapX = Math.round((start.startCx + dcx - pHw) / GRID_SIZE) * GRID_SIZE
      const peerSnapY = Math.round((start.startCy + dcy - pHh) / GRID_SIZE) * GRID_SIZE
      const node = stageRef.current?.findOne(`#tbl-${id}`)
      if (node) node.position({ x: peerSnapX + pHw, y: peerSnapY + pHh })
      onTableDragEnd(id, peerSnapX, peerSnapY)
    }
    groupDragRef.current = null
  }, [tables, onTableDragEnd])

  // Element group drag: same pattern as table group drag
  const handleElementDragStart = useCallback((elementId: string, cx: number, cy: number) => {
    if (!selectedVenueElementIds.includes(elementId) || selectedVenueElementIds.length < 2) {
      elementGroupDragRef.current = null
      return
    }
    const peers: Record<string, { startCx: number; startCy: number }> = {}
    for (const id of selectedVenueElementIds) {
      if (id === elementId) continue
      const el = venueElements.find(e => e.id === id)
      if (!el) continue
      const node = stageRef.current?.findOne(`#vel-${id}`)
      if (node) peers[id] = { startCx: node.x(), startCy: node.y() }
      else peers[id] = { startCx: el.position_x + el.width / 2, startCy: el.position_y + el.height / 2 }
    }
    elementGroupDragRef.current = { leaderId: elementId, leaderStartCx: cx, leaderStartCy: cy, peers }
  }, [selectedVenueElementIds, venueElements])

  const handleElementDragMove = useCallback((elementId: string, cx: number, cy: number) => {
    const g = elementGroupDragRef.current
    if (!g || g.leaderId !== elementId) return
    const dcx = cx - g.leaderStartCx
    const dcy = cy - g.leaderStartCy
    for (const [id, start] of Object.entries(g.peers)) {
      const node = stageRef.current?.findOne(`#vel-${id}`)
      if (node) node.position({ x: start.startCx + dcx, y: start.startCy + dcy })
    }
  }, [])

  const handleElementGroupDragEnd = useCallback((elementId: string, x: number, y: number) => {
    const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE
    const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE
    onElementDragEnd(elementId, snappedX, snappedY)
    const g = elementGroupDragRef.current
    if (!g || g.leaderId !== elementId) return
    const leaderEl = venueElements.find(e => e.id === elementId)
    if (!leaderEl) { elementGroupDragRef.current = null; return }
    const leaderHw = leaderEl.width / 2
    const leaderHh = leaderEl.height / 2
    const snappedLeaderCx = snappedX + leaderHw
    const snappedLeaderCy = snappedY + leaderHh
    const dcx = snappedLeaderCx - g.leaderStartCx
    const dcy = snappedLeaderCy - g.leaderStartCy
    for (const [id, start] of Object.entries(g.peers)) {
      const el = venueElements.find(e => e.id === id)
      if (!el) continue
      const pHw = el.width / 2
      const pHh = el.height / 2
      const peerSnapX = Math.round((start.startCx + dcx - pHw) / GRID_SIZE) * GRID_SIZE
      const peerSnapY = Math.round((start.startCy + dcy - pHh) / GRID_SIZE) * GRID_SIZE
      const node = stageRef.current?.findOne(`#vel-${id}`)
      if (node) node.position({ x: peerSnapX + pHw, y: peerSnapY + pHh })
      onElementDragEnd(id, peerSnapX, peerSnapY)
    }
    elementGroupDragRef.current = null
  }, [venueElements, onElementDragEnd])

  const handleElementSelect = useCallback((elementId: string, shiftKey: boolean) => {
    onSelectTables([])
    if (shiftKey) {
      const ids = selectedVenueElementIds.includes(elementId)
        ? selectedVenueElementIds.filter(id => id !== elementId)
        : [...selectedVenueElementIds, elementId]
      onSelectVenueElements(ids)
    } else {
      onSelectVenueElements([elementId])
    }
  }, [selectedVenueElementIds, onSelectVenueElements, onSelectTables])

  // Space+drag = pan; drag on background = lasso selection box
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target
    const isBackground = target.nodeType === 'Stage' || target.name() === "grid"
    if (!isBackground) return
    const pos = stageRef.current?.getPointerPosition()
    if (!pos) return
    if (isSpaceHeldRef.current) {
      isPanningRef.current = true
      setIsPanning(true)
      lastPanPos.current = pos
    } else {
      const world = screenToWorld(pos)
      selectionStartRef.current = world
      didDragSelectRef.current = false
      setSelectionBox({ x: world.x, y: world.y, w: 0, h: 0 })
    }
  }

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = stageRef.current?.getPointerPosition()
    if (!pos) return
    if (isPanningRef.current) {
      e.evt.preventDefault()
      const dx = pos.x - lastPanPos.current.x
      const dy = pos.y - lastPanPos.current.y
      lastPanPos.current = pos
      stageRef.current?.position({
        x: (stageRef.current.x() || 0) + dx,
        y: (stageRef.current.y() || 0) + dy,
      })
      return
    }
    if (selectionStartRef.current) {
      const world = screenToWorld(pos)
      const newBox = {
        x: selectionStartRef.current.x,
        y: selectionStartRef.current.y,
        w: world.x - selectionStartRef.current.x,
        h: world.y - selectionStartRef.current.y,
      }
      setSelectionBox(newBox)
      if (Math.abs(newBox.w) > 5 || Math.abs(newBox.h) > 5) {
        didDragSelectRef.current = true
      }
    }
  }

  const handleStageMouseUp = () => {
    if (isPanningRef.current) {
      const pos = stageRef.current?.position()
      if (pos) setStagePos(pos)
      isPanningRef.current = false
      setIsPanning(false)
      return
    }
    if (selectionStartRef.current && selectionBox && didDragSelectRef.current) {
      const normX = Math.min(selectionBox.x, selectionBox.x + selectionBox.w)
      const normY = Math.min(selectionBox.y, selectionBox.y + selectionBox.h)
      const normW = Math.abs(selectionBox.w)
      const normH = Math.abs(selectionBox.h)
      const selectedTables = tables.filter((t) =>
        t.position_x < normX + normW && t.position_x + t.width > normX &&
        t.position_y < normY + normH && t.position_y + t.height > normY
      )
      const selectedElems = venueElements.filter((e) =>
        e.position_x < normX + normW && e.position_x + e.width > normX &&
        e.position_y < normY + normH && e.position_y + e.height > normY
      )
      if (isShiftHeldRef.current) {
        const tIds = new Set(selectedTableIds)
        selectedTables.forEach(t => tIds.add(t.id))
        onSelectTables([...tIds])
        const eIds = new Set(selectedVenueElementIds)
        selectedElems.forEach(e => eIds.add(e.id))
        onSelectVenueElements([...eIds])
      } else {
        onSelectTables(selectedTables.map(t => t.id))
        onSelectVenueElements(selectedElems.map(e => e.id))
      }
    }
    selectionStartRef.current = null
    setSelectionBox(null)
  }

  // Click on empty space — deselect all (guard: swallow click that ended a lasso drag)
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.currentTarget || e.target.name() === "grid") {
      if (didDragSelectRef.current) { didDragSelectRef.current = false; return }
      onSelectTables([])
      onSelectVenueElements([])
    }
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-gray-50 relative ${
        isPanning ? 'cursor-grabbing' :
        isSpaceHeld ? 'cursor-grab' :
        selectionBox ? 'cursor-crosshair' :
        'cursor-default'
      }`}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect && tooltipRef.current) {
          tooltipRef.current.style.left = `${e.clientX - rect.left + 16}px`
          tooltipRef.current.style.top = `${e.clientY - rect.top - 12}px`
        }
      }}
    >
      {/* Hover Tooltip — position controlled via DOM ref to avoid re-renders on every mouse move */}
      <div
        ref={tooltipRef}
        className={`pointer-events-none absolute z-30 transition-opacity duration-100 ${hoveredTable ? 'opacity-100' : 'opacity-0'}`}
        style={{ transform: 'translateY(-100%)' }}
      >
        {(() => {
          if (!hoveredTable) return null
          const t = tables.find(t => t.id === hoveredTable.id)
          if (!t) return null
          const pct = t.capacity > 0 ? Math.round((t.occupancy / t.capacity) * 100) : 0
          return (
            <div className="bg-white/95 border border-gray-200/80 rounded-xl px-3 py-2.5 shadow-xl backdrop-blur-sm min-w-44 max-w-56">
              <p className="font-semibold text-sm text-gray-900 truncate mb-1">{t.name}</p>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      t.isOverfilled ? 'bg-red-400' : pct === 100 ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums text-gray-700">{t.occupancy}/{t.capacity}</span>
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                <p className="capitalize">{t.shape} table · {pct}% full</p>
                {t.isOverfilled && <p className="text-red-500 font-medium">⚠ Overfilled by {t.occupancy - t.capacity}</p>}
                {t.shape === 'rectangular' && t.side_a_count != null && (
                  <p>{t.side_a_count * 2} side seats{t.head_a_count ? ` · ${t.head_a_count * 2} head seats` : ''}</p>
                )}
                {t.rotation ? <p>Rotated {t.rotation}°</p> : null}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Hover Action Menu — positioned over the hovered table */}
      {hoveredTable && (() => {
        const ht = tables.find(t => t.id === hoveredTable.id)
        if (!ht) return null
        const screenX = stagePos.x + (ht.position_x + ht.width / 2) * zoom
        const screenY = stagePos.y + ht.position_y * zoom
        return (
          <div
            className="absolute z-40 flex items-center gap-0.5 bg-white rounded-lg shadow-lg border border-gray-200/70 px-1 py-1"
            style={{ left: screenX, top: screenY - 8, transform: 'translateX(-50%) translateY(-100%)' }}
            onMouseEnter={() => { if (hideMenuTimerRef.current) clearTimeout(hideMenuTimerRef.current) }}
            onMouseLeave={() => setHoveredTable(null)}
          >
            <button
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
              onClick={(e) => { e.stopPropagation(); onTableDuplicate?.(hoveredTable.id); setHoveredTable(null) }}
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Duplicate</span>
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              onClick={(e) => { e.stopPropagation(); onTableDelete?.(hoveredTable.id); setHoveredTable(null) }}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Delete</span>
            </button>
          </div>
        )
      })()}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={handleStageMouseUp}
      >
        {/* Grid Layer */}
        <Layer>
          <GridBackground width={CANVAS_WIDTH} height={CANVAS_HEIGHT} gridSize={GRID_SIZE} />
        </Layer>

        {/* Venue Elements Layer */}
        <Layer>
          {[...venueElements.filter(e => e.element_type === 'area'), ...venueElements.filter(e => e.element_type !== 'area')]
            .map((element) => (
            <VenueElementShape
              key={element.id}
              element={element}
              selected={selectedVenueElementIds.includes(element.id)}
              onSelect={(shiftKey) => handleElementSelect(element.id, shiftKey)}
              onDragStart={(cx, cy) => handleElementDragStart(element.id, cx, cy)}
              onDragMove={(cx, cy) => handleElementDragMove(element.id, cx, cy)}
              onDragEnd={(x, y) => handleElementGroupDragEnd(element.id, x, y)}
              onResize={(w, h, x, y, r) => onElementResize(element.id, w, h, x, y, r)}
            />
          ))}
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            borderStroke="#6366f1"
            borderStrokeWidth={1.5}
            anchorStroke="#6366f1"
            anchorFill="#fff"
            anchorSize={8}
            anchorCornerRadius={2}
            keepRatio={false}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 40 || newBox.height < 40) return oldBox
              return newBox
            }}
          />
        </Layer>

        {/* Tables Layer */}
        <Layer>
          {tables.map((table) => (
            <TableShape
              key={table.id}
              table={table}
              selected={selectedTableIds.includes(table.id)}
              onSelect={(shiftKey) => {
                onSelectVenueElements([])
                if (shiftKey) {
                  const ids = selectedTableIds.includes(table.id)
                    ? selectedTableIds.filter(id => id !== table.id)
                    : [...selectedTableIds, table.id]
                  onSelectTables(ids)
                } else {
                  onSelectTables([table.id])
                }
              }}
              onDragStart={(cx, cy) => handleTableDragStart(table.id, cx, cy)}
              onDragMove={(cx, cy) => handleTableDragMove(table.id, cx, cy)}
              onDragEnd={(x, y) => handleTableGroupDragEnd(table.id, x, y)}
              onResize={(w, h, x, y) => onTableResize(table.id, w, h, x, y)}
              onDblClick={() => onViewTableGuests(table.id)}
              onHover={handleTableHover}
            />
          ))}
          <Transformer
            ref={tableTransformerRef}
            rotateEnabled={false}
            borderStroke="#3b82f6"
            borderStrokeWidth={1.5}
            anchorStroke="#3b82f6"
            anchorFill="#fff"
            anchorSize={8}
            anchorCornerRadius={2}
            keepRatio={selectedTableIds.length === 1 && tables.find(t => t.id === selectedTableIds[0])?.shape === 'round'}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < GRID_SIZE || newBox.height < GRID_SIZE) return oldBox
              return newBox
            }}
          />
        </Layer>

        {/* Lasso Selection Box Layer */}
        <Layer listening={false}>
          {selectionBox && (() => {
            const nx = Math.min(selectionBox.x, selectionBox.x + selectionBox.w)
            const ny = Math.min(selectionBox.y, selectionBox.y + selectionBox.h)
            return (
              <Rect
                x={nx} y={ny}
                width={Math.abs(selectionBox.w)}
                height={Math.abs(selectionBox.h)}
                fill="rgba(59,130,246,0.07)"
                stroke="#3b82f6"
                strokeWidth={1 / zoom}
                dash={[4 / zoom, 3 / zoom]}
              />
            )
          })()}
        </Layer>
      </Stage>
    </div>
  )
}

// Grid Background
function GridBackground({
  width,
  height,
  gridSize,
}: {
  width: number
  height: number
  gridSize: number
}) {
  const lines: ReactElement[] = []

  // Vertical lines
  for (let i = 0; i <= width; i += gridSize) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i, 0, i, height]}
        stroke="#e5e7eb"
        strokeWidth={0.5}
        name="grid"
      />
    )
  }

  // Horizontal lines
  for (let j = 0; j <= height; j += gridSize) {
    lines.push(
      <Line
        key={`h-${j}`}
        points={[0, j, width, j]}
        stroke="#e5e7eb"
        strokeWidth={0.5}
        name="grid"
      />
    )
  }

  return (
    <>
      {/* Background */}
      <Rect x={0} y={0} width={width} height={height} fill="white" name="grid" />
      {lines}
    </>
  )
}

// Table Shape Component
function TableShape({
  table,
  selected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResize,
  onDblClick,
  onHover,
}: {
  table: TableWithAssignments
  selected: boolean
  onSelect: (shiftKey: boolean) => void
  onDragStart: (cx: number, cy: number) => void
  onDragMove: (cx: number, cy: number) => void
  onDragEnd: (x: number, y: number) => void
  onResize: (width: number, height: number, x: number, y: number) => void
  onDblClick: () => void
  onHover: (id: string | null) => void
}) {
  const fill = getTableColor(table)
  const stroke = getTableStroke(table, selected)
  const strokeWidth = selected ? 3 : 1.5

  // Shared transform-end handler: snaps new size to grid, keeps center in place
  const makeTransformEnd = (isRound: boolean) => (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    let newW = Math.max(GRID_SIZE, Math.round((table.width * scaleX) / GRID_SIZE) * GRID_SIZE)
    let newH = Math.max(GRID_SIZE, Math.round((table.height * scaleY) / GRID_SIZE) * GRID_SIZE)
    if (isRound) newW = newH = Math.max(newW, newH)
    const centerX = node.x()
    const centerY = node.y()
    node.offsetX(newW / 2)
    node.offsetY(newH / 2)
    onResize(newW, newH, centerX - newW / 2, centerY - newH / 2)
  }

  if (table.shape === "round") {
    const radius = table.width / 2
    // Position group so pivot is at center; offsetX/Y rotate around center
    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
      const topLeftX = Math.round((e.target.x() - radius) / GRID_SIZE) * GRID_SIZE
      const topLeftY = Math.round((e.target.y() - radius) / GRID_SIZE) * GRID_SIZE
      e.target.position({ x: topLeftX + radius, y: topLeftY + radius })
      onDragEnd(topLeftX, topLeftY)
    }
    return (
      <Group
        id={`tbl-${table.id}`}
        x={table.position_x + radius}
        y={table.position_y + radius}
        offsetX={radius}
        offsetY={radius}
        draggable
        onClick={(e) => onSelect(e.evt.shiftKey)}
        onTap={() => onSelect(false)}
        onDragStart={(e) => onDragStart(e.target.x(), e.target.y())}
        onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
        onDragEnd={handleDragEnd}
        onTransformEnd={makeTransformEnd(true)}
        onDblClick={onDblClick}
        onDblTap={onDblClick}
        onMouseEnter={() => onHover(table.id)}
        onMouseLeave={() => onHover(null)}
      >
        <Circle
          x={radius}
          y={radius}
          radius={radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          shadowColor="rgba(0,0,0,0.10)"
          shadowBlur={selected ? 14 : 8}
          shadowOffset={{ x: 0, y: 3 }}
        />
        {/* Chairs */}
        {Array.from({ length: table.capacity }).map((_, i) => {
          const angle = (2 * Math.PI * i) / table.capacity - Math.PI / 2
          const seatX = radius + (radius + 14) * Math.cos(angle)
          const seatY = radius + (radius + 14) * Math.sin(angle)
          const occupied = i < table.occupancy
          // Chair faces OUTWARD: local +y points away from table center
          const chairRotation = (angle * 180 / Math.PI) + 90
          const seatFill = occupied ? "#c4b5fd" : "#f5efe6"
          const seatStroke = occupied ? "#7c3aed" : "#c4a87a"
          const backFill = occupied ? "#a78bfa" : "#e8d9c5"
          return (
            <Group key={i} x={seatX} y={seatY} rotation={chairRotation}>
              {/* Seat cushion — farther from table */}
              <Rect x={-5.5} y={2} width={11} height={9} cornerRadius={[2, 2, 3, 3]} fill={seatFill} stroke={seatStroke} strokeWidth={1} />
              {/* Backrest — between seat and table edge */}
              <Rect x={-6} y={-6} width={12} height={7} cornerRadius={[2, 2, 0, 0]} fill={backFill} stroke={seatStroke} strokeWidth={1} />
            </Group>
          )
        })}
        {/* Table name */}
        <Text
          x={5} y={radius - 15}
          width={radius * 2 - 10}
          text={table.name}
          fontSize={11} fontFamily="system-ui, sans-serif" fontStyle="bold" fill="#78350f" align="center"
        />
        {/* Occupancy */}
        <Text
          x={5} y={radius + 5}
          width={radius * 2 - 10}
          text={`${table.occupancy}/${table.capacity}`}
          fontSize={9} fontFamily="system-ui, sans-serif" fill="#a16207" align="center"
        />
        {/* Status indicator dot — top-right inside the table circle */}
        <Circle x={radius * 1.55} y={radius * 0.45} radius={5} fill={getStatusColor(table)} stroke="white" strokeWidth={1.5} />
      </Group>
    )
  }

  // Rectangular table — rotate around center
  const hw = table.width / 2
  const hh = table.height / 2
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const topLeftX = Math.round((e.target.x() - hw) / GRID_SIZE) * GRID_SIZE
    const topLeftY = Math.round((e.target.y() - hh) / GRID_SIZE) * GRID_SIZE
    e.target.position({ x: topLeftX + hw, y: topLeftY + hh })
    onDragEnd(topLeftX, topLeftY)
  }

  // Sweetheart table — small elegant table for 2
  if (table.shape === "sweetheart") {
    const sideA = table.side_a_count ?? 2
    return (
      <Group
        id={`tbl-${table.id}`}
        x={table.position_x + hw}
        y={table.position_y + hh}
        offsetX={hw}
        offsetY={hh}
        rotation={table.rotation}
        draggable
        onClick={(e) => onSelect(e.evt.shiftKey)}
        onTap={() => onSelect(false)}
        onDragStart={(e) => onDragStart(e.target.x(), e.target.y())}
        onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
        onDragEnd={handleDragEnd}
        onTransformEnd={makeTransformEnd(false)}
        onDblClick={onDblClick}
        onDblTap={onDblClick}
        onMouseEnter={() => onHover(table.id)}
        onMouseLeave={() => onHover(null)}
      >
        {/* Table body */}
        <Rect
          width={table.width}
          height={table.height}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          cornerRadius={12}
          shadowColor="rgba(217,119,6,0.2)"
          shadowBlur={selected ? 14 : 8}
          shadowOffset={{ x: 0, y: 3 }}
        />
        {/* Crown / heart */}
        {/* Labels counter-rotated to stay readable at any table rotation */}
        <Group x={hw} y={hh} rotation={-table.rotation}>
          <Text
            x={-hw} y={-13}
            width={table.width}
            text="♛"
            fontSize={14} fontFamily="system-ui, sans-serif" fill="#d97706" align="center"
          />
          {/* Name label */}
          <Text
            x={-hw + 4} y={2}
            width={table.width - 8}
            text={`${table.name} · ${table.occupancy}/${table.capacity}`}
            fontSize={9} fontFamily="system-ui, sans-serif" fill="#78350f" align="center"
          />
        </Group>
        {/* Status indicator dot */}
        <Circle x={table.width - 8} y={8} radius={4} fill={getStatusColor(table)} stroke="white" strokeWidth={1.5} />
        {/* Front seats (top side) */}
        {Array.from({ length: sideA }).map((_, i) => {
          const occ = i < table.occupancy
          const seatFill = occ ? "#c4b5fd" : "#fef9c3"
          const seatStroke = occ ? "#7c3aed" : "#d97706"
          const backFill = occ ? "#a78bfa" : "#fde68a"
          return (
            <Group key={`sw-${i}`} x={((i + 1) / (sideA + 1)) * table.width} y={-14} rotation={180}>
              <Rect x={-5.5} y={-9} width={11} height={9} cornerRadius={[2, 2, 3, 3]} fill={seatFill} stroke={seatStroke} strokeWidth={1} />
              <Rect x={-6} y={1} width={12} height={5} cornerRadius={[0, 0, 2, 2]} fill={backFill} stroke={seatStroke} strokeWidth={1} />
            </Group>
          )
        })}
      </Group>
    )
  }

  return (
    <Group
      id={`tbl-${table.id}`}
      x={table.position_x + hw}
      y={table.position_y + hh}
      offsetX={hw}
      offsetY={hh}
      rotation={table.rotation}
      draggable
      onClick={(e) => onSelect(e.evt.shiftKey)}
      onTap={() => onSelect(false)}
      onDragStart={(e) => onDragStart(e.target.x(), e.target.y())}
      onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={handleDragEnd}
      onTransformEnd={makeTransformEnd(false)}
      onDblClick={onDblClick}
      onDblTap={onDblClick}
      onMouseEnter={() => onHover(table.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Rect
        width={table.width}
        height={table.height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={8}
        shadowColor="rgba(0,0,0,0.10)"
        shadowBlur={selected ? 14 : 8}
        shadowOffset={{ x: 0, y: 3 }}
      />
      {renderRectSeats(table)}
      {/* Labels counter-rotated to stay readable at any table rotation */}
      <Group x={hw} y={hh} rotation={-table.rotation}>
        <Text
          x={-(table.width - 10) / 2} y={-15}
          width={table.width - 10}
          text={table.name}
          fontSize={11} fontFamily="system-ui, sans-serif" fontStyle="bold" fill="#78350f" align="center"
        />
        <Text
          x={-(table.width - 10) / 2} y={5}
          width={table.width - 10}
          text={`${table.occupancy}/${table.capacity}`}
          fontSize={9} fontFamily="system-ui, sans-serif" fill="#a16207" align="center"
        />
      </Group>
      {/* Status indicator dot */}
      <Circle x={table.width - 8} y={8} radius={5} fill={getStatusColor(table)} stroke="white" strokeWidth={1.5} />
    </Group>
  )
}

function renderRectSeats(table: TableWithAssignments) {
  const seats: ReactElement[] = []
  const sideA = table.side_a_count ?? Math.ceil(table.capacity / 2)
  const sideB = table.side_b_count ?? Math.floor(table.capacity / 2)
  const headA = table.head_a_count ?? 0
  const headB = table.head_b_count ?? 0
  let seatIdx = 0

  const occupied = (i: number) => i < table.occupancy

  // Render a chair at the given position with a rotation matching the table side
  // rotation=0: seat faces down (backrest toward +y in local = outward), e.g. side B
  // chairRotation lookup for each side matches `90 - angle_deg` formula:
  //   side A (top)    angle=-90deg → rotation=90-(-90)=180
  //   side B (bottom) angle=+90deg → rotation=90-90=0
  //   head A (left)   angle=180deg → rotation=90-180=-90
  //   head B (right)  angle=0deg   → rotation=90-0=90
  const chairGroup = (key: string, x: number, y: number, occ: boolean, rotation: number) => {
    const seatFill = occ ? "#c4b5fd" : "#f5efe6"
    const seatStroke = occ ? "#7c3aed" : "#c4a87a"
    const backFill = occ ? "#a78bfa" : "#e8d9c5"
    return (
      <Group key={key} x={x} y={y} rotation={rotation}>
        {/* Seat cushion */}
        <Rect x={-5.5} y={-9} width={11} height={9} cornerRadius={[2, 2, 3, 3]} fill={seatFill} stroke={seatStroke} strokeWidth={1} />
        {/* Backrest */}
        <Rect x={-6} y={1} width={12} height={5} cornerRadius={[0, 0, 2, 2]} fill={backFill} stroke={seatStroke} strokeWidth={1} />
      </Group>
    )
  }

  // Side A — top (outward = up, rotation=180)
  for (let i = 0; i < sideA; i++) {
    seats.push(chairGroup(`a-${i}`, ((i + 1) / (sideA + 1)) * table.width, -14, occupied(seatIdx++), 180))
  }
  // Side B — bottom (outward = down, rotation=0)
  for (let i = 0; i < sideB; i++) {
    seats.push(chairGroup(`b-${i}`, ((i + 1) / (sideB + 1)) * table.width, table.height + 14, occupied(seatIdx++), 0))
  }
  // Head A — left end (outward = left, rotation=+90)
  for (let i = 0; i < headA; i++) {
    seats.push(chairGroup(`ha-${i}`, -14, ((i + 1) / (headA + 1)) * table.height, occupied(seatIdx++), 90))
  }
  // Head B — right end (outward = right, rotation=-90)
  for (let i = 0; i < headB; i++) {
    seats.push(chairGroup(`hb-${i}`, table.width + 14, ((i + 1) / (headB + 1)) * table.height, occupied(seatIdx++), -90))
  }

  return seats
}

// Venue Element Shape Component
function VenueElementShape({
  element,
  selected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResize,
}: {
  element: VenueElement
  selected: boolean
  onSelect: (shiftKey: boolean) => void
  onDragStart?: (cx: number, cy: number) => void
  onDragMove?: (cx: number, cy: number) => void
  onDragEnd: (x: number, y: number) => void
  onResize: (width: number, height: number, x: number, y: number, rotation: number) => void
}) {
  const hw = element.width / 2
  const hh = element.height / 2

  // Drag snaps to grid; position stored as top-left corner
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const x = Math.round((e.target.x() - hw) / GRID_SIZE) * GRID_SIZE
    const y = Math.round((e.target.y() - hh) / GRID_SIZE) * GRID_SIZE
    e.target.position({ x: x + hw, y: y + hh })
    onDragEnd(x, y)
  }

  // Resize: keep center fixed, snap new size to grid, update offset so pivot stays centered
  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    const newWidth = Math.max(40, Math.round((element.width * scaleX) / GRID_SIZE) * GRID_SIZE)
    const newHeight = Math.max(40, Math.round((element.height * scaleY) / GRID_SIZE) * GRID_SIZE)
    node.offsetX(newWidth / 2)
    node.offsetY(newHeight / 2)
    onResize(newWidth, newHeight, node.x() - newWidth / 2, node.y() - newHeight / 2, node.rotation())
  }

  const fillColors: Record<string, string> = {
    dance_floor: "#ddd6fe",
    stage: "#fbcfe8",
    entrance: "#bfdbfe",
    bar: "#fed7aa",
    dj_booth: "#d9f99d",
    periquera: "#fde68a",
    lounge: "#f5d0fe",
    area: "#e0f2fe",
    custom: "#e5e7eb",
  }

  const strokeColors: Record<string, string> = {
    dance_floor: "#8b5cf6",
    stage: "#ec4899",
    entrance: "#3b82f6",
    bar: "#f97316",
    dj_booth: "#84cc16",
    periquera: "#d97706",
    lounge: "#a855f7",
    area: "#0369a1",
    custom: "#6b7280",
  }

  const baseFill = element.color ?? fillColors[element.element_type] ?? "#e5e7eb"
  const baseStroke = selected ? "#6366f1" : (element.color ? element.color : (strokeColors[element.element_type] ?? "#9ca3af"))
  const labelInfo = VENUE_ELEMENT_LABELS[element.element_type]
  const displayLabel = element.label || labelInfo?.en || element.element_type
  const displayIcon = labelInfo?.icon ?? "📦"
  const isCircle = element.element_shape === 'circle'

  // Lounge proportional layout values
  const loungeArmWidth   = Math.max(16, Math.min(26, element.width  * 0.14))
  const loungeArmHeight  = Math.max(16, Math.min(26, element.height * 0.14))
  const loungePad        = Math.max(8,  Math.min(14, Math.min(element.width, element.height) * 0.08))
  const loungeBackH      = loungeArmHeight
  const loungeSideH      = element.height - loungePad * 2 - loungeBackH
  const loungeCoffeeW    = Math.max(30, (element.width  - loungePad * 2 - loungeArmWidth  * 2) * 0.55)
  const loungeCoffeeH    = Math.max(20, (element.height - loungePad * 2 - loungeBackH) * 0.45)

  // Periquera stool count — use capacity if set, else fallback to size-based default
  const periquStoolCount = element.capacity || (element.width >= 160 ? 6 : 4)
  const periquTableR     = Math.min(hw, hh) * 0.32
  const periquStoolDist  = Math.min(hw, hh) * 0.68

  return (
    <Group
      id={`vel-${element.id}`}
      x={element.position_x + hw}
      y={element.position_y + hh}
      offsetX={hw}
      offsetY={hh}
      rotation={element.rotation}
      draggable
      onClick={(e: Konva.KonvaEventObject<MouseEvent>) => onSelect(e.evt.shiftKey)}
      onTap={() => onSelect(false)}
      onDragStart={(e) => onDragStart?.(e.target.x(), e.target.y())}
      onDragMove={(e) => onDragMove?.(e.target.x(), e.target.y())}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {element.element_type === 'periquera' ? (
        <>
          {/* Background area */}
          <Rect
            width={element.width}
            height={element.height}
            fill={baseFill}
            stroke={baseStroke}
            strokeWidth={selected ? 2.5 : 1.5}
            cornerRadius={8}
            opacity={0.35}
          />
          {/* Table top */}
          <Circle
            x={hw}
            y={hh}
            radius={periquTableR}
            fill="#fef9c3"
            stroke="#d97706"
            strokeWidth={2}
            shadowColor="rgba(0,0,0,0.12)"
            shadowBlur={5}
          />
          {/* Inner table highlight ring */}
          <Circle
            x={hw}
            y={hh}
            radius={periquTableR * 0.62}
            fill="transparent"
            stroke="#fbbf24"
            strokeWidth={1}
            opacity={0.7}
          />
          {/* Bar stools */}
          {Array.from({ length: periquStoolCount }).map((_, i) => {
            const angle = (2 * Math.PI * i) / periquStoolCount - Math.PI / 2
            return (
              <Group key={i} x={hw + periquStoolDist * Math.cos(angle)} y={hh + periquStoolDist * Math.sin(angle)}>
                {/* Stool seat */}
                <Circle radius={7} fill="#fde68a" stroke="#d97706" strokeWidth={1.5} />
                {/* Stool center post */}
                <Circle radius={2.5} fill="#92400e" />
              </Group>
            )
          })}
          {/* Label */}
          <Text
            x={0}
            y={element.height - 16}
            width={element.width}
            text={displayLabel}
            fontSize={10}
            fontStyle="bold"
            fontFamily="system-ui, sans-serif"
            fill="#92400e"
            align="center"
          />
        </>
      ) : element.element_type === 'area' ? (
        <>
          {/* Area zone: large labeled dashed rectangle */}
          <Rect
            width={element.width}
            height={element.height}
            fill={baseFill}
            stroke={baseStroke}
            strokeWidth={selected ? 2.5 : 2}
            cornerRadius={6}
            dash={[14, 7]}
            opacity={0.35}
          />
          <Text
            x={10}
            y={10}
            width={element.width - 20}
            text={displayLabel}
            fontSize={Math.min(18, Math.max(11, element.height * 0.1))}
            fontStyle="bold"
            fontFamily="system-ui, sans-serif"
            fill={baseStroke}
            align="left"
            opacity={0.85}
          />
        </>
      ) : element.element_type === 'lounge' ? (
        <>
          {/* Background */}
          <Rect
            width={element.width}
            height={element.height}
            fill={baseFill}
            stroke={baseStroke}
            strokeWidth={selected ? 2.5 : 1.5}
            cornerRadius={10}
            opacity={0.45}
          />
          {element.element_shape === 'sofa_circle' ? (
            // Circle lounge: outer ring + open center + coffee table
            (() => {
              const r = Math.min(hw, hh)
              const outerR = r * 0.85
              const innerR = r * 0.52
              const coffeeR = r * 0.22
              return (
                <>
                  <Circle x={hw} y={hh} radius={outerR} fill="#d8b4fe" stroke="#a855f7" strokeWidth={2} />
                  <Circle x={hw} y={hh} radius={innerR} fill={baseFill} stroke="#c084fc" strokeWidth={1} opacity={0.9} />
                  <Circle x={hw} y={hh} radius={coffeeR} fill="#f3e8ff" stroke="#c084fc" strokeWidth={1.5} />
                </>
              )
            })()
          ) : element.element_shape === 'sofa_single' ? (
            // Single sofa: back + seat + two armrests
            (() => {
              const backH = Math.max(14, element.height * 0.32)
              const armW  = Math.max(12, element.width * 0.10)
              const seatH = element.height - backH - loungePad
              return (
                <>
                  {/* Back */}
                  <Rect x={loungePad} y={loungePad} width={element.width - loungePad * 2} height={backH}
                    fill="#d8b4fe" stroke="#a855f7" strokeWidth={1.5} cornerRadius={[5,5,0,0] as any} />
                  {/* Seat */}
                  <Rect x={loungePad + armW} y={loungePad + backH}
                    width={element.width - loungePad * 2 - armW * 2} height={seatH}
                    fill="#e9d5ff" stroke="#a855f7" strokeWidth={1} />
                  {/* Left arm */}
                  <Rect x={loungePad} y={loungePad + backH} width={armW} height={seatH}
                    fill="#d8b4fe" stroke="#a855f7" strokeWidth={1.5} cornerRadius={[0,0,0,4] as any} />
                  {/* Right arm */}
                  <Rect x={element.width - loungePad - armW} y={loungePad + backH} width={armW} height={seatH}
                    fill="#d8b4fe" stroke="#a855f7" strokeWidth={1.5} cornerRadius={[0,0,4,0] as any} />
                </>
              )
            })()
          ) : element.element_shape === 'sofa_l' ? (
            // L-shape sofa: horizontal piece + vertical piece on left
            (() => {
              const hBackH  = Math.max(14, element.height * 0.32)
              const hSeatH  = element.height - hBackH - loungePad
              const vBackW  = Math.max(14, element.width * 0.28)
              const vSeatW  = Math.max(10, vBackW * 0.6)
              return (
                <>
                  {/* Horizontal back */}
                  <Rect x={loungePad} y={loungePad} width={element.width - loungePad * 2} height={hBackH}
                    fill="#d8b4fe" stroke="#a855f7" strokeWidth={1.5} cornerRadius={[5,5,0,0] as any} />
                  {/* Horizontal seat */}
                  <Rect x={loungePad} y={loungePad + hBackH} width={element.width - loungePad * 2} height={hSeatH}
                    fill="#e9d5ff" stroke="#a855f7" strokeWidth={1} />
                  {/* Vertical back (left side) */}
                  <Rect x={loungePad} y={loungePad + hBackH} width={vBackW} height={hSeatH}
                    fill="#d8b4fe" stroke="#a855f7" strokeWidth={1.5} cornerRadius={[0,0,0,4] as any} />
                </>
              )
            })()
          ) : (
            // Default U-shape sofa
            <>
              {/* Back sofa (top edge) */}
              <Rect
                x={loungePad}
                y={loungePad}
                width={element.width - loungePad * 2}
                height={loungeBackH}
                fill="#d8b4fe"
                stroke="#a855f7"
                strokeWidth={1.5}
                cornerRadius={[5, 5, 0, 0] as any}
              />
              {/* Left arm */}
              <Rect
                x={loungePad}
                y={loungePad + loungeBackH}
                width={loungeArmWidth}
                height={loungeSideH}
                fill="#d8b4fe"
                stroke="#a855f7"
                strokeWidth={1.5}
                cornerRadius={[0, 0, 0, 5] as any}
              />
              {/* Right arm */}
              <Rect
                x={element.width - loungePad - loungeArmWidth}
                y={loungePad + loungeBackH}
                width={loungeArmWidth}
                height={loungeSideH}
                fill="#d8b4fe"
                stroke="#a855f7"
                strokeWidth={1.5}
                cornerRadius={[0, 0, 5, 0] as any}
              />
              {/* Coffee table */}
              <Rect
                x={hw - loungeCoffeeW / 2}
                y={loungePad + loungeBackH + (loungeSideH - loungeCoffeeH) / 2}
                width={loungeCoffeeW}
                height={loungeCoffeeH}
                fill="#f3e8ff"
                stroke="#c084fc"
                strokeWidth={1.5}
                cornerRadius={5}
              />
            </>
          )}
          {/* Label */}
          <Text
            x={0}
            y={element.height - 16}
            width={element.width}
            text={displayLabel}
            fontSize={10}
            fontStyle="bold"
            fontFamily="system-ui, sans-serif"
            fill="#6b21a8"
            align="center"
          />
        </>
      ) : (
        <>
          {/* Generic element rendering */}
          {isCircle ? (
            <Ellipse
              x={hw}
              y={hh}
              radiusX={hw}
              radiusY={hh}
              fill={baseFill}
              stroke={selected ? "#6366f1" : baseStroke}
              strokeWidth={selected ? 2.5 : 2}
              dash={[6, 4]}
              opacity={0.85}
            />
          ) : (
            <Rect
              width={element.width}
              height={element.height}
              fill={baseFill}
              stroke={baseStroke}
              strokeWidth={selected ? 2.5 : 2}
              cornerRadius={8}
              dash={[6, 4]}
              opacity={0.85}
            />
          )}
          <Text
            x={0}
            y={element.height / 2 - 18}
            width={element.width}
            text={displayIcon}
            fontSize={18}
            fontFamily="system-ui, sans-serif"
            fill="#374151"
            align="center"
          />
          <Text
            x={4}
            y={element.height / 2 + 2}
            width={element.width - 8}
            text={displayLabel}
            fontSize={12}
            fontStyle="bold"
            fontFamily="system-ui, sans-serif"
            fill="#374151"
            align="center"
          />
        </>
      )}
    </Group>
  )
}

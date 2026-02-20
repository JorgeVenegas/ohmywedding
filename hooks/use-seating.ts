"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  SeatingTable,
  SeatingAssignment,
  VenueElement,
  TableWithAssignments,
  SeatingGuest,
  TableShape,
  VenueElementType,
} from '@/app/admin/[weddingId]/seating/types'
import { TABLE_DEFAULTS } from '@/app/admin/[weddingId]/seating/types'

interface UseSeatingProps {
  weddingId: string
}

function tempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

interface UseSeatingReturn {
  // Data
  tables: SeatingTable[]
  tablesWithAssignments: TableWithAssignments[]
  assignments: SeatingAssignment[]
  venueElements: VenueElement[]
  guests: SeatingGuest[]
  unassignedGuests: SeatingGuest[]

  // State
  loading: boolean
  saving: boolean
  error: string | null
  hasUnsavedChanges: boolean

  // Table operations
  addTable: (shape: TableShape, position?: { x: number; y: number }) => Promise<SeatingTable | null>
  updateTable: (id: string, updates: Partial<SeatingTable>) => void
  deleteTable: (id: string) => Promise<boolean>
  duplicateTable: (id: string) => Promise<SeatingTable | null>
  duplicateTables: (ids: string[]) => SeatingTable[]
  mirrorDuplicateTables: (ids: string[], axis: 'h' | 'v') => SeatingTable[]

  // Assignment operations
  assignGuest: (guestId: string, tableId: string) => Promise<boolean>
  unassignGuest: (guestId: string) => Promise<boolean>
  moveGuest: (guestId: string, newTableId: string) => Promise<boolean>
  autoAssign: (keepGroupsTogether?: boolean) => Promise<number>

  // Venue element operations
  addVenueElement: (type: VenueElementType, position?: { x: number; y: number }) => Promise<VenueElement | null>
  updateVenueElement: (id: string, updates: Partial<VenueElement>) => void
  deleteVenueElement: (id: string) => Promise<boolean>

  // Save
  saveLayout: () => Promise<boolean>
  discardChanges: () => void

  // Undo
  undo: () => void
  canUndo: boolean
  redo: () => void
  canRedo: boolean

  // Stats
  stats: {
    totalGuests: number
    assignedGuests: number
    unassignedGuests: number
    totalTables: number
    overfilledTables: number
    totalCapacity: number
  }
}

export function useSeating({ weddingId }: UseSeatingProps): UseSeatingReturn {
  const [tables, setTables] = useState<SeatingTable[]>([])
  const [assignments, setAssignments] = useState<SeatingAssignment[]>([])
  const [venueElements, setVenueElements] = useState<VenueElement[]>([])
  const [guests, setGuests] = useState<SeatingGuest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const initialLoadRef = useRef(false)

  // Mutable refs to current state — used in callbacks to avoid stale closures
  const tablesRef = useRef<SeatingTable[]>([])
  const venueElementsRef = useRef<VenueElement[]>([])
  const assignmentsRef = useRef<SeatingAssignment[]>([])

  // Undo history: array of snapshots (push on every mutation, pop on undo)
  const historyRef = useRef<{
    tables: SeatingTable[]
    venueElements: VenueElement[]
    assignments: SeatingAssignment[]
  }[]>([])
  const MAX_HISTORY = 50

  // Redo stack: populated on undo, cleared on any new mutation
  const redoRef = useRef<{
    tables: SeatingTable[]
    venueElements: VenueElement[]
    assignments: SeatingAssignment[]
  }[]>([])

  // Track pending creates/deletes (ref avoids stale closure in save)
  const deletedTableIdsRef = useRef<Set<string>>(new Set())
  const deletedElementIdsRef = useRef<Set<string>>(new Set())
  const newTableIdsRef = useRef<Set<string>>(new Set())
  const newElementIdsRef = useRef<Set<string>>(new Set())

  // Autosave refs
  const hasUnsavedRef = useRef(false)
  const saveLayoutRef = useRef<() => Promise<boolean>>(() => Promise.resolve(false))
  useEffect(() => { hasUnsavedRef.current = hasUnsavedChanges }, [hasUnsavedChanges])
  // Keep state refs in sync
  useEffect(() => { tablesRef.current = tables }, [tables])
  useEffect(() => { venueElementsRef.current = venueElements }, [venueElements])
  useEffect(() => { assignmentsRef.current = assignments }, [assignments])

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [seatingRes, guestsRes, groupsRes] = await Promise.all([
        fetch(`/api/seating?weddingId=${encodeURIComponent(weddingId)}`),
        fetch(`/api/guests?weddingId=${encodeURIComponent(weddingId)}`),
        fetch(`/api/guest-groups?weddingId=${encodeURIComponent(weddingId)}`),
      ])

      if (!seatingRes.ok) throw new Error('Failed to fetch seating data')
      if (!guestsRes.ok) throw new Error('Failed to fetch guests')

      const seatingData = await seatingRes.json()
      const guestsData = await guestsRes.json()
      const groupsData = groupsRes.ok ? await groupsRes.json() : { data: [] }

      setTables(seatingData.tables || [])
      setAssignments(seatingData.assignments || [])
      setVenueElements(seatingData.venueElements || [])

      // Build a group name lookup
      const groupNameMap: Record<string, string> = {}
      for (const group of (groupsData.data || [])) {
        groupNameMap[group.id] = group.name || group.label || 'Group'
      }

      // Map guests to SeatingGuest type
      const allGuests: SeatingGuest[] = (guestsData.data || []).map((g: Record<string, unknown>) => ({
        id: g.id as string,
        name: g.name as string,
        confirmation_status: (g.confirmation_status as string) || 'pending',
        tags: (g.tags as string[]) || [],
        guest_group_id: g.guest_group_id as string | null,
        group_name: g.guest_group_id ? groupNameMap[g.guest_group_id as string] || undefined : undefined,
      }))
      setGuests(allGuests)

      // Reset pending tracking after a full server reload
      deletedTableIdsRef.current = new Set()
      deletedElementIdsRef.current = new Set()
      newTableIdsRef.current = new Set()
      newElementIdsRef.current = new Set()
      setHasUnsavedChanges(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [weddingId])

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      fetchData()
    }
  }, [fetchData])

  // Autosave every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedRef.current) saveLayoutRef.current()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Computed: tables with assignments
  const tablesWithAssignments: TableWithAssignments[] = tables.map(table => {
    const tableAssignments = assignments.filter(a => a.table_id === table.id)
    return {
      ...table,
      assignedGuests: tableAssignments,
      occupancy: tableAssignments.length,
      isOverfilled: tableAssignments.length > table.capacity,
    }
  })

  // Computed: unassigned guests
  const assignedGuestIds = new Set(assignments.map(a => a.guest_id))
  const unassignedGuests = guests.filter(g => !assignedGuestIds.has(g.id))

  // Computed: stats
  const stats = {
    totalGuests: guests.filter(g => g.confirmation_status === 'confirmed').length,
    assignedGuests: assignments.length,
    unassignedGuests: unassignedGuests.filter(g => g.confirmation_status === 'confirmed').length,
    totalTables: tables.length,
    overfilledTables: tablesWithAssignments.filter(t => t.isOverfilled).length,
    totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0),
  }

  // ── Undo helpers ──

  const pushHistory = useCallback(() => {
    historyRef.current = [
      ...historyRef.current.slice(-(MAX_HISTORY - 1)),
      {
        tables: [...tablesRef.current],
        venueElements: [...venueElementsRef.current],
        assignments: [...assignmentsRef.current],
      },
    ]
    // Any new mutation clears the redo stack
    redoRef.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    const prev = historyRef.current[historyRef.current.length - 1]
    if (!prev) return
    // Push current state onto redo stack before reverting
    redoRef.current = [
      ...redoRef.current.slice(-(MAX_HISTORY - 1)),
      {
        tables: [...tablesRef.current],
        venueElements: [...venueElementsRef.current],
        assignments: [...assignmentsRef.current],
      },
    ]
    historyRef.current = historyRef.current.slice(0, -1)
    setTables(prev.tables)
    setVenueElements(prev.venueElements)
    setAssignments(prev.assignments)
    setHasUnsavedChanges(true)
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(true)
  }, [])

  const redo = useCallback(() => {
    const next = redoRef.current[redoRef.current.length - 1]
    if (!next) return
    // Push current state onto undo stack before re-applying
    historyRef.current = [
      ...historyRef.current.slice(-(MAX_HISTORY - 1)),
      {
        tables: [...tablesRef.current],
        venueElements: [...venueElementsRef.current],
        assignments: [...assignmentsRef.current],
      },
    ]
    redoRef.current = redoRef.current.slice(0, -1)
    setTables(next.tables)
    setVenueElements(next.venueElements)
    setAssignments(next.assignments)
    setHasUnsavedChanges(true)
    setCanUndo(true)
    setCanRedo(redoRef.current.length > 0)
  }, [])

  // ── Table operations (optimistic / local-only — synced on save) ──

  const addTable = useCallback((shape: TableShape, position?: { x: number; y: number }): Promise<SeatingTable | null> => {
    pushHistory()
    const defaults = TABLE_DEFAULTS[shape]
    const count = tables.length
    const id = tempId()
    const newTable: SeatingTable = {
      id,
      wedding_id: '',
      name: shape === 'sweetheart' ? 'Sweetheart Table' : `Table ${count + 1}`,
      shape,
      capacity: defaults.capacity,
      side_a_count: shape === 'sweetheart' ? 2 : null,
      side_b_count: shape === 'sweetheart' ? 0 : null,
      head_a_count: null,
      head_b_count: null,
      position_x: position?.x ?? 100 + count * 50,
      position_y: position?.y ?? 100 + count * 30,
      rotation: 0,
      width: defaults.width,
      height: defaults.height,
      display_order: count,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    newTableIdsRef.current.add(id)
    setTables(prev => [...prev, newTable])
    setHasUnsavedChanges(true)
    return Promise.resolve(newTable)
  }, [tables.length, pushHistory])

  const updateTable = useCallback((id: string, updates: Partial<SeatingTable>) => {
    pushHistory()
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    setHasUnsavedChanges(true)
  }, [pushHistory])

  const deleteTable = useCallback((id: string): Promise<boolean> => {
    pushHistory()
    if (!newTableIdsRef.current.has(id)) deletedTableIdsRef.current.add(id)
    newTableIdsRef.current.delete(id)
    setTables(prev => prev.filter(t => t.id !== id))
    setAssignments(prev => prev.filter(a => a.table_id !== id))
    setHasUnsavedChanges(true)
    return Promise.resolve(true)
  }, [pushHistory])

  const duplicateTable = useCallback((id: string): Promise<SeatingTable | null> => {
    const source = tables.find(t => t.id === id)
    if (!source) return Promise.resolve(null)
    pushHistory()
    const newId = tempId()
    const newTable: SeatingTable = {
      ...source,
      id: newId,
      name: `${source.name} (copy)`,
      position_x: source.position_x + 40,
      position_y: source.position_y + 40,
      display_order: tables.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    newTableIdsRef.current.add(newId)
    setTables(prev => [...prev, newTable])
    setHasUnsavedChanges(true)
    return Promise.resolve(newTable)
  }, [tables, pushHistory])

  const duplicateTables = useCallback((ids: string[]): SeatingTable[] => {
    const sources = tablesRef.current.filter(t => ids.includes(t.id))
    if (!sources.length) return []
    pushHistory()
    const newTables: SeatingTable[] = sources.map((source, i) => {
      const newId = tempId()
      const t: SeatingTable = {
        ...source,
        id: newId,
        name: `${source.name} (copy)`,
        position_x: source.position_x + 40,
        position_y: source.position_y + 40,
        display_order: tablesRef.current.length + i,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      newTableIdsRef.current.add(newId)
      return t
    })
    setTables(prev => [...prev, ...newTables])
    setHasUnsavedChanges(true)
    return newTables
  }, [pushHistory])

  const mirrorDuplicateTables = useCallback((ids: string[], axis: 'h' | 'v'): SeatingTable[] => {
    const sources = tablesRef.current.filter(t => ids.includes(t.id))
    if (!sources.length) return []
    pushHistory()
    // Bounding box of the selection
    const minX = Math.min(...sources.map(t => t.position_x))
    const minY = Math.min(...sources.map(t => t.position_y))
    const maxX = Math.max(...sources.map(t => t.position_x + t.width))
    const maxY = Math.max(...sources.map(t => t.position_y + t.height))
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const GRID = 20
    const newTables: SeatingTable[] = sources.map((source, i) => {
      const newId = tempId()
      const newX = axis === 'h'
        ? 2 * cx - source.position_x - source.width
        : source.position_x
      const newY = axis === 'v'
        ? 2 * cy - source.position_y - source.height
        : source.position_y
      const newRotation = axis === 'h'
        ? (-source.rotation + 360) % 360
        : (180 - source.rotation + 360) % 360
      const t: SeatingTable = {
        ...source,
        id: newId,
        name: `${source.name} (mirror)`,
        position_x: Math.round(newX / GRID) * GRID,
        position_y: Math.round(newY / GRID) * GRID,
        rotation: newRotation,
        display_order: tablesRef.current.length + i,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      newTableIdsRef.current.add(newId)
      return t
    })
    setTables(prev => [...prev, ...newTables])
    setHasUnsavedChanges(true)
    return newTables
  }, [pushHistory])

  // ── Assignment operations (optimistic / local-only) ──

  const assignGuest = useCallback((guestId: string, tableId: string): Promise<boolean> => {
    pushHistory()
    const guest = guests.find(g => g.id === guestId)
    const localAssignment: SeatingAssignment = {
      id: `temp_${guestId}`,
      wedding_id: '',
      table_id: tableId,
      guest_id: guestId,
      seat_number: null,
      created_at: new Date().toISOString(),
      guests: guest
        ? { id: guest.id, name: guest.name, confirmation_status: guest.confirmation_status, tags: guest.tags }
        : undefined,
    }
    setAssignments(prev => [...prev.filter(a => a.guest_id !== guestId), localAssignment])
    setHasUnsavedChanges(true)
    return Promise.resolve(true)
  }, [guests, pushHistory])

  const unassignGuest = useCallback((guestId: string): Promise<boolean> => {
    pushHistory()
    setAssignments(prev => prev.filter(a => a.guest_id !== guestId))
    setHasUnsavedChanges(true)
    return Promise.resolve(true)
  }, [pushHistory])

  const moveGuest = useCallback((guestId: string, newTableId: string): Promise<boolean> => {
    pushHistory()
    setAssignments(prev => prev.map(a => a.guest_id === guestId ? { ...a, table_id: newTableId } : a))
    setHasUnsavedChanges(true)
    return Promise.resolve(true)
  }, [pushHistory])

  const autoAssign = useCallback(async (keepGroupsTogether = true): Promise<number> => {
    try {
      const res = await fetch(`/api/seating/auto-assign?weddingId=${encodeURIComponent(weddingId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepGroupsTogether }),
      })
      if (!res.ok) throw new Error('Failed to auto-assign')
      const result = await res.json()
      // Full reload after server computation
      await fetchData()
      return result.assigned || 0
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-assign')
      return 0
    }
  }, [weddingId, fetchData])

  // ── Venue element operations (optimistic / local-only) ──

  const addVenueElement = useCallback((type: VenueElementType, position?: { x: number; y: number }): Promise<VenueElement | null> => {
    pushHistory()
    const id = tempId()
    const newElement: VenueElement = {
      id,
      wedding_id: '',
      element_type: type,
      label: null,
      position_x: position?.x ?? 300,
      position_y: position?.y ?? 300,
      width: 150,
      height: 100,
      rotation: 0,
      color: null,
      created_at: new Date().toISOString(),
    }
    newElementIdsRef.current.add(id)
    setVenueElements(prev => [...prev, newElement])
    setHasUnsavedChanges(true)
    return Promise.resolve(newElement)
  }, [pushHistory])

  const updateVenueElement = useCallback((id: string, updates: Partial<VenueElement>) => {
    pushHistory()
    setVenueElements(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
    setHasUnsavedChanges(true)
  }, [pushHistory])

  const deleteVenueElement = useCallback((id: string): Promise<boolean> => {
    pushHistory()
    if (!newElementIdsRef.current.has(id)) deletedElementIdsRef.current.add(id)
    newElementIdsRef.current.delete(id)
    setVenueElements(prev => prev.filter(e => e.id !== id))
    setHasUnsavedChanges(true)
    return Promise.resolve(true)
  }, [pushHistory])

  // ── Save layout ──

  const saveLayout = useCallback(async (): Promise<boolean> => {
    try {
      setSaving(true)
      const res = await fetch(`/api/seating?weddingId=${encodeURIComponent(weddingId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tables: tables.map(t => ({
            id: t.id,
            name: t.name,
            shape: t.shape,
            capacity: t.capacity,
            side_a_count: t.side_a_count,
            side_b_count: t.side_b_count,
            head_a_count: t.head_a_count,
            head_b_count: t.head_b_count,
            position_x: t.position_x,
            position_y: t.position_y,
            rotation: t.rotation,
            width: t.width,
            height: t.height,
            display_order: t.display_order,
          })),
          venueElements: venueElements.map(e => ({
            id: e.id,
            element_type: e.element_type,
            label: e.label,
            position_x: e.position_x,
            position_y: e.position_y,
            width: e.width,
            height: e.height,
            rotation: e.rotation,
            color: e.color ?? null,
          })),
          assignments: assignments.map(a => ({
            table_id: a.table_id,
            guest_id: a.guest_id,
          })),
          deletedTableIds: [...deletedTableIdsRef.current],
          deletedElementIds: [...deletedElementIdsRef.current],
        }),
      })

      if (!res.ok) throw new Error('Failed to save layout')

      const { idMaps } = await res.json()

      // Swap temp IDs for real DB IDs returned by the server
      if (idMaps?.tables && Object.keys(idMaps.tables).length > 0) {
        setTables(prev => prev.map(t => ({ ...t, id: idMaps.tables[t.id] ?? t.id })))
        setAssignments(prev => prev.map(a => ({ ...a, table_id: idMaps.tables[a.table_id] ?? a.table_id })))
        newTableIdsRef.current = new Set()
      }
      if (idMaps?.elements && Object.keys(idMaps.elements).length > 0) {
        setVenueElements(prev => prev.map(e => ({ ...e, id: idMaps.elements[e.id] ?? e.id })))
        newElementIdsRef.current = new Set()
      }
      deletedTableIdsRef.current = new Set()
      deletedElementIdsRef.current = new Set()
      setHasUnsavedChanges(false)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save layout')
      return false
    } finally {
      setSaving(false)
    }
  }, [weddingId, tables, venueElements, assignments])

  // Keep autosave ref current
  saveLayoutRef.current = saveLayout

  return {
    tables,
    tablesWithAssignments,
    assignments,
    venueElements,
    guests,
    unassignedGuests,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    addTable,
    updateTable,
    deleteTable,
    duplicateTable,
    duplicateTables,
    mirrorDuplicateTables,
    assignGuest,
    unassignGuest,
    moveGuest,
    autoAssign,
    addVenueElement,
    updateVenueElement,
    deleteVenueElement,
    saveLayout,
    discardChanges: fetchData,
    undo,
    canUndo,
    redo,
    canRedo,
    stats,
  }
}

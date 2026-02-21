// Shared types for the seating chart feature

export type TableShape = 'round' | 'rectangular' | 'sweetheart'

export type VenueElementType = 'dance_floor' | 'stage' | 'entrance' | 'bar' | 'dj_booth' | 'periquera' | 'lounge' | 'custom'
export type VenueElementShape = 'rect' | 'circle'

export interface SeatingTable {
  id: string
  wedding_id: string
  name: string
  shape: TableShape
  capacity: number
  side_a_count: number | null
  side_b_count: number | null
  head_a_count: number | null
  head_b_count: number | null
  position_x: number
  position_y: number
  rotation: number
  width: number
  height: number
  display_order: number
  created_at: string
  updated_at: string
}

export interface SeatingAssignment {
  id: string
  wedding_id: string
  table_id: string
  guest_id: string
  seat_number: number | null
  created_at: string
  guests?: {
    id: string
    name: string
    confirmation_status: string
    tags: string[]
  }
}

export interface VenueElement {
  id: string
  wedding_id: string
  element_type: VenueElementType
  element_shape: VenueElementShape
  label: string | null
  position_x: number
  position_y: number
  width: number
  height: number
  rotation: number
  color: string | null
  created_at: string
}

export interface SeatingGuest {
  id: string
  name: string
  confirmation_status: string
  tags: string[]
  guest_group_id: string | null
  group_name?: string
}

export interface TableWithAssignments extends SeatingTable {
  assignedGuests: SeatingAssignment[]
  occupancy: number
  isOverfilled: boolean
}

export const VENUE_ELEMENT_LABELS: Record<VenueElementType, { en: string; es: string; icon: string }> = {
  dance_floor: { en: 'Dance Floor', es: 'Pista de Baile', icon: '💃' },
  stage: { en: 'Stage', es: 'Escenario', icon: '🎤' },
  entrance: { en: 'Entrance', es: 'Entrada', icon: '🚪' },
  bar: { en: 'Bar', es: 'Bar', icon: '🍸' },
  dj_booth: { en: 'DJ Booth', es: 'Cabina DJ', icon: '🎧' },
  periquera: { en: 'High Table', es: 'Periquera', icon: '🪑' },
  lounge: { en: 'Lounge', es: 'Lounge', icon: '🛋️' },
  custom: { en: 'Custom', es: 'Personalizado', icon: '✏️' },
}

export const TABLE_DEFAULTS = {
  round:        { width: 120, height: 120, capacity: 8 },  // 3×3 grid cells
  rectangular:  { width: 200, height: 80,  capacity: 8 },  // 5×2 grid cells
  sweetheart:   { width: 160, height: 40,  capacity: 2 },  // 4×1 grid cells
} as const

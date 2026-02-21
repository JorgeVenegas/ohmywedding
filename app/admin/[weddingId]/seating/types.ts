// Shared types for the seating chart feature

export type TableShape = 'round' | 'rectangular' | 'sweetheart'

export type VenueElementType = 'dance_floor' | 'stage' | 'entrance' | 'bar' | 'dj_booth' | 'periquera' | 'lounge' | 'custom' | 'area'
export type VenueElementShape = 'rect' | 'circle' | 'sofa_single' | 'sofa_l' | 'sofa_u' | 'sofa_circle'

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
  capacity: number
  position_x: number
  position_y: number
  width: number
  height: number
  rotation: number
  color: string | null
  locked: boolean
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

export const VENUE_ELEMENT_LABELS: Record<VenueElementType, { en: string; es: string }> = {
  dance_floor: { en: 'Dance Floor', es: 'Pista de Baile' },
  stage: { en: 'Stage', es: 'Escenario' },
  entrance: { en: 'Entrance', es: 'Entrada' },
  bar: { en: 'Bar', es: 'Bar' },
  dj_booth: { en: 'DJ Booth', es: 'Cabina DJ' },
  periquera: { en: 'High Table', es: 'Periquera' },
  lounge: { en: 'Lounge', es: 'Lounge' },
  area: { en: 'Area / Zone', es: 'Área / Zona' },
  custom: { en: 'Custom', es: 'Personalizado' },
}

export const LOUNGE_SHAPE_LABELS: Record<string, { en: string; icon: string }> = {
  sofa_single: { en: 'Single Sofa',  icon: '—' },
  sofa_l:      { en: 'L-Shape',      icon: '⌐' },
  sofa_u:      { en: 'U-Shape',      icon: '∪' },
  sofa_circle: { en: 'Circle',       icon: '○' },
}

export const TABLE_DEFAULTS = {
  round:        { width: 120, height: 120, capacity: 8 },  // 3×3 grid cells
  rectangular:  { width: 200, height: 80,  capacity: 8 },  // 5×2 grid cells
  sweetheart:   { width: 160, height: 40,  capacity: 2 },  // 4×1 grid cells
} as const

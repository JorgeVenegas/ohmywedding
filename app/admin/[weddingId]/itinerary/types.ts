export interface ItineraryEvent {
  id: string
  wedding_id: string
  parent_id: string | null
  title: string
  description: string | null
  location: string | null
  start_time: string
  end_time: string | null
  notes: string | null
  icon: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface ItineraryEventWithChildren extends ItineraryEvent {
  children: ItineraryEvent[]
}

export interface SubEventInput {
  id?: string
  title: string
  start_time: string
  icon: string
}

export const EVENT_ICONS: { value: string; label: string; lucide: string }[] = [
  { value: 'ceremony', label: 'Ceremony', lucide: 'Church' },
  { value: 'reception', label: 'Reception', lucide: 'PartyPopper' },
  { value: 'cocktail', label: 'Cocktail', lucide: 'Wine' },
  { value: 'dinner', label: 'Dinner', lucide: 'Utensils' },
  { value: 'dancing', label: 'Dancing', lucide: 'Music2' },
  { value: 'firstDance', label: 'First Dance', lucide: 'HeartHandshake' },
  { value: 'entrance', label: 'Entrance', lucide: 'DoorOpen' },
  { value: 'toast', label: 'Toast', lucide: 'GlassWater' },
  { value: 'cake', label: 'Cake Cutting', lucide: 'Cake' },
  { value: 'bouquet', label: 'Bouquet Toss', lucide: 'Flower2' },
  { value: 'photo', label: 'Photos', lucide: 'Camera' },
  { value: 'music', label: 'Music', lucide: 'Music' },
  { value: 'transport', label: 'Transport', lucide: 'Car' },
  { value: 'preparation', label: 'Preparation', lucide: 'Sparkles' },
  { value: 'other', label: 'Other', lucide: 'CalendarDays' },
]

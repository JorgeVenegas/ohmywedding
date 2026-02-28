import {
  Church, PartyPopper, Wine, Utensils, Music2, HeartHandshake, DoorOpen,
  GlassWater, Cake, Flower2, Camera, Music, Car, Sparkles, CalendarDays,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  Church, PartyPopper, Wine, Utensils, Music2, HeartHandshake, DoorOpen,
  GlassWater, Cake, Flower2, Camera, Music, Car, Sparkles, CalendarDays,
}

/** Brand wine/burgundy color used for all icons for visual consistency */
const WINE = { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' }

export const ICON_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ceremony:    WINE,
  reception:   WINE,
  cocktail:    WINE,
  dinner:      WINE,
  dancing:     WINE,
  firstDance:  WINE,
  entrance:    WINE,
  toast:       WINE,
  cake:        WINE,
  bouquet:     WINE,
  photo:       WINE,
  music:       WINE,
  transport:   WINE,
  preparation: WINE,
  other:       WINE,
}

const VALUE_TO_LUCIDE: Record<string, string> = {
  ceremony: 'Church', reception: 'PartyPopper', cocktail: 'Wine',
  dinner: 'Utensils', dancing: 'Music2', firstDance: 'HeartHandshake',
  entrance: 'DoorOpen', toast: 'GlassWater', cake: 'Cake',
  bouquet: 'Flower2', photo: 'Camera', music: 'Music',
  transport: 'Car', preparation: 'Sparkles', other: 'CalendarDays',
}

export function getEventIcon(iconValue: string | null): LucideIcon {
  if (!iconValue) return CalendarDays
  return LUCIDE_ICON_MAP[VALUE_TO_LUCIDE[iconValue] ?? 'CalendarDays'] ?? CalendarDays
}

export function getIconColor(iconValue: string | null) {
  return ICON_COLORS[iconValue ?? 'other'] ?? ICON_COLORS.other
}


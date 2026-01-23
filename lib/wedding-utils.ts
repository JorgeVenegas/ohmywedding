import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getWeddingByDateAndNameId } from "./wedding-data"

// RSVP related functions
export interface RSVP {
  id: string
  wedding_id: string
  guest_name: string
  guest_email: string
  attending: string
  companions: number
  dietary_restrictions: string | null
  message: string | null
  submitted_at: string
}

export async function getRSVPsByDateAndNameId(dateId: string, weddingNameId: string): Promise<RSVP[]> {
  // First, get the wedding to obtain the UUID
  const wedding = await getWeddingByDateAndNameId(dateId, weddingNameId)
  if (!wedding) {
    return []
  }

  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('submitted_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data as RSVP[]
}

// Legacy function for backward compatibility
export async function getRSVPsByWeddingId(weddingId: string): Promise<RSVP[]> {
  const [dateId, weddingNameId] = weddingId.split('/')
  if (!dateId || !weddingNameId) {
    return []
  }
  return getRSVPsByDateAndNameId(dateId, weddingNameId)
}

export async function getRSVPStats(weddingId: string) {
  const rsvps = await getRSVPsByWeddingId(weddingId)
  
  const attending = rsvps.filter(rsvp => rsvp.attending === 'yes')
  const notAttending = rsvps.filter(rsvp => rsvp.attending === 'no')
  const pending = rsvps.filter(rsvp => rsvp.attending === 'pending')
  
  const totalGuests = attending.reduce((sum, rsvp) => sum + 1 + (rsvp.companions || 0), 0)
  
  return {
    total: rsvps.length,
    attending: attending.length,
    notAttending: notAttending.length,
    pending: pending.length,
    totalGuests
  }
}

// Gallery functions
export interface GalleryAlbum {
  id: string
  wedding_id: string
  name: string
  description: string | null
  cover_photo_url: string | null
  is_public: boolean
  display_order: number
  created_at: string
}

export interface GalleryPhoto {
  id: string
  album_id: string
  wedding_id: string
  title: string | null
  description: string | null
  photo_url: string
  thumbnail_url: string | null
  uploaded_by: string | null
  display_order: number
  created_at: string
}

export async function getGalleryAlbumsByDateAndNameId(dateId: string, weddingNameId: string): Promise<GalleryAlbum[]> {
  // First, get the wedding to obtain the UUID
  const wedding = await getWeddingByDateAndNameId(dateId, weddingNameId)
  if (!wedding) {
    return []
  }

  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('gallery_albums')
    .select('*')
    .eq('wedding_id', wedding.id)
    .eq('is_public', true)
    .order('display_order', { ascending: true })

  if (error || !data) {
    return []
  }

  return data as GalleryAlbum[]
}

// Legacy function for backward compatibility
export async function getGalleryAlbumsByWeddingId(weddingId: string): Promise<GalleryAlbum[]> {
  const [dateId, weddingNameId] = weddingId.split('/')
  if (!dateId || !weddingNameId) {
    return []
  }
  return getGalleryAlbumsByDateAndNameId(dateId, weddingNameId)
}

export async function getPhotosByAlbumId(albumId: string): Promise<GalleryPhoto[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('*')
    .eq('album_id', albumId)
    .order('display_order', { ascending: true })

  if (error || !data) {
    return []
  }

  return data as GalleryPhoto[]
}

// FAQ functions
export interface WeddingFAQ {
  id: string
  wedding_id: string
  question: string
  answer: string
  image_url?: string | null
  display_order: number
  is_visible: boolean
  created_at: string
}

export async function getFAQsByDateAndNameId(dateId: string, weddingNameId: string): Promise<WeddingFAQ[]> {
  // First, get the wedding to obtain the UUID
  const wedding = await getWeddingByDateAndNameId(dateId, weddingNameId)
  if (!wedding) {
    return []
  }

  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('wedding_faqs')
    .select('*')
    .eq('wedding_id', wedding.id)
    .eq('is_visible', true)
    .order('display_order', { ascending: true })

  if (error || !data) {
    return []
  }

  return data as WeddingFAQ[]
}

// Legacy function for backward compatibility
export async function getFAQsByWeddingId(weddingId: string): Promise<WeddingFAQ[]> {
  const [dateId, weddingNameId] = weddingId.split('/')
  if (!dateId || !weddingNameId) {
    return []
  }
  return getFAQsByDateAndNameId(dateId, weddingNameId)
}

// Schedule functions
export interface WeddingSchedule {
  id: string
  wedding_id: string
  event_name: string
  event_time: string
  event_description: string | null
  display_order: number
  created_at: string
}

export async function getScheduleByDateAndNameId(dateId: string, weddingNameId: string): Promise<WeddingSchedule[]> {
  // First, get the wedding to obtain the UUID
  const wedding = await getWeddingByDateAndNameId(dateId, weddingNameId)
  if (!wedding) {
    return []
  }

  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('wedding_schedule')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('event_time', { ascending: true })

  if (error || !data) {
    return []
  }

  return data as WeddingSchedule[]
}

// Legacy function for backward compatibility
export async function getScheduleByWeddingId(weddingId: string): Promise<WeddingSchedule[]> {
  const [dateId, weddingNameId] = weddingId.split('/')
  if (!dateId || !weddingNameId) {
    return []
  }
  return getScheduleByDateAndNameId(dateId, weddingNameId)
}
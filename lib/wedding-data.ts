import { createServerSupabaseClient } from "@/lib/supabase-server"

export interface Wedding {
  id: string
  date_id: string
  wedding_name_id: string
  partner1_first_name: string
  partner1_last_name: string
  partner2_first_name: string
  partner2_last_name: string
  wedding_date: string
  wedding_time: string
  story: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  ceremony_venue_name: string | null
  ceremony_venue_address: string | null
  reception_venue_name: string | null
  reception_venue_address: string | null
  created_at: string
  updated_at: string
}

export async function getWeddingByDateAndNameId(dateId: string, weddingNameId: string): Promise<Wedding | null> {
  const supabase = await createServerSupabaseClient()
  
  // Decode the wedding name ID in case it's URL encoded
  const decodedWeddingNameId = decodeURIComponent(weddingNameId)
  
  const { data, error } = await supabase
    .from('weddings')
    .select('*')
    .eq('date_id', dateId)
    .eq('wedding_name_id', decodedWeddingNameId)
    .single()

  if (error || !data) {
    return null
  }

  return data as Wedding
}

// Legacy function for backward compatibility
export async function getWeddingByWeddingId(weddingId: string): Promise<Wedding | null> {
  const [dateId, weddingNameId] = weddingId.split('/')
  if (!dateId || !weddingNameId) {
    return null
  }
  // The weddingNameId from the split might be URL encoded, let getWeddingByDateAndNameId handle decoding
  return getWeddingByDateAndNameId(dateId, weddingNameId)
}
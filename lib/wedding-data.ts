import { createServerSupabaseClient } from "@/lib/supabase-server"

export interface Wedding {
  id: string
  date_id: string
  wedding_name_id: string
  partner1_first_name: string
  partner1_last_name: string
  partner2_first_name: string
  partner2_last_name: string
  wedding_date: string | null
  wedding_time: string | null
  reception_time: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  ceremony_venue_name: string | null
  ceremony_venue_address: string | null
  reception_venue_name: string | null
  reception_venue_address: string | null
  page_config: Record<string, any>
  owner_id: string | null
  collaborator_emails: string[]
  og_title: string | null
  og_description: string | null
  og_image_url: string | null
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

// Get wedding by wedding_name_id only (for server-side metadata generation)
export async function getWeddingByNameId(weddingNameId: string): Promise<Wedding | null> {
  const supabase = await createServerSupabaseClient()
  
  // Decode the wedding name ID in case it's URL encoded
  const decodedWeddingNameId = decodeURIComponent(weddingNameId)
  
  // Check if it's a UUID or wedding_name_id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedWeddingNameId)
  
  let query = supabase.from('weddings').select('*')
  
  if (isUuid) {
    query = query.eq('id', decodedWeddingNameId)
  } else {
    query = query.eq('wedding_name_id', decodedWeddingNameId)
  }
  
  const { data, error } = await query.single()

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
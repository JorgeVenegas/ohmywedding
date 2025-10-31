import { createClient } from "@/lib/supabase-client"
import { Wedding } from "./wedding-data"

export async function getWeddingByDateAndNameIdClient(dateId: string, weddingNameId: string): Promise<Wedding | null> {
  const supabase = createClient()
  
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
export async function getWeddingByWeddingIdClient(weddingId: string): Promise<Wedding | null> {
  const [dateId, weddingNameId] = weddingId.split('/')
  if (!dateId || !weddingNameId) {
    return null
  }
  // The weddingNameId from the split might be URL encoded, let getWeddingByDateAndNameIdClient handle decoding
  return getWeddingByDateAndNameIdClient(dateId, weddingNameId)
}
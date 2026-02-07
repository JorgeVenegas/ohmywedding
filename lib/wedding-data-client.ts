import { createClient } from "@/lib/supabase-client"
import { Wedding } from "./wedding-data"

export async function getWeddingByNameIdClient(weddingNameId: string): Promise<Wedding | null> {
  const supabase = createClient()
  
  // Decode the wedding name ID in case it's URL encoded
  const decodedWeddingNameId = decodeURIComponent(weddingNameId)
  
  const { data, error } = await supabase
    .from('weddings')
    .select('*')
    .eq('wedding_name_id', decodedWeddingNameId)
    .single()

  if (error || !data) {
    return null
  }

  // Fetch the wedding subscription (plan info)
  const { data: features } = await supabase
    .from('wedding_subscriptions')
    .select('plan')
    .eq('wedding_id', data.id)
    .single()

  return {
    ...data,
    wedding_features: features ? { plan: features.plan } : { plan: 'free' }
  } as Wedding
}

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

  // Fetch the wedding subscription (plan info)
  const { data: features } = await supabase
    .from('wedding_subscriptions')
    .select('plan')
    .eq('wedding_id', data.id)
    .single()

  return {
    ...data,
    wedding_features: features ? { plan: features.plan } : { plan: 'free' }
  } as Wedding
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
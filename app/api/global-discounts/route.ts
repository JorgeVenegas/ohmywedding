import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/global-discounts — returns the currently active global discount (public)
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('global_discounts')
      .select('id, name, label, premium_card_discount_percent, premium_msi_discount_percent, deluxe_card_discount_percent, deluxe_msi_discount_percent, applies_to_plans, starts_at, ends_at')
      .eq('is_active', true)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching global discount:', error)
      return NextResponse.json({ discount: null })
    }

    return NextResponse.json({ discount: data })
  } catch (err) {
    console.error('Error in global-discounts GET:', err)
    return NextResponse.json({ discount: null })
  }
}

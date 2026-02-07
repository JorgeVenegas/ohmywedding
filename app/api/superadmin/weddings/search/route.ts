import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase-server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Verify superuser
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: superuser } = await supabase
      .from('superusers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!superuser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('q') || ''
    
    if (!search.trim()) {
      return NextResponse.json({ weddings: [] })
    }
    
    // Use admin client to bypass RLS
    const adminClient = createAdminSupabaseClient()
    
    // Search weddings by name or ID
    const { data: weddings, error } = await adminClient
      .from('weddings')
      .select(`
        id,
        wedding_name_id,
        partner1_first_name,
        partner1_last_name,
        partner2_first_name,
        partner2_last_name,
        wedding_date,
        owner_id,
        created_at
      `)
      .or(`wedding_name_id.ilike.%${search}%,partner1_first_name.ilike.%${search}%,partner1_last_name.ilike.%${search}%,partner2_first_name.ilike.%${search}%,partner2_last_name.ilike.%${search}%`)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    
    // Get plans for each wedding
    const weddingsWithPlans = await Promise.all(
      (weddings || []).map(async (wedding) => {
        const { data: features } = await adminClient
          .from('wedding_subscriptions')
          .select('plan')
          .eq('wedding_id', wedding.id)
          .single()
        
        return {
          ...wedding,
          partner1_name: `${wedding.partner1_first_name} ${wedding.partner1_last_name || ''}`.trim(),
          partner2_name: `${wedding.partner2_first_name} ${wedding.partner2_last_name || ''}`.trim(),
          plan: features?.plan || 'free'
        }
      })
    )
    
    return NextResponse.json({ weddings: weddingsWithPlans })
  } catch (error) {
    console.error('Error searching weddings:', error)
    return NextResponse.json(
      { error: 'Failed to search weddings' },
      { status: 500 }
    )
  }
}

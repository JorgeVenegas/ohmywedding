import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase-server"
import { isSuperUser } from "@/lib/superadmin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isSuperUser(supabase, { userId: user.id }))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('q') || ''

    const adminClient = createAdminSupabaseClient()

    let query = adminClient
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
        created_at,
        ceremony_venue_name,
        invitation_design_status
      `)
      .order('created_at', { ascending: false })

    if (search.trim()) {
      query = query.or(`wedding_name_id.ilike.%${search}%,partner1_first_name.ilike.%${search}%,partner1_last_name.ilike.%${search}%,partner2_first_name.ilike.%${search}%,partner2_last_name.ilike.%${search}%`)
      query = query.limit(20)
    } else {
      query = query.limit(100)
    }

    const { data: weddings, error } = await query

    if (error) throw error
    if (!weddings?.length) return NextResponse.json({ weddings: [] })

    const weddingIds = weddings.map(w => w.id)

    // Batch fetch plans, guest counts, and photo storage in parallel
    const [{ data: subscriptions }, { data: guestRows }, { data: photoRows }] = await Promise.all([
      adminClient
        .from('wedding_subscriptions')
        .select('wedding_id, plan')
        .in('wedding_id', weddingIds),
      adminClient
        .from('guests')
        .select('wedding_id')
        .in('wedding_id', weddingIds),
      adminClient
        .from('guest_photos')
        .select('wedding_id, file_size, preview_size')
        .in('wedding_id', weddingIds),
    ])

    const planMap = Object.fromEntries(
      (subscriptions || []).map(s => [s.wedding_id, s.plan])
    )
    const guestCountMap = (guestRows || []).reduce<Record<string, number>>((acc, g) => {
      acc[g.wedding_id] = (acc[g.wedding_id] || 0) + 1
      return acc
    }, {})
    const storageMap = (photoRows || []).reduce<Record<string, { bytes: number; count: number }>>((acc, p) => {
      if (!acc[p.wedding_id]) acc[p.wedding_id] = { bytes: 0, count: 0 }
      acc[p.wedding_id].bytes += (p.file_size ?? 0) + (p.preview_size ?? 0)
      acc[p.wedding_id].count += 1
      return acc
    }, {})

    const result = weddings.map(wedding => ({
      id: wedding.id,
      wedding_name_id: wedding.wedding_name_id,
      partner1_name: `${wedding.partner1_first_name} ${wedding.partner1_last_name || ''}`.trim(),
      partner2_name: `${wedding.partner2_first_name} ${wedding.partner2_last_name || ''}`.trim(),
      wedding_date: wedding.wedding_date,
      owner_id: wedding.owner_id,
      created_at: wedding.created_at,
      location: wedding.ceremony_venue_name || null,
      design_status: wedding.invitation_design_status || 'not_started',
      guest_count: guestCountMap[wedding.id] ?? 0,
      plan: planMap[wedding.id] || 'free',
      photo_storage_bytes: storageMap[wedding.id]?.bytes ?? 0,
      photo_count: storageMap[wedding.id]?.count ?? 0,
    }))

    return NextResponse.json({ weddings: result })
  } catch (error) {
    console.error('Error searching weddings:', error)
    return NextResponse.json(
      { error: 'Failed to search weddings' },
      { status: 500 }
    )
  }
}

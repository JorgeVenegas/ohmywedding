import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST: Create a new lead when user visits the upgrade page
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { source, plan, weddingId } = await request.json()

    // Check for a recent non-completed lead from same user + source to avoid duplicates
    // If the user refreshes the page, reuse the existing lead (within 30 min window)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: existingLead } = await supabase
      .from('subscription_orders')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('source', source || 'direct')
      .gte('visited_at', thirtyMinAgo)
      .in('status', ['visited'])
      .order('visited_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingLead) {
      return NextResponse.json({ leadId: existingLead.id })
    }

    // Create a new lead
    const leadData: Record<string, unknown> = {
      user_id: user.id,
      source: source || 'direct',
      status: 'visited',
      visited_at: new Date().toISOString(),
    }

    // Set optional fields if provided via URL params
    if (plan && ['premium', 'deluxe'].includes(plan)) {
      leadData.to_plan = plan
    }
    if (weddingId) {
      // Resolve wedding UUID if slug provided
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingId)
      if (isUUID) {
        leadData.wedding_id = weddingId
      } else {
        const { data: wedding } = await supabase
          .from('weddings')
          .select('id')
          .eq('wedding_name_id', weddingId)
          .maybeSingle()
        if (wedding) {
          leadData.wedding_id = wedding.id
        }
      }
    }

    const { data: lead, error: insertError } = await supabase
      .from('subscription_orders')
      .insert(leadData)
      .select('id')
      .single()

    if (insertError) {
      console.error('Failed to create lead:', insertError)
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    return NextResponse.json({ leadId: lead.id })
  } catch (error) {
    console.error('Lead creation failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update an existing lead (plan selected, wedding selected)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { leadId, plan, weddingId } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: 'leadId required' }, { status: 400 })
    }

    // Verify the lead belongs to this user
    const { data: lead, error: fetchError } = await supabase
      .from('subscription_orders')
      .select('id, status, user_id')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Build update payload
    const updates: Record<string, unknown> = {}

    if (plan && ['premium', 'deluxe'].includes(plan)) {
      updates.to_plan = plan
    }

    if (weddingId) {
      // Resolve wedding UUID if slug provided
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingId)
      if (isUUID) {
        updates.wedding_id = weddingId
      } else {
        const { data: wedding } = await supabase
          .from('weddings')
          .select('id')
          .eq('wedding_name_id', weddingId)
          .maybeSingle()
        if (wedding) {
          updates.wedding_id = wedding.id
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true })
    }

    const { error: updateError } = await supabase
      .from('subscription_orders')
      .update(updates)
      .eq('id', leadId)

    if (updateError) {
      console.error('Failed to update lead:', updateError)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Lead update failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

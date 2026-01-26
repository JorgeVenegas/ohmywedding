import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/weddings/[weddingNameId]/claim - Claim ownership of an unowned wedding
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingNameId } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 })
    }

    // Get wedding info
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('owner_id')
      .eq('wedding_name_id', weddingNameId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    // Check if wedding already has an owner
    if (wedding.owner_id !== null) {
      if (wedding.owner_id === user.id) {
        return NextResponse.json({ message: 'You already own this wedding' })
      }
      return NextResponse.json({ error: 'This wedding already has an owner' }, { status: 403 })
    }

    // Claim ownership - use raw SQL to bypass RLS
    const { error: updateError } = await supabase.rpc('claim_wedding_ownership', {
      p_wedding_name_id: weddingNameId,
      p_user_id: user.id
    })

    // If RPC doesn't exist, try direct update (might fail due to RLS)
    if (updateError?.message?.includes('function') || updateError?.code === '42883') {
      const { error: directUpdateError } = await supabase
        .from('weddings')
        .update({ 
          owner_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('wedding_name_id', weddingNameId)
        .is('owner_id', null)

      if (directUpdateError) {
        return NextResponse.json({ error: 'Failed to claim wedding' }, { status: 500 })
      }
    } else if (updateError) {
      return NextResponse.json({ error: 'Failed to claim wedding' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Wedding ownership claimed successfully'
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

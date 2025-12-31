import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PATCH /api/weddings/[weddingNameId]/metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingNameId: rawWeddingNameId } = await params
    const weddingNameId = decodeURIComponent(rawWeddingNameId)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if it's a UUID or wedding_name_id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingNameId)
    
    // Get wedding to verify ownership
    let query = supabase
      .from('weddings')
      .select('id, owner_id, collaborator_emails')
    
    if (isUuid) {
      query = query.eq('id', weddingNameId)
    } else {
      query = query.eq('wedding_name_id', weddingNameId)
    }
    
    const { data: wedding, error: fetchError } = await query.single()
    
    if (fetchError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    // Check if user is owner or collaborator
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const userEmail = currentUser?.email
    const isOwner = wedding.owner_id === user.id
    const isCollaborator = userEmail && wedding.collaborator_emails?.includes(userEmail)
    
    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { ogTitle, ogDescription, ogImageUrl } = body

    // Update metadata
    const { error: updateError } = await supabase
      .from('weddings')
      .update({
        og_title: ogTitle || null,
        og_description: ogDescription || null,
        og_image_url: ogImageUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', wedding.id)

    if (updateError) {
      console.error('Error updating metadata:', updateError)
      return NextResponse.json({ error: 'Failed to update metadata' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in metadata PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

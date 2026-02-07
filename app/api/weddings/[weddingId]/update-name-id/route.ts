import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const { weddingId } = await params
    const { newWeddingNameId } = await request.json()

    if (!newWeddingNameId || typeof newWeddingNameId !== 'string') {
      return NextResponse.json(
        { error: "New wedding name ID is required" },
        { status: 400 }
      )
    }

    // Validate format (no spaces, reasonable length)
    if (newWeddingNameId.trim() !== newWeddingNameId || newWeddingNameId.length < 2) {
      return NextResponse.json(
        { error: "Wedding name ID must not have leading/trailing spaces and be at least 2 characters" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const decodedWeddingId = decodeURIComponent(weddingId)

    // Verify user owns this wedding (check owner_id, not user_id)
    const { data: wedding, error: fetchError } = await supabase
      .from('weddings')
      .select('id, wedding_name_id, owner_id')
      .eq('wedding_name_id', decodedWeddingId)
      .single()

    if (fetchError || !wedding) {
      return NextResponse.json(
        { error: "Wedding not found" },
        { status: 404 }
      )
    }

    if (wedding.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - you must be the wedding owner" },
        { status: 403 }
      )
    }

    // Check if new wedding_name_id already exists
    const { data: existingWedding } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', newWeddingNameId)
      .single()

    if (existingWedding) {
      return NextResponse.json(
        { error: "This wedding name ID is already taken" },
        { status: 409 }
      )
    }

    // Update wedding_name_id in weddings table only
    // Foreign keys now use wedding_id, so changing wedding_name_id doesn't affect other tables
    const { data: updatedWedding, error: updateError } = await supabase
      .from('weddings')
      .update({ wedding_name_id: newWeddingNameId })
      .eq('id', wedding.id)
      .select('wedding_name_id')
      .single()

    if (updateError || !updatedWedding) {
      return NextResponse.json(
        { error: "Failed to update wedding name ID", details: updateError?.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      oldWeddingNameId: wedding.wedding_name_id,
      newWeddingNameId: updatedWedding.wedding_name_id
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

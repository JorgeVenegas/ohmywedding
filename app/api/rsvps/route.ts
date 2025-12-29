import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Update each guest's confirmation status
    if (body.guests && Array.isArray(body.guests)) {
      for (const guest of body.guests) {
        const confirmationStatus = 
          guest.attending === true ? 'confirmed' : 
          guest.attending === false ? 'declined' : 
          'pending'
        
        const { error: updateError } = await supabase
          .from('guests')
          .update({ confirmation_status: confirmationStatus })
          .eq('id', guest.guestId)

        if (updateError) {
          return NextResponse.json(
            { error: `Failed to update guest ${guest.guestId}` },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({ success: true })
    }

    // Legacy single guest RSVP support (for backward compatibility)
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', body.weddingNameId)
      .single()
    
    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { data, error } = await supabase.from("rsvps").insert([
      {
        wedding_id: wedding.id,
        guest_name: body.name,
        guest_email: body.email,
        attending: body.attending,
        companions: body.companions,
        dietary_restrictions: body.dietaryRestrictions,
        message: body.message,
      },
    ])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

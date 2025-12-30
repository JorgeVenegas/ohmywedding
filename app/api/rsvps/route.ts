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
      // REQUIRE OTP verification for group RSVPs
      if (!body.verificationToken || !body.groupId) {
        return NextResponse.json(
          { error: "Phone verification required" },
          { status: 403 }
        )
      }

      // Verify the OTP token is valid and not expired
      const { data: verification, error: verificationError } = await supabase
        .from('rsvp_otp_verifications')
        .select('*')
        .eq('guest_group_id', body.groupId)
        .eq('verification_token', body.verificationToken)
        .eq('verified', true)
        .single()

      if (verificationError || !verification) {
        return NextResponse.json(
          { error: "Invalid or expired verification" },
          { status: 403 }
        )
      }

      // Check if verification has expired (valid for 1 hour after verification)
      const verifiedAt = new Date(verification.verified_at)
      const expirationTime = new Date(verifiedAt.getTime() + 60 * 60 * 1000) // 1 hour
      
      if (new Date() > expirationTime) {
        return NextResponse.json(
          { error: "Verification has expired. Please verify your phone number again." },
          { status: 403 }
        )
      }

      // Update each guest's confirmation status
      for (const guest of body.guests) {
        const confirmationStatus = 
          guest.attending === true ? 'confirmed' : 
          guest.attending === false ? 'declined' : 
          'pending'
        
        // Prepare update object with confirmation status and optional travel fields
        const updateData: any = { 
          confirmation_status: confirmationStatus 
        }
        
        // Add travel information if provided
        if (guest.is_traveling !== undefined) {
          updateData.is_traveling = guest.is_traveling
        }
        if (guest.traveling_from) {
          updateData.traveling_from = guest.traveling_from
        }
        if (guest.travel_arrangement) {
          updateData.travel_arrangement = guest.travel_arrangement
        }
        if (guest.ticket_attachment_url !== undefined) {
          updateData.ticket_attachment_url = guest.ticket_attachment_url
        }
        if (guest.no_ticket_reason !== undefined) {
          updateData.no_ticket_reason = guest.no_ticket_reason
        }
        
        console.log('[RSVP API] Updating guest:', guest.guestId, 'with data:', updateData)
        
        const { error: updateError } = await supabase
          .from('guests')
          .update(updateData)
          .eq('id', guest.guestId)

        if (updateError) {
          console.error('[RSVP API] Update error:', updateError)
          return NextResponse.json(
            { error: `Failed to update guest: ${updateError.message}` },
            { status: 500 }
          )
        }
      }

      // Optionally invalidate the verification token after use
      // Uncomment if you want one-time use tokens:
      // await supabase
      //   .from('rsvp_otp_verifications')
      //   .update({ verification_token: null })
      //   .eq('id', verification.id)

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
    console.error('[RSVP API] Unexpected error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

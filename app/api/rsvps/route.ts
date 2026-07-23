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
      // Use service role client to bypass RLS
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Check if phone verification is being skipped
      if (body.skipPhoneVerification && body.groupId) {
        // Verify the wedding actually has phone verification disabled in its config
        // Look up the wedding via the group's wedding_id
        const { data: groupCheck } = await supabaseAdmin
          .from('guest_groups')
          .select('wedding_id')
          .eq('id', body.groupId)
          .single()

        if (!groupCheck) {
          return NextResponse.json(
            { error: "Guest group not found" },
            { status: 404 }
          )
        }

        // Check page config for requirePhoneVerification setting
        // Try wedding_websites first, fall back to legacy weddings.page_config
        const { data: website } = await supabaseAdmin
          .from('wedding_websites')
          .select('page_config')
          .eq('wedding_id', groupCheck.wedding_id)
          .single()

        let pageConfig = website?.page_config as Record<string, any> | null

        // Fallback: older weddings may store config in weddings.page_config
        if (!pageConfig || (pageConfig.sectionConfigs?.rsvp?.requirePhoneVerification === undefined)) {
          const { data: legacyWedding } = await supabaseAdmin
            .from('weddings')
            .select('page_config')
            .eq('id', groupCheck.wedding_id)
            .single()
          const legacyConfig = legacyWedding?.page_config as Record<string, any> | null
          if (legacyConfig?.sectionConfigs?.rsvp?.requirePhoneVerification !== undefined) {
            pageConfig = legacyConfig
          }
        }

        const rsvpConfig = pageConfig?.sectionConfigs?.rsvp || {}
        const requirePhoneVerification = rsvpConfig.requirePhoneVerification ?? true

        if (requirePhoneVerification) {
          return NextResponse.json(
            { error: "Phone verification is required" },
            { status: 403 }
          )
        }
        // Phone verification disabled — proceed without token
      } else {
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
      }

      // Update the guest group with the message and submission timestamp
      const groupUpdateData: Record<string, any> = {
        rsvp_submitted_at: new Date().toISOString()
      }
      if (body.message) {
        groupUpdateData.message = body.message
      }
      // Handle extra passes confirmed count
      if (typeof body.extraPassesAttending === 'number' && body.extraPassesAttending >= 0) {
        groupUpdateData.extra_passes_confirmed = body.extraPassesAttending
      }

      {
        const { error: groupUpdateError } = await supabaseAdmin
          .from('guest_groups')
          .update(groupUpdateData)
          .eq('id', body.groupId)

        if (groupUpdateError) {
        }
      }

      // Collect guests that change status so we can log one grouped activity per status
      const confirmedGuestNames: string[] = []
      const declinedGuestNames: string[] = []
      let weddingIdForActivity: string | null = null

      // Update each guest's confirmation status
      for (const guest of body.guests) {
        // Validate: if travel arrangement is 'already_booked', ticket_attachment_url must be present
        if (guest.travel_arrangement === 'already_booked' && !guest.ticket_attachment_url) {
          return NextResponse.json(
            { error: 'Ticket upload is required when you have already booked transportation' },
            { status: 400 }
          )
        }

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

        // Verify this guest belongs to the verified group
        const { data: guestData, error: guestError } = await supabaseAdmin
          .from('guests')
          .select('guest_group_id, name, wedding_id, confirmation_status')
          .eq('id', guest.guestId)
          .single()

        if (guestError || !guestData || guestData.guest_group_id !== body.groupId) {
          return NextResponse.json(
            { error: 'Guest does not belong to verified group' },
            { status: 403 }
          )
        }

        const oldStatus = guestData.confirmation_status
        weddingIdForActivity = guestData.wedding_id

        const { error: updateError } = await supabaseAdmin
          .from('guests')
          .update(updateData)
          .eq('id', guest.guestId)

        if (updateError) {
          return NextResponse.json(
            { error: `Failed to update guest: ${updateError.message}` },
            { status: 500 }
          )
        }

        // Collect guests whose status actually changed
        if (confirmationStatus !== 'pending' && oldStatus !== confirmationStatus) {
          if (confirmationStatus === 'confirmed') {
            confirmedGuestNames.push(guestData.name)
          } else {
            declinedGuestNames.push(guestData.name)
          }
        }
      }

      // Log one grouped activity record per status after all guests are processed
      if (weddingIdForActivity && (confirmedGuestNames.length > 0 || declinedGuestNames.length > 0)) {
        const { data: weddingStatus } = await supabaseAdmin
          .from('weddings')
          .select('is_ready')
          .eq('id', weddingIdForActivity)
          .single()

        if (weddingStatus?.is_ready) {
          const { data: groupData } = await supabaseAdmin
            .from('guest_groups')
            .select('name')
            .eq('id', body.groupId)
            .single()

          const groupName = groupData?.name || ''
          const extraPasses = typeof body.extraPassesAttending === 'number' ? body.extraPassesAttending : 0

          if (confirmedGuestNames.length > 0) {
            await supabaseAdmin.from('activity_logs').insert({
              wedding_id: weddingIdForActivity,
              guest_group_id: body.groupId,
              guest_id: null,
              activity_type: 'rsvp_confirmed',
              description: `${confirmedGuestNames.join(', ')} confirmed attendance`,
              metadata: {
                source: 'guest_rsvp',
                guest_names: confirmedGuestNames,
                group_name: groupName,
                extra_passes: extraPasses,
              },
            })
          }

          if (declinedGuestNames.length > 0) {
            await supabaseAdmin.from('activity_logs').insert({
              wedding_id: weddingIdForActivity,
              guest_group_id: body.groupId,
              guest_id: null,
              activity_type: 'rsvp_declined',
              description: `${declinedGuestNames.join(', ')} declined attendance`,
              metadata: {
                source: 'guest_rsvp',
                guest_names: declinedGuestNames,
                group_name: groupName,
                extra_passes: 0,
              },
            })
          }
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

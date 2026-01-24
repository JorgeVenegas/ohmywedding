import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import crypto from "crypto"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { phoneNumber, groupId } = await request.json()

    if (!phoneNumber || !groupId) {
      return NextResponse.json(
        { error: "Phone number and group ID are required" },
        { status: 400 }
      )
    }

    // Verify the group exists and fetch all phone numbers in the group
    const { data: group, error: groupError } = await supabase
      .from('guest_groups')
      .select('id, phone_number, guests(phone_number)')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      console.error('[OTP Send] Group not found:', groupError)
      return NextResponse.json(
        { error: "Guest group not found" },
        { status: 404 }
      )
    }

    // Collect all valid phone numbers from the group and guests
    const validPhones: string[] = []
    if (group.phone_number) {
      validPhones.push(group.phone_number)
    }
    if (group.guests && Array.isArray(group.guests)) {
      group.guests.forEach((guest: any) => {
        if (guest.phone_number) {
          validPhones.push(guest.phone_number)
        }
      })
    }

    if (validPhones.length === 0) {
      return NextResponse.json(
        { error: "No phone numbers found for this group" },
        { status: 404 }
      )
    }

    // Normalize phone numbers for comparison (remove spaces, dashes, etc.)
    const normalizePhone = (phone: string) => phone.replace(/[\s\-\(\)]/g, '')
    const normalizedInput = normalizePhone(phoneNumber)
    const normalizedValidPhones = validPhones.map(normalizePhone)
    
    if (!normalizedValidPhones.includes(normalizedInput)) {
      return NextResponse.json(
        { error: "Phone number is not associated with this guest group" },
        { status: 403 }
      )
    }

    // Check for existing unverified OTP and delete it
    await supabase
      .from('rsvp_otp_verifications')
      .delete()
      .eq('guest_group_id', groupId)
      .eq('verified', false)

    // No actual SMS sending - phone verification is done by matching the complete number
    // Create a verification request record
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30) // 30 minute expiration for phone verification

    const { data: insertData, error: insertError } = await supabase
      .from('rsvp_otp_verifications')
      .insert({
        guest_group_id: groupId,
        phone_number: phoneNumber,
        expires_at: expiresAt.toISOString(),
        verified: false,
      })
      .select()

    if (insertError) {
      console.error('Failed to create verification record:', insertError)
      return NextResponse.json(
        { error: "Failed to create verification record" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Ready for verification",
      expiresIn: 1800 // 30 minutes in seconds
    })
  } catch (error) {
    console.error('OTP send error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

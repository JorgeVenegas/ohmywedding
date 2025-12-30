import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import crypto from "crypto"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { phoneNumber, enteredPhone, groupId } = await request.json()
    console.log('[OTP Verify] Verifying OTP for phone:', phoneNumber?.substring(0, 6) + '***', 'groupId:', groupId)
    if (!phoneNumber || !enteredPhone || !groupId) {
      return NextResponse.json(
        { error: "Phone number, entered phone, and group ID are required" },
        { status: 400 }
      )
    }

    console.log('Looking for verification:', {
      guest_group_id: groupId,
      phone_number: phoneNumber,
      verified: false
    })

    // Check if there's a pending verification for this group (get most recent)
    const { data: verifications, error: verificationError } = await supabase
      .from('rsvp_otp_verifications')
      .select('*')
      .eq('guest_group_id', groupId)
      .eq('phone_number', phoneNumber)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)

    console.log('Verification lookup result:', { verifications, verificationError })

    const verification = verifications?.[0]

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: "No pending verification found" },
        { status: 404 }
      )
    }

    // Check if verification has expired
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Verification has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Normalize phone numbers for comparison (remove spaces, dashes, parentheses, plus)
    const normalizePhone = (phone: string) => phone.replace(/[\s\-\(\)\+]/g, '')
    const normalizedStored = normalizePhone(phoneNumber)
    const normalizedEntered = normalizePhone(enteredPhone)

    // Verify that the entered phone matches the stored phone
    if (normalizedStored !== normalizedEntered) {
      return NextResponse.json(
        { error: "Phone number does not match" },
        { status: 400 }
      )
    }

    // Generate a unique verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Mark verification as complete
    const { error: updateError } = await supabase
      .from('rsvp_otp_verifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        verification_token: verificationToken,
      })
      .eq('id', verification.id)

    if (updateError) {
      console.error('Failed to update verification:', updateError)
      return NextResponse.json(
        { error: "Failed to complete verification" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      verificationToken,
      message: "Phone number verified successfully"
    })
  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

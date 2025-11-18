import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const { data, error } = await supabase.from("rsvps").insert([
      {
        date_id: body.dateId,
        wedding_name_id: body.weddingNameId,
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

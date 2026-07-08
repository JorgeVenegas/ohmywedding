import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function resolveWeddingUuid(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  weddingNameId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('weddings')
    .select('id')
    .eq('wedding_name_id', weddingNameId)
    .single()
  if (error || !data) return null
  return data.id as string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingUuid(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('wedding_events')
      .select('*')
      .eq('wedding_id', weddingUuid)
      .order('due_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ events: data || [] })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingUuid(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      start_date,
      due_date,
      category,
      status,
      reminder_days_before,
      assignee_email,
      reviewer_email,
    } = body

    if (!title || !due_date) {
      return NextResponse.json({ error: "title and due_date are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('wedding_events')
      .insert({
        wedding_id: weddingUuid,
        title,
        description: description || null,
        start_date: start_date || null,
        due_date,
        category: category || 'other',
        status: status || 'todo',
        reminder_days_before: reminder_days_before ?? 7,
        assignee_email: assignee_email || null,
        reviewer_email: reviewer_email || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ event: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

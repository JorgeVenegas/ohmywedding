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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (start_date !== undefined) updates.start_date = start_date
    if (due_date !== undefined) updates.due_date = due_date
    if (category !== undefined) updates.category = category
    if (reminder_days_before !== undefined) updates.reminder_days_before = reminder_days_before
    if (assignee_email !== undefined) updates.assignee_email = assignee_email
    if (reviewer_email !== undefined) updates.reviewer_email = reviewer_email

    if (status !== undefined) {
      updates.status = status
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
      } else {
        updates.completed_at = null
      }
    }

    const { data, error } = await supabase
      .from('wedding_events')
      .update(updates)
      .eq('id', id)
      .eq('wedding_id', weddingUuid)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ event: data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { error } = await supabase
      .from('wedding_events')
      .delete()
      .eq('id', id)
      .eq('wedding_id', weddingUuid)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

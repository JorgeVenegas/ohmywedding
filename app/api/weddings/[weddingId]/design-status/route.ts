import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import {
  DESIGN_STATUSES,
  canTransition,
  availableTransitions,
  type DesignStatus,
} from '@/lib/invitation-workflow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveWedding(adminClient: ReturnType<typeof createAdminSupabaseClient>, weddingId: string) {
  const isUUID = UUID_REGEX.test(weddingId)
  return adminClient
    .from('weddings')
    .select('*')
    .eq(isUUID ? 'id' : 'wedding_name_id', weddingId)
    .single()
}

// GET /api/weddings/[weddingId]/design-status
// Returns status, history, reviewer list, meetings, and versions for the wedding.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> },
) {
  try {
    const { weddingId } = await params
    const decoded = decodeURIComponent(weddingId)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminSupabaseClient()
    const { data: wedding, error: weddingErr } = await resolveWedding(adminClient, decoded)
    if (weddingErr) {
      console.error('[design-status GET] wedding query error:', weddingErr)
      if (weddingErr.code === 'PGRST116') {
        return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to load wedding', details: weddingErr.message }, { status: 500 })
    }
    if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const isSuperuser = await isSuperUser(adminClient, { email: user.email })
    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email?.toLowerCase() ?? '') ?? false

    // Reviewers can also access their assigned weddings
    // Use try/catch in case design_review_requests table isn't in PostgREST cache yet
    let isReviewer = false
    try {
      const { data: reviewerRow } = await adminClient
        .from('design_review_requests')
        .select('id')
        .eq('wedding_id', wedding.id)
        .eq('reviewer_email', user.email?.toLowerCase() ?? '')
        .neq('status', 'dismissed')
        .maybeSingle()
      isReviewer = !!reviewerRow
    } catch { /* table not in schema cache yet — not a reviewer */ }

    if (!isSuperuser && !isOwner && !isCollaborator && !isReviewer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [historyResult, reviewersResult, meetingsResult, versionsResult] = await Promise.all([
      adminClient
        .from('invitation_status_history')
        .select('id, from_status, to_status, changed_at, notes, changed_by')
        .eq('wedding_id', wedding.id)
        .order('changed_at', { ascending: false })
        .then((r) => r.error ? { data: [] } : r),
      adminClient
        .from('design_review_requests')
        .select('id, reviewer_email, reviewer_user_id, requested_at, status, reviewed_at, notes')
        .eq('wedding_id', wedding.id)
        .order('requested_at', { ascending: true })
        .then((r) => r.error ? { data: [] } : r),
      adminClient
        .from('design_meetings')
        .select('id, meeting_type, title, scheduled_at, meeting_url, notes, status, created_at')
        .eq('wedding_id', wedding.id)
        .order('scheduled_at', { ascending: true })
        .then((r) => r.error ? { data: [] } : r),
      adminClient
        .from('wedding_versions')
        .select('id, version_number, label, is_active, created_at, notes')
        .eq('wedding_id', wedding.id)
        .order('version_number', { ascending: false })
        .then((r) => r.error ? { data: [] } : r),
    ])

    const currentStatus = ((wedding as Record<string, unknown>).invitation_design_status as DesignStatus) ?? 'not_started'

    return NextResponse.json({
      status: currentStatus,
      design_self_serve_locked: (wedding as Record<string, unknown>).design_self_serve_locked ?? true,
      available_transitions: isSuperuser ? availableTransitions(currentStatus, 'superadmin') : [],
      current_user_is_reviewer: isReviewer,
      current_user_can_approve:
        isReviewer &&
        canTransition(currentStatus, 'approved', 'reviewer') &&
        (reviewersResult.data as Array<{ reviewer_email: string; status: string }>)?.some(
          (r) => r.reviewer_email === user.email?.toLowerCase() && r.status === 'pending',
        ),
      history: historyResult.data ?? [],
      reviewers: reviewersResult.data ?? [],
      meetings: meetingsResult.data ?? [],
      versions: versionsResult.data ?? [],
    })
  } catch (err) {
    console.error('[design-status GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/weddings/[weddingId]/design-status
// Superadmin-only: advance or roll back the design status.
// When moving to ready_for_review, body may include reviewer_emails[].
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> },
) {
  try {
    const { weddingId } = await params
    const decoded = decodeURIComponent(weddingId)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminSupabaseClient()
    const isSuperuser = await isSuperUser(adminClient, { email: user.email })
    if (!isSuperuser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { to_status, notes, reviewer_emails } = body as {
      to_status: unknown
      notes?: string
      reviewer_emails?: string[]
    }

    if (!DESIGN_STATUSES.includes(to_status as DesignStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data: wedding, error: weddingErr } = await resolveWedding(adminClient, decoded)
    if (weddingErr) {
      console.error('[design-status PATCH] wedding query error:', weddingErr)
      if (weddingErr.code === 'PGRST116') {
        return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to load wedding', details: weddingErr.message }, { status: 500 })
    }
    if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const from = (wedding.invitation_design_status ?? 'not_started') as DesignStatus
    const to = to_status as DesignStatus

    if (!canTransition(from, to, 'superadmin')) {
      return NextResponse.json(
        { error: `Transition ${from} → ${to} is not allowed for superadmin` },
        { status: 422 },
      )
    }

    // Update status + write history via RPC to bypass PostgREST schema-cache
    // issues (PGRST204) that occur when the REST table API is called before
    // PostgREST has refreshed its cache after the column migration.
    const { error: updateErr } = await adminClient.rpc('set_wedding_design_status', {
      p_wedding_id: wedding.id,
      p_status: to,
      p_changed_by: user.id,
      p_notes: notes ?? null,
    })

    if (updateErr) throw updateErr

    // When moving to ready_for_review, insert reviewer rows
    if (to === 'ready_for_review' && Array.isArray(reviewer_emails) && reviewer_emails.length > 0) {
      const rows = reviewer_emails
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
        .map((email) => ({
          wedding_id: wedding.id,
          reviewer_email: email,
          requested_by: user.id,
        }))

      // upsert so re-opening review doesn't fail on the unique constraint
      await adminClient.from('design_review_requests').upsert(rows, {
        onConflict: 'wedding_id,reviewer_email',
        ignoreDuplicates: false,
      })

      // Try to resolve reviewer_user_id for existing users
      for (const email of rows.map((r) => r.reviewer_email)) {
        const { data: userData } = await adminClient.auth.admin.listUsers()
        const match = userData?.users?.find((u) => u.email?.toLowerCase() === email)
        if (match) {
          await adminClient
            .from('design_review_requests')
            .update({ reviewer_user_id: match.id })
            .eq('wedding_id', wedding.id)
            .eq('reviewer_email', email)
        }
      }
    }

    return NextResponse.json({ success: true, status: to })
  } catch (err) {
    console.error('[design-status PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isAIChatEnabledForSlug, isAIChatEligiblePlan } from '@/lib/ai/feature-flag'

export const runtime = 'nodejs'

// GET /api/ai/chat/enabled?weddingSlug=...
// Returns { enabled: boolean } — used by the admin layout to gate the chat panel.
// Superadmins always get enabled: true.
export async function GET(req: NextRequest) {
  const weddingSlug = req.nextUrl.searchParams.get('weddingSlug')
  if (!weddingSlug) {
    return NextResponse.json({ enabled: false })
  }

  const userClient = await createServerSupabaseClient()

  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ enabled: false })

  // Feature flag check first — cheapest gate.
  // No superadmin bypass here: env vars control visibility for everyone.
  if (!isAIChatEnabledForSlug(weddingSlug)) {
    return NextResponse.json({ enabled: false })
  }

  const admin = createAdminSupabaseClient()

  // Plan check — must have an eligible subscription tier
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingSlug)
  const { data: wedding } = await admin
    .from('weddings')
    .select('id')
    .eq(isUUID ? 'id' : 'wedding_name_id', weddingSlug)
    .single()

  if (!wedding) return NextResponse.json({ enabled: false })

  const { data: sub } = await admin
    .from('wedding_subscriptions')
    .select('management_tier, invitation_tier, plan')
    .eq('wedding_id', wedding.id)
    .maybeSingle()

  const eligible = isAIChatEligiblePlan(
    sub?.management_tier ?? null,
    sub?.invitation_tier ?? null,
    sub?.plan ?? null,
  )

  return NextResponse.json({ enabled: eligible })
}

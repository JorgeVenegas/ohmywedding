import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { getAIBudgetStatus } from '@/lib/ai/credits'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weddingId = req.nextUrl.searchParams.get('weddingId')
  if (!weddingId) return NextResponse.json({ error: 'weddingId required' }, { status: 400 })

  // Verify access
  const admin = createAdminSupabaseClient()
  const [{ data: owner }, { data: collab }] = await Promise.all([
    admin.from('weddings').select('id').eq('id', weddingId).eq('owner_id', user.id).single(),
    admin.from('collaborator_permissions').select('id').eq('wedding_id', weddingId).eq('user_id', user.id).single(),
  ])
  if (!owner && !collab) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const status = await getAIBudgetStatus(weddingId)
  return NextResponse.json(status)
}

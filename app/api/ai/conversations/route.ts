import { NextRequest, NextResponse } from 'next/server'
import { resolveAIIdentity } from '@/lib/ai/auth/resolver'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const weddingSlug = req.nextUrl.searchParams.get('weddingSlug')
  if (!weddingSlug) {
    return NextResponse.json({ error: 'weddingSlug required' }, { status: 400 })
  }

  let identity
  try {
    identity = await resolveAIIdentity(req, weddingSlug)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()
  const { data } = await admin
    .from('ai_conversations')
    .select('id, channel, created_at, updated_at')
    .eq('wedding_id', identity.weddingId)
    .eq('user_id', identity.userId)
    .order('updated_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ conversations: data ?? [] })
}

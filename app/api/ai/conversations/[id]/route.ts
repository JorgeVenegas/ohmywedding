import { NextRequest, NextResponse } from 'next/server'
import { resolveAIIdentity } from '@/lib/ai/auth/resolver'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  // Verify the conversation belongs to this wedding
  const { data: conv } = await admin
    .from('ai_conversations')
    .select('id, wedding_id')
    .eq('id', id)
    .eq('wedding_id', identity.weddingId)
    .maybeSingle()

  if (!conv) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const { data: messages } = await admin
    .from('ai_messages')
    .select('role, content, created_at')
    .eq('conversation_id', id)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: true })
    .limit(100)

  return NextResponse.json({ messages: messages ?? [] })
}

import { NextRequest } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import type { AIIdentity, AIRole, AIChannel } from './types'

export async function resolveAIIdentity(
  request: NextRequest,
  weddingSlug: string,
  channel: AIChannel = 'planner_dashboard'
): Promise<AIIdentity> {
  const userClient = await createServerSupabaseClient()
  const admin = createAdminSupabaseClient()

  const { data: { user } } = await userClient.auth.getUser()

  // Resolve wedding by slug or UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingSlug)
  const weddingQuery = admin.from('weddings').select('id, owner_id, collaborator_emails')
  const { data: wedding } = isUUID
    ? await weddingQuery.eq('id', weddingSlug).single()
    : await weddingQuery.eq('wedding_name_id', weddingSlug).single()

  if (!wedding) throw new Error('Wedding not found')

  const weddingId = wedding.id

  // Superadmin check
  if (user) {
    const { data: superuser } = await admin
      .from('superusers')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (superuser) {
      return { userId: user.id, role: 'superadmin', weddingId, channel }
    }
  }

  // Owner = couple
  if (user && wedding.owner_id === user.id) {
    return { userId: user.id, role: 'couple', weddingId, channel }
  }

  // Collaborator — resolve ai_role
  if (user && wedding.collaborator_emails?.includes(user.email ?? '')) {
    const { data: perms } = await admin
      .from('collaborator_permissions')
      .select('ai_role')
      .eq('wedding_id', weddingId)
      .eq('collaborator_email', (user.email ?? '').toLowerCase())
      .maybeSingle()

    const aiRole = perms?.ai_role as AIRole | null

    if (aiRole === 'partner') return { userId: user.id, role: 'partner', weddingId, channel }
    if (aiRole === 'planner') return { userId: user.id, role: 'planner', weddingId, channel }
    if (aiRole === 'planner_staff') return { userId: user.id, role: 'planner_staff', weddingId, channel }

    // Collaborator without ai_role → planner (safe default for existing collaborators)
    return { userId: user.id, role: 'planner', weddingId, channel }
  }

  // No authenticated user → unauthenticated (will be rejected by the orchestrator
  // unless this is a WhatsApp guest flow resolved separately)
  throw new Error('Unauthorized: not a member of this wedding')
}

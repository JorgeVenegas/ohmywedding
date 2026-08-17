import { NextRequest } from 'next/server'
import { resolveAIIdentity } from '@/lib/ai/auth/resolver'
import { getWeddingContext } from '@/lib/ai/context/builder'
import { runOrchestrator } from '@/lib/ai/orchestrator'
import { getAIBudgetStatus } from '@/lib/ai/credits'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { isAIChatEnabledForSlug, isAIChatEligiblePlan } from '@/lib/ai/feature-flag'
import type { AIChannel } from '@/lib/ai/auth/types'

export const runtime = 'nodejs'
export const maxDuration = 60

// Control-char markers injected into the stream and stripped client-side.
// \x02ARIA:tool_name\x03  → drives the thinking indicator
// \x02ARIA:usage:{...}\x03 → token/model metadata sent after stream ends
const MARKER = (name: string) => `\x02ARIA:${name}\x03`

export async function POST(req: NextRequest) {
  let body: {
    message: string
    conversationId?: string
    weddingSlug: string
    channel?: AIChannel
    currentPage?: string
  }

  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { message, conversationId, weddingSlug, channel = 'planner_dashboard', currentPage } = body

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'message is required' }), { status: 400 })
  }
  if (!weddingSlug) {
    return new Response(JSON.stringify({ error: 'weddingSlug is required' }), { status: 400 })
  }

  let identity, snapshot

  try {
    identity = await resolveAIIdentity(req, weddingSlug, channel)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized'
    return new Response(JSON.stringify({ error: msg }), { status: 401 })
  }

  // ── Feature flag + plan gate (superadmins bypass) ────────────────────────
  if (identity.role !== 'superadmin') {
    if (!isAIChatEnabledForSlug(weddingSlug)) {
      return new Response(
        JSON.stringify({ error: 'ai_not_enabled', message: 'AI chat is not enabled for this wedding.' }),
        { status: 403 }
      )
    }

    const admin = createAdminSupabaseClient()
    const { data: sub } = await admin
      .from('wedding_subscriptions')
      .select('management_tier, invitation_tier, plan')
      .eq('wedding_id', identity.weddingId)
      .maybeSingle()

    if (!isAIChatEligiblePlan(sub?.management_tier, sub?.invitation_tier, sub?.plan)) {
      return new Response(
        JSON.stringify({ error: 'plan_not_eligible', message: 'Tu plan actual no incluye acceso al asistente Aria. Actualiza tu suscripción para continuar.' }),
        { status: 403 }
      )
    }
  }

  // ── Budget check ──────────────────────────────────────────────────────────
  try {
    const budget = await getAIBudgetStatus(identity.weddingId)
    if (budget.isExhausted) {
      return new Response(
        JSON.stringify({ error: 'budget_exhausted', message: 'Tu presupuesto de IA se ha agotado. Recarga créditos para continuar.' }),
        { status: 402 }
      )
    }
  } catch {
    // Non-blocking: if budget check fails, allow the request through
  }

  try {
    snapshot = await getWeddingContext(identity.weddingId)
  } catch (err) {
    console.error('[AI Chat] getWeddingContext failed:', err)
    return new Response(JSON.stringify({ error: 'Failed to load wedding context' }), { status: 500 })
  }

  const cid = conversationId ?? crypto.randomUUID()

  try {
    const { result, modelId } = await runOrchestrator({
      identity,
      snapshot,
      conversationId: cid,
      message: message.trim(),
      currentPage,
    })

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of result.fullStream) {
            if (event.type === 'tool-call') {
              controller.enqueue(encoder.encode(MARKER(event.toolName)))
            } else if (event.type === 'text-delta') {
              controller.enqueue(encoder.encode(event.text))
            }
          }

          // After stream is fully consumed, usage is resolved — emit it as a trailing marker.
          const usage = await result.usage
          if (usage) {
            controller.enqueue(encoder.encode(
              MARKER(`usage:${JSON.stringify({
                model:  modelId,
                input:  usage.inputTokens  ?? 0,
                output: usage.outputTokens ?? 0,
              })}`)
            ))
          }
        } catch (err) {
          console.error('[AI stream]', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':      'text/plain; charset=utf-8',
        'x-conversation-id': cid,
        'x-ai-model':        modelId,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed'
    console.error('[AI Chat] Orchestrator error:', msg)
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }
}

/**
 * Deterministic tool pre-loader.
 *
 * Analyzes the user's message, decides which tools are likely needed,
 * executes them in parallel BEFORE the LLM call, and returns the results
 * as a formatted string to inject into the system prompt.
 */

import type { LLMTool, ToolContext } from './tools/types'

export interface PreloadResult {
  contextSection: string
  toolsExecuted: string[]
}

interface ToolRun {
  name: string
  tool: LLMTool
  params: Record<string, unknown>
}

/** Fields the query explicitly needs — avoids returning phone/dietary/notes when not asked. */
interface FieldNeeds {
  phone:    boolean
  dietary:  boolean
  notes:    boolean
  contact:  boolean
  address:  boolean
}

function detectFieldNeeds(lower: string): FieldNeeds {
  return {
    phone:   /tel[eé]fono|phone|n[uú]mero de|celular|m[oó]vil|llamar|whatsapp/i.test(lower),
    dietary: /diet|restricci|comida|food|alergi|celiac|vegan|vegetar|gluten|intoler/i.test(lower),
    notes:   /nota|note|comment|observaci|detalle|detail|informaci[oó]n adicional/i.test(lower),
    contact: /contact|tel[eé]fono|phone|email|correo|reach|comunicar|llamar|escribir/i.test(lower),
    address: /direcci[oó]n|address|ubic|d[oó]nde est[aá]|c[oó]mo llegar|how to get/i.test(lower),
  }
}

function detectGuestStatus(lower: string): 'pending' | 'confirmed' | 'declined' | 'all' {
  if (/pending|pendiente|sin confirmar|no han confirm|no respond|hasn.t confirm|haven.t confirm/i.test(lower))
    return 'pending'
  if (/declin|no asistir|no vien|won.t attend|said no|no van a/i.test(lower))
    return 'declined'
  if (/\b(confirmed|confirmados?|asistir[aá]n|attending|will attend)\b/.test(lower) &&
      !/pending|sin confirmar|no han confirm/.test(lower))
    return 'confirmed'
  return 'all'
}

function findTool(tools: LLMTool[], name: string): LLMTool | undefined {
  return tools.find(t => t.name === name)
}

function planPreloads(message: string, tools: LLMTool[]): ToolRun[] {
  const lower = message.toLowerCase()
  const runs: ToolRun[] = []
  const fields = detectFieldNeeds(lower)

  // ── Guest list ───────────────────────────────────────────────────────────────
  const guestNameQuery =
    /\b(who|qui[eé]n|qui[eé]nes|cu[aá]les?)\b/.test(lower) ||
    /\b(list|lista|names?|nombres?|dame|dime|show)\b.*\b(guest|invitad)/i.test(lower) ||
    /\b(guest|invitad).*\b(list|lista|names?|pending|confirm|declin)\b/i.test(lower) ||
    /\b(pending|pendiente|sin confirmar|no han confirm|declinaron|no asistir)\b/.test(lower)

  if (guestNameQuery) {
    const tool = findTool(tools, 'get_guest_list')
    if (tool) {
      runs.push({ name: 'get_guest_list', tool, params: {
        status:           detectGuestStatus(lower),
        limit:            100,
        include_phone:    fields.phone,
        include_dietary:  fields.dietary,
        include_notes:    fields.notes,
      }})
    }
  }

  // ── Payments / budget ────────────────────────────────────────────────────────
  if (/\b(payment|pago|cobr|debe|saldo|balance|outstanding|pendiente de pago|presupuest|budget)\b/i.test(lower)) {
    const tool = findTool(tools, 'get_payments')
    if (tool) runs.push({ name: 'get_payments', tool, params: {} })
  }

  // ── Vendors ──────────────────────────────────────────────────────────────────
  if (/proveedor|vendor|supplier/i.test(lower) && !/^cu[aá]ntos|^how many/i.test(lower)) {
    const tool = findTool(tools, 'get_vendor_summary')
    if (tool) runs.push({ name: 'get_vendor_summary', tool, params: { include_contact: fields.contact } })
  }

  // ── Timeline ─────────────────────────────────────────────────────────────────
  if (/itinerar|horario|timeline|schedule|evento|event|ceremony|ceremoni/i.test(lower)) {
    const tool = findTool(tools, 'get_timeline')
    if (tool) runs.push({ name: 'get_timeline', tool, params: { include_notes: fields.notes } })
  }

  // ── Hotels ───────────────────────────────────────────────────────────────────
  if (/hotel|hospedaj|alojamient|accommodation|where.*stay|donde.*quedar/i.test(lower)) {
    const tool = findTool(tools, 'get_hotels')
    if (tool) runs.push({ name: 'get_hotels', tool, params: {
      include_address: fields.address,
      include_contact: fields.contact,
      include_notes:   fields.notes,
    }})
  }

  // ── Menus ────────────────────────────────────────────────────────────────────
  if (/menu|men[uú]|comida|food|meal|plato|course|cena|dish/i.test(lower)) {
    const tool = findTool(tools, 'get_menu')
    if (tool) runs.push({ name: 'get_menu', tool, params: {} })
  }

  // ── Seating ──────────────────────────────────────────────────────────────────
  if (/seat|seating|\bmesa\b|\basiento|floor.?plan|plano de|table.*assign|assign.*table/i.test(lower)) {
    const tool = findTool(tools, 'get_seating')
    if (tool) runs.push({ name: 'get_seating', tool, params: {} })
  }

  // ── Registry ─────────────────────────────────────────────────────────────────
  if (/registr|regalo|gift|contribuci|donaci|raised|recaudado|mesa de regalo/i.test(lower)) {
    const tool = findTool(tools, 'get_registry')
    if (tool) runs.push({ name: 'get_registry', tool, params: {} })
  }

  // ── Invitation stats ─────────────────────────────────────────────────────────
  // No trailing \b — Spanish "invitación", "abierto" break word boundaries after accented chars
  if (/invitaci|invitation|abri|open.*invit|invit.*open|vieron la|leyeron|open rate|tasa de apertura/i.test(lower)) {
    const tool = findTool(tools, 'get_invitation_stats')
    if (tool) runs.push({ name: 'get_invitation_stats', tool, params: {} })
  }

  return runs
}

function formatResult(name: string, data: unknown): string {
  return `[${name}]\n${JSON.stringify(data, null, 2)}`
}

export async function preloadToolData(
  message: string,
  tools: LLMTool[],
  ctx: ToolContext,
): Promise<PreloadResult> {
  const runs = planPreloads(message, tools)

  if (runs.length === 0) return { contextSection: '', toolsExecuted: [] }

  const startMs = Date.now()

  const settled = await Promise.allSettled(
    runs.map(({ tool, params }) => tool.execute(params, ctx))
  )

  const sections: string[] = []
  const executed: string[] = []

  for (let i = 0; i < runs.length; i++) {
    const r = settled[i]
    const name = runs[i].name
    if (r.status === 'fulfilled') {
      sections.push(formatResult(name, r.value))
      executed.push(name)
    } else {
      console.error(`[Preloader] ${name} failed:`, r.reason)
    }
  }

  console.log(`[Preloader] ${executed.join(', ')} — ${Date.now() - startMs}ms`)

  if (sections.length === 0) return { contextSection: '', toolsExecuted: [] }

  const contextSection = [
    '',
    '══ RETRIEVED DATA — answer the user using this ══',
    sections.join('\n\n'),
    '══ END RETRIEVED DATA ══',
  ].join('\n')

  return { contextSection, toolsExecuted: executed }
}

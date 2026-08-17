import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { AIWeddingSnapshot, AIGuestSummary, AITaskSummary, AIBudgetSummary } from './types'

export async function buildSnapshot(weddingId: string): Promise<AIWeddingSnapshot> {
  const admin = createAdminSupabaseClient()

  const [weddingRes, guestsRes, groupsRes, itineraryRes, suppliersRes, paymentsRes, faqRes] =
    await Promise.all([
      admin
        .from('weddings')
        .select('id, wedding_name_id, partner1_first_name, partner1_last_name, partner2_first_name, partner2_last_name, wedding_date, ceremony_venue_name, reception_venue_name, page_config, owner_id')
        .eq('id', weddingId)
        .single(),
      admin.from('guests').select('confirmation_status, dietary_restrictions').eq('wedding_id', weddingId),
      admin.from('guest_groups').select('extra_passes, extra_passes_confirmed').eq('wedding_id', weddingId),
      admin
        .from('itinerary_events')
        .select('title, start_time, location, notes, parent_id')
        .eq('wedding_id', weddingId)
        .order('start_time', { ascending: true }),
      admin.from('suppliers').select('id, name, category, contact_info, total_amount, notes').eq('wedding_id', weddingId),
      admin.from('supplier_payments').select('supplier_id, amount, payment_date').eq('wedding_id', weddingId),
      admin.from('wedding_faqs').select('question, answer').eq('wedding_id', weddingId),
    ])

  const wedding = weddingRes.data
  if (!wedding) throw new Error('Wedding not found while building snapshot')

  const guests = guestsRes.data ?? []
  const groups = groupsRes.data ?? []
  const itinerary = itineraryRes.data ?? []
  const suppliers = suppliersRes.data ?? []
  const payments = paymentsRes.data ?? []
  const faqs = faqRes.data ?? []

  // Guest summary
  const totalExtraPasses = groups.reduce((s, g) => s + (g.extra_passes ?? 0), 0)
  const totalExtraConfirmed = groups.reduce((s, g) => s + (g.extra_passes_confirmed ?? 0), 0)
  const accepted = guests.filter(g => g.confirmation_status === 'confirmed').length + totalExtraConfirmed
  const declined = guests.filter(g => g.confirmation_status === 'declined').length
  const pending = guests.filter(g => g.confirmation_status === 'pending').length + (totalExtraPasses - totalExtraConfirmed)
  const dietaryMap: Record<string, number> = {}
  for (const g of guests) {
    const d = g.dietary_restrictions
    if (d && d !== 'none') dietaryMap[d] = (dietaryMap[d] ?? 0) + 1
  }
  const guestSummary: AIGuestSummary = {
    total: guests.length + totalExtraPasses,
    accepted,
    declined,
    pending,
    vip_count: 0,
    dietary_summary: dietaryMap,
  }

  // Timeline — top-level events only for the snapshot
  const timeline = itinerary
    .filter(e => !e.parent_id)
    .map(e => ({
      time: e.start_time,
      title: e.title,
      location: e.location ?? undefined,
      notes: e.notes ?? undefined,
      is_public: true,
    }))

  // Build paid-amount index per supplier
  const paidBySupplier: Record<string, number> = {}
  for (const p of payments) {
    paidBySupplier[p.supplier_id] = (paidBySupplier[p.supplier_id] ?? 0) + Number(p.amount ?? 0)
  }

  // Vendors — include per-supplier payment breakdown
  const vendors = suppliers.map(s => {
    const total  = Number(s.total_amount ?? 0)
    const paid   = paidBySupplier[s.id] ?? 0
    const remaining = total - paid
    return {
      name:         s.name,
      category:     s.category ?? '',
      contact:      s.contact_info ?? undefined,
      status:       (remaining <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid') as 'paid' | 'partial' | 'unpaid',
      total_amount: total,
      paid_amount:  paid,
      remaining,
    }
  })

  // Budget totals
  const totalBudget = suppliers.reduce((s, sup) => s + Number(sup.total_amount ?? 0), 0)
  const totalSpent  = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const budget: AIBudgetSummary = {
    total:     totalBudget,
    spent:     totalSpent,
    remaining: totalBudget - totalSpent,
    currency:  'USD',
  }

  // Tasks — not a dedicated table yet; use 0 values as placeholder
  const tasks: AITaskSummary = { total: 0, completed: 0, pending: 0, overdue: 0 }

  // Hotels from page_config
  const pageConfig = (wedding.page_config ?? {}) as Record<string, unknown>
  const sectionConfigs = (pageConfig.sectionConfigs ?? {}) as Record<string, Record<string, unknown>>
  const hotelSection = sectionConfigs['hotel-suggestions'] ?? {}
  const rawHotels = (hotelSection.hotels ?? []) as Array<Record<string, string>>
  const hotels = rawHotels.map(h => ({
    name: h.name ?? '',
    address: h.address ?? undefined,
    contact: h.phone ?? h.contact ?? undefined,
    notes: h.notes ?? undefined,
  }))

  // FAQ
  const faq = faqs.map(f => ({ question: f.question, answer: f.answer }))

  // Venue — prefer ceremony venue
  const venue = wedding.ceremony_venue_name ?? wedding.reception_venue_name ?? null

  // Owner email (for couple info) — getUserById can fail if owner_id is null or auth admin errors
  let ownerEmail: string | null = null
  if (wedding.owner_id) {
    try {
      const ownerRes = await admin.auth.admin.getUserById(wedding.owner_id)
      ownerEmail = ownerRes.data?.user?.email ?? null
    } catch {
      // Non-critical — snapshot still valid without owner email
    }
  }

  return {
    wedding: {
      id: wedding.id,
      name: `${wedding.partner1_first_name ?? ''} & ${wedding.partner2_first_name ?? ''}`.trim(),
      slug: wedding.wedding_name_id,
      date: wedding.wedding_date,
      timezone: 'America/New_York',
      venue,
      dress_code: null,
    },
    couple: {
      name1: `${wedding.partner1_first_name ?? ''} ${wedding.partner1_last_name ?? ''}`.trim() || null,
      name2: `${wedding.partner2_first_name ?? ''} ${wedding.partner2_last_name ?? ''}`.trim() || null,
      email: ownerEmail,
    },
    guests: guestSummary,
    vendors,
    tasks,
    timeline,
    hotels,
    faq,
    budget,
    updated_at: new Date().toISOString(),
  }
}

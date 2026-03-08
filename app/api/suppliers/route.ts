import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { getWeddingFeatureLimit } from "@/lib/subscription"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveWeddingUuid(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  weddingId: string
): Promise<string | null> {
  if (UUID_RE.test(weddingId)) return weddingId
  const { data } = await supabase
    .from('weddings')
    .select('id')
    .eq('wedding_name_id', weddingId)
    .single()
  return data?.id ?? null
}

// GET: fetch all suppliers (with payments aggregated & individual)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) return NextResponse.json({ error: 'weddingId is required' }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const uuid = await resolveWeddingUuid(supabase, decodeURIComponent(weddingId))
    if (!uuid) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const [suppliersRes, paymentsRes] = await Promise.all([
      supabase
        .from('suppliers')
        .select('*')
        .eq('wedding_id', uuid)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('supplier_payments')
        .select('*')
        .eq('wedding_id', uuid)
        .order('payment_date', { ascending: true }),
    ])

    if (suppliersRes.error) return NextResponse.json({ error: suppliersRes.error.message }, { status: 400 })
    if (paymentsRes.error) return NextResponse.json({ error: paymentsRes.error.message }, { status: 400 })

    const payments = paymentsRes.data ?? []
    const suppliers = (suppliersRes.data ?? []).map(s => ({
      ...s,
      payments: payments.filter(p => p.supplier_id === s.id),
      covered_amount: payments
        .filter(p => p.supplier_id === s.id)
        .reduce((sum, p) => sum + Number(p.amount), 0),
    }))

    return NextResponse.json({ suppliers })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: create supplier or payment depending on `type` param
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const type = searchParams.get('type') ?? 'supplier'
    if (!weddingId) return NextResponse.json({ error: 'weddingId is required' }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const uuid = await resolveWeddingUuid(supabase, decodeURIComponent(weddingId))
    if (!uuid) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const body = await request.json()

    if (type === 'payment') {
      const { supplier_id, amount, payment_date, notes } = body
      if (!supplier_id || !amount) return NextResponse.json({ error: 'supplier_id and amount are required' }, { status: 400 })

      const { data, error } = await supabase
        .from('supplier_payments')
        .insert({ supplier_id, wedding_id: uuid, amount: Number(amount), payment_date: payment_date || new Date().toISOString().split('T')[0], notes: notes || null })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ payment: data })
    }

    // type === 'supplier'
    const { name, category, contact_info, contact_type, contract_url, total_amount, notes, display_order } = body
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    // Check supplier limit for this plan
    const supplierLimit = await getWeddingFeatureLimit(uuid, 'suppliers_limit')
    if (supplierLimit !== null) {
      const { count } = await supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('wedding_id', uuid)
      if ((count ?? 0) >= supplierLimit) {
        return NextResponse.json({
          error: `Supplier limit reached. Your plan allows ${supplierLimit} suppliers. Upgrade to add more.`,
          code: 'SUPPLIER_LIMIT_EXCEEDED',
          limit: supplierLimit,
        }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        wedding_id: uuid,
        name,
        category: category || 'other',
        contact_info: contact_info || null,
        contact_type: contact_type || 'email',
        contract_url: contract_url || null,
        total_amount: Number(total_amount) || 0,
        notes: notes || null,
        display_order: display_order ?? 0,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ supplier: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: update supplier or payment
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const supplierId = searchParams.get('supplierId')
    const paymentId = searchParams.get('paymentId')
    const type = searchParams.get('type') ?? 'supplier'
    if (!weddingId) return NextResponse.json({ error: 'weddingId is required' }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const uuid = await resolveWeddingUuid(supabase, decodeURIComponent(weddingId))
    if (!uuid) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const body = await request.json()

    if (type === 'payment' && paymentId) {
      const { amount, payment_date, notes } = body
      const { data, error } = await supabase
        .from('supplier_payments')
        .update({ amount: Number(amount), payment_date, notes: notes || null })
        .eq('id', paymentId)
        .eq('wedding_id', uuid)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ payment: data })
    }

    if (!supplierId) return NextResponse.json({ error: 'supplierId is required' }, { status: 400 })
    const { name, category, contact_info, contact_type, contract_url, total_amount, notes, display_order } = body
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        name, category: category || 'other',
        contact_info: contact_info || null,
        contact_type: contact_type || 'email',
        contract_url: contract_url || null,
        total_amount: Number(total_amount) || 0,
        notes: notes || null,
        display_order: display_order ?? 0,
      })
      .eq('id', supplierId)
      .eq('wedding_id', uuid)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ supplier: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: remove supplier or payment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const supplierId = searchParams.get('supplierId')
    const paymentId = searchParams.get('paymentId')
    const type = searchParams.get('type') ?? 'supplier'
    if (!weddingId) return NextResponse.json({ error: 'weddingId is required' }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const uuid = await resolveWeddingUuid(supabase, decodeURIComponent(weddingId))
    if (!uuid) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    if (type === 'payment' && paymentId) {
      const { error } = await supabase
        .from('supplier_payments')
        .delete()
        .eq('id', paymentId)
        .eq('wedding_id', uuid)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    if (!supplierId) return NextResponse.json({ error: 'supplierId is required' }, { status: 400 })
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId)
      .eq('wedding_id', uuid)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

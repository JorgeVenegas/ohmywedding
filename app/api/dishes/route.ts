import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function resolveWeddingId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, weddingNameId: string) {
  const { data, error } = await supabase
    .from('weddings')
    .select('id')
    .eq('wedding_name_id', weddingNameId)
    .single()
  if (error || !data) return null
  return data.id as string
}

// GET: Fetch all dishes for a wedding
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('wedding_id', weddingUuid)
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ dishes: data || [] })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Create a new dish
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, category, is_vegetarian, is_vegan, is_gluten_free, allergens, display_order } = body

    if (!name) {
      return NextResponse.json({ error: "Dish name is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('dishes')
      .insert({
        wedding_id: weddingUuid,
        name,
        description: description || null,
        category: category || 'main',
        is_vegetarian: is_vegetarian || false,
        is_vegan: is_vegan || false,
        is_gluten_free: is_gluten_free || false,
        allergens: allergens || null,
        display_order: display_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT: Update a dish
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const dishId = searchParams.get('dishId')
    if (!weddingId || !dishId) {
      return NextResponse.json({ error: "weddingId and dishId are required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, category, is_vegetarian, is_vegan, is_gluten_free, allergens, display_order } = body

    const { data, error } = await supabase
      .from('dishes')
      .update({
        name,
        description,
        category,
        is_vegetarian,
        is_vegan,
        is_gluten_free,
        allergens,
        display_order,
      })
      .eq('id', dishId)
      .eq('wedding_id', weddingUuid)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete a dish
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const dishId = searchParams.get('dishId')
    if (!weddingId || !dishId) {
      return NextResponse.json({ error: "weddingId and dishId are required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', dishId)
      .eq('wedding_id', weddingUuid)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

// GET: Fetch all menus with their courses for a wedding
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) return NextResponse.json({ error: "weddingId is required" }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) return NextResponse.json({ error: "Wedding not found" }, { status: 404 })

    const { data, error } = await supabase
      .from('menus')
      .select(`*, menu_courses(*)`)
      .eq('wedding_id', weddingUuid)
      .order('display_order', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Sort courses by course_number
    const menus = (data || []).map(m => ({
      ...m,
      courses: (m.menu_courses || []).sort((a: { course_number: number }, b: { course_number: number }) => a.course_number - b.course_number),
    }))

    return NextResponse.json({ menus })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Create a new menu with its courses
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) return NextResponse.json({ error: "weddingId is required" }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) return NextResponse.json({ error: "Wedding not found" }, { status: 404 })

    const body = await request.json()
    const { name, description, image_url, courses_count, courses, display_order } = body

    if (!name) return NextResponse.json({ error: "Menu name is required" }, { status: 400 })

    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .insert({
        wedding_id: weddingUuid,
        name,
        description: description || null,
        image_url: image_url || null,
        courses_count: courses_count || 3,
        display_order: display_order ?? 0,
      })
      .select()
      .single()

    if (menuError) return NextResponse.json({ error: menuError.message }, { status: 400 })

    // Insert courses if provided
    if (courses && courses.length > 0) {
      const courseRows = courses.map((c: { course_number: number; course_name?: string; dish_name?: string }) => ({
        menu_id: menu.id,
        course_number: c.course_number,
        course_name: c.course_name || null,
        dish_name: c.dish_name || null,
      }))
      const { error: coursesError } = await supabase.from('menu_courses').insert(courseRows)
      if (coursesError) return NextResponse.json({ error: coursesError.message }, { status: 400 })
    }

    return NextResponse.json({ data: menu })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT: Update a menu and upsert its courses
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const menuId = searchParams.get('menuId')
    if (!weddingId || !menuId) return NextResponse.json({ error: "weddingId and menuId are required" }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) return NextResponse.json({ error: "Wedding not found" }, { status: 404 })

    const body = await request.json()
    const { name, description, image_url, courses_count, courses } = body

    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .update({ name, description, image_url, courses_count })
      .eq('id', menuId)
      .eq('wedding_id', weddingUuid)
      .select()
      .single()

    if (menuError) return NextResponse.json({ error: menuError.message }, { status: 400 })

    // Replace all courses
    if (courses && courses.length > 0) {
      await supabase.from('menu_courses').delete().eq('menu_id', menuId)
      const courseRows = courses.map((c: { course_number: number; course_name?: string; dish_name?: string }) => ({
        menu_id: menuId,
        course_number: c.course_number,
        course_name: c.course_name || null,
        dish_name: c.dish_name || null,
      }))
      const { error: coursesError } = await supabase.from('menu_courses').insert(courseRows)
      if (coursesError) return NextResponse.json({ error: coursesError.message }, { status: 400 })
    }

    return NextResponse.json({ data: menu })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete a menu
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const menuId = searchParams.get('menuId')
    if (!weddingId || !menuId) return NextResponse.json({ error: "weddingId and menuId are required" }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) return NextResponse.json({ error: "Wedding not found" }, { status: 404 })

    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', menuId)
      .eq('wedding_id', weddingUuid)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

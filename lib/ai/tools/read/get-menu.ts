import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { LLMTool, ToolContext } from '../types'

const schema = z.object({})

export const getMenu: LLMTool<z.infer<typeof schema>> = {
  name: 'get_menu',
  description: `Returns the wedding menus with their courses and how many guests are assigned to each.
Call this when the user asks about menus, food options, meal choices, courses, or which menu guests have been assigned.`,
  schema,
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute(_input, ctx: ToolContext) {
    const admin = createAdminSupabaseClient()

    const { data: menus } = await admin
      .from('menus')
      .select('id, name, description, courses_count')
      .eq('wedding_id', ctx.weddingId)
      .order('display_order', { ascending: true })

    if (!menus || menus.length === 0) return { menus: [], total: 0 }

    const [{ data: courses }, { data: assignments }] = await Promise.all([
      admin
        .from('menu_courses')
        .select('menu_id, course_number, course_name')
        .in('menu_id', menus.map(m => m.id))
        .order('course_number', { ascending: true }),
      admin
        .from('guest_menu_assignments')
        .select('menu_id')
        .eq('wedding_id', ctx.weddingId),
    ])

    const assignmentCounts: Record<string, number> = {}
    for (const a of assignments ?? []) {
      assignmentCounts[a.menu_id] = (assignmentCounts[a.menu_id] ?? 0) + 1
    }

    const coursesByMenu: Record<string, { number: number; name: string | null }[]> = {}
    for (const c of courses ?? []) {
      if (!coursesByMenu[c.menu_id]) coursesByMenu[c.menu_id] = []
      coursesByMenu[c.menu_id]!.push({ number: c.course_number, name: c.course_name })
    }

    return {
      total: menus.length,
      menus: menus.map(m => ({
        name: m.name,
        description: m.description,
        courses_count: m.courses_count,
        guests_assigned: assignmentCounts[m.id] ?? 0,
        courses: coursesByMenu[m.id] ?? [],
      })),
    }
  },
}

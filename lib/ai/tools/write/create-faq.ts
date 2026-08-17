import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { LLMTool, ToolContext } from '../types'

const schema = z.object({
  question: z.string().describe('The FAQ question to add'),
  answer: z.string().describe('The answer to the question'),
})

export const createFaq: LLMTool<z.infer<typeof schema>> = {
  name: 'create_faq',
  description: 'Adds a new FAQ entry to the wedding website. Use when the user wants to add a common question and answer for their guests.',
  schema,
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute({ question, answer }, ctx: ToolContext) {
    const admin = createAdminSupabaseClient()

    const { data, error } = await admin
      .from('wedding_faqs')
      .insert({ wedding_id: ctx.weddingId, question, answer })
      .select('id')
      .single()

    if (error || !data) {
      return { success: false, error: 'Failed to create FAQ entry' }
    }

    return {
      success: true,
      id: data.id,
      message: `FAQ added: "${question}"`,
    }
  },
}

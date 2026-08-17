import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function POST(req: NextRequest) {
  // Require an authenticated session — this endpoint calls Claude
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: { message: string; response: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { message, response } = body
  if (!message || !response) {
    return new Response(JSON.stringify({ suggestions: [] }))
  }

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: `You generate follow-up questions for a wedding planning AI assistant.
Given a user's question and the AI's response, output exactly 3 short, natural follow-up questions.
Rules:
- Write in the SAME language as the conversation (detect from the user message).
- Each question must be on its own line, no bullets, no numbers, no extra text.
- Questions must be directly relevant to what was just discussed.
- Keep each question under 60 characters.
- Output ONLY the 3 questions, nothing else.`,
      prompt: `User asked: "${message.slice(0, 300)}"\n\nAI answered: "${response.slice(0, 600)}"\n\nGenerate 3 follow-up questions:`,
    })

    const suggestions = result.text
      .split('\n')
      .map(l => l.replace(/^[-•\d.)\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 3)

    return Response.json({ suggestions })
  } catch (err) {
    console.error('[AI suggestions]', err)
    return Response.json({ suggestions: [] })
  }
}

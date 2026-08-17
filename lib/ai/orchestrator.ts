import { streamText, isStepCount, type ModelMessage } from 'ai'
import { tool as sdkTool } from '@ai-sdk/provider-utils'
import { resolveModel } from './providers'
import { selectModel } from './providers/types'
import { getToolsForRole } from './tools/registry'
import type { LLMTool } from './tools/types'
import type { ToolContext } from './tools/types'
import type { AIIdentity } from './auth/types'
import type { AIWeddingSnapshot } from './context/types'
import { buildSystemPrompt } from './prompts/builder'
import { loadHistory, saveMessage, ensureConversation, shouldSummarize } from './memory'
import { loadMessages, deleteOldMessages } from './memory/storage'
import { summarizeMessages } from './memory/summarizer'
import { preloadToolData } from './preloader'
import { logInteraction } from './logging'

export interface OrchestratorInput {
  identity: AIIdentity
  snapshot: AIWeddingSnapshot
  conversationId: string
  message: string
  currentPage?: string
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSDKTools(tools: LLMTool<any, any>[], ctx: ToolContext) {
  return Object.fromEntries(
    tools.map(t => [
      t.name,
      sdkTool({
        description: t.description,
        inputSchema: t.schema,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (input: any) => t.execute(input, ctx),
      }),
    ])
  )
}

function detectComplexity(message: string): 'simple' | 'complex' {
  const lower = message.toLowerCase()

  // Queries that need a tool call to answer correctly — route to the capable model.
  const needsToolCall = [
    /\b(who|quién|quiénes|cuáles?|cuál)\b/,
    /\b(list|lista|names?|nombres?|show me|dame|dime)\b/,
    /\b(pending|pendientes?|sin confirmar|no han confirmado|no respondieron)\b/,
    /\b(confirmed|confirmados?|asistirán|van a ir)\b.*\b(list|lista|who|quién|names?)\b/,
    /\b(declined|declinaron?|no asistirán|no vienen)\b/,
    /\b(guest|invitado)s?\b.*\b(names?|lista|list|specific|detail)\b/,
    /\b(contact|contacto|teléfono|phone|email)\b/,
    /\b(payment history|historial de pagos|cuándo pagamos|when did we pay)\b/,
    /invitaci|invitation|abri|opened|no han abiert|open rate/i,
    /registr|regalo|gift|contribuci|mesa de regalo/i,
    /menu|menú|plato|meal choice|seating|seat.*table/i,
  ]

  if (needsToolCall.some(re => re.test(lower))) return 'complex'

  const complexKeywords = ['compare', 'analyze', 'summarize', 'plan', 'suggest', 'recommend', 'help me decide', 'what should']
  if (complexKeywords.some(kw => lower.includes(kw))) return 'complex'

  return 'simple'
}

export async function runOrchestrator(input: OrchestratorInput) {
  const { identity, snapshot, conversationId, message, currentPage } = input
  const startTime = Date.now()

  await ensureConversation(
    conversationId,
    identity.weddingId,
    identity.userId,
    identity.role,
    identity.channel
  )

  const toolCtx: ToolContext = {
    weddingId: identity.weddingId,
    role: identity.role,
    snapshot,
  }

  const complexity = detectComplexity(message)
  const modelConfig = selectModel(identity.role, complexity)
  const model = resolveModel(modelConfig)

  const roleTools = getToolsForRole(identity.role)
  const sdkTools = toSDKTools(roleTools, toolCtx)

  const [history, needsSummarize, preloaded] = await Promise.all([
    loadHistory(conversationId),
    shouldSummarize(conversationId),
    preloadToolData(message, roleTools, toolCtx),
  ])

  if (needsSummarize) {
    try {
      const rawMessages = await loadMessages(conversationId, 40)
      const summary = await summarizeMessages(rawMessages)
      await saveMessage(conversationId, 'assistant', `[Resumen de conversación anterior]: ${summary}`)
      await deleteOldMessages(conversationId, 20)
    } catch (err) {
      console.error('[AI] summarization failed:', err)
    }
  }

  const systemPrompt = buildSystemPrompt(identity.role, snapshot, currentPage, preloaded.contextSection || undefined)

  const messages: ModelMessage[] = [
    ...history,
    { role: 'user', content: message },
  ]

  const llmToolsCalled: string[] = []

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    ...(Object.keys(sdkTools).length > 0
      ? {
          tools: sdkTools,
          stopWhen: isStepCount(5),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStepEnd({ toolCalls }: any) {
            if (toolCalls) {
              for (const tc of toolCalls) llmToolsCalled.push(tc.toolName)
            }
          },
        }
      : {}),
  })

  // Save messages and log after the stream is consumed by the client.
  // Promise.resolve() wraps PromiseLike so .catch() is available.
  Promise.resolve(result.text)
    .then(text =>
      Promise.all([
        saveMessage(conversationId, 'user', message),
        saveMessage(conversationId, 'assistant', text),
      ])
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch((err: any) => console.error('[AI] saveMessage failed:', err))

  Promise.resolve(result.usage)
    .then(usage =>
      logInteraction({
        userId: identity.userId,
        weddingId: identity.weddingId,
        conversationId,
        model: modelConfig.model,
        promptTokens: usage?.inputTokens ?? 0,
        completionTokens: usage?.outputTokens ?? 0,
        totalTokens: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
        toolsCalled: llmToolsCalled,
        durationMs: Date.now() - startTime,
      })
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch((err: any) => console.error('[AI] logInteraction failed:', err))

  return { result, modelId: modelConfig.model }
}

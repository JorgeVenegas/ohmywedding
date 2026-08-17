import { buildSnapshot } from './snapshot'
import type { AIWeddingSnapshot } from './types'

const TTL_MS = 5 * 60 * 1000 // 5 minutes

const cache = new Map<string, { snapshot: AIWeddingSnapshot; expiresAt: number }>()

export async function getWeddingContext(weddingId: string): Promise<AIWeddingSnapshot> {
  const now = Date.now()
  const hit = cache.get(weddingId)
  if (hit && hit.expiresAt > now) return hit.snapshot
  const snapshot = await buildSnapshot(weddingId)
  cache.set(weddingId, { snapshot, expiresAt: now + TTL_MS })
  return snapshot
}

export function invalidateWeddingContext(weddingId: string): void {
  cache.delete(weddingId)
}

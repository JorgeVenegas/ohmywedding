import type { AIRole } from '../auth/types'
import type { AIWeddingSnapshot } from '../context/types'
import { buildBasePrompt } from './system/base'
import { guestSystemAddition } from './system/guest'
import { coupleSystemAddition } from './system/couple'
import { plannerSystemAddition, plannerStaffSystemAddition } from './system/planner'

export function buildSystemPrompt(
  role: AIRole,
  snapshot: AIWeddingSnapshot,
  currentPage?: string,
  preloadedContext?: string
): string {
  const base = buildBasePrompt(snapshot)

  const roleAddition: Record<AIRole, string> = {
    guest: guestSystemAddition,
    couple: coupleSystemAddition,
    partner: coupleSystemAddition,
    planner: plannerSystemAddition,
    planner_staff: plannerStaffSystemAddition,
    superadmin: plannerSystemAddition,
  }

  const parts = [base, roleAddition[role]]

  if (currentPage) {
    parts.push(`\nThe user is currently viewing: ${currentPage}`)
  }

  if (preloadedContext) {
    parts.push(`\n## Pre-fetched Data\n${preloadedContext}`)
  }

  return parts.join('\n')
}

import type { AIRole } from '../auth/types'
import type { LLMTool } from './types'
import { getWeddingInfo } from './read/get-wedding-info'
import { getGuestSummary } from './read/get-guest-summary'
import { getGuestList } from './read/get-guest-list'
import { findGuest } from './read/find-guest'
import { getVendorSummary } from './read/get-vendor-summary'
import { getTimeline } from './read/get-timeline'
import { getBudget } from './read/get-budget'
import { getPayments } from './read/get-payments'
import { getHotels } from './read/get-hotels'
import { getFaq } from './read/get-faq'
import { getMenu } from './read/get-menu'
import { getSeating } from './read/get-seating'
import { getRegistry } from './read/get-registry'
import { getInvitationStats } from './read/get-invitation-stats'
import { updateGuestNote } from './write/update-guest-note'
import { createFaq } from './write/create-faq'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL_TOOLS: LLMTool<any, any>[] = [
  getWeddingInfo,
  getGuestSummary,
  getGuestList,
  findGuest,
  getVendorSummary,
  getTimeline,
  getBudget,
  getPayments,
  getHotels,
  getFaq,
  getMenu,
  getSeating,
  getRegistry,
  getInvitationStats,
  updateGuestNote,
  createFaq,
]

export function getToolsForRole(role: AIRole): LLMTool[] {
  return ALL_TOOLS.filter(tool => tool.roles.includes(role))
}

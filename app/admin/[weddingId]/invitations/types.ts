export interface Guest {
  id: string
  guest_group_id: string | null
  name: string
  phone_number: string | null
  email: string | null
  tags: string[]
  confirmation_status: 'pending' | 'confirmed' | 'declined'
  dietary_restrictions: string | null
  notes: string | null
  invited_by: string[]
  invitation_sent: boolean
  invitation_sent_at: string | null
  created_at: string
  attending?: boolean | null
  is_traveling?: boolean
  traveling_from?: string | null
  travel_arrangement?: 'will_buy_ticket' | 'no_ticket_needed' | null
  ticket_attachment_url?: string | null
  no_ticket_reason?: string | null
  admin_set_travel?: boolean
  // Extended fields for flat view
  groupName?: string
  allTags?: string[]
}

export interface GuestGroup {
  id: string
  name: string | null
  notes: string | null
  invitation_sent: boolean
  invitation_sent_at: string | null
  message: string | null
  rsvp_submitted_at: string | null
  created_at: string
  guests: Guest[]
  first_opened_at: string | null
  open_count: number
  is_draft?: boolean
}

export interface TimelineData {
  chartData: Array<{
    date: string
    confirmed: number
    declined: number
    opens: number
    cumulativeConfirmed: number
    cumulativeDeclined: number
    cumulativeOpens: number
    groupId?: string
  }>
  confirmationEvents: Array<{
    id: string
    type: 'confirmed' | 'declined' | 'updated'
    timestamp: string
    groupId: string
    groupName: string
    guestId?: string
    guestName?: string
    description: string
  }>
  openEvents?: Array<{
    id: string
    timestamp: string
    groupId: string
    groupName: string
    deviceType: string
  }>
  summary: {
    totalConfirmed: number
    totalDeclined: number
    totalOpens: number
  }
}

export interface ColumnVisibility {
  phone: boolean
  group: boolean
  tags: boolean
  status: boolean
  dietary: boolean
  invitedBy: boolean
  inviteSent: boolean
  travelInfo: boolean
}

export interface GroupTravelForm {
  groupId: string
  groupName: string
  isTraveling: boolean
  travelingFrom: string
  travelArrangement: 'will_buy_ticket' | 'no_ticket_needed' | null
  noTicketReason: string
}

export const TAG_COLORS: Record<string, string> = {
  family: "bg-blue-100 text-blue-700 border-blue-200",
  friends: "bg-green-100 text-green-700 border-green-200",
  work: "bg-purple-100 text-purple-700 border-purple-200",
  neighbors: "bg-orange-100 text-orange-700 border-orange-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
}

export const PREDEFINED_TAGS = ["family", "friends", "work", "neighbors"]

// ── Invited By helpers ────────────────────────────────────────────────
export interface PartnerOption {
  key: 'partner1' | 'partner2'
  name: string
}

/**
 * Resolve an invited_by reference ('partner1'/'partner2') to its display name.
 * Falls back to the raw value for legacy data that hasn't been migrated.
 */
export function resolveInvitedBy(
  ref: string,
  partnerNames: { partner1: string; partner2: string },
): string {
  if (ref === 'partner1') return partnerNames.partner1 || 'Partner 1'
  if (ref === 'partner2') return partnerNames.partner2 || 'Partner 2'
  return ref // legacy fallback
}

/**
 * Simple similarity score between two strings (0–1).
 * Uses longest common prefix ratio + edit distance heuristic
 * to catch nicknames and typos (e.g. "Yuls" ↔ "Yuli").
 */
function nameSimilarity(a: string, b: string): number {
  if (a === b) return 1
  // Common prefix ratio
  let prefix = 0
  const minLen = Math.min(a.length, b.length)
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) prefix++
    else break
  }
  const maxLen = Math.max(a.length, b.length)
  return prefix / maxLen
}

/**
 * Map a free-text name (e.g. from CSV or legacy DB value) to a partner
 * reference key. Uses exact match first, then prefix/similarity matching
 * for nicknames and typos (e.g. "Yuls" → partner2 when partner2 is "Yuli").
 * Returns null if the name doesn't match either partner.
 */
export function nameToInvitedByKey(
  name: string,
  partnerNames: { partner1: string; partner2: string },
): 'partner1' | 'partner2' | null {
  const normalized = name.trim().toLowerCase()
  const p1 = partnerNames.partner1?.toLowerCase() || ''
  const p2 = partnerNames.partner2?.toLowerCase() || ''

  // Exact match
  if (p1 && normalized === p1) return 'partner1'
  if (p2 && normalized === p2) return 'partner2'

  // Accept literal keys
  if (normalized === 'partner1' || normalized === 'partner 1') return 'partner1'
  if (normalized === 'partner2' || normalized === 'partner 2') return 'partner2'

  // Prefix match: one starts with the other (e.g. "Yuls" starts with "Yul", "Yuli" starts with "Yul")
  // or startsWith match (e.g. "Jorge Luis" starts with "Jorge")
  if (p1 && (normalized.startsWith(p1) || p1.startsWith(normalized))) return 'partner1'
  if (p2 && (normalized.startsWith(p2) || p2.startsWith(normalized))) return 'partner2'

  // Fuzzy match for short nicknames (min 3 chars, similarity >= 0.7)
  if (normalized.length >= 3) {
    const sim1 = p1 ? nameSimilarity(normalized, p1) : 0
    const sim2 = p2 ? nameSimilarity(normalized, p2) : 0
    const threshold = 0.7
    if (sim1 >= threshold && sim1 > sim2) return 'partner1'
    if (sim2 >= threshold && sim2 > sim1) return 'partner2'
  }

  return null
}

/**
 * Normalize an invited_by array from the DB.
 * Converts any legacy raw name strings to 'partner1'/'partner2' references.
 * Drops values that can't be matched. Deduplicates.
 */
export function normalizeInvitedBy(
  invitedBy: string[] | undefined | null,
  partnerNames: { partner1: string; partner2: string },
): string[] {
  if (!invitedBy || invitedBy.length === 0) return []
  const result = new Set<string>()
  for (const val of invitedBy) {
    // Already a valid reference
    if (val === 'partner1' || val === 'partner2') {
      result.add(val)
      continue
    }
    // Try to map legacy raw name → reference
    const key = nameToInvitedByKey(val, partnerNames)
    if (key) {
      result.add(key)
    }
    // Drop values that don't match any partner (phantom values)
  }
  return Array.from(result)
}

// Server-only — never import this from a client component.
// Pattern mirrors lib/messaging/feature-flag.ts.
//
// AI_CHAT_GA=true          → open to all weddings with an eligible plan
// AI_CHAT_ENABLED_WEDDING_SLUGS=slug1,slug2 → per-wedding allowlist (early access)

export function isAIChatEnabledForSlug(slug: string): boolean {
  if (process.env.AI_CHAT_GA === 'true') return true
  const slugs = new Set(
    (process.env.AI_CHAT_ENABLED_WEDDING_SLUGS ?? '')
      .split(',').map(s => s.trim()).filter(Boolean)
  )
  return slugs.has(slug)
}

// Plans eligible for AI chat access.
// management_tier: pro, agency — full planning tier
// invitation_tier: bespoke — highest invitation tier
// legacy plan: premium, deluxe
const ELIGIBLE_MGMT = new Set(['pro', 'agency'])
const ELIGIBLE_INV  = new Set(['bespoke'])
const ELIGIBLE_LEGACY = new Set(['premium', 'deluxe'])

export function isAIChatEligiblePlan(
  managementTier: string | null | undefined,
  invitationTier: string | null | undefined,
  legacyPlan:     string | null | undefined,
): boolean {
  return ELIGIBLE_MGMT.has(managementTier ?? '')
    || ELIGIBLE_INV.has(invitationTier ?? '')
    || ELIGIBLE_LEGACY.has(legacyPlan ?? '')
}

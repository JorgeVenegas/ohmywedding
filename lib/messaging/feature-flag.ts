import type { SupabaseClient } from "@supabase/supabase-js"

// Restricts the whole messaging feature to a manually curated allowlist of
// weddings during early rollout — comma-separated wedding_name_id values (the
// URL slug, not the UUID), e.g. MESSAGING_ENABLED_WEDDING_IDS=031326,jorgeandyuli
// Deliberately a server-only env var, not NEXT_PUBLIC_ — the allowlist itself
// shouldn't ship in the client bundle.
function getEnabledWeddingNameIds(): Set<string> {
  const raw = process.env.MESSAGING_ENABLED_WEDDING_IDS || ""
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  )
}

// Kill switch for the allowlist itself: set MESSAGING_GA=true to open the
// feature to every wedding (general availability), no code changes needed.
function isGeneralAvailability(): boolean {
  return process.env.MESSAGING_GA === "true"
}

export function isMessagingEnabledForWeddingNameId(weddingNameId: string): boolean {
  if (isGeneralAvailability()) return true
  return getEnabledWeddingNameIds().has(weddingNameId)
}

// Most messaging routes only have the wedding UUID in hand (resolved from a
// conversation/contact row), not the wedding_name_id the flag is keyed on —
// this does that one extra lookup.
export async function isMessagingEnabledForWeddingUuid(
  supabase: SupabaseClient,
  weddingUuid: string
): Promise<boolean> {
  const { data } = await supabase.from("weddings").select("wedding_name_id").eq("id", weddingUuid).maybeSingle()
  if (!data) return false
  return isMessagingEnabledForWeddingNameId(data.wedding_name_id as string)
}

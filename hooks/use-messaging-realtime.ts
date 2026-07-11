"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase-client"

// First use of Supabase Realtime in this codebase. Subscribes to changes on
// messages/conversations scoped to one wedding (RLS applies automatically since
// this uses the browser client, carrying the user's session) and calls back so
// the inbox page can refetch — kept deliberately simple (refetch-on-change)
// rather than hand-merging realtime payloads into local state.
export function useMessagingRealtime(weddingUuid: string | null, onChange: () => void) {
  useEffect(() => {
    if (!weddingUuid) return

    const supabase = createClient()
    const channel = supabase
      .channel(`messaging-${weddingUuid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `wedding_id=eq.${weddingUuid}` },
        onChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `wedding_id=eq.${weddingUuid}` },
        onChange
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingUuid])
}

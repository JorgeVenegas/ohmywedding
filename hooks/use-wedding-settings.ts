import { useState, useEffect } from "react"

export interface WeddingSettings {
  id?: string
  wedding_id?: string
  rsvp_travel_confirmation_enabled: boolean
  rsvp_require_ticket_attachment: boolean
  rsvp_require_no_ticket_reason: boolean
  rsvp_allow_plus_ones: boolean
  rsvp_deadline?: string | null
  invitation_default_message?: string | null
  invitation_custom_fields?: any
  gallery_allow_guest_uploads: boolean
  gallery_moderation_enabled: boolean
  timezone: string
  language: string
}

interface UseWeddingSettingsOptions {
  weddingNameId?: string
}

export function useWeddingSettings(options: UseWeddingSettingsOptions) {
  const [settings, setSettings] = useState<WeddingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true)
        let url: string

        if (options.weddingNameId) {
          // Check if it's being used in admin context (needs auth) or public context
          // Admin routes use the wedding name ID directly
          url = `/api/weddings/${encodeURIComponent(options.weddingNameId)}/settings`
        } else {
          throw new Error("weddingNameId is required")
        }

        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error("Failed to fetch wedding settings")
        }

        const data = await response.json()
        setSettings(data.settings)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setLoading(false)
      }
    }

    if (options.weddingNameId) {
      fetchSettings()
    }
  }, [options.weddingNameId])

  return { settings, loading, error }
}

"use client"

import { useEffect } from "react"
import Cal, { getCalApi } from "@calcom/embed-react"

interface CalBookingEmbedProps {
  calLink: string
  weddingId: string
  prefillName?: string
  prefillEmail?: string
  locale?: string
  onBookingSuccess?: () => void
}

export function CalBookingEmbed({
  calLink,
  weddingId,
  prefillName,
  prefillEmail,
  locale,
  onBookingSuccess,
}: CalBookingEmbedProps) {
  const namespace = `omw-${weddingId.slice(0, 8)}`

  useEffect(() => {
    ;(async () => {
      const cal = await getCalApi({ namespace })

      cal("ui", {
        theme: "light",
        colorScheme: "light",
        styles: {
          branding: { brandColor: "#420c14" },
        },
        cssVarsPerTheme: {
          light: {
            "--cal-brand-color": "#420c14",
            "--cal-bg": "#fefdfb",
            "--cal-bg-emphasis": "#f9f2ee",
            "--cal-bg-muted": "#f3e8e2",
            "--cal-text": "#420c14",
            "--cal-text-emphasis": "#2c0810",
            "--cal-text-subtle": "#7a3a42",
            "--cal-text-muted": "#a06070",
            "--cal-text-inverted": "#fefdfb",
            "--cal-border-subtle": "#f0e0d8",
            "--cal-border-muted": "#ddc8be",
          },
          dark: {
            "--cal-brand-color": "#c9856a",
            "--cal-bg": "#1c0a08",
            "--cal-bg-emphasis": "#2a1210",
            "--cal-bg-muted": "#381a16",
            "--cal-text": "#f0d8d0",
            "--cal-text-emphasis": "#f9f2ee",
            "--cal-text-subtle": "#c0907a",
            "--cal-text-muted": "#9a7060",
            "--cal-text-inverted": "#1c0a08",
            "--cal-border-subtle": "#2a1210",
            "--cal-border-muted": "#4a2820",
          },
        },
      })

      cal("on", {
        action: "bookingSuccessful",
        callback: () => onBookingSuccess?.(),
      })
    })()
  }, [namespace, onBookingSuccess])

  const params = new URLSearchParams({
    "metadata[weddingId]": weddingId,
    ...(prefillName ? { name: prefillName, "metadata[client_name]": prefillName } : {}),
    ...(prefillEmail ? { email: prefillEmail } : {}),
    ...(locale ? { locale } : {}),
  })
  const fullLink = `${calLink}?${params.toString()}`

  return (
    <Cal
      namespace={namespace}
      calLink={fullLink}
      style={{ width: "100%", overflow: "scroll" }}
      config={{ layout: "month_view", theme: "light" }}
    />
  )
}

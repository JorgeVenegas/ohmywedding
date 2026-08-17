"use client"

import { useEffect } from "react"
import Cal, { getCalApi } from "@calcom/embed-react"

interface CalRescheduleEmbedProps {
  uid: string
  calLink: string // original event link e.g. "ohmywedding/discovery-meeting" — NOT "reschedule/uid"
  locale?: string
}

// Cal.com's WithEmbedSSR strips `theme` when redirecting reschedule/<uid> to the event page.
// Workaround: use the original event calLink + config.rescheduleUid, which bypasses the redirect
// and puts all params directly into the iframe URL with no stripping.
export function CalRescheduleEmbed({ uid, calLink, locale }: CalRescheduleEmbedProps) {
  const namespace = `omw-rs-${uid.slice(0, 8)}`

  useEffect(() => {
    ;(async () => {
      const cal = await getCalApi({ namespace })
      cal("ui", {
        theme: "light",
        colorScheme: "light",
        styles: { branding: { brandColor: "#420c14" } },
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
    })()
  }, [namespace])

  return (
    <Cal
      namespace={namespace}
      calLink={calLink}
      style={{ width: "100%" }}
      config={{ layout: "month_view", theme: "light", rescheduleUid: uid, ...(locale ? { locale } : {}) } as Record<string, string>}
    />
  )
}

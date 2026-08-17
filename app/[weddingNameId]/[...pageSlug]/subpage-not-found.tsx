"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/components/contexts/i18n-context"
import { getWeddingPath } from "@/lib/wedding-url"

export function SubPageNotFound({ weddingNameId }: { weddingNameId: string }) {
  const { t } = useTranslation()
  // Initialize with the server-safe path; resolve to subdomain-aware path after mount
  const [href, setHref] = useState(`/${weddingNameId}`)
  useEffect(() => {
    setHref(getWeddingPath(weddingNameId))
  }, [weddingNameId])

  return (
    <div className="min-h-screen bg-[#fefdfb] flex flex-col items-center justify-center px-4 text-center">
      <p
        className="text-[10px] uppercase tracking-[0.3em] mb-4"
        style={{ color: "#DDA46F" }}
      >
        OhMyWedding
      </p>
      <h1 className="text-2xl font-serif mb-3" style={{ color: "#420c14" }}>
        {t("subPage.nothingHere")}
      </h1>
      <p className="text-sm max-w-xs" style={{ color: "rgba(66,12,20,0.5)" }}>
        {t("subPage.nothingHereDesc")}
      </p>
      <a
        href={href}
        className="mt-8 text-sm underline underline-offset-4 transition-opacity hover:opacity-70"
        style={{ color: "#420c14" }}
      >
        {t("subPage.goToInvitation")}
      </a>
    </div>
  )
}

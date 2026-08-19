"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { PricingUpgradeContent } from "@/app/pricing/page-client"

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#f5f2eb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
      </main>
    }>
      <PricingUpgradeContent mode="upgrade" />
    </Suspense>
  )
}

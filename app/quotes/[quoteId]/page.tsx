import { notFound } from "next/navigation"
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { isSuperUser } from "@/lib/superadmin"
import type { Quote } from "@/lib/quote-types"
import { QuotePageClient } from "./quote-page-client"

export const dynamic = "force-dynamic"

async function getQuote(quoteId: string): Promise<Quote | null> {
  try {
    const admin = createAdminSupabaseClient()
    const { data: quote, error } = await admin
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single()

    if (error || !quote) return null

    // Advance sent → viewed, but only when the actual recipient opens it.
    // Superadmins previewing the page should not trigger the status change.
    if (quote.status === "sent") {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      const viewerIsSuperuser = user ? await isSuperUser(supabase, { userId: user.id }) : false

      if (!viewerIsSuperuser) {
        await admin
          .from("quotes")
          .update({ status: "viewed" })
          .eq("id", quoteId)
      }
    }

    return quote as Quote
  } catch {
    return null
  }
}

async function isCouponUsed(couponId: string): Promise<boolean> {
  try {
    const admin = createAdminSupabaseClient()
    const { data } = await admin
      .from("coupons")
      .select("times_redeemed")
      .eq("id", couponId)
      .single()
    return (data?.times_redeemed ?? 0) > 0
  } catch {
    return false
  }
}

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ quoteId: string }>
}) {
  const { quoteId } = await params
  const quote = await getQuote(quoteId)
  if (!quote) notFound()

  const isExpired =
    quote.status === "expired" ||
    quote.status === "cancelled" ||
    (quote.coupon_expires_at && new Date(quote.coupon_expires_at) < new Date())

  const isPaid = quote.status === "paid"

  // Check if the coupon was already redeemed by someone else (only relevant when not paid)
  const couponUsed = !isPaid && !!quote.coupon_id
    ? await isCouponUsed(quote.coupon_id)
    : false

  return (
    <QuotePageClient
      quote={quote}
      isExpired={!!isExpired}
      isPaid={isPaid}
      couponUsed={couponUsed}
    />
  )
}

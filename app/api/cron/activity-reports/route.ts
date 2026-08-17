import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { sendEmail, TEAM_EMAIL } from '@/lib/email'
import { activityReportEmail } from '@/lib/email-activity-report'
import type {
  RsvpSummary, UpcomingMeeting, BudgetSummary, MessageSummary,
} from '@/lib/email-activity-report'

// Vercel Cron: run daily at 8 AM UTC
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_DOMAIN
  ? `https://${process.env.NEXT_PUBLIC_BASE_DOMAIN}`
  : 'https://ohmy.wedding'

// Plan tiers that get activity reports
const ELIGIBLE_TIERS = new Set(['personalized', 'bespoke', 'pro', 'agency'])

function daysSince(date: string | null): number {
  if (!date) return 999
  return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  const { searchParams } = new URL(req.url)
  const isTestMode = searchParams.get('test') === 'true'
  const testWeddingId = searchParams.get('weddingId')

  // Test mode: require auth via standard session (called from admin UI)
  // Normal cron mode: require CRON_SECRET
  if (!isTestMode && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()

  // Fetch weddings that have activity reports enabled, with their settings + subscription
  const { data: rows, error } = await admin
    .from('wedding_settings')
    .select(`
      wedding_id,
      activity_reports,
      last_activity_report_sent_at,
      language,
      weddings!inner (
        id,
        wedding_name_id,
        partner1_first_name,
        partner2_first_name,
        wedding_date,
        owner_id,
        profiles:owner_id ( email )
      ),
      wedding_subscriptions!inner (
        invitation_tier,
        management_tier,
        plan,
        status
      )
    `)
    .eq('activity_reports->>enabled', 'true')

  if (error) {
    console.error('[activity-reports cron] fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0

  // In test mode, filter to just the requested wedding
  const rowsToProcess = isTestMode && testWeddingId
    ? (rows ?? []).filter(r => r.wedding_id === testWeddingId)
    : (rows ?? [])

  for (const row of rowsToProcess) {
    try {
      const config = row.activity_reports as {
        enabled: boolean
        frequency: 'daily' | 'weekly' | 'never'
        include_rsvp: boolean
        include_meetings: boolean
        include_budget: boolean
        include_messages: boolean
        additional_emails: string[]
      }

      if (!config.enabled || config.frequency === 'never') { skipped++; continue }

      const sub = (row as any).wedding_subscriptions
      const invTier: string = sub?.invitation_tier ?? ''
      const mgmtTier: string = sub?.management_tier ?? ''
      const legacyPlan: string = sub?.plan ?? ''
      const isEligible = ELIGIBLE_TIERS.has(invTier) || ELIGIBLE_TIERS.has(mgmtTier) ||
        legacyPlan === 'premium' || legacyPlan === 'deluxe'

      if (!isEligible) { skipped++; continue }

      // Enforce per-plan frequency: basic plans only get weekly
      const frequency = config.frequency
      const lastSent = row.last_activity_report_sent_at as string | null
      const hoursSinceLast = daysSince(lastSent) * 24

      if (!isTestMode) {
        if (frequency === 'daily' && hoursSinceLast < 20) { skipped++; continue }
        if (frequency === 'weekly' && daysSince(lastSent) < 6.5) { skipped++; continue }
      }

      const wedding = (row as any).weddings
      if (!wedding) { skipped++; continue }

      const weddingId: string = wedding.id
      const locale: 'en' | 'es' = (row.language === 'es' ? 'es' : 'en')
      const coupleNames = [wedding.partner1_first_name, wedding.partner2_first_name]
        .filter(Boolean).join(' & ') || 'Pareja'

      const since = lastSent ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const now = new Date().toISOString()
      const periodLabel = new Date().toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })

      // ── Gather data in parallel ──
      const [rsvpData, meetingsData, budgetData, messagesData] = await Promise.all([
        config.include_rsvp ? fetchRsvpSummary(admin, weddingId, since) : null,
        config.include_meetings ? fetchUpcomingMeetings(admin, weddingId, now) : null,
        config.include_budget ? fetchBudgetSummary(admin, weddingId) : null,
        config.include_messages ? fetchMessageSummary(admin, weddingId, since) : null,
      ])

      // Skip if nothing happened
      const hasActivity =
        (rsvpData && rsvpData.newSinceLastReport.length > 0) ||
        (meetingsData && meetingsData.length > 0) ||
        (messagesData && messagesData.count > 0)

      if (!hasActivity && !isTestMode) { skipped++; continue }

      const ownerEmail = (wedding.profiles as { email: string } | null)?.email
      const recipients = [
        ...(ownerEmail ? [ownerEmail] : []),
        ...(config.additional_emails ?? []),
      ].filter(Boolean)

      if (recipients.length === 0) { skipped++; continue }

      const dashboardUrl = `${BASE_URL}/admin/${wedding.wedding_name_id}`
      const unsubscribeToken = createHmac('sha256', process.env.CRON_SECRET ?? 'omw-unsub')
        .update(weddingId)
        .digest('hex')
      const unsubscribeUrl = `${BASE_URL}/api/weddings/${weddingId}/unsubscribe-activity-report?token=${unsubscribeToken}`

      const subject = locale === 'es'
        ? `Tu resumen de boda · ${periodLabel}`
        : `Your wedding summary · ${periodLabel}`

      await sendEmail({
        to: recipients,
        subject,
        html: activityReportEmail({
          coupleNames,
          weddingDate: wedding.wedding_date,
          locale,
          periodLabel,
          rsvp: rsvpData ?? undefined,
          meetings: meetingsData ?? undefined,
          budget: budgetData ?? undefined,
          messages: messagesData ?? undefined,
          dashboardUrl,
          unsubscribeUrl,
        }),
      })

      // Update last sent timestamp
      await admin
        .from('wedding_settings')
        .update({ last_activity_report_sent_at: new Date().toISOString() })
        .eq('wedding_id', weddingId)

      sent++
    } catch (err) {
      console.error('[activity-reports cron] row error:', err)
    }
  }

  console.log(`[activity-reports cron] sent=${sent} skipped=${skipped}`)
  return NextResponse.json({ sent, skipped })
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function fetchRsvpSummary(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  weddingId: string,
  since: string,
): Promise<RsvpSummary> {
  const { data: guests } = await admin
    .from('guests')
    .select('name, confirmation_status, updated_at')
    .eq('wedding_id', weddingId)

  const all = guests ?? []
  const confirmed = all.filter(g => g.confirmation_status === 'confirmed').length
  const declined = all.filter(g => g.confirmation_status === 'declined').length
  const pending = all.filter(g => g.confirmation_status === 'pending' || !g.confirmation_status).length

  const newSinceLastReport = all
    .filter(g =>
      (g.confirmation_status === 'confirmed' || g.confirmation_status === 'declined') &&
      g.updated_at && g.updated_at > since,
    )
    .map(g => ({ name: g.name as string, status: g.confirmation_status as 'confirmed' | 'declined' }))

  return { confirmed, declined, pending, newSinceLastReport }
}

async function fetchUpcomingMeetings(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  weddingId: string,
  now: string,
): Promise<UpcomingMeeting[]> {
  const oneWeekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await admin
    .from('design_meetings')
    .select('title, scheduled_at, meeting_url')
    .eq('wedding_id', weddingId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', now)
    .lte('scheduled_at', oneWeekOut)
    .order('scheduled_at', { ascending: true })

  return (data ?? []).map(m => ({
    title: m.title as string,
    scheduled_at: m.scheduled_at as string,
    meeting_url: m.meeting_url as string | null,
  }))
}

async function fetchBudgetSummary(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  weddingId: string,
): Promise<BudgetSummary | null> {
  const [{ data: suppliers }, { data: payments }] = await Promise.all([
    admin.from('suppliers').select('id, name, total_amount').eq('wedding_id', weddingId),
    admin.from('supplier_payments').select('supplier_id, amount, payment_date').eq('wedding_id', weddingId),
  ])

  if (!suppliers || suppliers.length === 0) return null

  const totalBudget = suppliers.reduce((s, r) => s + Number(r.total_amount ?? 0), 0)
  const totalPaid = (payments ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0)

  const paidBySupplier = new Map<string, number>()
  for (const p of payments ?? []) {
    paidBySupplier.set(p.supplier_id, (paidBySupplier.get(p.supplier_id) ?? 0) + Number(p.amount))
  }

  const pendingPayments = suppliers
    .filter(s => {
      const paid = paidBySupplier.get(s.id) ?? 0
      return paid < Number(s.total_amount ?? 0)
    })
    .map(s => ({
      supplier: s.name as string,
      amount: Number(s.total_amount ?? 0) - (paidBySupplier.get(s.id) ?? 0),
      dueDate: null,
    }))

  return { totalBudget, totalPaid, pendingPayments }
}

async function fetchMessageSummary(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  weddingId: string,
  since: string,
): Promise<MessageSummary | null> {
  // Messages are stored on guest_groups.message, submitted alongside the RSVP
  const { data } = await admin
    .from('guest_groups')
    .select('name, message, rsvp_submitted_at')
    .eq('wedding_id', weddingId)
    .not('message', 'is', null)
    .gte('rsvp_submitted_at', since)
    .order('rsvp_submitted_at', { ascending: false })
    .limit(10)

  if (!data || data.length === 0) return null
  const withMessages = data.filter(m => m.message?.trim())
  if (withMessages.length === 0) return null
  return {
    count: withMessages.length,
    recent: withMessages.map(m => ({ name: m.name as string, message: m.message as string })),
  }
}

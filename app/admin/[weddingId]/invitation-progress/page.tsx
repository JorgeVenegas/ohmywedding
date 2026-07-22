"use client"

import { use, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { InvitationStatusTimeline } from "@/components/ui/invitation-status-timeline"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/components/contexts/i18n-context"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { getWeddingPath } from "@/lib/wedding-url"
import { isPreviewable, type DesignStatus } from "@/lib/invitation-workflow"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Link2,
  Loader2,
  LogOut,
  Video,
  XCircle,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface DesignStatusData {
  status: DesignStatus
  design_self_serve_locked: boolean
  current_user_can_approve: boolean
  current_user_is_reviewer: boolean
  history: Array<{
    id: string
    from_status: string
    to_status: string
    changed_at: string
    notes: string | null
  }>
  reviewers: Array<{
    id: string
    reviewer_email: string
    status: 'pending' | 'approved' | 'dismissed'
    requested_at: string
    reviewed_at: string | null
    notes: string | null
  }>
  meetings: Array<{
    id: string
    meeting_type: 'kickoff' | 'review' | 'final' | 'other'
    title: string
    scheduled_at: string | null
    meeting_url: string | null
    notes: string | null
    status: 'scheduled' | 'completed' | 'cancelled'
  }>
  versions: Array<{
    id: string
    version_number: number
    label: string
    is_active: boolean
    created_at: string
    notes: string | null
  }>
}

const REVIEWER_STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', className: 'bg-green-50 text-green-700 border-green-200' },
  dismissed: { label: 'Dismissed', className: 'bg-[#420c14]/5 text-[#420c14]/50 border-[#420c14]/10' },
}

export default function InvitationProgressPage({ params }: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = use(params)
  const { user, signOut } = useAuth()
  const { t } = useTranslation()

  const [data, setData] = useState<DesignStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [approveNote, setApproveNote] = useState("")
  const [showApproveForm, setShowApproveForm] = useState(false)
  const [showVersions, setShowVersions] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/weddings/${weddingId}/design-status`)
      if (res.ok) setData(await res.json())
    } catch {
      // silent — error state shown via !data check
    } finally {
      setLoading(false)
    }
  }, [weddingId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleApprove = async () => {
    setApproving(true)
    try {
      const res = await fetch(`/api/weddings/${weddingId}/design-status/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: approveNote.trim() || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to approve')
        return
      }
      toast.success('Design approved!')
      setShowApproveForm(false)
      setApproveNote("")
      fetchData()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setApproving(false)
    }
  }

  const statusLabel = (s: string) => t(`admin.invitationProgress.statusLabels.${s}`) || s
  const meetingTypeLabel = (type: string) => t(`admin.invitationProgress.meetingTypes.${type}`) || type

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header rightContent={
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            {t('admin.dashboard.signOut')}
          </Button>
        } />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-background">
        <Header rightContent={
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            {t('admin.dashboard.signOut')}
          </Button>
        } />
        <div className="page-container py-16 text-center">
          <p className="text-[#420c14]/60">{t('admin.invitationProgress.unableToLoad')}</p>
          <Link href={getCleanAdminUrl(weddingId, 'dashboard')} className="mt-4 inline-block text-[#DDA46F] underline text-sm">
            {t('admin.invitationProgress.backToDashboard')}
          </Link>
        </div>
      </main>
    )
  }

  const canPreview = isPreviewable(data.status)
  const isLive = data.status === 'live'
  const upcomingMeetings = data.meetings.filter((m) => m.status === 'scheduled')
  const pastMeetings = data.meetings.filter((m) => m.status !== 'scheduled')

  return (
    <main className="min-h-screen bg-background">
      <Header
        rightContent={
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            {t('admin.dashboard.signOut')}
          </Button>
        }
      />

      <div className="page-container py-8 max-w-6xl mx-auto">

        {/* Back link */}
        <Link
          href={getCleanAdminUrl(weddingId, 'dashboard')}
          className="inline-flex items-center gap-1.5 text-sm text-[#420c14]/50 hover:text-[#420c14] transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('admin.invitationProgress.backToDashboard')}
        </Link>

        {/* Page heading */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">{t('admin.invitationProgress.label')}</p>
          <h1 className="text-3xl font-serif text-[#420c14]">{t('admin.invitationProgress.title')}</h1>
          <p className="text-[#420c14]/60 mt-2 text-sm max-w-xl">{t('admin.invitationProgress.description')}</p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8 items-start">

          {/* ── Left column: status + approve + meetings ── */}
          <div className="space-y-6">

            {/* Status overview */}
            <Card className="p-6 border-[#420c14]/10 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-1">{t('admin.invitationProgress.currentStatus')}</p>
                  <p className="text-xl font-medium text-[#420c14]">{statusLabel(data.status)}</p>
                </div>
                {canPreview && (
                  <Link
                    href={isLive ? getWeddingPath(weddingId) : `/${weddingId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#420c14] text-[#f5f2eb] px-4 py-2 text-sm font-medium hover:bg-[#5a1a22] transition-colors"
                  >
                    {isLive ? t('admin.invitationProgress.viewLiveSite') : t('admin.invitationProgress.previewDesign')}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
              <InvitationStatusTimeline
                currentStatus={data.status}
                history={data.history}
              />
            </Card>

            {/* Approve section */}
            {data.current_user_can_approve && !showApproveForm && (
              <Card className="p-6 border-[#DDA46F]/30 bg-[#DDA46F]/5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#DDA46F]/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-[#DDA46F]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#420c14]">{t('admin.invitationProgress.approvalRequested.title')}</p>
                    <p className="text-sm text-[#420c14]/60 mt-1">{t('admin.invitationProgress.approvalRequested.description')}</p>
                    <Button
                      onClick={() => setShowApproveForm(true)}
                      className="mt-4 rounded-xl bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
                    >
                      {t('admin.invitationProgress.approvalRequested.button')}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {showApproveForm && (
              <Card className="p-6 border-[#420c14]/10 shadow-sm">
                <p className="font-medium text-[#420c14] mb-3">{t('admin.invitationProgress.approveForm.title')}</p>
                <textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder={t('admin.invitationProgress.approveForm.notePlaceholder')}
                  rows={3}
                  className="w-full rounded-xl border border-[#420c14]/10 px-4 py-3 text-sm text-[#420c14] placeholder:text-[#420c14]/30 focus:outline-none focus:border-[#DDA46F] focus:ring-1 focus:ring-[#DDA46F]/20 resize-none"
                />
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={handleApprove}
                    disabled={approving}
                    className="rounded-xl bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
                  >
                    {approving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t('admin.invitationProgress.approveForm.confirm')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowApproveForm(false); setApproveNote("") }}
                    className="rounded-xl border-[#420c14]/10 text-[#420c14]"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </Card>
            )}

            {/* Meetings */}
            {data.meetings.length > 0 && (
              <Card className="p-6 border-[#420c14]/10 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-5">{t('admin.invitationProgress.meetings.title')}</p>
                <ul className="space-y-3">
                  {upcomingMeetings.map((m) => (
                    <li key={m.id} className="flex items-start gap-3 rounded-xl border border-[#420c14]/10 bg-[#f5f2eb]/40 p-4">
                      <div className="w-9 h-9 rounded-lg bg-[#DDA46F]/10 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-[#DDA46F]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#420c14]">{m.title}</p>
                        <p className="text-[11px] text-[#420c14]/50 mt-0.5">
                          {meetingTypeLabel(m.meeting_type)}
                          {m.scheduled_at && (
                            <> · {format(new Date(m.scheduled_at), "MMM d, yyyy 'at' h:mm a")}</>
                          )}
                        </p>
                        {m.notes && <p className="text-xs text-[#420c14]/50 mt-1">{m.notes}</p>}
                      </div>
                      {m.meeting_url && (
                        <a
                          href={m.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#420c14] text-[#f5f2eb] px-3 py-1.5 text-xs font-medium hover:bg-[#5a1a22] transition-colors"
                        >
                          {t('admin.invitationProgress.meetings.join')}
                          <Link2 className="w-3 h-3" />
                        </a>
                      )}
                    </li>
                  ))}

                  {pastMeetings.map((m) => (
                    <li key={m.id} className="flex items-start gap-3 rounded-xl border border-[#420c14]/8 bg-[#420c14]/2 p-4 opacity-60">
                      <div className="w-9 h-9 rounded-lg bg-[#420c14]/5 flex items-center justify-center shrink-0">
                        {m.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-[#420c14]/40" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#420c14]/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#420c14]">{m.title}</p>
                        <p className="text-[11px] text-[#420c14]/50 mt-0.5">
                          {meetingTypeLabel(m.meeting_type)} ·{' '}
                          {m.status === 'completed' ? t('admin.invitationProgress.meetings.completed') : t('admin.invitationProgress.meetings.cancelled')}
                          {m.scheduled_at && (
                            <> · {format(new Date(m.scheduled_at), 'MMM d, yyyy')}</>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* ── Right column: reviewers + versions ── */}
          <div className="space-y-6">

            {/* Reviewers */}
            {data.reviewers.length > 0 && (
              <Card className="p-6 border-[#420c14]/10 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-4">{t('admin.invitationProgress.reviewers')}</p>
                <ul className="space-y-2">
                  {data.reviewers.map((r) => {
                    const isCurrentUser = r.reviewer_email === user?.email?.toLowerCase()
                    const cfg = REVIEWER_STATUS_CONFIG[r.status]
                    return (
                      <li
                        key={r.id}
                        className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border ${
                          isCurrentUser ? 'bg-[#420c14]/[0.03] border-[#420c14]/15' : 'bg-[#f5f2eb]/40 border-[#420c14]/8'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-[#420c14] font-medium truncate">{r.reviewer_email}</p>
                          {isCurrentUser && (
                            <p className="text-[10px] text-[#420c14]/40">(you)</p>
                          )}
                        </div>
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border shrink-0 ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            )}

            {/* Version history */}
            {data.versions.length > 0 && (
              <Card className="p-6 border-[#420c14]/10 shadow-sm">
                <button
                  onClick={() => setShowVersions((v) => !v)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40">
                    {t('admin.invitationProgress.versions.title')} ({data.versions.length})
                  </p>
                  <Clock className={`w-3.5 h-3.5 text-[#420c14]/30 transition-transform ${showVersions ? 'rotate-180' : ''}`} />
                </button>

                {showVersions && (
                  <ul className="mt-4 space-y-2">
                    {data.versions.map((v) => (
                      <li
                        key={v.id}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 border text-sm ${
                          v.is_active
                            ? 'border-[#DDA46F]/30 bg-[#DDA46F]/5 text-[#420c14]'
                            : 'border-[#420c14]/8 bg-[#f5f2eb]/30 text-[#420c14]/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-medium">{v.label}</span>
                          {v.notes && <p className="text-[11px] text-[#420c14]/40 mt-0.5">{v.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#420c14]/40 shrink-0 ml-2">
                          {v.is_active && (
                            <span className="text-[#DDA46F] font-medium">{t('admin.invitationProgress.versions.active')}</span>
                          )}
                          {format(new Date(v.created_at), 'MMM d')}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

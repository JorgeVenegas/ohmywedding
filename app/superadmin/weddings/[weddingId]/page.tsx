"use client"

import { use, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DesignProgressJourney } from "@/components/ui/design-progress-dots"
import {
  DESIGN_STATUSES,
  STATUS_LABELS,
  availableTransitions,
  type DesignStatus,
  type WorkflowPlan,
} from "@/lib/invitation-workflow"
import { MeetingDateTimePicker } from "@/components/ui/meeting-date-time-picker"
import dynamic from "next/dynamic"
import { InvitationActivityLog } from "@/components/ui/invitation-activity-log"

const CalRescheduleEmbed = dynamic(
  () => import("@/components/ui/cal-reschedule-embed").then((m) => m.CalRescheduleEmbed),
  { ssr: false },
)
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Link2,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  UserPlus,
  Video,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface DesignStatusData {
  status: DesignStatus
  plan: WorkflowPlan
  available_transitions: DesignStatus[]
  suggested_attendees?: {
    owner_email: string | null
    collaborator_emails: string[]
  }
  history: Array<{
    id: string
    from_status: string | null
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
    calcom_uid: string | null
    calcom_event_type_slug: string | null
  }>
  versions: Array<{
    id: string
    version_number: number
    label: string
    is_active: boolean
    created_at: string
    notes: string | null
  }>
  activity_logs: Array<{
    id: string
    event_type: string
    title: string
    description: string | null
    metadata: Record<string, unknown> | null
    created_at: string
  }>
}

type Tab = 'status' | 'versions' | 'meetings' | 'storage' | 'ai' | 'pages'

interface StorageBreakdown {
  table: string
  count: number | null
}

interface StorageData {
  couple: string
  breakdown: StorageBreakdown[]
  total_rows: number
}

const MEETING_TYPE_LABELS_DEFAULT = {
  kickoff: 'Kickoff Call',
  review: 'Design Review',
  final: 'Final Review',
  other: 'Meeting',
}

const MEETING_TYPE_LABELS_BESPOKE = {
  kickoff: 'Discovery Meeting',
  review: 'Presentation Meeting',
  final: 'Delivery Meeting',
  other: 'Other Meeting',
}

function getMeetingTypeLabels(plan?: 'free' | 'premium' | 'deluxe') {
  return plan === 'deluxe' ? MEETING_TYPE_LABELS_BESPOKE : MEETING_TYPE_LABELS_DEFAULT
}

const REVIEWER_STATUS_CONFIG = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  dismissed: 'bg-[#420c14]/5 text-[#420c14]/40 border-[#420c14]/8',
}

export default function SuperadminWeddingDesignPage({
  params,
}: {
  params: Promise<{ weddingId: string }>
}) {
  const { weddingId } = use(params)
  const router = useRouter()
  const [data, setData] = useState<DesignStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('status')
  const [storageData, setStorageData] = useState<StorageData | null>(null)
  const [loadingStorage, setLoadingStorage] = useState(false)

  // Status change form
  const [toStatus, setToStatus] = useState<DesignStatus | ''>('')
  const [statusNotes, setStatusNotes] = useState("")
  const [reviewerEmails, setReviewerEmails] = useState("")
  const [savingStatus, setSavingStatus] = useState(false)

  // Add reviewer
  const [addingReviewer, setAddingReviewer] = useState(false)
  const [newReviewerEmail, setNewReviewerEmail] = useState("")
  const [savingReviewer, setSavingReviewer] = useState(false)

  // Version snapshot
  const [versionLabel, setVersionLabel] = useState("")
  const [versionNotes, setVersionNotes] = useState("")
  const [savingVersion, setSavingVersion] = useState(false)
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)


  // Manual meeting form (Meetings tab)
  const [meetingForm, setMeetingForm] = useState<{
    id?: string
    meeting_type: string
    title: string
    scheduled_at: string
    meeting_url: string
    notes: string
    status: string
  } | null>(null)
  const [savingMeeting, setSavingMeeting] = useState(false)
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<{ uid: string; calLink: string; locale: string } | null>(null)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (deleteConfirm !== weddingId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/superadmin/weddings/${weddingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      toast.success('Wedding deleted')
      router.push('/superadmin/weddings')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/weddings/${weddingId}/design-status`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
        if (d.available_transitions.length > 0) {
          // Functional update reads actual current state — avoids stale closure
          // and prevents re-selecting when user has already picked a transition.
          setToStatus((prev) => prev || d.available_transitions[0])
        } else {
          setToStatus('')
        }
      }
    } finally {
      setLoading(false)
    }
  }, [weddingId])

  useEffect(() => { fetchData() }, [fetchData])

  const fetchStorage = async () => {
    if (storageData || loadingStorage) return
    setLoadingStorage(true)
    try {
      const res = await fetch(`/api/superadmin/weddings/${weddingId}/storage`)
      if (res.ok) setStorageData(await res.json())
    } finally {
      setLoadingStorage(false)
    }
  }

  useEffect(() => { if (tab === 'storage') fetchStorage() }, [tab])

  // ── Status change ─────────────────────────────────────────────
  const handleStatusChange = async () => {
    if (!toStatus) return
    setSavingStatus(true)
    try {
      const body: Record<string, unknown> = { to_status: toStatus, notes: statusNotes.trim() || null }
      if (toStatus === 'ready_for_review' && reviewerEmails.trim()) {
        body.reviewer_emails = reviewerEmails.split(/[\n,]+/).map((e) => e.trim()).filter(Boolean)
      }
      const res = await fetch(`/api/weddings/${weddingId}/design-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to update status')
        return
      }
      toast.success(`Status updated to "${STATUS_LABELS[toStatus]}"`)
      setStatusNotes("")
      setReviewerEmails("")
      setToStatus('')
      await fetchData()
    } finally {
      setSavingStatus(false)
    }
  }

  const MEETING_STATUSES: DesignStatus[] = ['discovery_meeting', 'review_meeting', 'delivery_meeting']

  // ── Add reviewer ──────────────────────────────────────────────
  const handleAddReviewer = async () => {
    if (!newReviewerEmail.trim()) return
    setSavingReviewer(true)
    try {
      const emails = newReviewerEmail.split(/[\n,]+/).map((e) => e.trim()).filter(Boolean)
      const res = await fetch(`/api/weddings/${weddingId}/design-status/reviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to add reviewer')
        return
      }
      toast.success('Reviewer added')
      setNewReviewerEmail("")
      setAddingReviewer(false)
      await fetchData()
    } finally {
      setSavingReviewer(false)
    }
  }

  const handleRemoveReviewer = async (id: string) => {
    const res = await fetch(
      `/api/weddings/${weddingId}/design-status/reviewers/${id}`,
      { method: 'DELETE' },
    )
    if (res.ok) {
      toast.success('Reviewer removed')
      fetchData()
    } else {
      toast.error('Failed to remove reviewer')
    }
  }

  // ── Version snapshot ──────────────────────────────────────────
  const handleSaveVersion = async () => {
    if (!versionLabel.trim()) return
    setSavingVersion(true)
    try {
      const res = await fetch(`/api/weddings/${weddingId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: versionLabel.trim(), notes: versionNotes.trim() || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to save version')
        return
      }
      toast.success('Version saved')
      setVersionLabel("")
      setVersionNotes("")
      await fetchData()
    } finally {
      setSavingVersion(false)
    }
  }

  const handleRestoreVersion = async () => {
    if (!confirmRestoreId) return
    setRestoring(true)
    try {
      const res = await fetch(
        `/api/weddings/${weddingId}/versions/${confirmRestoreId}/restore`,
        { method: 'POST' },
      )
      if (res.ok) {
        toast.success('Version restored')
        setConfirmRestoreId(null)
        fetchData()
      } else {
        toast.error('Failed to restore version')
      }
    } finally {
      setRestoring(false)
    }
  }

  // ── Meetings ──────────────────────────────────────────────────
  const handleSaveMeeting = async () => {
    if (!meetingForm?.title.trim()) return
    setSavingMeeting(true)
    try {
      const isNew = !meetingForm.id
      const url = isNew
        ? `/api/weddings/${weddingId}/meetings`
        : `/api/weddings/${weddingId}/meetings/${meetingForm.id}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meetingForm.title.trim(),
          meeting_type: meetingForm.meeting_type,
          scheduled_at: meetingForm.scheduled_at || null,
          meeting_url: meetingForm.meeting_url || null,
          notes: meetingForm.notes || null,
          status: meetingForm.status,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to save meeting')
        return
      }
      toast.success(isNew ? 'Meeting added' : 'Meeting updated')
      setMeetingForm(null)
      fetchData()
    } finally {
      setSavingMeeting(false)
    }
  }

  const handleDeleteMeeting = async (id: string) => {
    setDeletingMeetingId(id)
    try {
      const res = await fetch(`/api/weddings/${weddingId}/meetings/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Meeting deleted')
        fetchData()
      } else {
        toast.error('Failed to delete meeting')
      }
    } finally {
      setDeletingMeetingId(null)
    }
  }

  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/superadmin/weddings" className="inline-flex items-center gap-1.5 text-sm text-[#420c14]/50 hover:text-[#420c14]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to weddings
        </Link>
        <p className="text-[#420c14]/60">Unable to load design data for this wedding.</p>
      </div>
    )
  }

  const availableNext = availableTransitions(data.status, 'superadmin', data.plan)
  const meetingTypeLabels = getMeetingTypeLabels(data.plan)

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <Link
          href="/superadmin/weddings"
          className="inline-flex items-center gap-1.5 text-sm text-[#420c14]/50 hover:text-[#420c14] transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to weddings
        </Link>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Design Management</p>
        <h1 className="text-4xl font-serif text-[#420c14]">Invitation Design</h1>
        <p className="text-[#420c14]/60 mt-2 text-sm font-mono">{weddingId}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#420c14]/5 rounded-xl p-1">
        {(['status', 'versions', 'meetings', 'pages', 'storage', 'ai'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-white text-[#420c14] shadow-sm'
                : 'text-[#420c14]/50 hover:text-[#420c14]'
            }`}
          >
            {t === 'versions' ? `Versions (${data.versions.length})` : t === 'ai' ? 'AI Credits' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Status tab ─────────────────────────────────────── */}
      {tab === 'status' && (
        <div className="space-y-6">
          {/* Journey progress */}
          <Card className="p-6 border-[#420c14]/10 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-5">Design Progress</p>
            <DesignProgressJourney plan={data.plan ?? 'free'} status={data.status} />
          </Card>

          {/* Status change form */}
          {availableNext.length > 0 && (
            <Card className="p-6 border-[#420c14]/10 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-5">Advance Status</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-[#420c14]/70 text-sm mb-2 block">Next Status</Label>
                  <Select value={toStatus} onValueChange={(v) => setToStatus(v as DesignStatus)}>
                    <SelectTrigger className="h-11 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F]">
                      <SelectValue placeholder="Select next status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#420c14]/10">
                      {availableNext.map((s) => (
                        <SelectItem key={s} value={s} className="rounded-lg">
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cal.com info callout for meeting statuses */}
                {toStatus && MEETING_STATUSES.includes(toStatus as DesignStatus) && (
                  <div className="flex items-center gap-2 rounded-xl bg-[#DDA46F]/8 border border-[#DDA46F]/20 px-4 py-3">
                    <Calendar className="w-4 h-4 text-[#DDA46F] shrink-0" />
                    <p className="text-sm text-[#420c14]/70">
                      The couple will be prompted to pick a time via Cal.com on their next visit.
                    </p>
                  </div>
                )}

                {toStatus === 'ready_for_review' && (
                  <div>
                    <Label className="text-[#420c14]/70 text-sm mb-2 block">
                      Reviewer Emails <span className="text-[#420c14]/40 font-normal">(one per line or comma-separated)</span>
                    </Label>
                    <Textarea
                      value={reviewerEmails}
                      onChange={(e) => setReviewerEmails(e.target.value)}
                      placeholder="couple@example.com&#10;planner@example.com"
                      rows={3}
                      className="rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] resize-none text-sm"
                    />
                    <p className="text-xs text-[#420c14]/40 mt-1">
                      These people will be able to approve the design.
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-[#420c14]/70 text-sm mb-2 block">Notes <span className="text-[#420c14]/40 font-normal">(optional)</span></Label>
                  <Textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="What changed in this update?"
                    rows={2}
                    className="rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] resize-none text-sm"
                  />
                </div>

                <Button
                  onClick={handleStatusChange}
                  disabled={savingStatus || !toStatus}
                  className="rounded-xl bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
                >
                  {savingStatus && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update to {toStatus ? STATUS_LABELS[toStatus as DesignStatus] : '—'}
                </Button>
              </div>
            </Card>
          )}

          {/* Reviewers */}
          <Card className="p-6 border-[#420c14]/10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40">Reviewers</p>
              <button
                onClick={() => setAddingReviewer((v) => !v)}
                className="inline-flex items-center gap-1.5 text-sm text-[#DDA46F] hover:text-[#c48d5a] transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {addingReviewer && (
              <div className="mb-4 space-y-3 p-4 rounded-xl bg-[#f5f2eb]/60 border border-[#420c14]/8">
                <Textarea
                  value={newReviewerEmail}
                  onChange={(e) => setNewReviewerEmail(e.target.value)}
                  placeholder="email@example.com"
                  rows={2}
                  className="rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] resize-none text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddReviewer}
                    disabled={savingReviewer || !newReviewerEmail.trim()}
                    className="rounded-lg bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] text-xs"
                  >
                    {savingReviewer && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Add Reviewer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setAddingReviewer(false); setNewReviewerEmail("") }}
                    className="rounded-lg border-[#420c14]/10 text-[#420c14] text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {data.reviewers.length === 0 ? (
              <p className="text-sm text-[#420c14]/40">No reviewers assigned yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.reviewers.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-[#f5f2eb]/40 border border-[#420c14]/8"
                  >
                    <span className="text-sm text-[#420c14] truncate">{r.reviewer_email}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${REVIEWER_STATUS_CONFIG[r.status]}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                      <button
                        onClick={() => handleRemoveReviewer(r.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-[#420c14]/30 hover:text-[#420c14]/70 hover:bg-[#420c14]/5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Scheduled meetings — quick cancel without leaving the Status tab */}
          {data.meetings.filter(m => m.status === 'scheduled').length > 0 && (
            <Card className="p-6 border-[#420c14]/10 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-4">Scheduled Meetings</p>
              <ul className="space-y-2">
                {data.meetings.filter(m => m.status === 'scheduled').map(m => (
                  <li key={m.id} className="rounded-xl border border-[#420c14]/8 bg-[#f5f2eb]/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#DDA46F]/10 flex items-center justify-center shrink-0">
                        <Video className="w-3.5 h-3.5 text-[#DDA46F]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#420c14] truncate">{m.title}</p>
                        <p className="text-[11px] text-[#420c14]/45 mt-0.5">
                          {meetingTypeLabels[m.meeting_type]}
                          {m.scheduled_at && <> · {format(new Date(m.scheduled_at), "MMM d 'at' h:mm a")}</>}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {m.meeting_url && (
                            <a
                              href={m.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] text-[#DDA46F] hover:underline"
                            >
                              <Link2 className="w-2.5 h-2.5" />
                              Join
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMeeting(m.id)}
                        disabled={deletingMeetingId === m.id}
                        title="Cancel meeting"
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-[#420c14]/25 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      {deletingMeetingId === m.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                    </div>
                    {m.calcom_uid && (
                      <button
                        onClick={() => {
          if (!m.calcom_uid) return
          const slugFallback = m.meeting_type === 'review' ? 'design-review' : m.meeting_type === 'final' ? 'delivery-meeting' : 'discovery-meeting'
          const slug = m.calcom_event_type_slug ?? slugFallback
          const locale = slug.endsWith('-es') ? 'es' : 'en'
          setRescheduleTarget({ uid: m.calcom_uid, calLink: `${process.env.NEXT_PUBLIC_CALCOM_USERNAME ?? 'ohmywedding'}/${slug}`, locale })
        }}
                        className="mt-2 flex items-center gap-1 text-[11px] text-[#420c14]/45 hover:text-[#420c14] hover:underline"
                      >
                        <Calendar className="w-2.5 h-2.5" />
                        Reschedule
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Danger zone */}
          <Card className="p-6 border-red-100 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-red-400 mb-4">Danger Zone</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#420c14]">Delete this wedding</p>
                <p className="text-xs text-[#420c14]/40 mt-0.5">Permanently removes all guests, design history, meetings, and files.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => { setDeleteDialogOpen(true); setDeleteConfirm("") }}
                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shrink-0 ml-6"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Wedding
              </Button>
            </div>
          </Card>

          {/* History */}
          {data.history.length > 0 && (
            <Card className="p-6 border-[#420c14]/10 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-4">Status History</p>
              <ul className="space-y-2">
                {data.history.map((h) => (
                  <li key={h.id} className="flex items-start gap-3 text-sm">
                    <span className="text-[11px] text-[#420c14]/40 w-24 shrink-0 pt-0.5">
                      {format(new Date(h.changed_at), 'MMM d, HH:mm')}
                    </span>
                    <div>
                      <span className="text-[#420c14]/50">
                        {h.from_status ? `${STATUS_LABELS[h.from_status as DesignStatus]} →` : 'Set to'}
                      </span>{' '}
                      <span className="font-medium text-[#420c14]">{STATUS_LABELS[h.to_status as DesignStatus]}</span>
                      {h.notes && <p className="text-xs text-[#420c14]/40 mt-0.5">{h.notes}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* ── Versions tab ───────────────────────────────────── */}
      {tab === 'versions' && (
        <div className="space-y-6">
          {/* Save new version */}
          <Card className="p-6 border-[#420c14]/10 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-5">Snapshot Current Design</p>
            <div className="space-y-4">
              <div>
                <Label className="text-[#420c14]/70 text-sm mb-2 block">Label *</Label>
                <Input
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  placeholder="v1 — First Draft"
                  className="h-11 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F]"
                />
              </div>
              <div>
                <Label className="text-[#420c14]/70 text-sm mb-2 block">Notes <span className="text-[#420c14]/40 font-normal">(optional)</span></Label>
                <Textarea
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  rows={2}
                  className="rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] resize-none text-sm"
                />
              </div>
              <Button
                onClick={handleSaveVersion}
                disabled={savingVersion || !versionLabel.trim()}
                className="rounded-xl bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
              >
                {savingVersion && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Snapshot
              </Button>
            </div>
          </Card>

          {/* Version list */}
          {data.versions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm py-12 text-center">
              <Clock className="w-10 h-10 text-[#420c14]/20 mx-auto mb-3" />
              <p className="text-[#420c14]/50 text-sm">No versions saved yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.versions.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between gap-4 rounded-2xl border p-5 ${
                    v.is_active ? 'border-[#DDA46F]/30 bg-[#DDA46F]/5' : 'border-[#420c14]/10 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#420c14]">{v.label}</span>
                      {v.is_active && (
                        <span className="text-[10px] font-medium text-[#DDA46F] bg-[#DDA46F]/10 px-2 py-0.5 rounded-full border border-[#DDA46F]/20">
                          Active
                        </span>
                      )}
                    </div>
                    {v.notes && <p className="text-xs text-[#420c14]/40 mt-0.5">{v.notes}</p>}
                    <p className="text-xs text-[#420c14]/40 mt-1">
                      {format(new Date(v.created_at), 'MMM d, yyyy · HH:mm')}
                    </p>
                  </div>
                  {!v.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmRestoreId(v.id)}
                      className="rounded-lg border-[#420c14]/10 text-[#420c14] text-xs gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Meetings tab ───────────────────────────────────── */}
      {tab === 'meetings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#420c14]/60">Schedule and manage design calls with the couple.</p>
            <Button
              onClick={() =>
                setMeetingForm({
                  meeting_type: 'kickoff',
                  title: '',
                  scheduled_at: '',
                  meeting_url: '',
                  notes: '',
                  status: 'scheduled',
                })
              }
              className="rounded-xl bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Meeting
            </Button>
          </div>

          {data.meetings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm py-12 text-center">
              <Video className="w-10 h-10 text-[#420c14]/20 mx-auto mb-3" />
              <p className="text-[#420c14]/50 text-sm">No meetings scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.meetings.map((m) => (
                <div key={m.id} className="flex items-start gap-4 rounded-2xl border border-[#420c14]/10 bg-white p-5">
                  <div className="w-10 h-10 rounded-xl bg-[#DDA46F]/10 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4 text-[#DDA46F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#420c14] text-sm">{m.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        m.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        m.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-[#420c14]/5 text-[#420c14]/40 border-[#420c14]/10'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#420c14]/50 mt-0.5">
                      {meetingTypeLabels[m.meeting_type]}
                      {m.scheduled_at && <> · {format(new Date(m.scheduled_at), "MMM d, yyyy 'at' h:mm a")}</>}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap mt-1">
                      {m.meeting_url && (
                        <a
                          href={m.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#DDA46F] hover:underline"
                        >
                          <Link2 className="w-2.5 h-2.5" />
                          Meeting link
                        </a>
                      )}
                    </div>
                    {m.notes && <p className="text-xs text-[#420c14]/40 mt-1">{m.notes}</p>}
                    {m.calcom_uid && (
                      <button
                        onClick={() => {
          if (!m.calcom_uid) return
          const slugFallback = m.meeting_type === 'review' ? 'design-review' : m.meeting_type === 'final' ? 'delivery-meeting' : 'discovery-meeting'
          const slug = m.calcom_event_type_slug ?? slugFallback
          const locale = slug.endsWith('-es') ? 'es' : 'en'
          setRescheduleTarget({ uid: m.calcom_uid, calLink: `${process.env.NEXT_PUBLIC_CALCOM_USERNAME ?? 'ohmywedding'}/${slug}`, locale })
        }}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#420c14]/45 hover:text-[#420c14] hover:underline"
                      >
                        <Calendar className="w-3 h-3" />
                        Reschedule
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        setMeetingForm({
                          id: m.id,
                          meeting_type: m.meeting_type,
                          title: m.title,
                          scheduled_at: m.scheduled_at
                            ? new Date(m.scheduled_at).toISOString().slice(0, 16)
                            : '',
                          meeting_url: m.meeting_url ?? '',
                          notes: m.notes ?? '',
                          status: m.status,
                        })
                      }
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#420c14]/30 hover:text-[#420c14]/70 hover:bg-[#420c14]/5 transition-colors text-xs"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteMeeting(m.id)}
                      disabled={deletingMeetingId === m.id}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#420c14]/30 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      {deletingMeetingId === m.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        <div className="mt-6">
          <InvitationActivityLog
            logs={data?.activity_logs ?? []}
          />
        </div>
      </div>
      )}

      {/* ── Storage tab ────────────────────────────────── */}
      {tab === 'storage' && (
        <div className="space-y-4">
          {loadingStorage ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
            </div>
          ) : storageData ? (
            <>
              <Card className="p-6 border-[#420c14]/10 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-1">Data Usage</p>
                    <h3 className="font-serif text-lg text-[#420c14]">{storageData.couple}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-1">Total Rows</p>
                    <p className="text-2xl font-serif font-semibold text-[#420c14]">
                      {storageData.total_rows.toLocaleString()}
                    </p>
                  </div>
                </div>

                {storageData.breakdown.length === 0 ? (
                  <p className="text-sm text-[#420c14]/40 text-center py-8">No data found for this wedding.</p>
                ) : (
                  <div className="space-y-2">
                    {storageData.breakdown.map((row) => {
                      const pct = storageData.total_rows > 0 ? ((row.count ?? 0) / storageData.total_rows) * 100 : 0
                      return (
                        <div key={row.table}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-mono text-[#420c14]/70">{row.table}</span>
                            <span className="text-sm font-semibold text-[#420c14]">{(row.count ?? 0).toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 bg-[#420c14]/8 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#DDA46F] rounded-full transition-all"
                              style={{ width: `${Math.max(pct, 0.5)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

              <button
                onClick={() => { setStorageData(null); fetchStorage() }}
                className="text-xs text-[#420c14]/40 hover:text-[#420c14] transition-colors"
              >
                Refresh
              </button>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm py-12 text-center">
              <Database className="w-10 h-10 text-[#420c14]/20 mx-auto mb-3" />
              <p className="text-[#420c14]/50 text-sm">Failed to load storage data.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Pages tab ──────────────────────────────────── */}
      {tab === 'pages' && (
        <SubpagesTab weddingId={weddingId} />
      )}

      {/* ── AI Credits tab ─────────────────────────────── */}
      {tab === 'ai' && (
        <AICreditsTab weddingId={weddingId} />
      )}

      {/* ── Delete wedding dialog ───────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={(o) => { if (!o) { setDeleteDialogOpen(false); setDeleteConfirm("") } }}>
        <DialogContent className="max-w-md rounded-2xl border-red-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-red-700">Delete Wedding</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#420c14]/60">
            This will permanently delete <strong className="text-[#420c14]">{weddingId}</strong> and all associated data — guests, design history, meetings, and files. This cannot be undone.
          </p>
          <div className="space-y-2 py-1">
            <p className="text-xs text-[#420c14]/50">
              Type <span className="font-mono font-semibold text-[#420c14]">{weddingId}</span> to confirm:
            </p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={weddingId}
              className="w-full h-10 rounded-xl border border-red-200 bg-red-50/40 px-3 text-sm font-mono text-[#420c14] placeholder:text-[#420c14]/20 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => { setDeleteDialogOpen(false); setDeleteConfirm("") }}
              className="rounded-xl border-[#420c14]/10 text-[#420c14]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting || deleteConfirm !== weddingId}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
            >
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting…</> : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Restore confirmation dialog ──────────────────── */}
      <Dialog open={!!confirmRestoreId} onOpenChange={() => setConfirmRestoreId(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-[#420c14]/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#420c14]">Restore this version?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#420c14]/60">
            This will overwrite the current live design with the snapshot. This action cannot be undone
            unless you save the current design as a version first.
          </p>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmRestoreId(null)}
              className="rounded-xl border-[#420c14]/10 text-[#420c14]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreVersion}
              disabled={restoring}
              className="rounded-xl bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
            >
              {restoring && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Meeting form dialog ──────────────────────────── */}
      <Dialog open={!!meetingForm} onOpenChange={() => !savingMeeting && setMeetingForm(null)}>
        <DialogContent className="max-w-md rounded-2xl border-[#420c14]/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#420c14]">
              {meetingForm?.id ? 'Edit Meeting' : 'Add Meeting'}
            </DialogTitle>
          </DialogHeader>
          {meetingForm && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-[#420c14]/70 text-sm mb-2 block">Type</Label>
                <Select
                  value={meetingForm.meeting_type}
                  onValueChange={(v) => setMeetingForm((f) => f && ({ ...f, meeting_type: v }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#420c14]/10">
                    {Object.entries(meetingTypeLabels).map(([k, l]) => (
                      <SelectItem key={k} value={k} className="rounded-lg">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#420c14]/70 text-sm mb-2 block">Title *</Label>
                <Input
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm((f) => f && ({ ...f, title: e.target.value }))}
                  placeholder="Kickoff call with the couple"
                  className="h-11 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F]"
                />
              </div>
              <div>
                <Label className="text-[#420c14]/70 text-sm mb-2 block">Date & Time</Label>
                <MeetingDateTimePicker
                  value={meetingForm.scheduled_at}
                  onChange={(v) => setMeetingForm((f) => f && ({ ...f, scheduled_at: v }))}
                />
              </div>
              <div>
                <Label className="text-[#420c14]/70 text-sm mb-2 block">Meeting Link</Label>
                <Input
                  value={meetingForm.meeting_url}
                  onChange={(e) => setMeetingForm((f) => f && ({ ...f, meeting_url: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                  className="h-11 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F]"
                />
              </div>
              {meetingForm.id && (
                <div>
                  <Label className="text-[#420c14]/70 text-sm mb-2 block">Status</Label>
                  <Select
                    value={meetingForm.status}
                    onValueChange={(v) => setMeetingForm((f) => f && ({ ...f, status: v }))}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#420c14]/10">
                      <SelectItem value="scheduled" className="rounded-lg">Scheduled</SelectItem>
                      <SelectItem value="completed" className="rounded-lg">Completed</SelectItem>
                      <SelectItem value="cancelled" className="rounded-lg">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-[#420c14]/70 text-sm mb-2 block">Notes</Label>
                <Textarea
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm((f) => f && ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] resize-none text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setMeetingForm(null)}
              className="rounded-xl border-[#420c14]/10 text-[#420c14]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMeeting}
              disabled={savingMeeting || !meetingForm?.title.trim()}
              className="rounded-xl bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
            >
              {savingMeeting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {meetingForm?.id ? 'Update' : 'Add Meeting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reschedule dialog ───────────────────────── */}
      <Dialog open={!!rescheduleTarget} onOpenChange={(o) => { if (!o) setRescheduleTarget(null) }}>
        <DialogContent className="w-full max-w-4xl p-0 overflow-hidden rounded-2xl border-[#420c14]/10">
          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle className="font-serif text-xl text-[#420c14]">Reschedule Meeting</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 pt-4">
            {rescheduleTarget && (
              <CalRescheduleEmbed uid={rescheduleTarget.uid} calLink={rescheduleTarget.calLink} locale={rescheduleTarget.locale} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Subpages Tab ────────────────────────────────────────────────────────── */

interface SubPage {
  id: string
  path: string
  label: string
  showInNav: boolean
  enabled: boolean
}

function SubpagesTab({ weddingId }: { weddingId: string }) {
  const [pages, setPages] = useState<SubPage[]>([])
  const [fullConfig, setFullConfig] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ label: '', path: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/weddings/${weddingId}/config`)
        if (res.ok) {
          const data = await res.json()
          setFullConfig(data.config)
          setPages((data.config?.pages as SubPage[]) || [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [weddingId])

  const startEdit = (page: SubPage) => {
    setEditingId(page.id)
    setEditForm({ label: page.label, path: page.path })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ label: '', path: '' })
  }

  const saveEdit = async (pageId: string) => {
    if (!fullConfig) return
    const label = editForm.label.trim()
    const path = editForm.path.trim().replace(/^\/+/, '').replace(/\s+/g, '-').toLowerCase()
    if (!label || !path) return

    const updatedPages = pages.map(p =>
      p.id === pageId ? { ...p, label, path } : p
    )
    const updatedConfig = { ...fullConfig, pages: updatedPages }

    setSaving(true)
    try {
      const res = await fetch(`/api/weddings/${weddingId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updatedConfig }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to save')
        return
      }
      setPages(updatedPages)
      setFullConfig(updatedConfig)
      setEditingId(null)
      toast.success('Subpage updated')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
    </div>
  )

  if (pages.length === 0) return (
    <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm py-14 text-center">
      <p className="text-[#420c14]/40 text-sm">No subpages configured for this wedding.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {pages.map((page) => (
        <div key={page.id} className="rounded-2xl border border-[#420c14]/10 bg-white p-5">
          {editingId === page.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#420c14]/55 text-xs uppercase tracking-wider">Nav Label</Label>
                  <Input
                    value={editForm.label}
                    onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                    className="h-9 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/15 text-sm"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#420c14]/55 text-xs uppercase tracking-wider">URL Path</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#420c14]/30 text-sm select-none">/</span>
                    <Input
                      value={editForm.path}
                      onChange={e => setEditForm(f => ({ ...f, path: e.target.value }))}
                      className="pl-5 h-9 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/15 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => saveEdit(page.id)}
                  disabled={saving || !editForm.label.trim() || !editForm.path.trim()}
                  className="rounded-lg bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] text-xs h-8"
                >
                  {saving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="rounded-lg border-[#420c14]/10 text-[#420c14] text-xs h-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[#420c14] text-sm">{page.label}</span>
                  {!page.enabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#420c14]/5 text-[#420c14]/40 border border-[#420c14]/8">
                      Hidden
                    </span>
                  )}
                  {!page.showInNav && page.enabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DDA46F]/10 text-[#b8843a] border border-[#DDA46F]/20">
                      Not in nav
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#420c14]/40 font-mono mt-0.5">/{page.path}</p>
              </div>
              <button
                onClick={() => startEdit(page)}
                className="shrink-0 h-8 px-3 rounded-lg text-xs font-medium text-[#420c14]/50 hover:text-[#420c14] hover:bg-[#420c14]/6 border border-[#420c14]/10 transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── AI Credits Tab ──────────────────────────────────────────────────────── */

interface AIUsageRow {
  model: string
  prompt_tokens: number
  completion_tokens: number
  estimated_cost: number
  created_at: string
}

function AICreditsTab({ weddingId }: { weddingId: string }) {
  const [status, setStatus]           = useState<{ budgetCents: number | null; usedCents: number; remainingCents: number | null; isExhausted: boolean; usagePct: number | null } | null>(null)
  const [logs, setLogs]               = useState<AIUsageRow[]>([])
  const [loading, setLoading]         = useState(true)
  const [grantAmount, setGrantAmount] = useState('')
  const [granting, setGranting]       = useState(false)
  const [grantMsg, setGrantMsg]       = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [statusRes, logsRes] = await Promise.all([
        fetch(`/api/superadmin/weddings/${weddingId}/ai-credits`),
        fetch(`/api/superadmin/weddings/${weddingId}/ai-credits?logs=1`),
      ])
      if (statusRes.ok) setStatus(await statusRes.json())
      if (logsRes.ok) {
        const data = await logsRes.json()
        setLogs(data.logs ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [weddingId])

  const handleGrant = async () => {
    const cents = Math.round(parseFloat(grantAmount) * 100)
    if (isNaN(cents) || cents <= 0) return
    setGranting(true)
    setGrantMsg('')
    try {
      const res = await fetch(`/api/superadmin/weddings/${weddingId}/ai-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: cents }),
      })
      if (res.ok) {
        setGrantMsg(`Granted $${(cents / 100).toFixed(2)} successfully`)
        setGrantAmount('')
        await load()
      } else {
        const e = await res.json()
        setGrantMsg(e.error ?? 'Failed to grant')
      }
    } finally {
      setGranting(false)
    }
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-[#DDA46F]" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Budget overview */}
      <Card className="p-6 border-[#420c14]/10 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-4">Budget Overview</p>
        {status ? (
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-[#420c14]/50 mb-1">Budget</p>
              <p className="text-2xl font-serif text-[#420c14]">
                {status.budgetCents === null ? '∞' : fmt(status.budgetCents)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#420c14]/50 mb-1">Used</p>
              <p className="text-2xl font-serif text-[#420c14]">{fmt(status.usedCents)}</p>
            </div>
            <div>
              <p className="text-xs text-[#420c14]/50 mb-1">Remaining</p>
              <p className={`text-2xl font-serif ${status.isExhausted ? 'text-red-600' : 'text-[#420c14]'}`}>
                {status.remainingCents === null ? '∞' : fmt(status.remainingCents)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#420c14]/40">No budget set — unlimited.</p>
        )}
      </Card>

      {/* Manual grant */}
      <Card className="p-6 border-[#420c14]/10 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-4">Manual Grant</p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#420c14]/40 text-sm">$</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={grantAmount}
              onChange={e => setGrantAmount(e.target.value)}
              placeholder="5.00"
              className="pl-7 pr-3 py-2 border border-[#420c14]/15 rounded-xl text-sm w-32 focus:outline-none focus:border-[#420c14]/40"
            />
          </div>
          <button
            onClick={handleGrant}
            disabled={granting || !grantAmount}
            className="px-4 py-2 bg-[#420c14] text-[#DDA46F] text-sm font-medium rounded-xl disabled:opacity-50 hover:bg-[#5a1a22] transition-colors flex items-center gap-2"
          >
            {granting && <Loader2 className="w-3 h-3 animate-spin" />}
            Grant Credits
          </button>
          {grantMsg && (
            <p className={`text-sm ${grantMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {grantMsg}
            </p>
          )}
        </div>
      </Card>

      {/* Usage log */}
      <Card className="p-6 border-[#420c14]/10 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-4">
          Recent Usage ({logs.length} interactions)
        </p>
        {logs.length === 0 ? (
          <p className="text-sm text-[#420c14]/40 text-center py-8">No AI interactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#420c14]/8">
                  <th className="text-left text-[#420c14]/40 font-medium pb-2 pr-4">Date</th>
                  <th className="text-left text-[#420c14]/40 font-medium pb-2 pr-4">Model</th>
                  <th className="text-right text-[#420c14]/40 font-medium pb-2 pr-4">In</th>
                  <th className="text-right text-[#420c14]/40 font-medium pb-2 pr-4">Out</th>
                  <th className="text-right text-[#420c14]/40 font-medium pb-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-[#420c14]/5">
                    <td className="py-2 pr-4 text-[#420c14]/50 font-mono">
                      {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 pr-4 font-mono text-[#420c14]/70">
                      {row.model.replace('claude-', '').replace('-20251001', '')}
                    </td>
                    <td className="py-2 pr-4 text-right text-[#420c14]/60">
                      {row.prompt_tokens.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-right text-[#420c14]/60">
                      {row.completion_tokens.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-[#420c14] font-medium">
                      ${Number(row.estimated_cost).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

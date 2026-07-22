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
import { InvitationStatusTimeline } from "@/components/ui/invitation-status-timeline"
import {
  DESIGN_STATUSES,
  STATUS_LABELS,
  availableTransitions,
  type DesignStatus,
} from "@/lib/invitation-workflow"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
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
  available_transitions: DesignStatus[]
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

type Tab = 'status' | 'versions' | 'meetings' | 'storage'

interface StorageBreakdown {
  table: string
  count: number | null
}

interface StorageData {
  couple: string
  breakdown: StorageBreakdown[]
  total_rows: number
}

const MEETING_TYPE_LABELS = {
  kickoff: 'Kickoff Call',
  review: 'Design Review',
  final: 'Final Review',
  other: 'Meeting',
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

  // Meeting form
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

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/weddings/${weddingId}/design-status`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
        if (!toStatus && d.available_transitions.length > 0) {
          setToStatus(d.available_transitions[0])
        }
      }
    } finally {
      setLoading(false)
    }
  }, [weddingId, toStatus])

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

  const availableNext = availableTransitions(data.status, 'superadmin')

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
        {(['status', 'versions', 'meetings', 'storage'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-white text-[#420c14] shadow-sm'
                : 'text-[#420c14]/50 hover:text-[#420c14]'
            }`}
          >
            {t === 'versions' ? `Versions (${data.versions.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Status tab ─────────────────────────────────────── */}
      {tab === 'status' && (
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="p-6 border-[#420c14]/10 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-[#420c14]/40 mb-5">Current Status</p>
            <InvitationStatusTimeline
              currentStatus={data.status}
              history={data.history}
            />
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
                      {MEETING_TYPE_LABELS[m.meeting_type]}
                      {m.scheduled_at && <> · {format(new Date(m.scheduled_at), "MMM d, yyyy 'at' h:mm a")}</>}
                    </p>
                    {m.meeting_url && (
                      <a
                        href={m.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#DDA46F] hover:underline mt-1"
                      >
                        <Link2 className="w-2.5 h-2.5" />
                        Meeting link
                      </a>
                    )}
                    {m.notes && <p className="text-xs text-[#420c14]/40 mt-1">{m.notes}</p>}
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
                    {Object.entries(MEETING_TYPE_LABELS).map(([k, l]) => (
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
                <Input
                  type="datetime-local"
                  value={meetingForm.scheduled_at}
                  onChange={(e) => setMeetingForm((f) => f && ({ ...f, scheduled_at: e.target.value }))}
                  className="h-11 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F]"
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
    </div>
  )
}

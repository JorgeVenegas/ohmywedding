"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  Heart,
  Calendar,
  Loader2,
  ExternalLink,
  Crown,
  TrendingUp,
  MapPin,
  Trash2,
  X,
  Copy,
  SlidersHorizontal,
  Check,
} from "lucide-react"
import { DesignProgressDots } from "@/components/ui/design-progress-dots"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getWeddingUrl } from "@/lib/wedding-url"
import { cn } from "@/lib/utils"

type PlanType = 'free' | 'premium' | 'deluxe'
type DesignStatus = 'not_started' | 'discovery_meeting' | 'design_started' | 'ready_for_review' | 'review_meeting' | 'changes_in_progress' | 'approved' | 'delivery_meeting' | 'live'

interface Wedding {
  id: string
  wedding_name_id: string
  partner1_name: string
  partner2_name: string
  wedding_date: string | null
  owner_id: string
  created_at: string
  location: string | null
  design_status: DesignStatus
  guest_count: number
  plan: PlanType
  photo_storage_bytes: number
  photo_count: number
}

function fmtBytes(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

const PLAN_STRIP: Record<PlanType, string> = {
  deluxe:  'border-l-[#420c14]',
  premium: 'border-l-[#DDA46F]',
  free:    'border-l-[#420c14]/10',
}


function PlanBadge({ plan }: { plan: PlanType }) {
  if (plan === 'deluxe') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#420c14] text-[#DDA46F] text-[10px] font-semibold uppercase tracking-wider">
      <Crown className="w-2.5 h-2.5" />
      Bespoke
    </span>
  )
  if (plan === 'premium') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DDA46F]/12 text-[#b8843a] text-[10px] font-semibold uppercase tracking-wider border border-[#DDA46F]/25">
      <TrendingUp className="w-2.5 h-2.5" />
      Personalized
    </span>
  )
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#420c14]/5 text-[#420c14]/40 text-[10px] font-semibold uppercase tracking-wider">
      Basic
    </span>
  )
}


const COL_LABEL = "text-[9px] font-semibold uppercase tracking-[0.2em] text-[#420c14]/35 whitespace-nowrap"

export default function WeddingsManagementPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWedding, setSelectedWedding] = useState<Wedding | null>(null)
  const [newPlan, setNewPlan] = useState<PlanType>('free')
  const [reason, setReason] = useState("")
  const [updating, setUpdating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Wedding | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)

  // Clone as demo state
  const [cloneSource, setCloneSource] = useState<Wedding | null>(null)
  const [cloneForm, setCloneForm] = useState({ p1First: '', p1Last: '', p2First: '', p2Last: '', date: '', location: '' })
  const [cloning, setCloning] = useState(false)

  // Column visibility — couple + actions always shown
  type ColKey = 'created' | 'weddingDate' | 'location' | 'plan' | 'design' | 'guests' | 'photos'
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(
    new Set(['weddingDate', 'plan', 'guests', 'photos'] as ColKey[])
  )
  const [colsOpen, setColsOpen] = useState(false)
  const colsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!colsOpen) return
    const handler = (e: MouseEvent) => {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) setColsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [colsOpen])

  const toggleCol = (key: ColKey) =>
    setVisibleCols(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })

  const ALL_COLS: { key: ColKey; label: string }[] = [
    { key: 'created',     label: 'Created' },
    { key: 'weddingDate', label: 'Wedding Date' },
    { key: 'location',    label: 'Location' },
    { key: 'plan',        label: 'Plan' },
    { key: 'design',      label: 'Design Progress' },
    { key: 'guests',      label: 'Guests' },
    { key: 'photos',      label: 'Photos' },
  ]

  const fetchWeddings = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/superadmin/weddings/search?q=${encodeURIComponent(q)}`)
      if (!response.ok) {
        const d = await response.json()
        throw new Error(d.error || 'Failed to load weddings')
      }
      const { weddings: data } = await response.json()
      setWeddings(data || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load weddings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWeddings('') }, [fetchWeddings])

  useEffect(() => {
    const t = setTimeout(() => fetchWeddings(search), 300)
    return () => clearTimeout(t)
  }, [search, fetchWeddings])

  const stats = useMemo(() => ({
    total:        weddings.length,
    deluxe:       weddings.filter(w => w.plan === 'deluxe').length,
    premium:      weddings.filter(w => w.plan === 'premium').length,
    free:         weddings.filter(w => w.plan === 'free').length,
    totalStorage: weddings.reduce((s, w) => s + (w.photo_storage_bytes ?? 0), 0),
    totalPhotos:  weddings.reduce((s, w) => s + (w.photo_count ?? 0), 0),
  }), [weddings])

  const openChangePlan = (wedding: Wedding) => {
    setSelectedWedding(wedding)
    setNewPlan(wedding.plan)
    setReason("")
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== deleteTarget.wedding_name_id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/superadmin/weddings/${deleteTarget.wedding_name_id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      toast.success(`${deleteTarget.partner1_name} & ${deleteTarget.partner2_name} deleted`)
      setWeddings(prev => prev.filter(w => w.id !== deleteTarget.id))
      setDeleteTarget(null)
      setDeleteConfirm("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete wedding')
    } finally {
      setDeleting(false)
    }
  }

  const handleChangePlan = async () => {
    if (!selectedWedding || !reason.trim()) return toast.error('Please provide a reason')
    if (newPlan === selectedWedding.plan) return toast.error('Select a different plan')

    setUpdating(true)
    try {
      const res = await fetch('/api/superadmin/weddings/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId: selectedWedding.id, newPlan, reason: reason.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      toast.success(`Plan changed to ${newPlan}`)
      setDialogOpen(false)
      setWeddings(prev => prev.map(w => w.id === selectedWedding.id ? { ...w, plan: newPlan } : w))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change plan')
    } finally {
      setUpdating(false)
    }
  }

  const handleCloneDemo = async () => {
    if (!cloneSource || !cloneForm.p1First.trim() || !cloneForm.p2First.trim()) return
    setCloning(true)
    try {
      const res = await fetch('/api/superadmin/weddings/clone-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceWeddingId: cloneSource.id,
          partner1FirstName: cloneForm.p1First.trim(),
          partner1LastName: cloneForm.p1Last.trim() || null,
          partner2FirstName: cloneForm.p2First.trim(),
          partner2LastName: cloneForm.p2Last.trim() || null,
          weddingDate: cloneForm.date || null,
          location: cloneForm.location.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(`Demo wedding "${data.weddingNameId}" created from ${cloneSource.wedding_name_id}`)
      setCloneSource(null)
      fetchWeddings(search)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clone wedding')
    } finally {
      setCloning(false)
    }
  }

  return (
    <div className="space-y-7">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#DDA46F] mb-2">Management</p>
          <h1 className="text-4xl font-serif text-[#420c14]">Weddings</h1>
        </div>

        {/* Live stats */}
        {!loading && weddings.length > 0 && (
          <div className="flex items-end gap-6 pb-0.5">
            <div className="text-right">
              <p className="text-3xl font-serif font-medium text-[#420c14] leading-none">{stats.total}</p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#420c14]/35 mt-1">Total</p>
            </div>
            <div className="flex items-center gap-4 pb-1">
              {stats.deluxe > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#420c14]" />
                  <span className="text-xs tabular-nums text-[#420c14]/50">{stats.deluxe}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#420c14]/30">Bespoke</span>
                </div>
              )}
              {stats.premium > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#DDA46F]" />
                  <span className="text-xs tabular-nums text-[#420c14]/50">{stats.premium}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#420c14]/30">Personalized</span>
                </div>
              )}
              {stats.free > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#420c14]/15" />
                  <span className="text-xs tabular-nums text-[#420c14]/50">{stats.free}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#420c14]/30">Basic</span>
                </div>
              )}
            </div>
            {stats.totalPhotos > 0 && (
              <div className="text-right border-l border-[#420c14]/8 pl-6">
                <p className="text-sm font-semibold tabular-nums text-[#420c14]/70 leading-none">{fmtBytes(stats.totalStorage)}</p>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#420c14]/35 mt-1">{stats.totalPhotos.toLocaleString()} photos</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Table card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-[#420c14]/6 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#420c14]/25" />
            <Input
              placeholder="Filter by couple or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-8 h-8 rounded-lg border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/15 bg-[#f5f2eb]/40 text-sm placeholder:text-[#420c14]/30"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#420c14]/25 hover:text-[#420c14]/60 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Columns toggle */}
          <div className="relative ml-auto" ref={colsRef}>
            <button
              onClick={() => setColsOpen(v => !v)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#420c14]/10 bg-[#f5f2eb]/40 text-[11px] text-[#420c14]/50 hover:text-[#420c14] hover:border-[#420c14]/20 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3" />
              Columns
              <span className="text-[10px] tabular-nums text-[#420c14]/30">({visibleCols.size + 2})</span>
            </button>
            {colsOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-30 bg-white rounded-xl border border-[#420c14]/10 shadow-lg py-1.5 min-w-[160px]">
                <p className="px-3 pt-1 pb-2 text-[9px] uppercase tracking-[0.25em] text-[#420c14]/30">Toggle columns</p>
                {/* Fixed columns */}
                {[{ label: 'Couple' }, { label: 'Actions' }].map(c => (
                  <div key={c.label} className="flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-[#420c14]/30 select-none">
                    <Check className="w-3 h-3 text-[#420c14]/20" />
                    {c.label}
                    <span className="ml-auto text-[9px] text-[#420c14]/20">fixed</span>
                  </div>
                ))}
                <div className="my-1 border-t border-[#420c14]/6" />
                {ALL_COLS.map(c => (
                  <button
                    key={c.key}
                    onClick={() => toggleCol(c.key)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-[#420c14]/60 hover:bg-[#420c14]/4 transition-colors cursor-pointer"
                  >
                    <div className="w-3 h-3 rounded flex items-center justify-center shrink-0" style={{
                      background: visibleCols.has(c.key) ? '#420c14' : 'transparent',
                      border: visibleCols.has(c.key) ? '1px solid #420c14' : '1px solid rgba(66,12,20,0.2)',
                    }}>
                      {visibleCols.has(c.key) && <Check className="w-2 h-2 text-white" />}
                    </div>
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!loading && (
            <p className="text-[11px] text-[#420c14]/35 tabular-nums">
              {weddings.length} {weddings.length === 1 ? 'wedding' : 'weddings'}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-[#DDA46F]" />
          </div>
        ) : weddings.length === 0 ? (
          <div className="py-20 text-center">
            {search ? (
              <>
                <Search className="w-9 h-9 text-[#420c14]/12 mx-auto mb-3" />
                <p className="font-serif text-[#420c14]/40">No results for &ldquo;{search}&rdquo;</p>
              </>
            ) : (
              <>
                <Heart className="w-9 h-9 text-[#420c14]/12 mx-auto mb-3" />
                <p className="font-serif text-[#420c14]/40">No weddings yet</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-max w-full">
              <thead>
                <tr className="bg-[#faf8f4] border-b border-[#420c14]/6">
                  <th className="w-1 p-0" />
                  <th className="pl-4 pr-6 py-3 text-left"><span className={COL_LABEL}>Couple</span></th>
                  {visibleCols.has('created')     && <th className="px-4 py-3 text-left whitespace-nowrap"><span className={COL_LABEL}>Created</span></th>}
                  {visibleCols.has('weddingDate') && <th className="px-4 py-3 text-left whitespace-nowrap"><span className={COL_LABEL}>Wedding Date</span></th>}
                  {visibleCols.has('location')    && <th className="px-4 py-3 text-left whitespace-nowrap"><span className={COL_LABEL}>Location</span></th>}
                  {visibleCols.has('plan')        && <th className="px-4 py-3 text-left whitespace-nowrap"><span className={COL_LABEL}>Plan</span></th>}
                  {visibleCols.has('design')      && <th className="px-4 py-3 text-left whitespace-nowrap"><span className={COL_LABEL}>Design Progress</span></th>}
                  {visibleCols.has('guests')      && <th className="px-4 py-3 text-right whitespace-nowrap"><span className={COL_LABEL}>Guests</span></th>}
                  {visibleCols.has('photos')      && <th className="px-4 py-3 text-right whitespace-nowrap"><span className={COL_LABEL}>Photos</span></th>}
                  <th className="pl-4 pr-5 py-3 text-right"><span className={COL_LABEL}>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {weddings.map((wedding, i) => (
                  <tr
                    key={wedding.id}
                    onClick={() => router.push(`/superadmin/weddings/${wedding.wedding_name_id}`)}
                    className={cn(
                      "group relative transition-colors duration-100 cursor-pointer",
                      "hover:bg-[#faf7f2]",
                      i > 0 && "border-t border-[#420c14]/5"
                    )}
                  >
                    <td className="w-1 p-0">
                      <div className={cn(
                        "w-[3px] h-full min-h-[52px]",
                        wedding.plan === 'deluxe'  ? 'bg-[#420c14]' :
                        wedding.plan === 'premium' ? 'bg-[#DDA46F]' :
                                                     'bg-[#420c14]/8'
                      )} />
                    </td>

                    <td className="pl-4 pr-6 py-3.5">
                      <p className="font-serif text-[#420c14] text-[15px] leading-snug whitespace-nowrap">
                        {wedding.partner1_name}
                        <span className="mx-1.5 text-[#DDA46F] text-sm font-light">&amp;</span>
                        {wedding.partner2_name}
                      </p>
                      <span className="font-mono text-[10px] text-[#420c14]/30 bg-[#420c14]/4 px-1.5 py-px rounded mt-0.5 inline-block">
                        {wedding.wedding_name_id}
                      </span>
                    </td>

                    {visibleCols.has('created') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-[#420c14]/40 tabular-nums">
                          <Calendar className="w-3 h-3 text-[#420c14]/20 flex-shrink-0" />
                          {format(new Date(wedding.created_at), 'MMM d, yyyy')}
                        </div>
                      </td>
                    )}

                    {visibleCols.has('weddingDate') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {wedding.wedding_date ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#420c14]/60 tabular-nums">
                            <Heart className="w-3 h-3 text-[#DDA46F] flex-shrink-0" />
                            {format(new Date(wedding.wedding_date), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <span className="text-[#420c14]/18 text-sm">·</span>
                        )}
                      </td>
                    )}

                    {visibleCols.has('location') && (
                      <td className="px-4 py-3.5 max-w-[160px]">
                        {wedding.location ? (
                          <div className="flex items-start gap-1.5 text-xs text-[#420c14]/50">
                            <MapPin className="w-3 h-3 text-[#420c14]/20 flex-shrink-0 mt-px" />
                            <span className="truncate">{wedding.location}</span>
                          </div>
                        ) : (
                          <span className="text-[#420c14]/18 text-sm">·</span>
                        )}
                      </td>
                    )}

                    {visibleCols.has('plan') && (
                      <td className="px-4 py-3.5">
                        <PlanBadge plan={wedding.plan} />
                      </td>
                    )}

                    {visibleCols.has('design') && (
                      <td className="px-4 py-3.5">
                        <DesignProgressDots plan={wedding.plan} status={wedding.design_status} />
                      </td>
                    )}

                    {visibleCols.has('guests') && (
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-serif text-base font-medium text-[#420c14]/70 tabular-nums">
                          {wedding.guest_count.toLocaleString()}
                        </span>
                      </td>
                    )}

                    {visibleCols.has('photos') && (
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {wedding.photo_count > 0 ? (
                          <div>
                            <p className="text-xs font-medium tabular-nums text-[#420c14]/70">{fmtBytes(wedding.photo_storage_bytes)}</p>
                            <p className="text-[10px] tabular-nums text-[#420c14]/35">{wedding.photo_count} files</p>
                          </div>
                        ) : (
                          <span className="text-[#420c14]/20 text-xs">—</span>
                        )}
                      </td>
                    )}

                    <td className="pl-4 pr-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <Link
                          href={getWeddingUrl(wedding.wedding_name_id, '', wedding.plan)}
                          target="_blank"
                          title="View site"
                          onClick={e => e.stopPropagation()}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#420c14]/30 hover:text-[#420c14] hover:bg-[#420c14]/8 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCloneSource(wedding)
                            setCloneForm({ p1First: '', p1Last: '', p2First: '', p2Last: '', date: '', location: '' })
                          }}
                          title="Clone as demo"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#420c14]/30 hover:text-[#DDA46F] hover:bg-[#DDA46F]/10 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openChangePlan(wedding) }}
                          title="Change plan"
                          className="h-7 px-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-[#420c14]/40 hover:text-[#420c14] hover:bg-[#420c14]/8 transition-colors whitespace-nowrap"
                        >
                          Plan
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(wedding); setDeleteConfirm("") }}
                          title="Delete wedding"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#420c14]/25 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete wedding dialog ────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteConfirm("") } }}>
        <DialogContent className="max-w-md rounded-2xl border-[#420c14]/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-red-700">Delete Wedding</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-1 mt-1">
                <p className="text-[#420c14]/60 text-sm">
                  This will permanently delete{' '}
                  <strong className="text-[#420c14]">
                    {deleteTarget?.partner1_name} &amp; {deleteTarget?.partner2_name}
                  </strong>{' '}
                  and all their data — guests, design history, meetings, and files.
                  This cannot be undone.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-[#420c14]/50">
              Type <span className="font-mono font-semibold text-[#420c14]">{deleteTarget?.wedding_name_id}</span> to confirm:
            </p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={deleteTarget?.wedding_name_id}
              className="w-full h-10 rounded-xl border border-red-200 bg-red-50/40 px-3 text-sm font-mono text-[#420c14] placeholder:text-[#420c14]/20 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
            />
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => { setDeleteTarget(null); setDeleteConfirm("") }}
              className="rounded-xl border-[#420c14]/10 text-[#420c14]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting || deleteConfirm !== deleteTarget?.wedding_name_id}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
            >
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting…</> : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Clone as demo dialog ────────────────────────────────────── */}
      <Dialog open={!!cloneSource} onOpenChange={(o) => { if (!o) setCloneSource(null) }}>
        <DialogContent className="max-w-md rounded-2xl border-[#420c14]/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#420c14]">Clone as Demo</DialogTitle>
            <DialogDescription asChild>
              <div className="mt-1">
                <p className="text-[#420c14]/55 text-sm">
                  Copies the page design, FAQs, pages, and schedule from{' '}
                  <span className="font-mono text-xs bg-[#420c14]/5 px-1.5 py-0.5 rounded text-[#420c14]">
                    {cloneSource?.wedding_name_id}
                  </span>{' '}
                  into a new demo wedding with the details below.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#420c14]/55 text-xs uppercase tracking-wider">Partner 1 First Name *</Label>
                <Input
                  value={cloneForm.p1First}
                  onChange={e => setCloneForm(f => ({ ...f, p1First: e.target.value }))}
                  placeholder="Sofia"
                  className="h-10 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#420c14]/55 text-xs uppercase tracking-wider">Last Name</Label>
                <Input
                  value={cloneForm.p1Last}
                  onChange={e => setCloneForm(f => ({ ...f, p1Last: e.target.value }))}
                  placeholder="García"
                  className="h-10 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/15"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#420c14]/55 text-xs uppercase tracking-wider">Partner 2 First Name *</Label>
                <Input
                  value={cloneForm.p2First}
                  onChange={e => setCloneForm(f => ({ ...f, p2First: e.target.value }))}
                  placeholder="Andrés"
                  className="h-10 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#420c14]/55 text-xs uppercase tracking-wider">Last Name</Label>
                <Input
                  value={cloneForm.p2Last}
                  onChange={e => setCloneForm(f => ({ ...f, p2Last: e.target.value }))}
                  placeholder="López"
                  className="h-10 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/15"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#420c14]/55 text-xs uppercase tracking-wider">Wedding Date</Label>
                <Input
                  type="date"
                  value={cloneForm.date}
                  onChange={e => setCloneForm(f => ({ ...f, date: e.target.value }))}
                  className="h-10 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/15"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#420c14]/55 text-xs uppercase tracking-wider">Location</Label>
                <Input
                  value={cloneForm.location}
                  onChange={e => setCloneForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Hacienda San Miguel"
                  className="h-10 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] focus:ring-[#DDA46F]/15"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setCloneSource(null)}
              className="rounded-xl border-[#420c14]/10 text-[#420c14] hover:bg-[#420c14]/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCloneDemo}
              disabled={cloning || !cloneForm.p1First.trim() || !cloneForm.p2First.trim()}
              className="rounded-xl bg-[#DDA46F] hover:bg-[#c8904f] text-white disabled:opacity-40"
            >
              {cloning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cloning…</> : 'Create Demo Wedding'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change plan dialog ───────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-[#420c14]/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#420c14]">Change Wedding Plan</DialogTitle>
            <DialogDescription className="text-[#420c14]/55">
              {selectedWedding && (
                <>
                  <strong className="text-[#420c14]">
                    {selectedWedding.partner1_name} &amp; {selectedWedding.partner2_name}
                  </strong>
                  <br />
                  <span className="font-mono text-xs bg-[#420c14]/5 px-2 py-0.5 rounded mt-1 inline-block">
                    {selectedWedding.wedding_name_id}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[#420c14]/60 text-xs uppercase tracking-wider">Current Plan</Label>
              {selectedWedding && <PlanBadge plan={selectedWedding.plan} />}
            </div>
            <div className="space-y-2">
              <Label className="text-[#420c14]/60 text-xs uppercase tracking-wider">New Plan</Label>
              <Select value={newPlan} onValueChange={v => setNewPlan(v as PlanType)}>
                <SelectTrigger className="h-11 rounded-xl border-[#420c14]/10 focus:border-[#DDA46F]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#420c14]/10">
                  <SelectItem value="free">Basic</SelectItem>
                  <SelectItem value="premium">Personalized</SelectItem>
                  <SelectItem value="deluxe">Bespoke</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#420c14]/60 text-xs uppercase tracking-wider">Reason *</Label>
              <Textarea
                placeholder="Why are you changing this plan?"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="rounded-xl border-[#420c14]/10 focus:border-[#DDA46F] resize-none"
              />
              <p className="text-xs text-[#420c14]/35">Logged for audit purposes</p>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl border-[#420c14]/10 text-[#420c14] hover:bg-[#420c14]/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePlan}
              disabled={updating || !reason.trim() || newPlan === selectedWedding?.plan}
              className="rounded-xl bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb]"
            >
              {updating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating…</> : 'Change Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

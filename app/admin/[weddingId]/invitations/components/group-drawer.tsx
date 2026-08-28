"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { X, Plus, Minus, ChevronDown, Check, ChevronUp } from "lucide-react"
import { GuestGroup, PREDEFINED_TAGS, getTagColorClass } from "../types"

export interface GuestRowData {
  _id: string
  name: string
  phone: string
  email: string
  tags: string[]
  status: "pending" | "confirmed" | "declined"
  dietary: string
  notes: string
  existingId?: string
}

export interface GroupDrawerData {
  name: string
  notes: string
  extraPasses: number
}

interface GroupDrawerProps {
  isOpen: boolean
  editingGroup?: GuestGroup | null
  onClose: () => void
  onSave: (
    group: GroupDrawerData,
    guests: GuestRowData[],
    deletedGuestIds: string[]
  ) => Promise<void>
  isSaving?: boolean
}

let idCounter = 0
function newId() {
  return `row-${++idCounter}-${Math.random().toString(36).slice(2)}`
}
function emptyRow(): GuestRowData {
  return { _id: newId(), name: "", phone: "", email: "", tags: [], status: "pending", dietary: "", notes: "" }
}

// ─── TagCell (desktop dropdown) ───────────────────────────────────────────────

function TagCell({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [open])
  const toggle = (tag: string) =>
    onChange(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])
  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap gap-1 min-h-[28px] cursor-pointer items-center" onClick={() => setOpen(v => !v)}>
        {tags.length === 0
          ? <span className="text-[12px]" style={{ color: "#c4b8b0" }}>—</span>
          : tags.map(tag => (
            <span key={tag} className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[11px] font-medium ${getTagColorClass(tag)}`}>{tag}</span>
          ))}
      </div>
      {open && (
        <div className="absolute z-[60] left-0 top-full mt-1 rounded-xl border shadow-lg py-1"
          style={{ background: "#fff", borderColor: "rgba(0,0,0,0.09)", minWidth: 140 }}>
          {PREDEFINED_TAGS.map(tag => (
            <button key={tag} type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-black/[0.03] transition-colors"
              onClick={e => { e.stopPropagation(); toggle(tag) }}>
              <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${tags.includes(tag) ? "border-[#420c14]" : "border-stone-300"}`}
                style={tags.includes(tag) ? { background: "#420c14" } : {}}>
                {tags.includes(tag) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </span>
              <span className={`text-[12px] font-medium ${getTagColorClass(tag).split(" ")[1] ?? ""}`}>{tag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TagPills (mobile inline toggles) ────────────────────────────────────────

function TagPills({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const toggle = (tag: string) =>
    onChange(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])
  return (
    <div className="flex flex-wrap gap-2">
      {PREDEFINED_TAGS.map(tag => {
        const active = tags.includes(tag)
        return (
          <button key={tag} type="button" onClick={() => toggle(tag)}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-[14px] font-medium transition-all ${
              active ? getTagColorClass(tag) : "border-stone-200 text-stone-400 bg-white"
            }`}>
            {active && <Check className="w-3 h-3" strokeWidth={3} />}
            {tag}
          </button>
        )
      })}
    </div>
  )
}

// ─── StatusCell ───────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:   { label: "Pending",   pill: "bg-amber-50 text-amber-600 border-amber-200",     dot: "bg-amber-400" },
  confirmed: { label: "Confirmed", pill: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
  declined:  { label: "Declined",  pill: "bg-red-50 text-red-500 border-red-200",           dot: "bg-red-400" },
}

function StatusCell({ status, onChange, size = "sm" }: {
  status: "pending" | "confirmed" | "declined"
  onChange: (s: "pending" | "confirmed" | "declined") => void
  size?: "sm" | "md"
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [open])
  const cfg = STATUS_CFG[status]
  const isMd = size === "md"
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button type="button"
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap ${cfg.pill} ${isMd ? "px-3 py-1.5 text-[14px]" : "px-2 py-0.5 text-[11px]"}`}
        onClick={() => setOpen(v => !v)}>
        {cfg.label}
        <ChevronDown className={isMd ? "w-3.5 h-3.5 opacity-50" : "w-3 h-3 opacity-50"} />
      </button>
      {open && (
        <div className="absolute z-[60] right-0 top-full mt-1 rounded-xl border shadow-lg py-1"
          style={{ background: "#fff", borderColor: "rgba(0,0,0,0.09)", minWidth: 148 }}>
          {(["pending", "confirmed", "declined"] as const).map(s => (
            <button key={s} type="button"
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-black/[0.03] transition-colors"
              onClick={() => { onChange(s); setOpen(false) }}>
              <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_CFG[s].dot}`} />
              <span className="text-[14px] text-stone-700">{STATUS_CFG[s].label}</span>
              {s === status && <Check className="w-3.5 h-3.5 ml-auto text-stone-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── GuestCard (mobile) ───────────────────────────────────────────────────────

function GuestCard({ row, idx, onChange, onRemove }: {
  row: GuestRowData
  idx: number
  onChange: (field: keyof GuestRowData, value: unknown) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="mb-3 rounded-2xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

      {/* Name + delete */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold"
          style={{ background: "rgba(66,12,20,0.07)", color: "rgba(66,12,20,0.45)" }}>{idx + 1}</span>
        <input type="text" value={row.name} onChange={e => onChange("name", e.target.value)}
          placeholder="Full name *"
          className="flex-1 min-w-0 bg-transparent outline-none font-semibold placeholder:text-stone-300"
          style={{ fontSize: 17, color: "#1c1917" }} />
        <button type="button" onClick={onRemove} tabIndex={-1}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full active:bg-red-50">
          <X className="w-4 h-4" style={{ color: "#c4b8b0" }} />
        </button>
      </div>

      {/* Phone + Status */}
      <div className="flex items-center gap-3 px-4 pb-3"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <input type="tel" value={row.phone} onChange={e => onChange("phone", e.target.value)}
          placeholder="Phone number"
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-stone-300"
          style={{ fontSize: 15, color: "#78716c" }} />
        <StatusCell status={row.status} onChange={s => onChange("status", s)} size="md" />
      </div>

      {/* Tags */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(66,12,20,0.4)" }}>Tags</p>
        <TagPills tags={row.tags} onChange={t => onChange("tags", t)} />
      </div>

      {/* Dietary + notes expandable */}
      <button type="button" onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-black/[0.02]"
        style={{ color: "#a8a29e" }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          {expanded ? "Hide details" : "Dietary & notes"}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <div className="pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(66,12,20,0.4)" }}>
              Dietary restrictions
            </p>
            <input type="text" value={row.dietary} onChange={e => onChange("dietary", e.target.value)}
              placeholder="e.g. vegetarian, gluten-free"
              className="w-full bg-transparent outline-none placeholder:text-stone-300"
              style={{ fontSize: 15, color: "#1c1917" }} />
          </div>
          <div className="pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(66,12,20,0.4)" }}>
              Notes
            </p>
            <input type="text" value={row.notes} onChange={e => onChange("notes", e.target.value)}
              placeholder="Any notes…"
              className="w-full bg-transparent outline-none placeholder:text-stone-300"
              style={{ fontSize: 15, color: "#1c1917" }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── GroupDrawer ──────────────────────────────────────────────────────────────

export function GroupDrawer({ isOpen, editingGroup, onClose, onSave, isSaving = false }: GroupDrawerProps) {
  const [groupName, setGroupName] = useState("")
  const [groupNotes, setGroupNotes] = useState("")
  const [extraPasses, setExtraPasses] = useState(0)
  const [rows, setRows] = useState<GuestRowData[]>([emptyRow()])
  const [deletedGuestIds, setDeletedGuestIds] = useState<string[]>([])
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    if (editingGroup) {
      setGroupName(editingGroup.name || "")
      setGroupNotes(editingGroup.notes || "")
      setExtraPasses(editingGroup.extra_passes || 0)
      const existing: GuestRowData[] = editingGroup.guests?.map(g => ({
        _id: newId(), existingId: g.id, name: g.name,
        phone: g.phone_number || "", email: g.email || "",
        tags: g.tags || [], status: g.confirmation_status,
        dietary: g.dietary_restrictions || "", notes: g.notes || "",
      })) ?? []
      setRows(existing.length > 0 ? [...existing, emptyRow()] : [emptyRow()])
      setDeletedGuestIds([])
    } else {
      setGroupName(""); setGroupNotes(""); setExtraPasses(0)
      setRows([emptyRow()]); setDeletedGuestIds([])
    }
  }, [isOpen, editingGroup])

  const updateRow = useCallback((id: string, field: keyof GuestRowData, value: unknown) => {
    setRows(prev => {
      const updated = prev.map(r => r._id === id ? { ...r, [field]: value } : r)
      if (field === "name") {
        const last = updated[updated.length - 1]
        if (last.name.trim() !== "") return [...updated, emptyRow()]
      }
      return updated
    })
  }, [])

  const addRow = useCallback(() => {
    setRows(prev => prev[prev.length - 1].name.trim() ? [...prev, emptyRow()] : prev)
  }, [])

  const removeRow = useCallback((row: GuestRowData) => {
    if (row.existingId) setDeletedGuestIds(prev => [...prev, row.existingId!])
    setRows(prev => { const n = prev.filter(r => r._id !== row._id); return n.length ? n : [emptyRow()] })
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowId: string, isLastCol: boolean) => {
    if (e.key === "Enter") { e.preventDefault(); if (rows[rows.length - 1]._id === rowId) addRow() }
    if (e.key === "Tab" && isLastCol && rows[rows.length - 1]._id === rowId) { e.preventDefault(); addRow() }
  }, [rows, addRow])

  const namedCount = rows.filter(r => r.name.trim()).length

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(1px)", opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
        onClick={onClose} />

      {/* Panel: full-width on mobile, max 1000px on desktop — always slides from right */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          width: "min(1000px, 100vw)",
          background: "#faf9f7",
          boxShadow: "-8px 0 60px rgba(0,0,0,0.14)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >

        {/* ── Mobile top bar (close + title) ── */}
        <div className="md:hidden flex items-center justify-between px-4 pt-4 pb-0 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-black/[0.05]">
            <X className="w-5 h-5" style={{ color: "#78716c" }} />
          </button>
          <span className="text-[16px] font-serif" style={{ color: "#420c14" }}>
            {editingGroup ? "Edit Group" : "New Group"}
          </span>
          <div className="w-9" />
        </div>

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 md:px-8 pb-4 pt-3 md:pt-6"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>

          {/* Desktop: name + extras + close in one row */}
          <div className="hidden md:flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. Johnson Family" autoFocus
                className="w-full bg-transparent outline-none font-semibold placeholder:text-stone-300"
                style={{ fontSize: 20, color: "#1c1917" }} />
              <input type="text" value={groupNotes} onChange={e => setGroupNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full bg-transparent outline-none mt-1 placeholder:text-stone-300"
                style={{ fontSize: 13, color: "#78716c" }} />
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(66,12,20,0.4)" }}>Extra passes</span>
                <div className="flex items-center gap-1.5 rounded-lg px-2 py-1"
                  style={{ background: "rgba(66,12,20,0.04)", border: "1px solid rgba(66,12,20,0.09)" }}>
                  <button type="button" className="w-6 h-6 flex items-center justify-center rounded transition-colors"
                    style={{}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(66,12,20,0.08)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=""}
                    onClick={() => setExtraPasses(p => Math.max(0, p - 1))}>
                    <Minus className="w-3.5 h-3.5" style={{ color: "rgba(66,12,20,0.5)" }} />
                  </button>
                  <span className="w-6 text-center font-semibold text-[15px]" style={{ color: "#420c14" }}>{extraPasses}</span>
                  <button type="button" className="w-6 h-6 flex items-center justify-center rounded transition-colors"
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(66,12,20,0.08)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=""}
                    onClick={() => setExtraPasses(p => p + 1)}>
                    <Plus className="w-3.5 h-3.5" style={{ color: "rgba(66,12,20,0.5)" }} />
                  </button>
                </div>
              </div>
              <button type="button" onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/[0.06]">
                <X className="w-4 h-4" style={{ color: "#78716c" }} />
              </button>
            </div>
          </div>

          {/* Mobile: name full-width, extras inline below */}
          <div className="md:hidden space-y-2">
            <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
              placeholder="Group name *"
              className="w-full bg-transparent outline-none font-semibold placeholder:text-stone-300"
              style={{ fontSize: 22, color: "#1c1917" }} />
            <input type="text" value={groupNotes} onChange={e => setGroupNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full bg-transparent outline-none placeholder:text-stone-300"
              style={{ fontSize: 15, color: "#78716c" }} />
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[13px]" style={{ color: "rgba(66,12,20,0.45)" }}>Extra passes</span>
              <div className="flex items-center gap-2 rounded-xl px-3 py-1.5"
                style={{ background: "rgba(66,12,20,0.04)", border: "1px solid rgba(66,12,20,0.09)" }}>
                <button type="button" className="w-6 h-6 flex items-center justify-center"
                  onClick={() => setExtraPasses(p => Math.max(0, p - 1))}>
                  <Minus className="w-4 h-4" style={{ color: "rgba(66,12,20,0.5)" }} />
                </button>
                <span className="w-6 text-center font-bold text-[16px]" style={{ color: "#420c14" }}>{extraPasses}</span>
                <button type="button" className="w-6 h-6 flex items-center justify-center"
                  onClick={() => setExtraPasses(p => p + 1)}>
                  <Plus className="w-4 h-4" style={{ color: "rgba(66,12,20,0.5)" }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">

          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 36 }} /><col style={{ width: "22%" }} /><col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} /><col style={{ width: "14%" }} /><col style={{ width: "13%" }} />
                <col style={{ width: "15%" }} /><col style={{ width: 36 }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                  {["#", "Name", "Phone", "Tags", "Status", "Dietary", "Notes", ""].map((h, i) => (
                    <th key={i} className="text-left px-3 py-2.5"
                      style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: "rgba(66,12,20,0.38)", textTransform: "uppercase" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row._id}
                    onMouseEnter={() => setHoveredRow(row._id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ borderBottom: "1px solid rgba(66,12,20,0.05)", background: hoveredRow === row._id ? "rgba(66,12,20,0.018)" : "transparent" }}>
                    <td className="px-3 py-2 text-right" style={{ fontSize: 11, color: "rgba(66,12,20,0.25)", userSelect: "none" }}>{idx + 1}</td>
                    <td className="px-2 py-1.5">
                      <input type="text" value={row.name} onChange={e => updateRow(row._id, "name", e.target.value)}
                        onKeyDown={e => handleKeyDown(e, row._id, false)} placeholder="Full name"
                        className="w-full bg-transparent outline-none text-sm placeholder:text-stone-300" style={{ color: "#1c1917" }} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="tel" value={row.phone} onChange={e => updateRow(row._id, "phone", e.target.value)}
                        onKeyDown={e => handleKeyDown(e, row._id, false)} placeholder="Phone"
                        className="w-full bg-transparent outline-none text-sm placeholder:text-stone-300" style={{ color: "#1c1917" }} />
                    </td>
                    <td className="px-2 py-1.5">
                      <TagCell tags={row.tags} onChange={t => updateRow(row._id, "tags", t)} />
                    </td>
                    <td className="px-2 py-1.5">
                      <StatusCell status={row.status} onChange={s => updateRow(row._id, "status", s)} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" value={row.dietary} onChange={e => updateRow(row._id, "dietary", e.target.value)}
                        onKeyDown={e => handleKeyDown(e, row._id, false)} placeholder="—"
                        className="w-full bg-transparent outline-none text-sm placeholder:text-stone-300" style={{ color: "#1c1917" }} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" value={row.notes} onChange={e => updateRow(row._id, "notes", e.target.value)}
                        onKeyDown={e => handleKeyDown(e, row._id, true)} placeholder="—"
                        className="w-full bg-transparent outline-none text-sm placeholder:text-stone-300" style={{ color: "#1c1917" }} />
                    </td>
                    <td className="px-1 py-1.5">
                      <button type="button" onClick={() => removeRow(row)} tabIndex={-1}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-all"
                        style={{ opacity: hoveredRow === row._id ? 1 : 0, pointerEvents: hoveredRow === row._id ? "auto" : "none" }}>
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3">
              <button type="button" onClick={addRow}
                className="flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: "rgba(66,12,20,0.45)" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#420c14"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="rgba(66,12,20,0.45)"}>
                <Plus className="w-4 h-4" /> Add guest
              </button>
            </div>
            <p className="px-6 pb-4" style={{ fontSize: 11, color: "rgba(66,12,20,0.3)" }}>
              Enter or Tab on the last column to add a new row
            </p>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden px-4 pt-4 pb-2">
            {rows.map((row, idx) => (
              <GuestCard key={row._id} row={row} idx={idx}
                onChange={(field, value) => updateRow(row._id, field, value)}
                onRemove={() => removeRow(row)} />
            ))}
            <button type="button" onClick={addRow}
              className="flex items-center gap-2 w-full justify-center py-4 rounded-2xl font-medium transition-colors active:bg-[#420c14]/[0.03]"
              style={{ fontSize: 15, border: "1.5px dashed rgba(66,12,20,0.15)", color: "rgba(66,12,20,0.5)" }}>
              <Plus className="w-5 h-5" /> Add guest
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 md:px-8"
          style={{
            borderTop: "1px solid rgba(0,0,0,0.07)",
            background: "#faf9f7",
            paddingTop: 16,
            paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
          }}>
          <button type="button" onClick={onClose} disabled={isSaving}
            className="px-5 py-3.5 rounded-2xl font-medium border transition-colors active:bg-black/[0.04]"
            style={{ fontSize: 15, borderColor: "rgba(0,0,0,0.12)", color: "#78716c" }}>
            Cancel
          </button>
          <button type="button" onClick={() => onSave({ name: groupName, notes: groupNotes, extraPasses }, rows.filter(r => r.name.trim()), deletedGuestIds)}
            disabled={!groupName.trim() || isSaving}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ fontSize: 15, background: "#420c14" }}>
            {isSaving ? "Saving…" : editingGroup ? "Save changes"
              : namedCount > 0 ? `Create group · ${namedCount} ${namedCount === 1 ? "guest" : "guests"}`
              : "Create group"}
          </button>
        </div>
      </div>
    </>
  )
}

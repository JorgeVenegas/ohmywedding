"use client"

import { useState, useEffect, useRef } from "react"
import { Switch } from "@/components/ui/switch"
import { X, Plus, Check, ChevronDown, ChevronUp } from "lucide-react"
import { GuestGroup, PREDEFINED_TAGS, getTagColorClass } from "../types"
import type { PartnerOption } from "../types"
import { useTranslation } from "@/components/contexts/i18n-context"

interface GuestForm {
  name: string
  phoneNumber: string
  tags: string[]
  confirmationStatus: "pending" | "confirmed" | "declined"
  dietaryRestrictions: string
  notes: string
  invitedBy: string[]
  isTraveling: boolean
  travelingFrom: string
  travelArrangement: "will_buy_ticket" | "no_ticket_needed" | null
  noTicketReason: string
  ticketAttachmentUrl: string | null
}

interface EditingGuest { id: string }

interface AddEditGuestModalProps {
  isOpen: boolean
  editingGuest: EditingGuest | null
  guestForm: GuestForm
  setGuestForm: React.Dispatch<React.SetStateAction<GuestForm>>
  guestGroups: GuestGroup[]
  selectedGroupId: string | null
  setSelectedGroupId: (id: string | null) => void
  isCreatingNewGroup: boolean
  setIsCreatingNewGroup: (value: boolean) => void
  newGroupNameForGuest: string
  setNewGroupNameForGuest: (value: string) => void
  partnerOptions: PartnerOption[]
  allTags?: string[]
  onClose: () => void
  onSubmit: () => void
  onSaveAndAddAnother?: () => void
  toggleGuestTag: (tag: string) => void
  isSubmitting?: boolean
}

const STATUS_CFG = {
  pending:   { label: "Pending",   pill: "bg-amber-50 text-amber-600 border-amber-200",      dot: "bg-amber-400" },
  confirmed: { label: "Confirmed", pill: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
  declined:  { label: "Declined",  pill: "bg-red-50 text-red-500 border-red-200",            dot: "bg-red-400" },
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#a8a29e" }}>
        {label}
      </p>
      {children}
    </div>
  )
}

// ─── BareInput ────────────────────────────────────────────────────────────────

function BareInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-transparent outline-none placeholder:text-stone-300 border-b pb-1.5"
      style={{ fontSize: 16, color: "#1c1917", borderColor: "rgba(0,0,0,0.1)", ...props.style }}
    />
  )
}

// ─── AddEditGuestModal ────────────────────────────────────────────────────────

export function AddEditGuestModal({
  isOpen,
  editingGuest,
  guestForm,
  setGuestForm,
  guestGroups,
  selectedGroupId,
  setSelectedGroupId,
  isCreatingNewGroup,
  setIsCreatingNewGroup,
  newGroupNameForGuest,
  setNewGroupNameForGuest,
  partnerOptions,
  allTags = [],
  onClose,
  onSubmit,
  onSaveAndAddAnother,
  toggleGuestTag,
  isSubmitting = false,
}: AddEditGuestModalProps) {
  const { t } = useTranslation()
  const [customTagInput, setCustomTagInput] = useState("")
  const [travelExpanded, setTravelExpanded] = useState(guestForm.isTraveling)

  // Snapshot of form state at the moment the drawer opens — used to detect changes
  const initialSnapshot = useRef<string>("")
  useEffect(() => {
    if (isOpen) {
      initialSnapshot.current = JSON.stringify({ guestForm, selectedGroupId, newGroupNameForGuest })
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentSnapshot = JSON.stringify({ guestForm, selectedGroupId, newGroupNameForGuest })
  const hasChanges = currentSnapshot !== initialSnapshot.current

  // In create mode always allow save (as long as name filled); in edit mode only when something changed
  const saveEnabled = !!guestForm.name && !isSubmitting && (!editingGuest || hasChanges)

  const customTags = allTags.filter(t => !PREDEFINED_TAGS.includes(t))
  const displayTags = [...PREDEFINED_TAGS, ...customTags]

  const handleAddCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase()
    if (!tag || guestForm.tags.includes(tag)) { setCustomTagInput(""); return }
    toggleGuestTag(tag)
    setCustomTagInput("")
  }

  const status = guestForm.confirmationStatus

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(1px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          width: "min(560px, 100vw)",
          background: "#faf9f7",
          boxShadow: "-8px 0 60px rgba(0,0,0,0.14)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Top bar (mobile) */}
        <div className="md:hidden flex items-center justify-between px-4 pt-4 pb-0 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-black/[0.05]">
            <X className="w-5 h-5" style={{ color: "#78716c" }} />
          </button>
          <span className="text-[15px] font-semibold" style={{ color: "#1c1917" }}>
            {editingGuest ? t("admin.invitations.guestModal.editTitle") : t("admin.invitations.guestModal.addTitle")}
          </span>
          <div className="w-9" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 px-5 md:px-7 pb-4 pt-3 md:pt-7 border-b" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
          {/* Desktop title + close */}
          <div className="hidden md:flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-semibold" style={{ color: "#1c1917" }}>
              {editingGuest ? t("admin.invitations.guestModal.editTitle") : t("admin.invitations.guestModal.addTitle")}
            </h2>
            <button type="button" onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/[0.06]">
              <X className="w-4 h-4" style={{ color: "#78716c" }} />
            </button>
          </div>

          {/* Name — big inline input */}
          <input
            type="text"
            value={guestForm.name}
            onChange={e => setGuestForm({ ...guestForm, name: e.target.value })}
            placeholder={t("admin.invitations.guestModal.fullNamePlaceholder")}
            className="w-full bg-transparent outline-none font-semibold placeholder:text-stone-300"
            style={{ fontSize: 22, color: "#1c1917" }}
            autoFocus={!editingGuest}
          />
          <input
            type="tel"
            value={guestForm.phoneNumber}
            onChange={e => setGuestForm({ ...guestForm, phoneNumber: e.target.value })}
            placeholder={t("admin.invitations.guestModal.phonePlaceholder")}
            className="w-full bg-transparent outline-none mt-1 placeholder:text-stone-300"
            style={{ fontSize: 15, color: "#78716c" }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-5 space-y-6">

          {/* Group */}
          <Field label={t("admin.invitations.guestModal.group")}>
            {!isCreatingNewGroup ? (
              <div className="space-y-1.5">
                <select
                  value={selectedGroupId || ""}
                  onChange={e => setSelectedGroupId(e.target.value || null)}
                  className="w-full rounded-xl border px-3 py-2.5 text-[15px]"
                  style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1c1917" }}
                >
                  <option value="">{t("admin.invitations.guestModal.selectGroup")}</option>
                  {guestGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button type="button"
                  className="text-[13px] flex items-center gap-1 font-medium"
                  style={{ color: "#a8a29e" }}
                  onClick={() => { setIsCreatingNewGroup(true); setSelectedGroupId(null) }}>
                  <Plus className="w-3.5 h-3.5" />
                  {t("admin.invitations.guestModal.createNewGroup")}
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <BareInput
                  value={newGroupNameForGuest}
                  onChange={e => setNewGroupNameForGuest(e.target.value)}
                  placeholder={t("admin.invitations.guestModal.newGroupPlaceholder")}
                  autoFocus
                />
                <button type="button"
                  className="text-[13px] flex items-center gap-1"
                  style={{ color: "#a8a29e" }}
                  onClick={() => { setIsCreatingNewGroup(false); setNewGroupNameForGuest("") }}>
                  <X className="w-3 h-3" />
                  {t("admin.invitations.guestModal.selectExisting")}
                </button>
              </div>
            )}
          </Field>

          {/* Status */}
          <Field label={t("admin.invitations.guestModal.confirmationStatus")}>
            <div className="flex gap-2 flex-wrap">
              {(["pending", "confirmed", "declined"] as const).map(s => {
                const cfg = STATUS_CFG[s]
                const active = status === s
                return (
                  <button key={s} type="button"
                    onClick={() => setGuestForm({ ...guestForm, confirmationStatus: s })}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[14px] font-medium transition-all ${
                      active ? cfg.pill : "border-stone-200 text-stone-400 bg-white"
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                    {active && <Check className="w-3.5 h-3.5 ml-0.5" strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Tags */}
          <Field label={t("admin.invitations.guestModal.tags")}>
            <div className="flex flex-wrap gap-2 mb-2">
              {displayTags.map(tag => {
                const active = guestForm.tags.includes(tag)
                return (
                  <button key={tag} type="button" onClick={() => toggleGuestTag(tag)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-all ${
                      active ? getTagColorClass(tag) : "border-stone-200 text-stone-400 bg-white"
                    }`}>
                    {active && <Check className="w-3 h-3" strokeWidth={3} />}
                    {tag}
                  </button>
                )
              })}
            </div>
            {/* Custom tag */}
            <div className="flex gap-2">
              <input
                value={customTagInput}
                onChange={e => setCustomTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomTag() } }}
                placeholder={t("admin.invitations.guestModal.addCustomTag")}
                className="flex-1 min-w-0 rounded-xl border px-3 py-2 text-[14px] outline-none"
                style={{ borderColor: "rgba(0,0,0,0.12)", color: "#1c1917" }}
              />
              <button type="button" onClick={handleAddCustomTag} disabled={!customTagInput.trim()}
                className="px-3 py-2 rounded-xl border text-[13px] font-medium disabled:opacity-30 transition-colors"
                style={{ borderColor: "rgba(0,0,0,0.12)", color: "#78716c" }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </Field>

          {/* Invited by */}
          {partnerOptions.length > 0 && (
            <Field label={t("admin.invitations.guestModal.invitedBy")}>
              <div className="flex flex-wrap gap-2">
                {partnerOptions.map(p => {
                  const active = guestForm.invitedBy.includes(p.key)
                  return (
                    <button key={p.key} type="button"
                      onClick={() => setGuestForm(prev => ({
                        ...prev,
                        invitedBy: active ? prev.invitedBy.filter(k => k !== p.key) : [...prev.invitedBy, p.key],
                      }))}
                      className={`px-4 py-2 rounded-xl border text-[14px] font-medium transition-all ${
                        active ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "border-stone-200 text-stone-400 bg-white"
                      }`}>
                      {active && <Check className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={3} />}
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </Field>
          )}

          {/* Dietary */}
          <Field label={t("admin.invitations.guestModal.dietaryRestrictions")}>
            <BareInput
              value={guestForm.dietaryRestrictions}
              onChange={e => setGuestForm({ ...guestForm, dietaryRestrictions: e.target.value })}
              placeholder={t("admin.invitations.guestModal.dietaryPlaceholder")}
            />
          </Field>

          {/* Notes */}
          <Field label={t("admin.invitations.guestModal.notes")}>
            <BareInput
              value={guestForm.notes}
              onChange={e => setGuestForm({ ...guestForm, notes: e.target.value })}
              placeholder={t("admin.invitations.guestModal.notesPlaceholder")}
            />
          </Field>

          {/* Travel — collapsible */}
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} className="pt-4">
            <button type="button"
              className="w-full flex items-center justify-between"
              onClick={() => setTravelExpanded(v => !v)}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#a8a29e" }}>
                {t("admin.invitations.guestModal.travelInformation")}
              </p>
              {travelExpanded ? <ChevronUp className="w-4 h-4" style={{ color: "#a8a29e" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#a8a29e" }} />}
            </button>

            {travelExpanded && (
              <div className="mt-4 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium" style={{ color: "#1c1917" }}>
                    {t("admin.invitations.guestModal.guestIsTraveling")}
                  </span>
                  <Switch
                    checked={guestForm.isTraveling}
                    onCheckedChange={checked => setGuestForm({ ...guestForm, isTraveling: checked })}
                  />
                </div>

                {guestForm.isTraveling && (
                  <>
                    <Field label={t("admin.invitations.travel.travelingFrom")}>
                      <BareInput
                        value={guestForm.travelingFrom}
                        onChange={e => setGuestForm({ ...guestForm, travelingFrom: e.target.value })}
                        placeholder={t("admin.invitations.travel.cityOrLocation")}
                      />
                    </Field>

                    <Field label={t("admin.invitations.travel.travelArrangement")}>
                      <div className="space-y-2">
                        {(["will_buy_ticket", "no_ticket_needed"] as const).map(opt => {
                          const active = guestForm.travelArrangement === opt
                          return (
                            <button key={opt} type="button"
                              onClick={() => setGuestForm({ ...guestForm, travelArrangement: opt })}
                              className={`w-full px-4 py-3 rounded-xl border-2 text-[14px] text-left transition-all ${
                                active
                                  ? opt === "will_buy_ticket"
                                    ? "border-blue-400 bg-blue-50 text-blue-700"
                                    : "border-purple-400 bg-purple-50 text-purple-700"
                                  : "border-stone-200 text-stone-500"
                              }`}>
                              {opt === "will_buy_ticket"
                                ? t("admin.invitations.travel.willPurchaseTicket")
                                : t("admin.invitations.travel.noTicketNeeded")}
                            </button>
                          )
                        })}
                      </div>
                    </Field>

                    {guestForm.travelArrangement === "no_ticket_needed" && (
                      <Field label={t("admin.invitations.travel.noTicketReason")}>
                        <BareInput
                          value={guestForm.noTicketReason}
                          onChange={e => setGuestForm({ ...guestForm, noTicketReason: e.target.value })}
                          placeholder={t("admin.invitations.travel.reasonPlaceholder")}
                        />
                      </Field>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 md:px-7"
          style={{
            borderTop: "1px solid rgba(0,0,0,0.07)",
            background: "#faf9f7",
            paddingTop: 16,
            paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
          }}>
          <button type="button" onClick={onClose} disabled={isSubmitting}
            className="px-5 py-3.5 rounded-2xl font-medium border transition-colors active:bg-black/[0.04]"
            style={{ fontSize: 15, borderColor: "rgba(0,0,0,0.12)", color: "#78716c" }}>
            {t("common.cancel")}
          </button>
          {!editingGuest && onSaveAndAddAnother && (
            <button type="button" onClick={onSaveAndAddAnother}
              disabled={!saveEnabled}
              className="py-3.5 px-4 rounded-2xl font-medium border transition-opacity disabled:opacity-40"
              style={{ fontSize: 15, borderColor: "rgba(0,0,0,0.12)", color: "#78716c" }}>
              {isSubmitting ? t("common.saving") : "+ otro"}
            </button>
          )}
          <button type="button" onClick={onSubmit}
            disabled={!saveEnabled}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ fontSize: 15, background: "#420c14" }}>
            {isSubmitting ? t("common.saving")
              : editingGuest ? t("admin.invitations.guestModal.updateGuest")
              : t("admin.invitations.guestModal.addGuest")}
          </button>
        </div>
      </div>
    </>
  )
}

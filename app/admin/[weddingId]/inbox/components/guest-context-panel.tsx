"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es as esLocale } from "date-fns/locale"
import { Check, X, Search, ExternalLink, UtensilsCrossed, Armchair, Salad, Plane, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { useTranslation } from "@/components/contexts/i18n-context"
import type { ConversationDetail } from "../types"

interface GuestSearchResult {
  id: string
  name: string
  phone_number: string | null
  confirmation_status: "pending" | "confirmed" | "declined"
}

interface GuestContextPanelProps {
  weddingId: string
  contactId: string | null
  detail: ConversationDetail | null
  onLinked: () => void
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
}

// Dish category -> accent dot color. Menus/dishes have no stored "color" field
// in the schema, so this derives a consistent, at-a-glance color code from the
// category enum instead (appetizer/soup/salad/main/dessert/drink/other).
const CATEGORY_DOT: Record<string, string> = {
  appetizer: "bg-amber-400",
  soup: "bg-orange-400",
  salad: "bg-emerald-400",
  main: "bg-rose-400",
  dessert: "bg-fuchsia-400",
  drink: "bg-sky-400",
  other: "bg-stone-400",
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase()
}

function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation()
  const label = t(`admin.inbox.guestPanel.status.${status}`) || status
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
      {label}
    </span>
  )
}

function LinkContactPanel({ weddingId, contactId, onLinked }: { weddingId: string; contactId: string; onLinked: () => void }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [guests, setGuests] = useState<GuestSearchResult[]>([])
  const [linking, setLinking] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/guests?weddingId=${encodeURIComponent(weddingId)}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setGuests(data.data ?? []))
      .catch(() => setGuests([]))
  }, [weddingId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return guests.slice(0, 8)
    return guests.filter((g) => g.name.toLowerCase().includes(q) || g.phone_number?.includes(q)).slice(0, 8)
  }, [guests, query])

  const handleLink = async (guestId: string) => {
    setLinking(guestId)
    try {
      const res = await fetch(`/api/messaging/contacts/${contactId}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId }),
      })
      if (res.ok) onLinked()
    } finally {
      setLinking(null)
    }
  }

  return (
    <div className="p-4">
      <div className="rounded-lg border border-dashed border-border p-3 text-center">
        <p className="text-sm font-medium text-foreground">{t('admin.inbox.guestPanel.notLinked.title')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('admin.inbox.guestPanel.notLinked.description')}</p>
      </div>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('admin.inbox.guestPanel.searchPlaceholder')}
          className="w-full rounded-full border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="mt-2 space-y-1">
        {filtered.map((guest) => (
          <button
            key={guest.id}
            onClick={() => handleLink(guest.id)}
            disabled={linking === guest.id}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60 disabled:opacity-50"
          >
            <span className="font-medium text-foreground">{guest.name}</span>
            <StatusPill status={guest.confirmation_status} />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">{t('admin.inbox.guestPanel.noMatchingGuests')}</p>
        )}
      </div>
    </div>
  )
}

export function GuestContextPanel({ weddingId, contactId, detail, onLinked }: GuestContextPanelProps) {
  const { t, locale } = useTranslation()
  const [updating, setUpdating] = useState(false)

  if (!contactId) {
    return (
      <div className="flex h-full items-center justify-center border-l border-border bg-muted/10 p-6 text-center text-sm text-muted-foreground">
        {t('admin.inbox.guestPanel.selectConversation')}
      </div>
    )
  }

  if (!detail || !detail.conversation.contacts?.guest_id) {
    return (
      <div className="h-full overflow-y-auto border-l border-border bg-muted/10">
        <LinkContactPanel weddingId={weddingId} contactId={contactId} onLinked={onLinked} />
      </div>
    )
  }

  const { guest, group, groupMembers, dishAssignment, menuAssignment, menuCourses, seatAssignment, rsvpRespondedAt } = detail
  if (!guest) return null

  const dateLocale = locale === "es" ? esLocale : undefined
  const respondedAtLabel = rsvpRespondedAt ? format(new Date(rsvpRespondedAt), "PPp", { locale: dateLocale }) : null

  const updateRsvp = async (status: "confirmed" | "declined") => {
    setUpdating(true)
    try {
      const res = await fetch("/api/guests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Passing name/tags through explicitly: the existing PUT /api/guests route
        // defaults omitted `tags` to [] (wipes them), not "leave unchanged" — so a
        // partial { id, confirmationStatus } body would silently clear this guest's
        // tags. Sending back what we already loaded avoids that.
        body: JSON.stringify({
          id: guest.id,
          name: guest.name,
          tags: guest.tags,
          confirmationStatus: status,
        }),
      })
      if (res.ok) onLinked()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto border-l border-border bg-muted/10">
      {/* Profile header */}
      <div className="border-b border-border bg-gradient-to-br from-primary/10 via-transparent to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary ring-2 ring-primary/25">
            {initials(guest.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-lg font-semibold leading-tight text-foreground">{guest.name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <StatusPill status={guest.confirmation_status} />
              {guest.confirmation_status !== "pending" && respondedAtLabel && (
                <span className="text-[11px] text-muted-foreground">
                  {t('admin.inbox.guestPanel.respondedAt', { date: respondedAtLabel })}
                </span>
              )}
            </div>
          </div>
        </div>
        {guest.confirmation_status === "pending" && (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={updating}
              onClick={() => updateRsvp("confirmed")}
              className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Check className="mr-1 h-3.5 w-3.5" /> {t('admin.inbox.guestPanel.confirm')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={updating}
              onClick={() => updateRsvp("declined")}
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
            >
              <X className="mr-1 h-3.5 w-3.5" /> {t('admin.inbox.guestPanel.decline')}
            </Button>
          </div>
        )}
      </div>

      {/* Seating spotlight — the one thing that used to be missing entirely */}
      <div className="border-b border-border p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('admin.inbox.guestPanel.seating.title')}
        </p>
        {seatAssignment?.seating_tables?.name ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Armchair className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{seatAssignment.seating_tables.name}</p>
              {seatAssignment.seat_number != null && (
                <p className="text-xs text-muted-foreground">
                  {t('admin.inbox.guestPanel.seating.seatLabel', { number: seatAssignment.seat_number })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
            {t('admin.inbox.guestPanel.seating.noneAssigned')}
          </div>
        )}
      </div>

      {/* Menu, with course-by-course breakdown and category color coding */}
      <div className="border-b border-border p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('admin.inbox.guestPanel.menu.title')}
        </p>
        {menuAssignment?.menus?.name ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UtensilsCrossed className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
              {menuAssignment.menus.name}
            </div>
            {menuCourses.length > 0 && (
              <div className="space-y-1 pl-[22px]">
                {menuCourses.map((course) => (
                  <div key={course.course_number} className="flex items-center gap-2 text-xs">
                    <span
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${
                        course.dish ? CATEGORY_DOT[course.dish.category] ?? CATEGORY_DOT.other : "bg-muted-foreground/30"
                      }`}
                    />
                    <span className="flex-shrink-0 text-muted-foreground">
                      {course.course_name || `${t('admin.dishes.course')} ${course.course_number}`}
                    </span>
                    <span className="truncate text-foreground">{course.dish?.name ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : dishAssignment?.dishes?.name ? (
          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${CATEGORY_DOT[dishAssignment.dishes.category] ?? CATEGORY_DOT.other}`} />
            <span className="text-foreground">{dishAssignment.dishes.name}</span>
            <span className="text-xs text-muted-foreground">
              ({t(`admin.dishes.categories.${dishAssignment.dishes.category}`)})
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('admin.inbox.guestPanel.menu.noneAssigned')}</p>
        )}
      </div>

      {/* Group roster — every member's RSVP AND seat, not just this guest's */}
      {group && (
        <div className="border-b border-border p-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t('admin.inbox.guestPanel.guestGroup')}
          </p>
          <p className="text-sm font-semibold text-foreground">{group.name || "Unnamed group"}</p>
          <p className="mb-2 text-xs text-muted-foreground">
            {t('admin.inbox.guestPanel.guestsCount', { count: groupMembers.length })}
            {group.extra_passes > 0
              ? ` · ${t('admin.inbox.guestPanel.extraPasses', { count: group.extra_passes })}`
              : ""}
          </p>
          <div className="space-y-1">
            {groupMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-xs ${
                  member.id === guest.id ? "bg-primary/10" : ""
                }`}
              >
                <span className={`truncate ${member.id === guest.id ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {member.name}
                  {member.id === guest.id ? ` ${t('admin.inbox.guestPanel.thisChat')}` : ""}
                </span>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    {member.table_name
                      ? member.seat_number != null
                        ? `${member.table_name} · #${member.seat_number}`
                        : member.table_name
                      : t('admin.inbox.guestPanel.unassigned')}
                  </span>
                  <StatusPill status={member.confirmation_status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dietary, travel, tags */}
      <div className="border-b border-border p-4 space-y-2">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('admin.inbox.guestPanel.details')}
        </p>
        {guest.dietary_restrictions && (
          <div className="flex items-start gap-2 text-xs">
            <Salad className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="text-foreground">{guest.dietary_restrictions}</span>
          </div>
        )}
        {guest.is_traveling && (
          <div className="flex items-start gap-2 text-xs">
            <Plane className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="text-foreground">
              {guest.traveling_from
                ? t('admin.inbox.guestPanel.travelingFrom', { location: guest.traveling_from })
                : t('admin.inbox.guestPanel.traveling')}
              {guest.travel_arrangement ? ` · ${guest.travel_arrangement.replace(/_/g, " ")}` : ""}
            </span>
          </div>
        )}
        {guest.tags?.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <Tag className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="text-foreground">{guest.tags.join(", ")}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <Link
          href={getCleanAdminUrl(weddingId, "invitations")}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t('admin.inbox.guestPanel.viewFullProfile')} <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { ChevronDown, CalendarPlus, CalendarX, CalendarClock, Pencil, Trash2, Calendar } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface ActivityLogEntry {
  id: string
  event_type: string
  title: string
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

interface InvitationActivityLogProps {
  logs: ActivityLogEntry[]
  locale?: string
  labels?: {
    sectionTitle?: string
    empty?: string
  }
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  meeting_scheduled: { icon: CalendarPlus,  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
  meeting_rescheduled:{ icon: CalendarClock, color: "text-amber-600",   bg: "bg-amber-50 border-amber-100" },
  meeting_cancelled:  { icon: CalendarX,     color: "text-red-500",     bg: "bg-red-50 border-red-100" },
  meeting_deleted:    { icon: Trash2,        color: "text-red-400",     bg: "bg-red-50 border-red-100" },
  meeting_created:    { icon: Calendar,      color: "text-blue-600",    bg: "bg-blue-50 border-blue-100" },
  meeting_updated:    { icon: Pencil,        color: "text-[#420c14]/50",bg: "bg-[#420c14]/5 border-[#420c14]/10" },
}

const DEFAULT_CONFIG = { icon: Calendar, color: "text-[#420c14]/40", bg: "bg-[#420c14]/5 border-[#420c14]/10" }

export function InvitationActivityLog({
  logs,
  locale = "en",
  labels,
}: InvitationActivityLogProps) {
  const [open, setOpen] = useState(false)
  const dateLocale = locale === "es" ? es : enUS

  const sectionTitle = labels?.sectionTitle ?? (locale === "es" ? "Historial de actividad" : "Activity log")
  const emptyText = labels?.empty ?? (locale === "es" ? "Sin actividad registrada aún." : "No activity recorded yet.")

  return (
    <div className="rounded-2xl border border-[#420c14]/10 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#420c14]/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-[#420c14]/40" />
          <span className="text-sm font-medium text-[#420c14]">{sectionTitle}</span>
          {logs.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#420c14]/8 text-[#420c14]/50">
              {logs.length}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn("w-4 h-4 text-[#420c14]/30 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t border-[#420c14]/8 divide-y divide-[#420c14]/6">
          {logs.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#420c14]/40 text-center">{emptyText}</p>
          ) : (
            logs.map((log) => {
              const cfg = EVENT_CONFIG[log.event_type] ?? DEFAULT_CONFIG
              const Icon = cfg.icon
              const date = new Date(log.created_at)
              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className={cn("mt-0.5 w-7 h-7 rounded-lg border flex items-center justify-center shrink-0", cfg.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#420c14] leading-snug">{log.title}</p>
                    {log.description && (
                      <p className="text-xs text-[#420c14]/50 mt-0.5">{log.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-[#420c14]/35 whitespace-nowrap">
                      {formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })}
                    </p>
                    <p className="text-[10px] text-[#420c14]/25 mt-0.5">
                      {format(date, "MMM d, h:mm a", { locale: dateLocale })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

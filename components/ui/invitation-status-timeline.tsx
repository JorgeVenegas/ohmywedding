"use client"

import { Check, Clock } from "lucide-react"
import { format } from "date-fns"
import { DESIGN_STATUSES, type DesignStatus } from "@/lib/invitation-workflow"
import { useTranslation } from "@/components/contexts/i18n-context"

interface HistoryEntry {
  id: string
  to_status: string
  changed_at: string
  notes?: string | null
}

interface Props {
  currentStatus: DesignStatus
  history?: HistoryEntry[]
  className?: string
}

export function InvitationStatusTimeline({ currentStatus, history = [], className }: Props) {
  const { t } = useTranslation()
  const currentIndex = DESIGN_STATUSES.indexOf(currentStatus)

  const completedAt = (status: DesignStatus): string | null => {
    const entry = history.find((h) => h.to_status === status)
    return entry?.changed_at ?? null
  }

  const statusLabel = (s: DesignStatus) =>
    t(`admin.invitationProgress.statusLabels.${s}`) || s

  const statusDescription = (s: DesignStatus) =>
    t(`admin.invitationProgress.statusDescriptions.${s}`)

  return (
    <div className={className}>
      <ol className="relative">
        {DESIGN_STATUSES.map((status, index) => {
          const isDone = index < currentIndex
          const isCurrent = index === currentIndex
          const completedTime = completedAt(status)

          return (
            <li key={status} className="relative pb-8 last:pb-0">
              {/* Connector line */}
              {index < DESIGN_STATUSES.length - 1 && (
                <div
                  className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${
                    isDone ? "bg-[#420c14]" : "bg-[#420c14]/15"
                  }`}
                />
              )}

              <div className="flex items-start gap-4">
                {/* Step indicator */}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isDone
                      ? "border-[#420c14] bg-[#420c14] text-[#f5f2eb]"
                      : isCurrent
                      ? "border-[#DDA46F] bg-[#DDA46F]/10 text-[#DDA46F]"
                      : "border-[#420c14]/15 bg-white text-[#420c14]/30"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : isCurrent ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#DDA46F] animate-pulse" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-[#420c14]/20" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm font-medium ${
                        isDone
                          ? "text-[#420c14]"
                          : isCurrent
                          ? "text-[#DDA46F]"
                          : "text-[#420c14]/40"
                      }`}
                    >
                      {statusLabel(status)}
                    </p>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#DDA46F]/10 px-2 py-0.5 text-[10px] font-medium text-[#DDA46F] border border-[#DDA46F]/20">
                        <Clock className="h-2.5 w-2.5" />
                        {t('admin.invitationProgress.current')}
                      </span>
                    )}
                    {isDone && completedTime && (
                      <span className="text-[11px] text-[#420c14]/40">
                        {format(new Date(completedTime), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  {(isCurrent || index === currentIndex + 1) && (
                    <p className="mt-0.5 text-xs text-[#420c14]/50 leading-relaxed">
                      {statusDescription(status)}
                    </p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

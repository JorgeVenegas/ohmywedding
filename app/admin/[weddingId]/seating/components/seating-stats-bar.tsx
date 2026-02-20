"use client"

import { useTranslation } from "@/components/contexts/i18n-context"
import { Button } from "@/components/ui/button"
import { PanelLeftOpen, PanelLeftClose } from "lucide-react"

interface SeatingStatsBarProps {
  stats: {
    totalGuests: number
    assignedGuests: number
    unassignedGuests: number
    totalTables: number
    overfilledTables: number
    totalCapacity: number
  }
  showGuestPanel: boolean
  onToggleGuestPanel: () => void
}

export function SeatingStatsBar({ stats, showGuestPanel, onToggleGuestPanel }: SeatingStatsBarProps) {
  const { t } = useTranslation()

  const assignmentPercent = stats.totalGuests > 0
    ? Math.round((stats.assignedGuests / stats.totalGuests) * 100)
    : 0

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-2xl shadow-lg border border-gray-200/50 backdrop-blur-sm whitespace-nowrap pointer-events-auto">
      {/* Guest Panel Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleGuestPanel}
        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
        title={showGuestPanel ? 'Hide guest panel' : 'Show guest panel'}
      >
        {showGuestPanel ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
      </Button>

      <div className="w-px h-4 bg-gray-200" />
      {/* Progress bar */}
      <div className="flex items-center gap-2 min-w-32">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${assignmentPercent}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-gray-500 tabular-nums whitespace-nowrap">
          {assignmentPercent}%
        </span>
      </div>

      <div className="w-px h-4 bg-gray-200" />

      {/* Stats pills */}
      <div className="flex items-center gap-1.5 px-1">
        <StatPill
          label={t('admin.seating.stats.assigned')}
          value={stats.assignedGuests}
          total={stats.totalGuests}
          color="emerald"
        />
        <StatPill
          label={t('admin.seating.stats.unassigned')}
          value={stats.unassignedGuests}
          color={stats.unassignedGuests > 0 ? "amber" : "gray"}
        />
        <StatPill
          label={t('admin.seating.stats.tables')}
          value={stats.totalTables}
          color="indigo"
        />
        <StatPill
          label={t('admin.seating.stats.capacity')}
          value={stats.totalCapacity}
          color="gray"
        />
        {stats.overfilledTables > 0 && (
          <StatPill
            label={t('admin.seating.stats.overfilled')}
            value={stats.overfilledTables}
            color="red"
          />
        )}
      </div>
    </div>
  )
}

function StatPill({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total?: number
  color: string
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    gray: 'bg-gray-100 text-gray-600',
    red: 'bg-red-50 text-red-700',
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${colorMap[color] || colorMap.gray}`}>
      <span>{label}</span>
      <span className="font-bold tabular-nums">
        {total !== undefined ? `${value}/${total}` : value}
      </span>
    </div>
  )
}

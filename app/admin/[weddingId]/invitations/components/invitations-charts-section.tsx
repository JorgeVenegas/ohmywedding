"use client"

import { useRouter } from "next/navigation"
import {
  InteractiveAreaChart,
  StackedBarChart,
  DonutChart,
} from "@/components/ui/charts"
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
} from "lucide-react"
import { useTranslation } from '@/components/contexts/i18n-context'
import { getCleanAdminUrl } from "@/lib/admin-url"
import type { GuestGroup, TimelineData } from "../types"
interface InvitationsChartsSectionProps {
  weddingId: string
  chartsExpanded: boolean
  setChartsExpanded: (expanded: boolean) => void
  // Chart data
  statusByInvitedByData: Array<{ name: string; confirmed: number; pending: number; declined: number }>
  tagsByInvitedByData: Array<{ name: string; value: number }>
  // Timeline
  timelineLoading: boolean
  timelineData: TimelineData | null
  timelineRange: 'all' | '90d' | '30d' | '14d' | '7d'
  setTimelineRange: (range: 'all' | '90d' | '30d' | '14d' | '7d') => void
  timelineGroupFilter: string
  setTimelineGroupFilter: (filter: string) => void
  guestGroups: GuestGroup[]
  hasPaidPlan: boolean
}

const TAG_PIE_COLORS: Record<string, string> = {
  family: "hsl(221 83% 53%)", // blue
  friends: "hsl(142 76% 36%)", // green
  work: "hsl(258 90% 66%)", // purple
  neighbors: "hsl(32 95% 44%)", // orange
  default: "hsl(215 16% 47%)", // gray
}

export function InvitationsChartsSection({
  weddingId,
  chartsExpanded,
  setChartsExpanded,
  statusByInvitedByData,
  tagsByInvitedByData,
  timelineLoading,
  timelineData,
  timelineRange,
  setTimelineRange,
  timelineGroupFilter,
  setTimelineGroupFilter,
  guestGroups,
  hasPaidPlan,
}: InvitationsChartsSectionProps) {
  const router = useRouter()
  const { t } = useTranslation()

  const hasTrackingAccess = hasPaidPlan
  const hasData = statusByInvitedByData.length > 0 || tagsByInvitedByData.length > 0 || !timelineLoading

  if (!hasData) return null

  return (
    <div>
      <button
        onClick={() => setChartsExpanded(!chartsExpanded)}
        aria-expanded={chartsExpanded}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-[#420c14]/5 border border-[#420c14]/10 hover:bg-[#420c14]/8 hover:border-[#420c14]/20 transition-all duration-200 ${
          chartsExpanded ? 'mb-5' : 'mb-0'
        }`}
      >
        <ChevronDown className={`w-4 h-4 text-[#420c14]/50 transition-transform duration-300 flex-shrink-0 ${chartsExpanded ? 'rotate-0' : '-rotate-90'}`} />
        <span className="text-sm font-medium text-[#420c14]">{t('admin.invitations.charts.title')}</span>
        <span className="text-xs text-[#420c14]/40 ml-1">{chartsExpanded ? t('admin.invitations.charts.hide') : t('admin.invitations.charts.show')}</span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${chartsExpanded
          ? 'max-h-[4000px] opacity-100 translate-y-0'
          : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
        }`}
        aria-hidden={!chartsExpanded}
      >
        {/* Status by Invited By & Tags - Side by side on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Status by Invited By - Stacked Bar Chart */}
          {statusByInvitedByData.length > 0 && (
            <div className="rounded-2xl border border-[#420c14]/10 bg-white shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#DDA46F] mb-0.5">
                  {t('admin.invitations.charts.guestStatusByInviterDesc')}
                </p>
                <h3 className="text-base font-serif text-[#420c14]">
                  {t('admin.invitations.charts.guestStatusByInviter')}
                </h3>
              </div>
              <div className="px-5 pb-5">
                <StackedBarChart
                  data={statusByInvitedByData}
                  categoryKey="name"
                  bars={[
                    { dataKey: "confirmed", name: t('common.confirmed'), color: "emerald" },
                    { dataKey: "pending", name: t('common.pending'), color: "amber" },
                    { dataKey: "declined", name: t('common.declined'), color: "red" },
                  ]}
                  height={Math.max(250, statusByInvitedByData.length * 45 + 60)}
                />
              </div>
            </div>
          )}

          {/* Tags Donut Chart */}
          {tagsByInvitedByData.length > 0 && (
            <div className="rounded-2xl border border-[#420c14]/10 bg-white shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#DDA46F] mb-0.5">
                  {t('admin.invitations.charts.guestDistributionByTagDesc')}
                </p>
                <h3 className="text-base font-serif text-[#420c14]">
                  {t('admin.invitations.charts.guestDistributionByTag')}
                </h3>
              </div>
              <div className="px-5 pb-5">
                <DonutChart
                  data={tagsByInvitedByData.map((item) => ({
                    name: item.name,
                    value: item.value,
                    color: TAG_PIE_COLORS[item.name.toLowerCase()] || TAG_PIE_COLORS.default,
                  }))}
                  height={280}
                  innerRadius={50}
                  outerRadius={90}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Timeline Chart */}
        {!hasTrackingAccess ? (
          <div className="rounded-2xl border border-[#420c14]/10 bg-white shadow-sm p-8 mb-5">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#420c14]/5 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-[#420c14]/25" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#DDA46F] mb-1">
                {t('admin.invitations.charts.confirmationOpensTracking')}
              </p>
              <h3 className="text-base font-serif text-[#420c14] mb-2">{t('admin.invitations.charts.confirmationTimeline')}</h3>
              <p className="text-sm text-[#420c14]/45 mb-5 max-w-sm leading-relaxed">
                {t('admin.invitations.charts.confirmationOpensTrackingDesc')}
              </p>
              <a
                href={`/upgrade?source=charts_tracking&weddingId=${encodeURIComponent(weddingId)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#420c14] text-white text-xs font-medium hover:bg-[#5a1220] transition-colors"
              >
                {t('admin.invitations.charts.upgradeToPremium')}
              </a>
            </div>
          </div>
        ) : !timelineLoading && (
          <div className="rounded-2xl border border-[#420c14]/10 bg-white shadow-sm overflow-hidden mb-5">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#DDA46F] mb-0.5">Activity</p>
              <h3 className="text-base font-serif text-[#420c14]">{t('admin.invitations.charts.confirmationTimeline')}</h3>
            </div>
            <div className="px-5 pb-5 flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                {/* Time Range Filter */}
                <div className="flex items-center border border-[#420c14]/10 rounded-lg bg-[#420c14]/[0.02] p-0.5 gap-0.5 overflow-x-auto w-fit">
                  {(['7d', '14d', '30d', '90d', 'all'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimelineRange(range)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${timelineRange === range
                          ? 'bg-[#420c14] text-white shadow-sm'
                          : 'text-[#420c14]/50 hover:text-[#420c14] hover:bg-[#420c14]/5'
                        }`}
                    >
                      {range === 'all' ? 'All' : range}
                    </button>
                  ))}
                </div>
                {/* Group Filter */}
                <select
                  value={timelineGroupFilter}
                  onChange={(e) => setTimelineGroupFilter(e.target.value)}
                  className="h-8 px-2 sm:px-3 text-xs border border-[#420c14]/10 rounded-md bg-white hover:bg-[#420c14]/[0.02] transition-colors flex-1 sm:flex-none text-[#420c14]"
                >
                  <option value="all">{t('admin.invitations.charts.allGroups')}</option>
                  {guestGroups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              {timelineData && timelineData.chartData.length > 0 && (
                <div className="space-y-4 sm:space-y-6">
                  <InteractiveAreaChart
                    data={timelineData.chartData}
                    xAxisKey="date"
                    areas={[
                      { dataKey: "cumulativeConfirmed", name: t('common.confirmed'), color: "emerald" },
                      { dataKey: "cumulativeDeclined", name: t('common.declined'), color: "red" },
                      { dataKey: "cumulativeOpens", name: t('admin.invitations.charts.opened'), color: "blue" },
                    ]}
                    height={280}
                    className="mb-4"
                    xAxisFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    }
                  />

                  {/* Recent Events */}
                  {timelineData.confirmationEvents.length > 0 && (
                    <div className="border-t border-[#420c14]/6 pt-3 sm:pt-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#420c14]/35 mb-2.5">{t('admin.invitations.charts.recentConfirmations')}</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {timelineData.confirmationEvents.slice(0, 8).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => router.push(getCleanAdminUrl(weddingId, `groups/${event.groupId}`))}
                            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full text-xs border transition-colors ${event.type === 'confirmed'
                                ? 'bg-emerald-50 border-emerald-200/70 text-emerald-700 hover:bg-emerald-100'
                                : event.type === 'declined'
                                  ? 'bg-red-50 border-red-200/70 text-red-700 hover:bg-red-100'
                                  : 'bg-blue-50 border-blue-200/70 text-blue-700 hover:bg-blue-100'
                              }`}
                          >
                            {event.type === 'confirmed' ? (
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                            ) : event.type === 'declined' ? (
                              <XCircle className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <Clock className="w-3 h-3 flex-shrink-0" />
                            )}
                            <span className="font-medium hidden sm:inline">{event.groupName}</span>
                            <span className="opacity-60 text-[10px]">
                              {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </button>
                        ))}
                        {timelineData.confirmationEvents.length > 8 && (
                          <span className="text-xs text-[#420c14]/35 py-1">
                            +{timelineData.confirmationEvents.length - 8} {t('admin.invitations.charts.more')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {hasTrackingAccess && timelineLoading && (
          <div className="rounded-2xl border border-[#420c14]/10 bg-white shadow-sm p-6 mb-5">
            <div className="h-[200px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#420c14]/20 border-t-[#420c14]" />
                <p className="text-xs text-[#420c14]/40">{t('admin.invitations.charts.loadingTimeline')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {hasTrackingAccess && !timelineLoading && (!timelineData || timelineData.chartData.length === 0) && (
          <div className="rounded-2xl border border-[#420c14]/10 bg-white shadow-sm p-6 mb-5">
            <div className="h-[180px] flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#420c14]/5 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-[#420c14]/20" />
              </div>
              <p className="text-sm font-serif text-[#420c14]/60">{t('admin.invitations.charts.noConfirmations')}</p>
              <p className="text-xs text-[#420c14]/35 mt-1">{t('admin.invitations.charts.noConfirmationsDesc')}</p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {hasTrackingAccess && timelineData && timelineData.chartData.length > 0 && (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Confirmed */}
            <div className="rounded-2xl border border-[#420c14]/10 bg-white shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#420c14]/40">
                  {t('admin.invitations.charts.confirmations')}
                </p>
              </div>
              <div className="text-3xl font-serif font-medium text-emerald-600">
                {timelineData.summary.totalConfirmed}
              </div>
              <p className="text-xs text-[#420c14]/40 mt-1">{t('admin.invitations.charts.guestsConfirmed')}</p>
            </div>
            {/* Declined */}
            <div className="rounded-2xl border border-[#420c14]/10 bg-white shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#420c14]/40">
                  {t('admin.invitations.charts.declines')}
                </p>
              </div>
              <div className="text-3xl font-serif font-medium text-red-500">
                {timelineData.summary.totalDeclined}
              </div>
              <p className="text-xs text-[#420c14]/40 mt-1">{t('admin.invitations.charts.guestsDeclined')}</p>
            </div>
            {/* Opens */}
            <div className="rounded-2xl border border-[#420c14]/10 bg-white shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#420c14]/40">
                  {t('admin.invitations.charts.opens')}
                </p>
              </div>
              <div className="text-3xl font-serif font-medium text-blue-600">
                {timelineData.summary.totalOpens}
              </div>
              <p className="text-xs text-[#420c14]/40 mt-1">{t('admin.invitations.charts.invitationViews')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import {
  ChartCard,
  StatCard,
  InteractiveAreaChart,
  StackedBarChart,
  DonutChart,
} from "@/components/ui/charts"
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
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
}: InvitationsChartsSectionProps) {
  const router = useRouter()

  const hasData = statusByInvitedByData.length > 0 || tagsByInvitedByData.length > 0 || !timelineLoading

  if (!hasData) return null

  return (
    <div>
      <button
        onClick={() => setChartsExpanded(!chartsExpanded)}
        aria-expanded={chartsExpanded}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 hover:border-primary/20 transition-all duration-200 ${
          chartsExpanded ? 'mb-4' : 'mb-0'
        }`}
      >
        <ChevronDown className={`w-4 h-4 text-primary/70 transition-transform duration-300 flex-shrink-0 ${chartsExpanded ? 'rotate-0' : '-rotate-90'}`} />
        <span className="text-sm font-semibold text-foreground">Charts & Analytics</span>
        <span className="text-xs text-muted-foreground ml-1">{chartsExpanded ? 'Hide' : 'Show'}</span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${chartsExpanded
          ? 'max-h-[4000px] opacity-100 translate-y-0'
          : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
        }`}
        aria-hidden={!chartsExpanded}
      >
        {/* Status by Invited By & Tags - Side by side on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status by Invited By - Stacked Bar Chart */}
          {statusByInvitedByData.length > 0 && (
            <ChartCard
              title="Guest Status by Inviter"
              description="Distribution of confirmations, pending, and declines"
            >
              <StackedBarChart
                data={statusByInvitedByData}
                categoryKey="name"
                bars={[
                  { dataKey: "confirmed", name: "Confirmed", color: "emerald" },
                  { dataKey: "pending", name: "Pending", color: "amber" },
                  { dataKey: "declined", name: "Declined", color: "red" },
                ]}
                height={Math.max(250, statusByInvitedByData.length * 45 + 60)}
              />
            </ChartCard>
          )}

          {/* Tags Donut Chart */}
          {tagsByInvitedByData.length > 0 && (
            <ChartCard
              title="Guest Distribution by Tag"
              description="Breakdown of guests by their assigned categories"
            >
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
            </ChartCard>
          )}
        </div>

        {/* Confirmation Timeline Chart */}
        {!timelineLoading && (
          <Card className="p-4 sm:p-6 border">
            <h3 className="text-sm font-semibold text-foreground mb-4">Confirmation Timeline</h3>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                {/* Time Range Filter */}
                <div className="flex items-center border border-border rounded-lg bg-muted/30 p-0.5 sm:p-1 gap-0.5 overflow-x-auto">
                  {(['7d', '14d', '30d', '90d', 'all'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimelineRange(range)}
                      className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${timelineRange === range
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                  className="h-8 px-2 sm:px-3 text-xs border border-border rounded-md bg-background hover:bg-muted/50 transition-colors flex-1 sm:flex-none"
                >
                  <option value="all">All Groups</option>
                  {guestGroups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              {timelineData && timelineData.chartData.length > 0 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Timeline Chart */}
                  <InteractiveAreaChart
                    data={timelineData.chartData}
                    xAxisKey="date"
                    areas={[
                      { dataKey: "cumulativeConfirmed", name: "Confirmed", color: "emerald" },
                      { dataKey: "cumulativeDeclined", name: "Declined", color: "red" },
                      { dataKey: "cumulativeOpens", name: "Opened", color: "blue" },
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
                    <div className="border-t pt-3 sm:pt-4">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Confirmations</h4>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {timelineData.confirmationEvents.slice(0, 8).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => router.push(getCleanAdminUrl(weddingId, `groups/${event.groupId}`))}
                            className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-full text-xs border transition-colors hover:bg-muted/50 ${event.type === 'confirmed'
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : event.type === 'declined'
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : 'bg-purple-50 border-purple-200 text-purple-700'
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
                            <span className="text-muted-foreground text-xs">
                              {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </button>
                        ))}
                        {timelineData.confirmationEvents.length > 8 && (
                          <span className="text-xs text-muted-foreground py-1">
                            +{timelineData.confirmationEvents.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Loading State */}
        {timelineLoading && (
          <Card className="p-4 sm:p-6 border shadow-sm">
            <div className="h-[200px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                <p className="text-xs text-muted-foreground">Loading timeline...</p>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!timelineLoading && (!timelineData || timelineData.chartData.length === 0) && (
          <Card className="p-4 sm:p-6 border shadow-sm">
            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium">No confirmations yet</p>
              <p className="text-xs mt-1">RSVPs will appear here when guests respond to invitations</p>
            </div>
          </Card>
        )}

        {/* Summary Stats */}
        {timelineData && timelineData.chartData.length > 0 && (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard
              label="Confirmations"
              value={timelineData.summary.totalConfirmed}
              color="emerald"
              subtitle="guests confirmed attendance"
            />
            <StatCard
              label="Declines"
              value={timelineData.summary.totalDeclined}
              color="red"
              subtitle="guests declined"
            />
            <StatCard
              label="Opens"
              value={timelineData.summary.totalOpens}
              color="blue"
              subtitle="invitation views"
            />
          </div>
        )}
      </div>
    </div>
  )
}

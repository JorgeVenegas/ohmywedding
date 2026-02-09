"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, CheckCircle2, TrendingUp, Eye, ShoppingCart, Banknote } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

// --- Types ---

interface FunnelData {
  visited: number
  checkout_started: number
  requires_action: number
  completed: number
  failed: number
}

interface SourceBreakdown {
  source: string
  visited: number
  checkout_started: number
  requires_action: number
  completed: number
  failed: number
  revenue_cents: number
}

interface FunnelResponse {
  funnel: FunnelData
  sources: SourceBreakdown[]
}

// --- Constants ---

const FUNNEL_STAGES = [
  { key: "visited" as const, label: "VISITED", sublabel: "Page Views", icon: Eye },
  { key: "checkout_started" as const, label: "CHECKOUT", sublabel: "Session Created", icon: ShoppingCart },
  { key: "requires_action" as const, label: "PENDING", sublabel: "Bank Transfer", icon: Banknote },
  { key: "completed" as const, label: "PAID", sublabel: "Subscription Active", icon: CheckCircle2 },
]

type DateRange = "7d" | "30d" | "90d" | "all"
type PlanFilter = "all" | "premium" | "deluxe"

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
]

const PLAN_FILTERS: { value: PlanFilter; label: string }[] = [
  { value: "all", label: "All plans" },
  { value: "premium", label: "Premium" },
  { value: "deluxe", label: "Deluxe" },
]

// --- Funnel SVG Visualization ---

function FunnelVisualization({ funnel }: { funnel: FunnelData }) {
  const stageValues = FUNNEL_STAGES.map((s) => funnel[s.key])
  const maxVal = Math.max(stageValues[0], 1)
  const percentages = stageValues.map((v) => (maxVal > 0 ? (v / maxVal) * 100 : 0))

  const SVG_WIDTH = 800
  const SVG_HEIGHT = 300
  const PADDING = 30
  const usableHeight = SVG_HEIGHT - PADDING * 2
  const centerY = SVG_HEIGHT / 2
  const numStages = FUNNEL_STAGES.length
  const segWidth = SVG_WIDTH / numStages
  const stageHeights = percentages.map((p) => Math.max((p / 100) * usableHeight, 8))

  const buildFunnelPath = () => {
    const points: { x: number; topY: number; botY: number }[] = []
    for (let i = 0; i <= numStages; i++) {
      const x = i * segWidth
      const h = i < numStages ? stageHeights[i] : stageHeights[numStages - 1]
      const halfH = h / 2
      points.push({ x, topY: centerY - halfH, botY: centerY + halfH })
    }
    let topPath = `M ${points[0].x} ${points[0].topY}`
    let botPath = ""
    for (let i = 0; i < points.length - 1; i++) {
      const cp = segWidth * 0.45
      topPath += ` C ${points[i].x + cp} ${points[i].topY}, ${points[i + 1].x - cp} ${points[i + 1].topY}, ${points[i + 1].x} ${points[i + 1].topY}`
    }
    for (let i = points.length - 1; i > 0; i--) {
      const cp = segWidth * 0.45
      botPath += ` C ${points[i].x - cp} ${points[i].botY}, ${points[i - 1].x + cp} ${points[i - 1].botY}, ${points[i - 1].x} ${points[i - 1].botY}`
    }
    return `${topPath} L ${points[points.length - 1].x} ${points[points.length - 1].botY} ${botPath} Z`
  }

  const buildLayerPath = (shrinkFactor: number, yOffset: number) => {
    const points: { x: number; topY: number; botY: number }[] = []
    for (let i = 0; i <= numStages; i++) {
      const x = i * segWidth
      const h = i < numStages ? stageHeights[i] : stageHeights[numStages - 1]
      const halfH = (h * shrinkFactor) / 2
      points.push({ x, topY: centerY - halfH + yOffset, botY: centerY + halfH + yOffset })
    }
    let topPath = `M ${points[0].x} ${points[0].topY}`
    let botPath = ""
    for (let i = 0; i < points.length - 1; i++) {
      const cp = segWidth * 0.45
      topPath += ` C ${points[i].x + cp} ${points[i].topY}, ${points[i + 1].x - cp} ${points[i + 1].topY}, ${points[i + 1].x} ${points[i + 1].topY}`
    }
    for (let i = points.length - 1; i > 0; i--) {
      const cp = segWidth * 0.45
      botPath += ` C ${points[i].x - cp} ${points[i].botY}, ${points[i - 1].x + cp} ${points[i - 1].botY}, ${points[i - 1].x} ${points[i - 1].botY}`
    }
    return `${topPath} L ${points[points.length - 1].x} ${points[points.length - 1].botY} ${botPath} Z`
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#420c14] via-[#5a1a22] to-[#420c14] border border-[#DDA46F]/20">
      {/* Stage labels and counts — above the funnel */}
      <div className="grid grid-cols-4">
        {FUNNEL_STAGES.map((stage, i) => {
          const Icon = stage.icon
          const pct = percentages[i]
          const count = stageValues[i]
          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`flex flex-col items-center py-5 sm:py-6 px-2 sm:px-4 ${i < 3 ? "border-r border-[#DDA46F]/10" : ""}`}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#DDA46F]/10 flex items-center justify-center mb-2 sm:mb-3 border border-[#DDA46F]/30">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#DDA46F]" />
              </div>
              <p className="text-[8px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] text-[#f5f2eb]/60 uppercase font-medium mb-1">{stage.label}</p>
              <p className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#DDA46F]">
                {pct.toFixed(pct < 1 && pct > 0 ? 1 : 0)}%
              </p>
              <p className="text-sm sm:text-base font-medium text-[#f5f2eb] tabular-nums mt-1">{count.toLocaleString()}</p>
            </motion.div>
          )
        })}
      </div>
      {/* SVG funnel shape — below the labels */}
      <div className="h-[300px] sm:h-[500px] relative">
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="funnelGrad0" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#DDA46F" stopOpacity="0.6" />
              <stop offset="40%" stopColor="#c99560" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#b88550" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#9d7240" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="funnelGrad1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#DDA46F" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#c99560" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#9d7240" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="funnelGrad2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#DDA46F" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#c99560" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#9d7240" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="funnelGradLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#DDA46F" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#c99560" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#f5f2eb" stopOpacity="0.6" />
            </linearGradient>
            <pattern id="funnelGrid" width={segWidth} height={SVG_HEIGHT} patternUnits="userSpaceOnUse">
              <line x1={segWidth} y1="0" x2={segWidth} y2={SVG_HEIGHT} stroke="#DDA46F" strokeOpacity="0.05" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#funnelGrid)" />
          <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }} d={buildLayerPath(1.08, 0)} fill="url(#funnelGrad2)" />
          <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }} d={buildLayerPath(1.04, 0)} fill="url(#funnelGrad1)" />
          <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.1 }} d={buildFunnelPath()} fill="url(#funnelGrad0)" />
          {(() => {
            const points = Array.from({ length: numStages + 1 }, (_, i) => ({ x: i * segWidth, y: centerY }))
            let path = `M ${points[0].x} ${points[0].y}`
            for (let i = 0; i < points.length - 1; i++) {
              const cp = segWidth * 0.5
              path += ` C ${points[i].x + cp} ${points[i].y}, ${points[i + 1].x - cp} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`
            }
            return <motion.path initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.5, delay: 0.5 }} d={path} stroke="url(#funnelGradLine)" strokeWidth="1.5" fill="none" />
          })()}
        </svg>
      </div>
    </div>
  )
}

// --- Helpers ---

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100)
}

// --- Lead Sources Stacked Bar Chart ---

function LeadSourcesBarChart({ sources }: { sources: SourceBreakdown[] }) {
  if (sources.length === 0) {
    return (
      <div className="text-center py-10 text-[#420c14]/40 text-sm">
        No lead source data yet
      </div>
    )
  }

  const maxVisited = Math.max(...sources.map((s) => s.visited), 1)
  const maxRevenue = Math.max(...sources.map((s) => s.revenue_cents), 1)

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-[#420c14]/60">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-[#DDA46F] to-[#c99560]" />
          Leads
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-[#420c14] to-[#5a1a22]" />
          Revenue
        </span>
      </div>

      {sources.map((src, i) => {
        const leadsBarWidth = (src.visited / maxVisited) * 100
        const revenueBarWidth = maxRevenue > 0 ? (src.revenue_cents / maxRevenue) * 100 : 0

        return (
          <motion.div
            key={src.source}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
          >
            <div className="flex items-start gap-3">
              {/* Source label */}
              <div className="w-28 sm:w-36 flex-shrink-0 text-right pt-1">
                <code className="text-xs font-mono text-[#420c14]/70 truncate block">{src.source}</code>
              </div>

              {/* Stacked bars */}
              <div className="flex-1 space-y-1">
                {/* Leads bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-[#420c14]/5 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${leadsBarWidth}%` }}
                      transition={{ duration: 0.7, delay: i * 0.05 + 0.1, ease: "easeOut" }}
                      className="h-full rounded bg-gradient-to-r from-[#DDA46F] to-[#c99560] flex items-center px-2"
                    >
                      {leadsBarWidth > 20 && (
                        <span className="text-[10px] font-semibold text-white tabular-nums whitespace-nowrap">{src.visited}</span>
                      )}
                    </motion.div>
                  </div>
                  {leadsBarWidth <= 20 && (
                    <span className="text-xs font-medium text-[#420c14]/60 tabular-nums w-8">{src.visited}</span>
                  )}
                </div>
                {/* Revenue bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-[#420c14]/5 rounded overflow-hidden">
                    {src.revenue_cents > 0 ? (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${revenueBarWidth}%` }}
                        transition={{ duration: 0.7, delay: i * 0.05 + 0.2, ease: "easeOut" }}
                        className="h-full rounded bg-gradient-to-r from-[#420c14] to-[#5a1a22] flex items-center px-2"
                      >
                        {revenueBarWidth > 25 && (
                          <span className="text-[10px] font-semibold text-[#DDA46F] tabular-nums whitespace-nowrap">{formatCurrency(src.revenue_cents)}</span>
                        )}
                      </motion.div>
                    ) : (
                      <div className="h-full flex items-center px-2">
                        <span className="text-[10px] text-[#420c14]/25">No revenue</span>
                      </div>
                    )}
                  </div>
                  {src.revenue_cents > 0 && revenueBarWidth <= 25 && (
                    <span className="text-xs font-medium text-[#420c14]/60 tabular-nums w-20 text-left">{formatCurrency(src.revenue_cents)}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// --- Lead Sources Detail Table ---

function LeadSourcesTable({ sources }: { sources: SourceBreakdown[] }) {
  if (sources.length === 0) {
    return (
      <div className="text-center py-10 text-[#420c14]/40 text-sm">
        No lead source data yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#420c14]/10">
            <th className="text-left py-3 px-4 font-medium text-[#420c14]/60 text-xs uppercase tracking-wider">Source</th>
            <th className="text-right py-3 px-4 font-medium text-[#420c14]/60 text-xs uppercase tracking-wider">Visits</th>
            <th className="text-right py-3 px-4 font-medium text-[#420c14]/60 text-xs uppercase tracking-wider">Checkout</th>
            <th className="text-right py-3 px-4 font-medium text-[#420c14]/60 text-xs uppercase tracking-wider">Pending</th>
            <th className="text-right py-3 px-4 font-medium text-[#420c14]/60 text-xs uppercase tracking-wider">Paid</th>
            <th className="text-right py-3 px-4 font-medium text-[#420c14]/60 text-xs uppercase tracking-wider">Failed</th>
            <th className="text-right py-3 px-4 font-medium text-[#420c14]/60 text-xs uppercase tracking-wider">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((src, i) => {
            const conversion = src.visited > 0 ? ((src.completed / src.visited) * 100).toFixed(1) : "0.0"
            return (
              <motion.tr
                key={src.source}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="border-b border-[#420c14]/5 hover:bg-[#DDA46F]/5 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#DDA46F]" />
                    <code className="text-xs bg-[#420c14]/5 px-2 py-0.5 rounded font-mono">{src.source}</code>
                  </span>
                </td>
                <td className="text-right py-3 px-4 tabular-nums font-medium">{src.visited}</td>
                <td className="text-right py-3 px-4 tabular-nums">{src.checkout_started}</td>
                <td className="text-right py-3 px-4 tabular-nums text-[#DDA46F]">{src.requires_action}</td>
                <td className="text-right py-3 px-4 tabular-nums text-green-700 font-medium">{src.completed}</td>
                <td className="text-right py-3 px-4 tabular-nums text-red-500">{src.failed}</td>
                <td className="text-right py-3 px-4">
                  <span className={`inline-flex items-center gap-1 font-semibold ${Number(conversion) > 0 ? "text-green-700" : "text-[#420c14]/40"}`}>
                    {Number(conversion) > 0 && <TrendingUp className="w-3 h-3" />}
                    {conversion}%
                  </span>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// --- Main Page ---

export default function SubscriptionsFunnelPage() {
  const [data, setData] = useState<FunnelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>("all")
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all")

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    if (dateRange !== "all") {
      const now = new Date()
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90
      const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      params.set("from", from.toISOString())
    }
    if (planFilter !== "all") params.set("plan", planFilter)
    const qs = params.toString()
    return qs ? `?${qs}` : ""
  }, [dateRange, planFilter])

  const fetchFunnelData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/superadmin/funnel${buildQueryParams()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch funnel data")
      }
      const result: FunnelResponse = await response.json()
      setData(result)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching funnel data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch funnel data")
      setLoading(false)
    }
  }, [buildQueryParams])

  useEffect(() => {
    fetchFunnelData()
    const interval = setInterval(fetchFunnelData, 30000)
    return () => clearInterval(interval)
  }, [fetchFunnelData])

  if (loading) {
    return (
      <div className="space-y-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Analytics</p>
          <h1 className="text-4xl font-serif text-[#420c14]">Conversion Funnel</h1>
        </div>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DDA46F]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Analytics</p>
          <h1 className="text-4xl font-serif text-[#420c14]">Conversion Funnel</h1>
        </div>
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const funnel = data?.funnel ?? { visited: 0, checkout_started: 0, requires_action: 0, completed: 0, failed: 0 }
  const sources = data?.sources ?? []

  const overallConversion = funnel.visited > 0
    ? ((funnel.completed / funnel.visited) * 100).toFixed(1)
    : "0.0"

  const hasAnyData = funnel.visited > 0

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Analytics</p>
          <h1 className="text-4xl font-serif text-[#420c14]">Conversion Funnel</h1>
          <p className="text-[#420c14]/60 mt-2">
            Lead-to-payment funnel — auto-refreshes every 30s
            {!hasAnyData && " (No visits yet)"}
          </p>
        </div>
        <Link
          href="/superadmin/subscriptions"
          className="inline-flex items-center gap-2 text-sm text-[#420c14]/60 hover:text-[#420c14] transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subscriptions
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Date range */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-[#420c14]/10 p-1">
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDateRange(r.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                dateRange === r.value
                  ? "bg-[#420c14] text-[#f5f2eb]"
                  : "text-[#420c14]/60 hover:text-[#420c14] hover:bg-[#420c14]/5"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {/* Plan filter */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-[#420c14]/10 p-1">
          {PLAN_FILTERS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPlanFilter(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                planFilter === p.value
                  ? "bg-[#DDA46F] text-white"
                  : "text-[#420c14]/60 hover:text-[#420c14] hover:bg-[#DDA46F]/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main funnel visualization */}
      <FunnelVisualization funnel={funnel} />

      {/* Lead Sources Bar Chart */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-[#DDA46F]" />
          <h2 className="text-xl font-serif text-[#420c14]">Lead Sources</h2>
          <span className="text-xs text-[#420c14]/40 bg-[#420c14]/5 px-2 py-0.5 rounded-full">
            {sources.length} source{sources.length !== 1 ? "s" : ""}
          </span>
          {funnel.visited > 0 && (
            <span className="ml-auto text-xs text-[#420c14]/50">
              Overall conversion: <span className="font-semibold text-[#420c14]">{overallConversion}%</span>
            </span>
          )}
        </div>
        <Card className="border-[#420c14]/10 p-5">
          <LeadSourcesBarChart sources={sources} />
        </Card>
      </div>

      {/* Lead Sources Detail Table */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-[#DDA46F]" />
          <h2 className="text-xl font-serif text-[#420c14]">Source Details</h2>
        </div>
        <Card className="border-[#420c14]/10 overflow-hidden">
          <LeadSourcesTable sources={sources} />
        </Card>
      </div>
    </div>
  )
}
